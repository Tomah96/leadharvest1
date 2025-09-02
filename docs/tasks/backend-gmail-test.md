# Backend Gmail Test Tasks - Claude 2

Date: 2025-07-17
Priority: Implement Gmail test endpoints for parser verification

## 🔴 Task 1: Fix Label Search to Return Email Count

**File**: `/backend/src/controllers/gmailController.js`
**Method**: `searchLabel`

Current implementation returns matching labels. Need to add email count:

```javascript
static searchLabel = asyncHandler(async (req, res) => {
  // ... existing code ...
  
  // After finding matching labels, if exactly one match:
  if (matchingLabels.length === 1) {
    const labelId = matchingLabels[0].id;
    
    // Fetch email count for this label
    const emails = await gmailService.fetchEmailsByLabel(
      userId, 
      labelId, 
      null, 
      1  // Just need count, not all emails
    );
    
    // Get total count (you may need to add this to gmailService)
    const totalCount = await gmailService.getEmailCountForLabel(userId, labelId);
    
    res.json({
      query,
      matchingLabels,
      emailCount: totalCount || emails.length,
      labelId: labelId,
      found: true
    });
  }
});
```

## 🔴 Task 2: Enhance Import Emails Response

**File**: `/backend/src/controllers/gmailController.js`
**Method**: `importEmails`

Modify to return detailed parsing results:

```javascript
static importEmails = asyncHandler(async (req, res) => {
  const userId = req.user?.id || 'test-user';
  const { labelId, labelName, maxResults = 50 } = req.body;
  
  // Limit to test values
  const allowedLimits = [3, 5, 10, 50];
  const limit = allowedLimits.includes(maxResults) ? maxResults : 10;
  
  console.log(`=== Test Import: ${limit} emails from "${labelName}" ===`);
  
  try {
    const emails = await gmailService.fetchEmailsByLabel(userId, labelId, null, limit);
    
    const results = {
      total: emails.length,
      processed: 0,
      successful: 0,
      failed: 0,
      leads: []
    };
    
    for (const email of emails) {
      const emailResult = {
        emailId: email.id,
        subject: email.subject,
        from: email.from,
        date: email.date,
        source: null,
        parseStatus: 'failed',
        parsedData: null,
        error: null,
        rawEmail: {
          subject: email.subject,
          body: email.body ? email.body.substring(0, 500) + '...' : ''
        }
      };
      
      // Detect source
      const source = emailSourceDetector.detectSource(email);
      emailResult.source = source;
      
      console.log(`\nEmail ${results.processed + 1}/${results.total}:`);
      console.log(`- Subject: ${email.subject}`);
      console.log(`- From: ${email.from}`);
      console.log(`- Source: ${source}`);
      
      if (source !== 'unknown') {
        try {
          // Parse email
          const parseResult = await emailParsingService.parseAndProcessEmail({
            ...email,
            gmail_message_id: email.id
          });
          
          if (parseResult.success) {
            emailResult.parseStatus = 'success';
            emailResult.parsedData = parseResult.lead;
            results.successful++;
            
            // Log parsed fields
            console.log('- Parsed Data:');
            console.log(`  * Name: ${parseResult.lead.first_name} ${parseResult.lead.last_name}`);
            console.log(`  * Phone: ${parseResult.lead.phone}`);
            console.log(`  * Email: ${parseResult.lead.email}`);
            console.log(`  * Property: ${parseResult.lead.property_address || '(none)'}`);
            console.log(`  * Missing: ${parseResult.lead.missing_info?.join(', ') || 'none'}`);
          } else {
            emailResult.error = parseResult.error;
            results.failed++;
            console.log(`- Parse Error: ${parseResult.error}`);
          }
        } catch (error) {
          emailResult.error = error.message;
          results.failed++;
          console.log(`- Parse Exception: ${error.message}`);
        }
      } else {
        emailResult.error = 'Unknown email source';
        results.failed++;
        console.log('- Status: SKIPPED (unknown source)');
      }
      
      results.leads.push(emailResult);
      results.processed++;
    }
    
    // Summary
    console.log('\n=== Import Summary ===');
    console.log(`Total: ${results.total}`);
    console.log(`Successful: ${results.successful}`);
    console.log(`Failed: ${results.failed}`);
    
    res.json({
      success: true,
      labelName,
      results
    });
    
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      error: 'Failed to import emails',
      message: error.message
    });
  }
});
```

## 🔴 Task 3: Add Email Count Method (if needed)

**File**: `/backend/src/services/gmailService.js`

Add method to get total email count for a label:

```javascript
async getEmailCountForLabel(userId, labelId) {
  try {
    const tokens = await this.getTokens(userId);
    if (!tokens) return 0;
    
    const auth = await this.getAuthClient(tokens);
    const gmail = google.gmail({ version: 'v1', auth });
    
    // Get messages with this label
    const response = await gmail.users.messages.list({
      userId: 'me',
      labelIds: [labelId],
      maxResults: 1,
      fields: 'resultSizeEstimate'
    });
    
    return response.data.resultSizeEstimate || 0;
  } catch (error) {
    console.error('Error getting email count:', error);
    return 0;
  }
}
```

## Testing Instructions

1. Start backend server
2. Use frontend test page or curl:

```bash
# Search for label
curl http://localhost:3001/api/gmail/search-label?query=processed-lead

# Import 3 emails
curl -X POST http://localhost:3001/api/gmail/import-emails \
  -H "Content-Type: application/json" \
  -d '{
    "labelId": "Label_123",
    "labelName": "processed-lead",
    "maxResults": 3
  }'
```

3. Check console output for detailed parsing logs
4. Response will include full parsed data for frontend display