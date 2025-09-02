# Backend Claude - Day 6 Gmail Testing Tasks

## Priority 1: Fix Critical Gmail Issues

### Task 1: Debug 404 Error on Import Endpoint
The `/api/gmail/test/import` works with curl but returns 404 from frontend. 

**Investigation Steps:**
1. Check if authentication middleware is interfering
2. Verify CORS headers for POST requests
3. Check if there's a route conflict
4. Add detailed logging to track the request

**Files to Check:**
- `/backend/src/routes/gmailRoutes.js` - verify route registration
- `/backend/app.js` - check middleware order
- `/backend/src/middleware/auth.js` - check if auth is blocking

### Task 2: Fix Gmail Status to Show Real Email
Currently shows hardcoded "test@leadharvest.com" instead of actual Gmail address.

**Implementation:**
```javascript
// In gmailController.js - already added but needs testing
const profile = await gmailService.gmail.users.getProfile({
  userId: 'me'
});
email = profile.data.emailAddress;
```

### Task 3: Create Test Token Storage
Create a way to store test tokens without OAuth flow for terminal testing.

**Create file:** `/backend/src/utils/testTokens.js`
```javascript
// Store test tokens for terminal testing
const testTokens = {
  access_token: 'test_access_token',
  refresh_token: 'test_refresh_token',
  scope: 'https://www.googleapis.com/auth/gmail.readonly',
  token_type: 'Bearer',
  expiry_date: Date.now() + 3600000
};
```

## Priority 2: Create Terminal Test Scripts

### Create: `/backend/test-scripts/test-all-gmail.sh`
```bash
#!/bin/bash
echo "Testing Gmail Endpoints..."

# Test health
echo -e "\n1. Testing Health Check:"
curl -s http://localhost:3001/api/health | jq .

# Test Gmail status (no auth)
echo -e "\n2. Testing Gmail Status:"
curl -s http://localhost:3001/api/gmail/status | jq .

# Test label search
echo -e "\n3. Testing Label Search:"
curl -s "http://localhost:3001/api/gmail/test/labels?q=inbox" | jq .

# Test import
echo -e "\n4. Testing Email Import:"
curl -X POST http://localhost:3001/api/gmail/test/import \
  -H "Content-Type: application/json" \
  -d '{"labelId":"INBOX","count":1}' | jq .
```

## Priority 3: Add Debug Logging

Add comprehensive logging to track down the 404 issue:

```javascript
// In app.js - add request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  next();
});
```

## Priority 4: Fix Token Persistence

Implement file-based token storage for development:

**File:** `/backend/src/services/tokenStorage.js`
- Save tokens to `.tokens.json` file
- Load on server start
- Survive server restarts

## Testing Checklist

- [ ] All endpoints return correct HTTP status codes
- [ ] Gmail status shows actual email address
- [ ] Import endpoint works from both curl and frontend
- [ ] Disconnect properly removes tokens
- [ ] Test scripts work without manual intervention
- [ ] Server logs show clear request/response data

## Files to Create/Modify

1. `/backend/test-scripts/test-all-gmail.sh` - Main test script
2. `/backend/src/utils/testTokens.js` - Test token storage
3. `/backend/src/services/tokenStorage.js` - Persistent token storage
4. `/backend/src/middleware/requestLogger.js` - Debug logging

Focus on fixing the 404 error first, as this is blocking all testing!