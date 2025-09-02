# Frontend Claude - Fix Gmail Import Error Display

## Issue
The Gmail import is working correctly (returns 200 OK) but the frontend shows "Request failed with status code 404". This is a misleading error message.

## Root Cause
Testing shows:
- API returns 200 OK with proper data structure
- Import actually succeeds
- Frontend error handler is misinterpreting the response

## Files to Fix

### 1. `/frontend/src/components/gmail/ImportControls.tsx`

**Current error handling (line ~89):**
```typescript
const errorMsg = err.response?.data?.error?.message || err.message || "Failed to import emails";
```

**Issue**: The backend returns errors at the top level: `{ error: "...", message: "..." }`
But the code is looking for `err.response.data.error.message` (nested)

**Fix needed:**
```typescript
// Check multiple error formats
const errorMsg = 
  err.response?.data?.message ||  // Backend format: { error: "...", message: "..." }
  err.response?.data?.error ||    // Alternative format
  err.message ||                   // Axios error
  "Failed to import emails";
```

### 2. Enhanced Error Handling

Add better error detection to show actual issues:

```typescript
try {
  const response = await api.gmail.test.importEmails(selectedId, actualCount);
  const result = response.data;
  
  // Check if import succeeded but no emails were parsed
  if (result.imported > 0 && result.parsed === 0) {
    onLog?.(`⚠️ Imported ${result.imported} emails but couldn't parse lead data`);
    onLog?.("This usually means the email format isn't recognized yet");
  }
  
  setImportResult(result);
  onLog?.(`✅ Import completed: ${result.parsed}/${result.imported} emails parsed successfully`);
  
} catch (err: any) {
  console.error('Import error:', err); // Add for debugging
  
  // Better error message extraction
  let errorMsg = "Failed to import emails";
  
  if (err.response?.status === 404) {
    errorMsg = "Import endpoint not found - please check backend is running";
  } else if (err.response?.data?.message) {
    errorMsg = err.response.data.message;
  } else if (err.response?.data?.error) {
    errorMsg = err.response.data.error;
  } else if (err.message) {
    errorMsg = err.message;
  }
  
  setError(errorMsg);
  onLog?.("❌ " + errorMsg);
}
```

### 3. Success Display Improvements

Update the UI to show what actually happened:

```typescript
// After successful import
if (result.results && result.results.length > 0) {
  onLog?.("\n📧 Imported Emails:");
  result.results.forEach((email, index) => {
    if (email.parsed) {
      onLog?.(`  ✅ ${index + 1}. ${email.subject}`);
      if (email.data) {
        onLog?.(`     Name: ${email.data.first_name || ''} ${email.data.last_name || ''}`);
        onLog?.(`     Phone: ${email.data.phone || 'Not found'}`);
        onLog?.(`     Property: ${email.data.property || 'Not found'}`);
      }
    } else {
      onLog?.(`  ⚠️ ${index + 1}. ${email.subject}`);
      onLog?.(`     Could not parse: ${email.error || 'Unknown format'}`);
    }
  });
}
```

## Testing

After fixing:
1. The error message should no longer show "404" when import succeeds
2. Should show actual error messages from backend
3. Should display imported email details even if parsing fails
4. Console should show helpful information about what happened

## Current API Response Format

The backend returns:
```json
{
  "imported": 5,
  "parsed": 0,
  "errors": ["Phone number is required", ...],
  "results": [{
    "messageId": "xxx",
    "subject": "Ernestine is requesting...",
    "parsed": false,
    "data": null,
    "error": "Phone number is required"
  }, ...]
}
```

Make sure the frontend properly displays this information instead of showing "404 error".