# Claude 3 - Frontend Display Fix Tasks

**Priority**: URGENT - These fixes are needed to display data correctly
**Time Estimate**: 20 minutes

## Task 1: Fix Pets Display Logic

**File**: `/frontend/src/app/leads/[id]/page.tsx`
**Line**: 608

### Current Problem:
- Using `(lead.pets || lead.has_pets)` which treats string "false" as truthy
- Shows "Has pets" when database has pets="false"

### Fix Required:
```typescript
// Replace line 608
// OLD: {(lead.pets || lead.has_pets) ? '🐕 Has pets' : '❌ No pets'}
// NEW:
{(lead.pets && lead.pets !== "" && lead.pets !== "false") ? 
  `🐕 Has pets${lead.pets !== 'Yes' ? `: ${lead.pets}` : ''}` : 
  '❌ No pets'}
```

This will:
- Show "No pets" for null, empty string, or "false"
- Show "Has pets: 2 dogs" if specific pet info provided
- Show "Has pets" for generic yes

## Task 2: Fix Income Display Logic

**File**: `/frontend/src/app/leads/[id]/page.tsx`
**Lines**: 129-145 (formatIncome function)

### Current Problem:
- Assumes all income is monthly and multiplies by 12
- $120,000 annual shows as "$120,000/mo ($1,440,000/yr)"

### Fix Required:
```typescript
const formatIncome = (value: number | string): string => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (!numValue || isNaN(numValue)) return 'Not provided';
  
  // Format the number
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numValue);
  
  // Smart detection of income type
  // Check if lead has income_type field (from new parser)
  const incomeType = (lead as any).income_type;
  
  if (incomeType === 'annual' || numValue > 10000) {
    // Display as annual income
    return `${formatted}/yr`;
  } else {
    // Display as monthly with annual calculation
    const annual = numValue * 12;
    const annualFormatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(annual);
    
    return `${formatted}/mo (${annualFormatted}/yr)`;
  }
};
```

## Task 3: Display Full Names Properly

**File**: `/frontend/src/app/leads/[id]/page.tsx`
**Location**: Where name is displayed

### Current Display:
Probably shows just `{lead.first_name}`

### Fix Required:
```typescript
// Display full name with last name when available
<h1 className="text-2xl font-bold">
  {lead.first_name}
  {lead.last_name && lead.last_name !== '' && ` ${lead.last_name}`}
</h1>
```

## Also Update Lead Cards

**File**: `/frontend/src/components/leads/LeadCard.tsx`

Apply similar fixes for:
1. Name display (show full name)
2. Income display (detect annual vs monthly)
3. Pets display (handle string values)

## Testing:
1. Check Mackenzie lead (ID 365) displays:
   - Full name: "Mackenzie Bohs"
   - Income: "$120,000/yr" (not monthly)
   - Pets: "No pets" (not "Has pets")

2. Check other Zillow leads display correctly

## Success Criteria:
- ✅ Full names displayed when available
- ✅ "No pets" shows correctly
- ✅ Annual income shows as "/yr" not "/mo"
- ✅ Pet types displayed when provided ("Has pets: 2 dogs")

Please update these files and test, then report back when complete!