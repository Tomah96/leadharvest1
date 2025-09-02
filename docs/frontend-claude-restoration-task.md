# Frontend Gmail Integration Fix - For Claude 3

## Critical Context
- Frontend is running at localhost:3000
- Backend is running at localhost:3001 (pure Node.js server)
- Gmail connection shows errors due to path mismatch
- Frontend expects `/gmail/auth-url` but backend provides `/api/gmail/auth-url`
- User needs this working for investor demo

## Your Priority Tasks

### 1. Fix Gmail OAuth Path Issue (20 minutes)

**The Problem:**
- Frontend makes requests to: `http://localhost:3001/gmail/auth-url`
- Backend actually provides: `http://localhost:3001/api/gmail/auth-url`

**Files to Check/Fix:**
1. `/frontend/src/lib/api-client.ts` or similar
2. `/frontend/src/components/settings/GmailConnection.tsx`
3. Any file with Gmail API calls

**Fix Pattern:**
```typescript
// Find lines like:
const response = await fetch(`${API_URL}/gmail/auth-url`);

// Change to:
const response = await fetch(`${API_URL}/api/gmail/auth-url`);
```

**All Gmail endpoints to fix:**
- `/gmail/status` → `/api/gmail/status`
- `/gmail/auth-url` → `/api/gmail/auth-url`
- `/gmail/disconnect` → `/api/gmail/disconnect`
- `/gmail/callback` → `/api/gmail/callback`
- `/gmail/test/mock-import` → `/api/gmail/test/mock-import`

### 2. Test Lead Management (20 minutes)

**Test These Features:**
1. Navigate to Leads page
2. Verify leads display (even if empty)
3. Test "Add Lead" button
4. Test Gmail import flow:
   - Click "Connect Gmail"
   - Should show auth URL or mock connection
   - Test import button

**Check for Errors:**
```bash
# Watch browser console for errors
# Check Network tab for failed requests
# Note any 404s or 500s
```

### 3. Document Frontend Status (10 minutes)

Create `/docs/frontend-status-report.md` with:
- [ ] Gmail connection status (working/fixed)
- [ ] Lead display functionality
- [ ] Any remaining console errors
- [ ] Features ready for demo
- [ ] Features that need workarounds

## Quick Fix Commands

```bash
# Find all Gmail API calls
cd /mnt/c/Users/12158/LeadHarvest/frontend
grep -r "gmail" --include="*.ts" --include="*.tsx" src/

# Test the frontend
npm run dev  # If not already running

# Check which endpoints are being called
# Open browser DevTools > Network tab
# Try connecting Gmail and watch the requests
```

## Testing the Fix

1. Open http://localhost:3000
2. Go to Settings > Gmail
3. Click "Connect Gmail"
4. Should not show network errors
5. Try importing test leads

## Success Criteria
- [ ] No Gmail connection errors in console
- [ ] "Connect Gmail" button works
- [ ] Lead import doesn't throw errors
- [ ] Leads page displays properly
- [ ] No critical UI breaks

## If You Encounter Issues

1. **If npm commands don't work:**
   - The frontend should already be running
   - Just edit the files directly
   - The dev server will hot-reload

2. **If you can't find the API client:**
   - Search for files containing "localhost:3001"
   - Look in src/lib, src/utils, or src/api folders

3. **Quick workaround if needed:**
   - You can update the backend to also respond to `/gmail/*` paths
   - But fixing frontend is preferred

## Remember
- Simple fix: just update the URL paths
- Don't overcomplicate
- Test in browser after each change
- Focus on demo readiness, not perfection
- Time limit: 1 hour total