# Critical Bugs Investigation & Fix Plan
**Date**: 2025-08-15  
**Priority**: URGENT  
**Assigned**: Claude 1 (Orchestrator), Claude 2 (Backend), Claude 3 (Frontend)

## Current Critical Issues (From User Screenshot & Testing)

### 1. **Parser Creating Garbage Names** 
- Lead 455: first_name="96", last_name="New message 2010 Walnut St #B02... Jenna Olsakowski"
- Multiple leads have "96" as first name
- Parser is extracting numbers/garbage from subject lines

### 2. **Date Display Problem**
- Screenshot shows all leads as "Today" instead of actual dates (8/30, 9/14, etc.)
- API returns correct dates but frontend shows wrong

### 3. **Ordering Still Wrong**
- Despite fix to inquiry_date.desc, leads appear random
- Shows: 9/14, 8/31, 8/30, 9/29 (not chronological)

### 4. **Income Display Error**
- Hollis Crane: $27,456/mo ($329,472/yr) - likely should be annual
- Frontend not respecting income_type field

### 5. **Missing Parser Patterns**
- "Victoria Watson requested an application:" not handled
- "Jenna Olsakowski says:" being parsed incorrectly

## Investigation & Fix Assignment

---

## Claude 2 (Backend) - PRIORITY 1
**Time Estimate**: 45 minutes

### Investigation Tasks (20 min)

#### Task 1: Debug Parser Name Extraction
```bash
# Test the parser with problematic emails
node -e "
const parser = require('./src/parsers/zillowParser');
const test1 = {
  subject: 'New message',
  body: '2010 Walnut St #B02, Philadelphia, PA, 19103. Jenna Olsakowski says: I would like to schedule a tour',
  sender: 'test@zillow.com'
};
const result1 = parser.parse(test1);
console.log('Test 1 - Jenna:', result1.first_name, result1.last_name);

const test2 = {
  subject: 'New application request',
  body: '1419 N 17th St #C, Philadelphia, PA, 19121. Victoria Watson requested an application: I am interested',
  sender: 'test@zillow.com'
};
const result2 = parser.parse(test2);
console.log('Test 2 - Victoria:', result2.first_name, result2.last_name);
"
```

**VERIFY**: Why is "96" being extracted as a name?
- Check if subject line patterns are too broad
- Look for regex that might match numbers
- Find where "New message" text is being parsed as last name

#### Task 2: Check Lead Ordering
```bash
# Query database directly to verify ordering
curl -s http://localhost:3001/api/leads?limit=10 | jq '.leads[].inquiry_date'
```

**VERIFY**: Is the API actually returning in correct order?
- Check if inquiry_date.desc is working
- Verify no caching issues
- Test with direct Supabase query

### Fix Tasks (25 min)

#### Fix 1: Parser Name Extraction
**File**: `/backend/src/parsers/zillowParser.js`

**CRITICAL**: Find and fix the pattern causing "96" extraction
```javascript
// INVESTIGATE THESE AREAS:
// 1. Line 50-60: Subject line parsing
// 2. Any pattern matching digits as names
// 3. Fallback logic that might use numbers

// ADD these patterns:
// Pattern for "X requested an application"
if (!result.first_name) {
  const requestMatch = cleanBody.match(/([A-Za-z]+\s+[A-Za-z]+)\s+requested\s+an?\s+application/i);
  if (requestMatch) {
    const nameParts = requestMatch[1].split(/\s+/);
    result.first_name = nameParts[0];
    result.last_name = nameParts.slice(1).join(' ');
  }
}

// Fix "says:" pattern to handle property address before name
const saysMatch = cleanBody.match(/\.?\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+says:/i);
```

#### Fix 2: Ensure Ordering Works
**File**: `/backend/src/models/leadModel.js`

**VERIFY** line 54 is actually:
```javascript
queryParams.push(`order=inquiry_date.desc`);
```

If it is, check why it's not working:
- Test with nulls_last: `order=inquiry_date.desc.nullslast`
- Check if inquiry_date has null values breaking sort

---

## Claude 3 (Frontend) - PRIORITY 2
**Time Estimate**: 30 minutes

### Investigation Tasks (15 min)

#### Task 1: Debug Date Display
**File**: `/frontend/src/components/leads/LeadCard.tsx`

Find where "Today" is displayed:
```typescript
// Look for date formatting logic
// Is it using daysSinceInquiry incorrectly?
// Should show actual date not "Today" for all
```

#### Task 2: Debug Income Display
**File**: `/frontend/src/app/leads/[id]/page.tsx`

Check formatIncome function:
```typescript
// Line ~143 - Why is $27,456 showing as monthly?
// Is income_type field being ignored?
// Check if backend is sending income_type
```

### Fix Tasks (15 min)

#### Fix 1: Date Display
**File**: `/frontend/src/components/leads/LeadCard.tsx`

```typescript
// Instead of always showing "Today", show actual date:
const inquiryDate = new Date(currentLead.inquiry_date);
const formatDate = (date: Date) => {
  const today = new Date();
  const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  // Show actual date for older
  return date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
};
```

#### Fix 2: Income Display Logic
Verify the logic at line 143-165:
```typescript
// Ensure we're checking income_type from backend
const incomeType = (lead as any)?.income_type;

// For Hollis: $27,456 should be annual if > $10,000
if (!incomeType && numValue > 15000) {
  // Likely annual, not monthly
  return `${formatted}/yr`;
}
```

---

## Claude 1 (Orchestrator) - COORDINATION
**Time Estimate**: 20 minutes

### Phase 1: Coordinate Investigation (10 min)
1. Ensure Claude 2 & 3 start investigations simultaneously
2. Monitor for blockers
3. Test lead 455 (Jenna) and Hollis Crane specifically

### Phase 2: Verification Testing (10 min)
After fixes by Claude 2 & 3:

```bash
# Test 1: Verify "96" name bug is fixed
curl http://localhost:3001/api/leads/455 | jq '.lead | {first_name, last_name}'
# Should show: Jenna Olsakowski, not "96"

# Test 2: Verify ordering
curl "http://localhost:3001/api/leads?limit=5" | jq '.leads[].inquiry_date'
# Should be newest first

# Test 3: Check Victoria Watson pattern
node -e "/* test Victoria Watson requested an application */"

# Test 4: Frontend display
# - Dates should show correctly (not all "Today")
# - Hollis income should be annual
```

### Phase 3: Create Updated Repair Script
If parser fixes work, update `/backend/scripts/repair-existing-leads.js` to:
1. Fix leads with "96" as name
2. Re-parse Victoria Watson type emails
3. Fix income_type for amounts > $15,000

---

## Critical Success Metrics

### Must Fix:
1. ✅ No more "96" or garbage in name fields
2. ✅ Dates display correctly (8/30, 9/14, not all "Today")
3. ✅ Leads ordered by newest inquiry first
4. ✅ Hollis shows ~$27k/yr not /mo
5. ✅ Victoria Watson & similar patterns parse correctly

### Import Behavior Clarification:
- Gmail API returns newest emails first
- Deduplication by phone number prevents duplicates
- Importing 50 then 50 more will get next 50 oldest emails
- No risk of missing recent emails

## Communication Protocol
1. Each Claude reports findings in first 15 minutes
2. Discuss root causes before implementing fixes
3. Test individually then together
4. Report completion with proof of fixes

## IMPORTANT INVESTIGATION NOTES

**For Claude 2**: The "96" bug is CRITICAL. It suggests the parser is:
- Matching apartment numbers as names?
- Using a too-broad regex pattern?
- Has fallback logic using any text/numbers?

**For Claude 3**: The "Today" issue means:
- Date calculation is wrong
- Or hardcoded to show "Today"
- Check daysSinceInquiry calculation

**DO NOT ASSUME** - Test and verify each hypothesis!