# Backend Claude - Fix Email Parsers

## Critical Parser Fixes Needed

### 1. Update Email Source Detector
The emailSourceDetector.js is missing patterns for actual Zillow emails.

**Current patterns:**
```javascript
senderPatterns: ['@zillow.com', 'zillow rental manager', 'noreply@zillow.com']
```

**Add these patterns:**
```javascript
senderPatterns: ['@zillow.com', '@convo.zillow.com', 'zillow rental manager', 'noreply@zillow.com']
```

Also update subject patterns to include:
- "is requesting information about" (common Zillow pattern)

### 2. Fix Parser Field Extraction

Based on the actual emails we're receiving, the parsers need to extract:

**From Zillow emails like "Ernestine is requesting information about 1919 W Diamond St #2, Philadelphia, PA, 19121":**
- Lead name: "Ernestine" (from subject)
- Property address: "1919 W Diamond St #2, Philadelphia, PA, 19121" (from subject)
- Phone: Check email body for phone number
- Email: Check email body for contact email

**From Realtor emails like "New realtor.com lead - Gabby Wood":**
- Lead name: "Gabby Wood" (from subject)
- Property: Check email body
- Phone: Check email body
- Email: Check email body

### 3. Test Cases to Fix

These emails are failing to parse:
1. "Ernestine is requesting information about 1919 W Diamond St #2, Philadelphia, PA, 19121"
2. "Hritik is requesting information about 253 N 3rd St #4, Philadelphia, PA, 19106"
3. "New realtor.com lead - Gabby Wood"
4. "New realtor.com lead - Mamadou Kouyate"

### 4. Required Parser Updates

**File: `/backend/src/parsers/zillowParser.js`**
- Add pattern to extract name from "X is requesting information" subject
- Add pattern to extract property from subject
- Look for phone/email in email body with patterns like:
  - "Phone: XXX-XXX-XXXX"
  - "Contact: xxx@xxx.com"
  - "Mobile: XXX-XXX-XXXX"

**File: `/backend/src/parsers/realtorParser.js`**
- Add pattern to extract name from "New realtor.com lead - X" subject
- Parse email body for property details
- Extract contact information from body

### 5. Testing Commands

After fixing, test with:
```bash
# Import processed leads
curl -X POST http://localhost:3001/api/gmail/test/import \
  -H "Content-Type: application/json" \
  -d '{"labelId":"Label_16","count":5}'
```

Success criteria:
- All 5 emails should have `parsed: true`
- Each should extract at minimum: name, phone, property
- No "Unknown error" messages

## Priority: HIGH
These parsers are the core functionality of LeadHarvest!