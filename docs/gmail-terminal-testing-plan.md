# Gmail Integration Terminal Testing Plan

## Overview
Complete terminal-based testing of Gmail integration to identify and fix all issues.

## Division of Work

### Claude 1 (Orchestrator) - Integration Testing
1. Test Gmail OAuth flow simulation
2. Test all Gmail API endpoints
3. Verify data flow between frontend and backend
4. Create test scripts for automated testing
5. Monitor and coordinate fixes

### Claude 2 (Backend) - Backend Testing & Fixes
1. Fix the 404 error on /api/gmail/test/import endpoint
2. Implement proper Gmail status endpoint that returns actual email
3. Fix disconnect functionality
4. Create terminal test scripts for all Gmail endpoints
5. Debug token storage and retrieval issues

## Test Scripts Needed

### 1. Gmail OAuth Simulation Script
```bash
# simulate_oauth.sh
# Simulates the OAuth flow without browser
```

### 2. Gmail Status Test
```bash
# test_status.sh
curl -X GET http://localhost:3001/api/gmail/status \
  -H "Cookie: connect.sid=test-session" \
  -H "Content-Type: application/json"
```

### 3. Gmail Import Test
```bash
# test_import.sh
curl -X POST http://localhost:3001/api/gmail/test/import \
  -H "Content-Type: application/json" \
  -d '{"labelId":"INBOX","count":1}'
```

### 4. Gmail Disconnect Test
```bash
# test_disconnect.sh
curl -X POST http://localhost:3001/api/gmail/disconnect \
  -H "Cookie: connect.sid=test-session" \
  -H "Content-Type: application/json"
```

## Current Issues to Fix

1. **404 on Import**: Frontend gets 404 but curl works
2. **Wrong Email Display**: Shows test@leadharvest.com instead of actual Gmail
3. **Disconnect Fails**: Returns error when trying to disconnect
4. **Token Persistence**: Tokens lost on server restart

## Testing Order

1. First, fix the basic endpoints (Claude 2)
2. Create mock OAuth flow for testing (Claude 1)
3. Test each endpoint individually (Both)
4. Test full flow end-to-end (Claude 1)
5. Create automated test suite (Claude 1)

## Success Criteria

- All endpoints return correct status codes
- Gmail email address displays correctly
- Import works without 404 errors
- Disconnect works properly
- Tokens persist across server restarts (stretch goal)
- All tests can be run from terminal without browser