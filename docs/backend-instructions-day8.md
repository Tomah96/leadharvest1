# Backend Instructions for Claude 2 - Day 8

## 🔴 IMPORTANT: DO NOT START UNTIL DATABASE IS UPDATED!
Check `/docs/collaboration-status-day8.md` for database status before beginning.

## Your Mission
Fix the backend to use the new database schema with proper property fields and unit extraction.

## Task 1: Create Address Parser Utility
**File to create:** `/backend/src/utils/addressParser.js`

```javascript
// This utility should extract unit numbers from addresses
// Examples to handle:
// "646 W Huntingdon St unit 1" → {address: "646 W Huntingdon St", unit: "1"}
// "1820 N 17th St #A" → {address: "1820 N 17th St", unit: "A"}
// "5914 Tackawanna St, Apt 2B" → {address: "5914 Tackawanna St", unit: "2B"}
// "123 Main Street" → {address: "123 Main Street", unit: null}

class AddressParser {
  static parseAddress(fullAddress) {
    if (!fullAddress) return { address: null, unit: null };
    
    // Pattern to match common unit indicators
    // Match: unit, apt, apartment, suite, ste, #, room, rm
    // After: street, st, road, rd, avenue, ave, drive, dr, court, ct, place, pl
    
    // Your implementation here
    // Return: { address: string, unit: string|null }
  }
}

module.exports = AddressParser;
```

## Task 2: Update Lead Service
**File to modify:** `/backend/src/services/leadService.js`

### Remove these fields (they don't exist in database):
- ❌ `property` (use `property_address` instead)
- ❌ `missing_info` 
- ❌ `parsing_errors`
- ❌ `gmail_message_id`
- ❌ `lead_type`

### Add/Update these fields:
```javascript
// In processEmailLead method around line 194:
const AddressParser = require('../utils/addressParser');

// Parse the address to extract unit
const { address, unit } = AddressParser.parseAddress(
  emailData.property || emailData.property_address
);

const leadData = {
  source: emailData.source,
  first_name: emailData.first_name || '',
  last_name: emailData.last_name || '',
  phone: emailData.phone,
  email: emailData.email,
  property_address: address,  // ✅ Use new field
  unit: unit,                  // ✅ New field
  lease_length: emailData.lease_length, // ✅ New field
  inquiry_date: emailData.inquiry_date || new Date().toISOString(),
  credit_score: emailData.credit_score,
  income: emailData.income,
  move_in_date: emailData.move_in_date,
  occupants: emailData.occupants,
  pets: emailData.pets,
  status: 'new',
  notes: emailData.notes || emailData.message
};
```

### Also update createOrUpdateLead method:
- Remove any references to missing_info calculation
- Ensure all fields match database schema

## Task 3: Update Email Parsers
**Files to check:** `/backend/src/parsers/*.js`

Each parser should return data with:
- `property` or `property_address` (will be parsed for unit)
- `lease_length` if available
- Remove `missing_info` and `parsing_errors`

## Task 4: Test the Import
After making changes:

1. Restart the backend:
```bash
cd /backend
npm run dev
```

2. Test with curl:
```bash
curl -X POST http://localhost:3001/api/gmail/test/import \
  -H "Content-Type: application/json" \
  -d '{"labelId": "processed-lead", "count": 5}'
```

3. Check the logs for successful parsing

## Task 5: Update Progress

After each task, update `/docs/collaboration-status-day8.md`:

```markdown
### 🟢 Claude 2 (Backend) - IN PROGRESS

✅ **Completed:**
- [ ] Created addressParser.js utility
- [ ] Updated leadService.js with new fields
- [ ] Removed non-existent field references
- [ ] Updated email parsers
- [ ] Tested import with 5 emails

🔧 **Current Task:**
[What you're working on now]

📝 **Notes:**
[Any issues or findings]
```

## Expected Results

After your changes, the 5 test emails should:
1. Parse successfully
2. Extract units properly:
   - "646 W Huntingdon St unit 1" → unit: "1"
   - "1820 N 17th St #A" → unit: "A"
3. Save to database without errors
4. Have proper property_address and unit fields

## Communication

1. **Before starting:** Check database status in `/docs/collaboration-status-day8.md`
2. **During work:** Update your progress every 30 minutes
3. **If blocked:** Document the issue and tag Claude 1
4. **When complete:** Update status and notify Claude 1 for testing

## Testing Checklist

- [ ] Address parser extracts units correctly
- [ ] All 5 emails import without errors
- [ ] Database receives correct fields
- [ ] No "column not found" errors
- [ ] Units are properly separated from addresses

## Common Issues & Solutions

**Issue:** "column not found" error
**Solution:** Remove that field from leadData object

**Issue:** Unit not extracting
**Solution:** Check addressParser regex patterns

**Issue:** Import still failing
**Solution:** Check console logs, verify database has new columns

---
*Created by: Claude 1 (Orchestrator)*
*For: Claude 2 (Backend Engineer)*
*Date: 2025-08-08*