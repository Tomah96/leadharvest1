# Email Parsing Fix - Task Delegation
**Created**: 2025-08-09 14:10 by Orchestrator Claude
**Purpose**: Fix Zillow email parsing and display issues

## 🚨 CRITICAL ISSUE
Zillow emails are not being parsed correctly. Lead 302 (Autanya Lucas) shows:
- Only first name extracted (missing last name)
- HTML fragments in notes field
- Missing ALL financial and preference data
- No inquiry message captured

## 📧 Sample Email Data Structure (Zillow)
```
Subject: Autanya Lucas is requesting information about 1919 W Diamond St #2, Philadelphia, PA, 19121

Body contains:
- "Autanya Lucas says: I would like to schedule a tour."
- Move in: Oct 01, 2025
- Credit score: 620 to 659  
- Income: $83976
- Pets: No
- Lease Length: 18 months
- Number of Occupants: 2
- Number of Bedrooms: 3
```

---

## 🔧 BACKEND TASKS (Claude 2)

### Priority 1: Fix Zillow Parser (2 hours)

**File**: `/backend/src/parsers/zillowParser.js`

#### Task 1.1: Handle HTML Email Format
```javascript
// Current issue: Parser is getting raw HTML, not text
// Solution: Add HTML stripping/parsing logic

// Before parsing, clean HTML:
const cleanHtml = (html) => {
  // Remove style tags and content
  html = html.replace(/<style[^>]*>.*?<\/style>/gi, '');
  // Replace divs with newlines for structure
  html = html.replace(/<\/div>/gi, '\n');
  html = html.replace(/<div[^>]*>/gi, '');
  // Remove all other tags
  html = html.replace(/<[^>]+>/g, '');
  // Decode HTML entities
  html = html.replace(/&nbsp;/g, ' ');
  html = html.replace(/&#x24;/g, '$');
  html = html.replace(/&#xa0;/g, ' ');
  return html;
};
```

#### Task 1.2: Extract Full Name from "X says:" Pattern
```javascript
// Pattern to find: "Autanya Lucas says:"
const saysPattern = /([A-Za-z]+(?:\s+[A-Za-z]+)*)\s+says:\s*(.+?)(?:\.|$)/i;
const saysMatch = cleanedBody.match(saysPattern);
if (saysMatch) {
  const fullName = saysMatch[1].trim();
  const nameParts = fullName.split(/\s+/);
  result.first_name = nameParts[0];
  result.last_name = nameParts.slice(1).join(' ');
  result.notes = saysMatch[2].trim(); // The inquiry message
}
```

#### Task 1.3: Parse Structured Data Sections
```javascript
// Zillow sends data in paired format:
// "Move in\nOct 01, 2025"
// "Credit score\n620 to 659"

const extractStructuredData = (text) => {
  const patterns = {
    moveIn: /Move\s+in\s*\n\s*([^\n]+)/i,
    creditScore: /Credit\s+score\s*\n\s*([\d\s\-to]+)/i,
    income: /Income\s*\n\s*\$?([\d,]+)/i,
    pets: /Pets?\s*\n\s*(Yes|No)/i,
    leaseLength: /Lease\s+Length\s*\n\s*(\d+)\s*months?/i,
    occupants: /Number\s+of\s+Occupants?\s*\n\s*(\d+)/i,
    bedrooms: /Number\s+of\s+Bedrooms?\s*\n\s*(\d+)/i
  };
  
  // Extract each field
  // Store in appropriate database columns
};
```

#### Task 1.4: Preserve Raw Email Content
```javascript
// Store original email for debugging/reference
result.metadata = {
  raw_email: originalEmailContent,
  parsed_at: new Date().toISOString(),
  parser_version: '2.0'
};
```

### Priority 2: Create Re-parse Script (30 min)

**File**: `/backend/scripts/reparse-zillow-leads.js`

```javascript
// Script to re-parse existing Zillow leads (270-302)
// 1. Fetch leads from database where source='zillow'
// 2. Get original email content (if stored)
// 3. Run through updated parser
// 4. Update database with new parsed data
// 5. Log results for verification
```

### Priority 3: Test with Real Data (30 min)
- Test with lead 302 (Autanya Lucas)
- Verify all fields extracted correctly
- Test with other Zillow leads
- Document any edge cases found

---

## 🎨 FRONTEND TASKS (Claude 3)

### Priority 1: Update Lead Details Display (1 hour)

**File**: `/frontend/src/app/leads/[id]/page.tsx`

#### Task 1.1: Display All Financial Data
```typescript
// Add sections for:
// - Credit Score Range (with color coding)
// - Monthly/Annual Income
// - Employment Status
// - Financial Qualification Status
```

#### Task 1.2: Display Preferences Section
```typescript
// Add new section showing:
// - Move-in Date (formatted nicely)
// - Lease Length preference
// - Number of Occupants
// - Number of Bedrooms needed
// - Pet information
```

#### Task 1.3: Show Inquiry Message Prominently
```typescript
// Display the actual inquiry message at the top
// "I would like to schedule a tour"
// Make it stand out as the primary communication
```

#### Task 1.4: Add Raw Email Viewer
```typescript
// Add collapsible section for raw email
// Useful for debugging and verification
// Format as monospace/code block
```

### Priority 2: Improve Data Presentation (30 min)

#### Task 2.1: Better Empty States
- Instead of "Not provided", use contextual messages
- "Awaiting credit check" for missing credit
- "To be discussed" for missing preferences

#### Task 2.2: Add Visual Indicators
- Icons for each data type
- Color coding for financial qualifications
- Progress bars for profile completeness

#### Task 2.3: Format Financial Data
- Format income with commas ($83,976)
- Show credit ranges clearly (620-659)
- Add qualification badges (Qualified/Needs Review)

---

## 📋 TESTING CHECKLIST

### Backend Testing
- [ ] Lead 302 shows "Autanya Lucas" (full name)
- [ ] Inquiry message captured: "I would like to schedule a tour"
- [ ] Credit score: 620-659
- [ ] Income: 83976
- [ ] Move-in date: 2025-10-01
- [ ] Pets: false
- [ ] Lease length: 18
- [ ] Occupants: 2
- [ ] Bedrooms: 3
- [ ] No HTML fragments in notes

### Frontend Testing
- [ ] All financial data displayed
- [ ] Preferences section visible
- [ ] Inquiry message prominent
- [ ] Raw email viewer works
- [ ] Data formatting correct
- [ ] Empty states contextual

---

## 🚀 EXECUTION ORDER

1. **Backend Claude (Claude 2)** - Start immediately
   - Fix parser (2 hours)
   - Create re-parse script (30 min)
   - Test and verify (30 min)
   - Update ACTIVE-WORK-LOG.md

2. **Frontend Claude (Claude 3)** - Start after backend confirms parser fix
   - Update display components (1 hour)
   - Improve presentation (30 min)
   - Test with real data
   - Update ACTIVE-WORK-LOG.md

3. **Orchestrator** - Coordinate and verify
   - Monitor progress
   - Test end-to-end
   - Document completion

---

## 📝 COMMUNICATION PROTOCOL

1. Backend Claude: Post in AGENT-COMMUNICATION-LOG.md when parser is fixed
2. Frontend Claude: Wait for backend confirmation before starting
3. Both: Update ACTIVE-WORK-LOG.md with progress
4. Both: Report any blockers in blockers-and-issues.md

---

## 🎯 SUCCESS CRITERIA

The fix is complete when:
1. Lead 302 shows all data correctly
2. No HTML fragments in any field
3. All Zillow leads (270-302) properly parsed
4. Frontend displays all information clearly
5. Raw email preserved for reference

---

## 💡 IMPORTANT NOTES

- The email is HTML formatted, not plain text
- Data appears in div pairs: `<div>Label</div><div>Value</div>`
- The "says:" pattern is key for name extraction
- Preserve original email for debugging
- Test with multiple Zillow emails to ensure robustness

---

END OF TASK DELEGATION