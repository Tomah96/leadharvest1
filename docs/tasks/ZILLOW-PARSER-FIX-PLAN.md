# Zillow Parser Fix Plan - Maryorie Lead Issues
**Date**: 2025-08-27
**Priority**: P0 - Critical Data Quality Issues
**Lead Example**: Maryorie castillo (ID: 574)

## Issues Identified

### 1. Pets Field Handling ❌
- **Current**: `pets: false` when email says "Not answered"
- **Expected**: `pets: null`
- **Impact**: Misleading data - shows "No pets" instead of "Unknown"

### 2. Occupants Field Default ❌
- **Current**: `occupants: 0` when not provided
- **Expected**: `occupants: null`
- **Impact**: Shows "0 occupants" instead of "Not provided"

### 3. Missing Inquiry Message ❌
- **Current**: `notes: null`
- **Expected**: Store actual inquiry text
- **Impact**: Losing valuable context about lead intent

### 4. Credit Score Range Storage 🔄
- **Current**: Storing midpoint (690 for "660-719")
- **Consider**: Store full range in metadata
- **Impact**: Losing precision for qualification

## Task Assignments

### Claude 2 (Backend) - Parser Fixes

#### Task 1: Fix "Not answered" Handling
**File**: `/backend/src/parsers/zillowParser.js`
**Changes**:
```javascript
// Current (line ~240)
pets: petsMatch ? petsMatch[1].trim() : 'false'

// Fix to:
pets: petsMatch ? (petsMatch[1].trim() === 'Not answered' ? null : petsMatch[1].trim()) : null
```

#### Task 2: Fix Occupants Default
**File**: `/backend/src/parsers/zillowParser.js`
**Changes**:
```javascript
// Current
occupants: occupantsMatch ? parseInt(occupantsMatch[1]) : 0

// Fix to:
occupants: occupantsMatch ? parseInt(occupantsMatch[1]) : null
```

#### Task 3: Capture Inquiry Message
**File**: `/backend/src/parsers/zillowParser.js`
**Changes**:
- Extract inquiry message from email body
- Look for pattern between property address and "Send Application"
- Store in notes field

#### Task 4: Store Credit Score Range in Metadata
**File**: `/backend/src/parsers/zillowParser.js`
**Changes**:
```javascript
metadata: {
  credit_score_range: creditMatch ? creditMatch[1] : null,
  // ... other metadata
}
```

#### Task 5: Add Tests
**File**: `/backend/src/parsers/__tests__/zillowParser.test.js`
- Test "Not answered" → null
- Test missing occupants → null
- Test inquiry message extraction
- Test metadata storage

### Claude 3 (Frontend) - Display Improvements

#### Task 1: Handle Null Values Properly
**File**: `/frontend/src/app/leads/[id]/page.tsx`
**Changes**:
- Show "Not provided" for null pets (not "No pets")
- Show "Not provided" for null occupants (not "0")
- Display credit score range from metadata if available

#### Task 2: Display Inquiry Message
**File**: `/frontend/src/app/leads/[id]/page.tsx`
**Changes**:
- Add "Initial Inquiry" section if notes field contains inquiry
- Format as quote block with timestamp

#### Task 3: Update Lead Card
**File**: `/frontend/src/components/leads/LeadCard.tsx`
**Changes**:
- Show badge for "Has inquiry message"
- Better null handling for all fields

### Claude 1 (Orchestrator) - Testing & Validation

#### Task 1: Create Test Cases
- Compile list of recent Zillow emails
- Document expected vs actual parsing results
- Create regression test suite

#### Task 2: Validate Fixes
- Test with Maryorie email
- Test with other recent Zillow leads
- Verify no regressions

#### Task 3: Update Documentation
- Document new parser behavior
- Update CLAUDE.md with parsing rules
- Add to lessons learned

## Implementation Order

### Phase 1: Backend Parser Fixes (Claude 2)
1. Fix "Not answered" handling (15 min)
2. Fix occupants default (10 min)
3. Extract inquiry message (30 min)
4. Add metadata storage (20 min)
5. Write tests (30 min)

### Phase 2: Frontend Display (Claude 3)
1. Fix null value display (20 min)
2. Add inquiry message section (30 min)
3. Update lead card badges (15 min)

### Phase 3: Testing & Validation (Claude 1)
1. Test all recent Zillow emails (30 min)
2. Document results (15 min)
3. Create regression tests (20 min)

## Success Criteria

✅ Maryorie lead shows:
- Pets: "Not provided" (not "No pets")
- Occupants: "Not provided" (not "0")
- Inquiry message visible
- Credit score shows "660-719" with context

✅ All recent Zillow leads parse correctly
✅ No regression in other parsers
✅ Tests pass for all scenarios

## Test Data

### Maryorie Email Key Fields
```
Subject: Maryorie is requesting an application for 5914 Tackawanna St
Inquiry: "I'm interested in your property and would like to move forward. Can you send me an application for this property?"
Move in: Aug 28, 2025
Credit: 660 to 719
Pets: Not answered
Lease: 12 months
Occupants: [not provided]
```

## Timeline
- **Start**: Immediately
- **Backend Complete**: 2 hours
- **Frontend Complete**: 1 hour  
- **Testing Complete**: 1 hour
- **Total**: 4 hours

## Communication Protocol
1. Claude 2 starts backend fixes immediately
2. Claude 3 waits for backend completion signal
3. Claude 1 coordinates and tests throughout
4. All updates logged to ACTIVE-WORK-LOG.md

---

## Quick Reference Commands

```bash
# Test parser with Maryorie email
node backend/test-zillow-parser.js maryorie.eml

# Run parser tests
cd backend && npm test -- zillowParser

# Check lead in database
curl http://localhost:3001/api/leads/574

# View in frontend
open http://localhost:3002/leads/574
```