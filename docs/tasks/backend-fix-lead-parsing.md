# Task Assignment: Fix Lead Data Parsing

**Assigned to**: Claude 2 (Backend)
**Date**: 2025-01-08
**Priority**: High
**Dependencies**: None

## Problem Statement

Email parsing is not correctly extracting lead information. Example:
- Lead 299 has "Tynesia Clanton" in the notes field
- But first_name shows "RentMarketplace." and last_name is empty
- Financial and preference data not being extracted

## Requirements

### 1. Fix Name Extraction

**Current Issue**:
```
notes: "Hello, I'd like more information about 1718 Edgley St.\r\nFirst Name: Tynesia\r\nLast Name: Clanton"
first_name: "RentMarketplace."  // WRONG
last_name: ""  // WRONG
```

**Expected Result**:
```
first_name: "Tynesia"
last_name: "Clanton"
```

### 2. Parsing Improvements Needed

Review and fix parsers for all email sources:
- `/backend/src/services/parsers/rentMarketplaceParser.js`
- `/backend/src/services/parsers/zillowParser.js`
- `/backend/src/services/parsers/apartmentsParser.js`
- `/backend/src/services/parsers/realtorParser.js`

### 3. Data Extraction Patterns

Look for and extract:
- **Names**: "First Name:", "Last Name:", "Name:", etc.
- **Contact**: Phone numbers (various formats), emails
- **Financial**: "Income:", "Credit Score:", salary mentions
- **Preferences**: "Move-in:", "Occupants:", "Pets:", lease terms
- **Property**: Address, unit numbers

### 4. Update Existing Leads

After fixing parsers:
1. Create a migration script or endpoint to re-parse existing leads
2. Update the 5 test leads (IDs 298-302) with corrected data
3. Preserve original notes field

### 5. Testing Requirements

Test each parser with sample emails:
```javascript
// Test the parser directly
const result = parseRentMarketplace(emailContent);
console.log(result);

// Verify extraction
assert(result.first_name === "Tynesia");
assert(result.last_name === "Clanton");
```

## Implementation Steps

1. **Analyze Current Parsers**:
   ```bash
   grep -n "first_name" src/services/parsers/*.js
   ```

2. **Fix RentMarketplace Parser First** (it's clearly broken):
   - Check how it's extracting names
   - Fix the regex/logic
   - Test with lead 299's email content

3. **Review Other Parsers**:
   - Ensure consistent extraction logic
   - Add fallback patterns
   - Handle edge cases

4. **Create Re-parse Endpoint** (optional):
   ```javascript
   // POST /api/leads/reparse/:id
   // Re-runs parser on original email content
   ```

## Common Parsing Patterns

```javascript
// Name extraction patterns
/First Name[:\s]+([^\n\r]+)/i
/Last Name[:\s]+([^\n\r]+)/i
/Name[:\s]+([^\n\r]+)/i  // Full name

// Phone patterns
/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/
/\(\d{3}\)\s?\d{3}-\d{4}/

// Financial patterns
/income[:\s]+\$?([\d,]+)/i
/credit score[:\s]+(\d{3})/i
```

## Success Criteria

- [ ] Lead 299 shows first_name: "Tynesia", last_name: "Clanton"
- [ ] All 4 email parsers correctly extract names
- [ ] Financial data extracted when present
- [ ] Preference data extracted when present
- [ ] Original notes preserved
- [ ] No data loss during re-parsing

## Communication Protocol

1. **Before Starting**:
   ```bash
   cat /mnt/c/Users/12158/LeadHarvest/docs/CURRENT-STATE.md
   tail -50 /mnt/c/Users/12158/LeadHarvest/docs/ACTIVE-WORK-LOG.md
   ```

2. **When Complete**:
   - Update ACTIVE-WORK-LOG.md with fixes made
   - Document which parsers were updated
   - List any leads that were re-parsed
   - Communicate to Frontend if data structure changes

## Notes

- Focus on RentMarketplace parser first (most broken)
- Don't over-engineer - simple regex patterns work fine
- Preserve all original data in notes field
- Consider adding a `parsing_confidence` field for future use