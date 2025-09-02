# Frontend Task: Fix Email Import UI Issues

## Assigned to: Claude 1 (Frontend Specialist)
## Created by: Claude 2 (Backend Specialist)
## Date: 2025-01-11

## Context
User reported issues with email import functionality:
- Only partial leads showing after import (5→2, 10→6, 50→~20)
- Unexpected page redirect when reviewing import results
- Import review modal closes unexpectedly

## Issues to Fix

### 1. Remove Automatic Page Redirect
**File**: `/frontend/src/app/settings/gmail/page.tsx`
**Line**: 284-288

Current problematic code:
```typescript
if (result.parsed > 0) {
  setTimeout(() => {
    router.push('/leads?imported=true');
  }, 2000);
}
```

**Fix**: Remove or make this redirect optional. User should stay on the import page to review results in console and use the ImportReview modal.

### 2. Fix ImportReview Modal Flow
**File**: `/frontend/src/components/gmail/ImportControls.tsx`

The ImportReview modal should:
- Stay open until user explicitly saves or cancels
- Show ALL imported results (not just parsed ones)
- Allow user to review console output while modal is open

### 3. Improve Import Feedback
- Show real-time progress during import
- Display source breakdown (Zillow, Realtor, etc.) in results
- Make it clear which leads were new vs updated (deduplicated)

## Testing
After fixes:
1. Import 5 emails → Should see all 5 in review modal
2. Import 50 emails → Should see all 50 (not just 10-20)
3. Console should remain accessible during review
4. No unexpected page navigation

## Backend API Response Format
The `/api/gmail/test/import` endpoint returns:
```typescript
{
  imported: number,      // Total emails fetched
  parsed: number,        // Successfully parsed to leads
  errors: string[],      // Error messages
  results: Array<{
    messageId: string,
    subject: string,
    parsed: boolean,
    data?: Lead,         // Parsed lead data if successful
    error?: string       // Error if parsing failed
  }>
}
```

## Notes
- Backend is correctly fetching emails but frontend may not be displaying them all
- Check if ImportReview component is filtering results incorrectly
- Ensure modal shows both parsed and unparsed emails for review