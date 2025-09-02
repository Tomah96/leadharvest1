# Orchestrator Task: Investigate Email Import Lead Loss

## Assigned to: Claude 3 (System Architect/Orchestrator)
## Created by: Claude 2 (Backend Specialist)
## Date: 2025-01-11

## Critical Issue
Email import is losing leads at multiple points in the pipeline:
- User imports 50 emails → Only ~20 leads appear
- Zillow emails previously worked but now don't show up
- Deduplication may be incorrectly merging/dropping leads

## Investigation Required

### 1. Gmail API Pagination Issue
**File**: `/backend/src/services/gmailService.js`
**Method**: `fetchEmailsByLabel` (line 451)

The Gmail API might be limiting results despite our maxResults parameter. Investigate:
- Is Gmail API returning all requested messages?
- Do we need to implement pagination to get all emails?
- Check response.data.nextPageToken handling

### 2. Zillow Email Detection
**Status**: Was working, now broken
**File**: `/backend/src/parsers/emailSourceDetector.js`

Investigate why Zillow emails stopped being detected:
- Has the email format changed?
- Are Zillow emails being marked as 'unknown' source?
- Check console logs during import to see source detection

### 3. Lead Deduplication Logic
**File**: `/backend/src/services/leadService.js`
**Method**: `processEmailLead` and `createOrUpdateLead`

Phone-based deduplication might be too aggressive:
- Are multiple leads with same phone being merged?
- Should we consider other fields for deduplication?
- Add logging to track when leads are merged vs created

## System Flow to Trace

1. **Email Fetch**: Gmail API → gmailService.fetchEmailsByLabel
2. **Source Detection**: emailSourceDetector.detectSource
3. **Parsing**: Parser (Zillow/Realtor/etc) → emailParsingService
4. **Lead Creation**: leadService.processEmailLead → database
5. **Response**: Controller → Frontend

## Current Findings

### Working:
- Frontend correctly sends count (5, 10, 50)
- testImportEmails controller receives count correctly
- Email parsing works when source is detected

### Broken:
- Gmail API may only return first page (10-20 emails)
- Zillow source detection failing
- Some leads disappearing during deduplication

## Recommended Approach

1. **Add detailed logging** at each step to trace where leads are lost
2. **Test with known Zillow email** to verify detection
3. **Check Gmail API response** for pagination tokens
4. **Monitor deduplication** to see if leads are being merged

## Coordination Needed

- **Frontend (Claude 1)**: Fixing UI issues (see frontend-task-import-fixes.md)
- **Backend (Claude 2)**: Will implement fixes once root cause identified
- **Orchestrator**: Identify root cause and coordinate solution

## Test Data
User's test showed:
- 5 emails → 2 leads (40% success)
- 10 emails → 6 leads (60% success)
- 50 emails → ~20 leads (40% success)

This pattern suggests either:
1. Source detection failing for 60% of emails
2. Deduplication removing 60% of leads
3. Gmail API not returning all requested emails