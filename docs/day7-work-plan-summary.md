# Day 7 Work Plan Summary

## Current Situation

✅ **Gmail Connection Working**
- Connected to toma@plusrealtors.com
- Can access 201 emails in "Processed lead" label
- Can import emails successfully

❌ **Lead Parsing Issue**
- Emails import but fail to parse
- Error: "Phone number is required"
- Parser doesn't extract from subject: "X is requesting information about [property]"

## Day 7 Task Assignments

### Backend (Claude 2) - Parser Fixes
**File**: `/docs/tasks/backend-day7.md`

1. **Fix Zillow Parser**
   - Extract name from "X is requesting information about..."
   - Extract property address from subject
   - Handle @convo.zillow.com emails

2. **Handle Missing Phones**
   - Make phone optional OR
   - Generate placeholder phones OR
   - Extract from email body

3. **Fix Realtor Parser**
   - Parse "New realtor.com lead - [Name]" format

### Frontend (Claude 3) - Lead Management UI
**File**: `/docs/tasks/frontend-day7.md`

1. **Add Lead Edit Modal**
   - Allow manual phone entry
   - Edit all lead fields

2. **Visual Indicators**
   - "Needs Phone" badge
   - Highlight incomplete leads

3. **Import Review Page**
   - List leads needing info
   - Bulk edit capabilities

## Terminal Commands for Testing

```bash
# Check connection
curl -s http://localhost:3001/api/gmail/status | jq .

# Import 1 email
curl -X POST http://localhost:3001/api/gmail/test/import \
  -H "Content-Type: application/json" \
  -d '{"labelId":"Label_16","count":1}'

# Import 5 emails
curl -X POST http://localhost:3001/api/gmail/test/import \
  -H "Content-Type: application/json" \
  -d '{"labelId":"Label_16","count":5}'
```

## Expected Outcomes

After Day 7 work:
1. Emails will parse name and property from subject
2. System will handle missing phone numbers gracefully
3. UI will show which leads need phone numbers
4. Users can manually add missing information
5. All 201 leads can be imported and managed

## Success Metrics

- Parse rate increases from 0% to 80%+
- Can import all 201 emails without errors
- UI clearly shows lead status
- Easy workflow to add missing data