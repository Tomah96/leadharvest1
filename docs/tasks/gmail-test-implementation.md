# Gmail Test Implementation Plan

Date: 2025-07-17
From: Claude 1 (Orchestrator)
For: Claude 2 (Backend) & Claude 3 (Frontend)

## Overview

User wants to test Gmail integration with:
1. Label input field to search any Gmail label
2. Show count of emails found with that label
3. Import options for 3, 5, or 10 emails
4. Console output showing parsed lead data as expandable objects
5. No database saves yet - just testing parsers

## Backend Tasks (Claude 2)

### Priority 1: Update Search Label Endpoint
**Endpoint**: `GET /api/gmail/search-label?query=<labelName>`

Current implementation should already:
- Search for labels by name
- Return count of emails with that label
- Log details to console

**Enhancement needed**:
```javascript
// In response, also return the exact email count for the label
{
  query: "processed-lead",
  matchingLabels: [...],
  emailCount: 247,  // Add this - actual count of emails with this label
  labelId: "Label_123"
}
```

### Priority 2: Update Import Emails Endpoint
**Endpoint**: `POST /api/gmail/import-emails`

Modify the endpoint to:
1. Accept smaller limits (3, 5, 10)
2. Return more detailed parsing results
3. Structure the response for easy console display

**Request body**:
```javascript
{
  labelId: "Label_123",
  labelName: "processed-lead",
  maxResults: 3  // or 5, or 10
}
```

**Response structure**:
```javascript
{
  success: true,
  labelName: "processed-lead",
  results: {
    total: 3,
    processed: 3,
    successful: 2,
    failed: 1,
    leads: [
      {
        emailId: "18abc123",
        subject: "New Lead from Zillow",
        from: "noreply@zillow.com",
        date: "2024-01-15",
        source: "zillow",
        parseStatus: "success",
        parsedData: {
          first_name: "John",
          last_name: "Doe",
          phone: "555-123-4567",
          email: "john.doe@email.com",
          property_address: "123 Main St",
          move_in_date: "2024-02-01",
          credit_score: 750,
          income: "$5000/month",
          occupants: 2,
          pets: "1 cat",
          missing_info: []
        },
        rawEmail: {
          subject: "...",
          body: "..." // First 500 chars
        }
      },
      {
        emailId: "18abc124",
        subject: "Unknown email format",
        from: "random@email.com",
        source: "unknown",
        parseStatus: "failed",
        error: "Unknown email source",
        rawEmail: {
          subject: "...",
          body: "..."
        }
      }
    ]
  }
}
```

### Priority 3: Console Logging
For each email processed, log:
```
=== Processing Email 1/3 ===
Subject: New Lead from Zillow
From: noreply@zillow.com
Source Detection: ZILLOW ✓

Parsing Result:
- Name: John Doe
- Phone: 555-123-4567
- Email: john.doe@email.com
- Property: 123 Main St
- Move-in: 2024-02-01
- Credit: 750
- Missing: []

Status: SUCCESS ✓
```

## Frontend Tasks (Claude 3)

### Priority 1: Update Test Gmail Page
**File**: `/frontend/src/app/test/gmail/page.tsx`

Add new section with:
1. Label input field
2. Search button to check email count
3. Three import buttons (3, 5, 10)
4. Results display in console

### Priority 2: Update API Types
**File**: `/frontend/src/types/index.ts`

```typescript
interface LabelSearchResponse {
  query: string;
  matchingLabels: GmailLabel[];
  emailCount: number;
  labelId: string;
}

interface ImportTestResult {
  success: boolean;
  labelName: string;
  results: {
    total: number;
    processed: number;
    successful: number;
    failed: number;
    leads: ParsedEmail[];
  };
}

interface ParsedEmail {
  emailId: string;
  subject: string;
  from: string;
  date: string;
  source: string;
  parseStatus: 'success' | 'failed';
  parsedData?: ParsedLead;
  error?: string;
  rawEmail: {
    subject: string;
    body: string;
  };
}

interface ParsedLead {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  property_address?: string;
  move_in_date?: string;
  credit_score?: number;
  income?: string;
  occupants?: number;
  pets?: string;
  missing_info: string[];
}
```

### Priority 3: Console Output
Instead of plain text logs, use `console.log` with structured objects:

```javascript
const handleImport = async (count: number) => {
  try {
    const result = await api.gmail.importEmails(selectedLabel.id, count);
    
    // Log overview
    console.log('=== Gmail Import Results ===', {
      label: result.labelName,
      total: result.results.total,
      successful: result.results.successful,
      failed: result.results.failed
    });
    
    // Log each email as expandable object
    result.results.leads.forEach((email, index) => {
      console.log(`Email ${index + 1}/${result.results.total}:`, {
        subject: email.subject,
        from: email.from,
        source: email.source,
        status: email.parseStatus,
        parsedData: email.parsedData || null,
        error: email.error || null,
        raw: email.rawEmail
      });
    });
    
    // Also show in UI console component
    addLog(`Imported ${result.results.total} emails - check browser console for details`);
    
  } catch (error) {
    console.error('Import failed:', error);
  }
};
```

### Priority 4: UI Layout
```
Test Gmail Import
─────────────────

Label Search:
┌─────────────────────────────┐
│ Label: [processed-lead    ] │
│ [Search]                    │
│                             │
│ ✓ Found 247 emails          │
└─────────────────────────────┘

Import Options:
┌─────────────────────────────┐
│ [Import 3] [Import 5]       │
│ [Import 10]                 │
└─────────────────────────────┘

Results:
┌─────────────────────────────┐
│ > Importing 3 emails...     │
│ > Check browser console for │
│   detailed results          │
│ > Success: 2/3 parsed       │
└─────────────────────────────┘
```

## Implementation Order

1. **Backend First**: 
   - Update search endpoint to return email count
   - Enhance import endpoint with detailed response
   - Test with Postman/curl

2. **Frontend Second**:
   - Update test page UI
   - Add API integration
   - Test console output

3. **Integration Testing**:
   - Connect Gmail
   - Search for label
   - Import 3 emails
   - Verify console shows all parsed data

## Success Criteria

✅ User can enter any label name and see count
✅ User can import exactly 3, 5, or 10 emails
✅ Browser console shows expandable objects with full parsed data
✅ Each email shows source detection and parsing results
✅ Failed parses show error reasons
✅ No database saves (just parsing and display)

## Notes

- Keep it simple - this is for testing parsers
- Use browser's native console.log for expandable objects
- Show both successful and failed parses
- Include raw email data for debugging