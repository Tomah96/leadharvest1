# Template System Debugging Lessons

## Issue: "templates.map is not a function" Error

### Date: 2025-08-28
### Debugged by: Claude 2 (Backend)

## The Problem

Frontend was getting "templates.map is not a function" error despite backend API returning correct data.

### Root Causes

1. **Module-level require() in method**: The `agentDefaults` config was being required inside a method, which could fail at runtime
2. **Type mismatch**: Frontend expected `{ data: MessageTemplate[] }` but backend returned `{ success: boolean, data: MessageTemplate[] }`
3. **Insufficient error handling**: No defensive checks for non-array data

## The Investigation Process

### Step 1: Check Backend Response
```bash
curl -s http://localhost:3001/api/templates | python3 -m json.tool
```
✅ Backend returned correct structure: `{ success: true, data: [...] }`

### Step 2: Check Frontend Type Definition
```typescript
// WRONG - Missing success field
apiClient.get<{ data: MessageTemplate[] }>("/templates")

// CORRECT
apiClient.get<{ success: boolean; data: MessageTemplate[] }>("/templates")
```

### Step 3: Trace Data Flow
- Backend returns: `{ success: true, data: [...] }`
- Axios wraps it: `response = { data: { success: true, data: [...] } }`
- Frontend needs: `response.data.data` to get the array

## The Fix

### 1. Backend - Move requires to module level
```javascript
// BAD - Can fail at runtime inside method
processSmartSections() {
  const agentDefaults = require('../config/agentDefaults'); // ❌
}

// GOOD - Fails at startup with fallback
const agentDefaults = (() => {
  try {
    return require('../config/agentDefaults');
  } catch {
    return { /* defaults */ };
  }
})();
```

### 2. Frontend - Fix type definitions
```typescript
// api-client.ts
templates: {
  getAll: () => apiClient.get<{ success: boolean; data: MessageTemplate[] }>("/templates"),
}
```

### 3. Frontend - Add defensive checks
```typescript
const templatesData = response?.data?.data;
if (!Array.isArray(templatesData)) {
  console.error('Templates data is not an array:', templatesData);
  setTemplates([]);
  return;
}
```

## Key Learnings

### 🎯 For Backend Development (Claude 2)
1. **Never require() inside methods** - Always at module level
2. **Always return consistent structure** - `{ success: boolean, data: T }`
3. **Add try-catch with fallbacks** for optional configs
4. **Log errors with context** - Include what was expected vs received

### 🎯 For Frontend Development (Claude 3)
1. **Match API response types exactly** - Check actual response structure
2. **Always validate data before using** - Use Array.isArray() checks
3. **Add console.log for debugging** - Log API responses during development
4. **Defensive programming** - Never assume data structure

### 🎯 For Orchestrator (Claude 1)
1. **Test full data flow** - From API to UI rendering
2. **Check type definitions match** - Frontend types must match backend responses
3. **Verify CORS configuration** - Ensure all ports are allowed
4. **Use curl to verify API first** - Before debugging frontend

## Debugging Checklist

When encountering "X is not a function" errors:

1. ✅ Check what the backend actually returns
   ```bash
   curl -s http://localhost:3001/api/endpoint | python3 -m json.tool
   ```

2. ✅ Check frontend type definitions match
   ```typescript
   // Look for the API method definition
   apiClient.get<TYPE>("/endpoint")
   ```

3. ✅ Log the actual data received
   ```typescript
   console.log('API response:', response);
   console.log('Data structure:', typeof response.data);
   ```

4. ✅ Add defensive checks
   ```typescript
   if (!Array.isArray(data)) {
     console.error('Expected array, got:', data);
     return [];
   }
   ```

5. ✅ Check for runtime requires
   ```javascript
   // Search for require() inside methods/functions
   grep -r "require(" --include="*.js" | grep -v "^const\|^let\|^var"
   ```

## Common Pitfalls to Avoid

### ❌ DON'T
- Require modules inside functions/methods
- Assume data structure without validation
- Fix symptoms without understanding root cause
- Change code randomly hoping it works

### ✅ DO
- Require all modules at file top level
- Validate data structure before use
- Log actual vs expected data
- Test API with curl first
- Add defensive programming checks

## Testing Commands

```bash
# Test backend API
curl -s http://localhost:3001/api/templates | python3 -m json.tool

# Test CORS from frontend port
curl -s -H "Origin: http://localhost:3003" http://localhost:3001/api/templates

# Check if Array
curl -s http://localhost:3001/api/templates | python3 -c "
import json, sys
d = json.load(sys.stdin)
print('Is array:', isinstance(d.get('data'), list))
"
```

## File References

Files involved in this fix:
- `/backend/src/services/templateService.js:94-112` - Agent defaults loading
- `/frontend/src/lib/api-client.ts:169-189` - API type definitions
- `/frontend/src/app/settings/templates/page.tsx:26-50` - Data loading and validation

---

**Remember**: When in doubt, console.log it out! 🔍