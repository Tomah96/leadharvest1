# Backend Claude - Debug Parsing Issue

## Problem
Emails are importing but all failing with "Failed to create or update lead". Examples:
- "Christine is requesting information about 1732 W Master St #2B, Philadelphia, PA, 19121"
- "New realtor.com lead - Michelle hammonds"
- "Diane Chapman is interested in 1732 Master St unit 2B"

## Investigation Steps

### 1. Check Lead Service Error
The error "Failed to create or update lead" comes from the lead service. Since we're in Gmail-only mode (no database), the lead creation is failing.

**File to check**: `/backend/src/services/leadService.js`
- Look at the `processEmailLead` method
- Check if it's trying to save to database when in Gmail-only mode

### 2. Modify for Gmail-Only Mode
The service needs to handle Gmail-only mode by:
```javascript
// In processEmailLead method
if (!isDatabaseAvailable()) {
  // In Gmail-only mode, just return the parsed data
  return {
    success: true,
    lead: parsedData,
    isNew: true,
    message: 'Parsed successfully (database not available)'
  };
}
```

### 3. Update Email Parsing Service
**File**: `/backend/src/services/emailParsingService.js`

In the `parseAndProcessEmail` method, handle the Gmail-only response:
```javascript
try {
  const result = await leadService.processEmailLead(parsedData);
  
  // In Gmail-only mode, consider it successful if we got parsed data
  if (result.lead && !isDatabaseAvailable()) {
    return {
      parsed: true,
      data: result.lead,
      source: source
    };
  }
  
  // ... existing code for database mode
} catch (error) {
  // Handle the error appropriately
}
```

### 4. Test the Fix
After making changes, test with:
```bash
curl -X POST http://localhost:3001/api/gmail/test/import \
  -H "Content-Type: application/json" \
  -d '{"labelId":"Label_16","count":5}'
```

Expected result: Emails should show as parsed with extracted data, even without database.

## Quick Fix Option

If the above is too complex, a simpler approach in `gmailController.js` `testImportEmails` method:

```javascript
// Around line 804 where parseAndProcessEmail is called
try {
  const parseResult = await emailParsingService.parseAndProcessEmail(emailData);
  
  // For test endpoint, just check if we got parsed data
  if (parseResult.data) {
    results.push({
      id: email.id,
      from: email.from,
      subject: email.subject,
      source: parseResult.source,
      parsed: true,
      data: parseResult.data,
      error: null
    });
  } else {
    // ... handle unparsed case
  }
} catch (error) {
  // For test endpoint, if we have parsed data in the error, use it
  if (error.parsedData) {
    results.push({
      id: email.id,
      from: email.from,
      subject: email.subject,
      source: error.source || 'unknown',
      parsed: true,
      data: error.parsedData,
      error: 'Database not available'
    });
  } else {
    // ... handle actual parsing error
  }
}
```

## Success Criteria
- Emails should show as "parsed: true" 
- Should see extracted data (name, property, etc.)
- No "Failed to create or update lead" errors in Gmail-only mode
- Frontend shows the parsed data in the review modal