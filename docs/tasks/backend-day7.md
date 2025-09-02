# Backend Claude - Day 7 Tasks

## Priority 1: Fix Zillow Email Parser

The emails from @convo.zillow.com have a specific format that needs parsing:
- Subject: "X is requesting information about [property address]"

### Task 1: Update Zillow Parser
**File**: `/backend/src/parsers/zillowParser.js`

The parser needs to extract from this subject format:
```
"Mamoudou is requesting information about 1504 N Willington St #B, Philadelphia, PA, 19121"
```

Extract:
- **Name**: "Mamoudou" (first word before "is requesting")
- **Property**: "1504 N Willington St #B, Philadelphia, PA, 19121" (everything after "about")

**Code to add**:
```javascript
// Parse subject line for @convo.zillow.com format
if (subject && subject.includes('is requesting information about')) {
  const match = subject.match(/^(.+?)\s+is requesting information about\s+(.+)$/i);
  if (match) {
    parsedData.first_name = match[1].trim();
    parsedData.property_address = match[2].trim();
    parsedData.property = match[2].trim();
  }
}
```

### Task 2: Handle Missing Phone Numbers

Since these emails don't contain phone numbers in an easily parseable format, we need to:

1. **Option A**: Make phone optional for initial import
   - Modify `/backend/src/services/leadService.js`
   - Allow creating leads without phone for parsing phase
   - Add a flag like `needs_phone: true` for follow-up

2. **Option B**: Generate placeholder phone
   - Use email or name to create unique placeholder
   - Example: "PENDING-Mamoudou-001"
   - Mark as needing update

3. **Option C**: Extract from email body
   - Check if phone appears in email body in formats like:
     - "Phone: XXX-XXX-XXXX"
     - "Call me at XXX-XXX-XXXX"
     - "Mobile: XXX-XXX-XXXX"

### Task 3: Parse Realtor.com Emails

Format: "New realtor.com lead - [Name]"

**File**: `/backend/src/parsers/realtorParser.js`

Extract from subject:
```javascript
if (subject && subject.includes('New realtor.com lead')) {
  const match = subject.match(/New realtor\.com lead\s*-\s*(.+)$/i);
  if (match) {
    const fullName = match[1].trim();
    const nameParts = fullName.split(' ');
    parsedData.first_name = nameParts[0];
    parsedData.last_name = nameParts.slice(1).join(' ');
  }
}
```

## Priority 2: Create Email Body Parser

Many lead details are in the email body. Create a utility to extract common patterns:

**Create**: `/backend/src/parsers/utils/bodyParser.js`

```javascript
class BodyParser {
  static extractPhone(body) {
    // Look for various phone patterns
    const patterns = [
      /Phone:\s*([\d-\(\)\s]+)/i,
      /Mobile:\s*([\d-\(\)\s]+)/i,
      /Call.*at:\s*([\d-\(\)\s]+)/i,
      /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/
    ];
    
    for (const pattern of patterns) {
      const match = body.match(pattern);
      if (match) {
        return this.normalizePhone(match[1]);
      }
    }
    return null;
  }
  
  static extractEmail(body) {
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = body.match(emailPattern);
    return match ? match[0] : null;
  }
  
  static normalizePhone(phone) {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
      return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
    }
    return phone;
  }
}
```

## Priority 3: Testing Commands

After implementing, test with:

```bash
# Test single import
curl -X POST http://localhost:3001/api/gmail/test/import \
  -H "Content-Type: application/json" \
  -d '{"labelId":"Label_16","count":1}'

# Test batch import
curl -X POST http://localhost:3001/api/gmail/test/import \
  -H "Content-Type: application/json" \
  -d '{"labelId":"Label_16","count":10}'
```

## Success Criteria

1. Zillow emails parse name and property from subject
2. Realtor emails parse name from subject
3. Phone extraction works from body OR placeholder system works
4. At least 80% of emails parse successfully
5. Can import without "Phone number is required" error

## Files to Modify

1. `/backend/src/parsers/zillowParser.js` - Add subject parsing
2. `/backend/src/parsers/realtorParser.js` - Add subject parsing
3. `/backend/src/parsers/utils/bodyParser.js` - Create body parser utility
4. `/backend/src/services/leadService.js` - Handle missing phones
5. `/backend/src/parsers/emailSourceDetector.js` - Already updated ✅