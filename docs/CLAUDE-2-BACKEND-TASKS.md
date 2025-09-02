# Claude 2 - Backend Parser Fix Tasks

**Priority**: URGENT - These fixes are blocking correct data display
**Time Estimate**: 20 minutes

## Task 1: Fix Name Extraction in Zillow Parser

**File**: `/backend/src/parsers/zillowParser.js`
**Lines**: Around 83-88

### Current Problem:
- Subject line extraction gets "Mackenzie" only
- Body has "Mackenzie Bohs says:" but it's not being used properly
- Result: Missing last names for all Zillow leads

### Fix Required:
```javascript
// After line 83, check if we have "X says:" pattern and override if better
const saysMatch = cleanBody.match(/(.+?)\s+says:/i);
if (saysMatch) {
  const fullName = saysMatch[1].trim();
  const parts = fullName.split(/\s+/);
  
  // Only override if we get a better name (has last name)
  if (!result.last_name || result.last_name === '') {
    result.first_name = parts[0];
    result.last_name = parts.slice(1).join(' ') || null;
  }
}
```

## Task 2: Fix Pets Storage

**File**: `/backend/src/parsers/zillowParser.js`
**Lines**: Around pets parsing section

### Current Problem:
- Storing "false" as string which is truthy in JavaScript
- Frontend shows "Has pets" when it should show "No pets"

### Fix Required:
```javascript
if (petsMatch) {
  const petsValue = petsMatch[1].toLowerCase();
  
  // Store null for no pets, actual value for yes
  if (petsValue === 'no' || petsValue === 'false') {
    result.pets = null;  // or empty string ""
  } else if (petsValue === 'yes' || petsValue === 'true') {
    result.pets = 'Yes';  // Generic yes
  } else {
    result.pets = petsValue; // Store specific type: "2 dogs", "cats", etc
  }
}
```

## Task 3: Add Income Type Detection

**File**: `/backend/src/parsers/zillowParser.js`
**Lines**: Around income parsing section

### Current Problem:
- No way to tell if income is monthly or annual
- Frontend assumes all values are monthly and multiplies by 12
- $120,000 annual shows as "$120,000/mo ($1,440,000/yr)"

### Fix Required:
```javascript
// Look for income type indicators
const hasAnnual = cleanBody.match(/annual|yearly|per year|\/yr/i);
const hasMonthly = cleanBody.match(/monthly|per month|\/mo/i);

let incomeMatch = cleanBody.match(patterns.income);
if (!incomeMatch) {
  incomeMatch = cleanBody.match(/Income\s*\n\s*\$?([\d,]+)/i);
}

if (incomeMatch) {
  const amount = parseFloat(incomeMatch[1].replace(/,/g, ''));
  result.income = amount;
  
  // Determine income type
  if (hasAnnual) {
    result.income_type = 'annual';
  } else if (hasMonthly) {
    result.income_type = 'monthly';
  } else {
    // Smart guess based on amount
    result.income_type = amount > 10000 ? 'annual' : 'monthly';
  }
}
```

## Testing Commands:
```bash
# Test the parser locally
node test-zillow-parsing-issues.js

# Check specific lead
curl -s http://localhost:3001/api/leads | grep -A10 "Mackenzie"
```

## Success Criteria:
- ✅ Full names extracted (first AND last)
- ✅ Pets stored as null/"" for no, string value for yes
- ✅ Income type detected and stored
- ✅ All existing Zillow leads can be re-parsed correctly

Please update these files and test, then report back when complete!