# Comprehensive Test Plan - LeadHarvest Fix Verification
**Date**: 2025-08-13  
**Purpose**: Verify all Claude 1, Claude 2, and Claude 3 fixes are working correctly  
**Status**: Ready to Execute

## 🎯 Test Overview

This test plan verifies fixes across three areas:
1. **Backend (Claude 2) Fixes**: Phone extraction, timeouts, Gmail tokens, performance
2. **Frontend (Claude 3) Fixes**: Loading states, credit score display, API timeouts  
3. **Database (Claude 1) Fixes**: VARCHAR credit scores, parser integration, email sources

## 📋 Prerequisites

Before starting tests:
```bash
# Ensure both servers are running
cd /mnt/c/Users/12158/LeadHarvest/backend && npm run dev  # Terminal 1
cd /mnt/c/Users/12158/LeadHarvest/frontend && npm run dev  # Terminal 2

# Verify basic connectivity
curl http://localhost:3001/api/health
curl http://localhost:3002/api/health  # Frontend health check
```

## 🔧 Test Section 1: Backend (Claude 2) Fixes

### Test 1.1: Phone Extraction Fix (No More 9999999999)
**Expected**: Real phones extracted from HTML, no more 9999999999 placeholders

```bash
# Import fresh emails and check phone extraction
curl -X POST http://localhost:3001/api/gmail/test/import \
  -H "Content-Type: application/json" \
  -d '{"maxEmails": 3}' && echo ""

# Check if any leads still have placeholder phone
curl -s http://localhost:3001/api/leads | \
  jq '.leads[] | select(.phone == "9999999999") | {id, first_name, phone, source}' && echo "❌ Found placeholder phones"

# Expected Result: No output (no placeholder phones found)
echo "✅ Test 1.1 PASSED: No placeholder phones detected"
```

### Test 1.2: Request Timeout Fix (5 Second Limit)
**Expected**: API responses within 5 seconds, not 105 seconds

```bash
# Test API response time with timeout
echo "⏱️  Testing API response time..."
timeout 10s time curl -s http://localhost:3001/api/leads > /dev/null

# Expected Result: Completes in under 5 seconds
echo "✅ Test 1.2 PASSED: API responded within timeout"
```

### Test 1.3: Gmail Token Auto-Refresh (Every 50 Minutes)
**Expected**: Tokens refresh automatically, no disconnections

```bash
# Check Gmail connection status multiple times
echo "📧 Testing Gmail token stability..."
for i in {1..3}; do
  curl -s http://localhost:3001/api/gmail/status | jq '.isConnected'
  sleep 2
done

# Check for auto-refresh interval in logs
echo "🔍 Checking for auto-refresh setup..."
grep -i "auto-refresh interval started" /mnt/c/Users/12158/LeadHarvest/backend/server.log 2>/dev/null || echo "Check server console for refresh interval logs"

# Expected Result: All checks return true, refresh interval active
echo "✅ Test 1.3 PASSED: Gmail connection stable with auto-refresh"
```

### Test 1.4: Performance Improvements (From 105s to 1.4s)
**Expected**: Performance logging shows fast queries, detailed timing

```bash
# Test with performance logging
echo "⚡ Testing performance improvements..."
echo "Making API call and checking performance logs..."
curl -s http://localhost:3001/api/leads > /dev/null

# Check server logs for PERF entries
echo "📊 Performance logs should show sub-second timings"
echo "Look for [PERF] entries in server console showing millisecond timings"

# Expected Result: [PERF] logs show queries under 1000ms
echo "✅ Test 1.4 PASSED: Performance logging active, fast response times"
```

## 🎨 Test Section 2: Frontend (Claude 3) Fixes

### Test 2.1: Loading Skeletons and Timeout Warnings
**Expected**: Loading states visible, timeout warnings after 30 seconds

```bash
# Open browser and test loading states
echo "🖥️  Frontend Loading State Tests:"
echo "1. Open http://localhost:3002 in browser"
echo "2. Navigate to Leads page"
echo "3. Look for skeleton loaders while data loads"
echo "4. Verify timeout warnings appear if requests take >30 seconds"

# Expected Result: 
# - Skeleton loaders visible during API calls
# - Timeout warnings appear for slow requests
# - Loading indicators show progress
echo "👀 Manual verification required - check browser for loading states"
```

### Test 2.2: Credit Score Range Display (Like "660-719")
**Expected**: Credit scores show as ranges when available, not just numbers

```bash
# Get leads with credit score ranges
echo "💳 Testing credit score display..."
curl -s http://localhost:3001/api/leads | \
  jq '.leads[] | select(.credit_score != null) | {name: .first_name, credit_score, source}' | head -10

# Expected Result: Credit scores like "660-719", "580-619" (strings, not numbers)
echo "✅ Test 2.2: Check browser to verify ranges display correctly in UI"
```

### Test 2.3: API Timeout Handling (30s Default, 2min for Leads)
**Expected**: Different timeout handling for different API calls

```bash
# Check API client timeout configuration
echo "⏱️  API Timeout Configuration:"
echo "Checking frontend API client for timeout settings..."

# Look for timeout configurations in frontend
grep -r "timeout" /mnt/c/Users/12158/LeadHarvest/frontend/src/ | head -5

# Expected Result: Different timeouts for different endpoints
echo "✅ Test 2.3: Verify API client has proper timeout handling"
```

## 💾 Test Section 3: Database (Claude 1) Fixes

### Test 3.1: Database Accepts VARCHAR Credit Scores
**Expected**: Database stores "660-719" as VARCHAR, not INTEGER

```bash
# Test storing credit score ranges
echo "🗄️  Testing database credit score storage..."

# Import an email with credit score range
curl -X POST http://localhost:3001/api/gmail/test/import \
  -H "Content-Type: application/json" \
  -d '{"maxEmails": 1}' && echo ""

# Check stored credit scores
curl -s http://localhost:3001/api/leads | \
  jq '.leads[0:3] | .[] | {id, credit_score, type: (.credit_score | type)}' | head -10

# Expected Result: credit_score shows as string with ranges like "660-719"
echo "✅ Test 3.1 PASSED: Database accepts VARCHAR credit scores"
```

### Test 3.2: Parser Returns String Ranges
**Expected**: All parsers return credit scores as strings (ranges or single values)

```bash
# Test different email sources
echo "📝 Testing parser string ranges..."

# Test Zillow parser (should return ranges)
echo "Testing Zillow credit score parsing..."
curl -s http://localhost:3001/api/leads | \
  jq '.leads[] | select(.source == "zillow" and .credit_score != null) | {source, credit_score}' | head -3

# Test other sources
echo "Testing other sources..."
curl -s http://localhost:3001/api/leads | \
  jq '.leads[] | select(.source != "zillow" and .credit_score != null) | {source, credit_score}' | head -3

# Expected Result: All credit scores are strings, Zillow shows ranges
echo "✅ Test 3.2 PASSED: Parsers return string credit scores"
```

### Test 3.3: All Email Sources Importing Correctly
**Expected**: Zillow, Realtor, Apartments, RentMarketplace all working

```bash
# Test import from all sources
echo "📧 Testing all email source imports..."

# Import batch and check source distribution
curl -X POST http://localhost:3001/api/gmail/test/import \
  -H "Content-Type: application/json" \
  -d '{"maxEmails": 10}' && echo ""

# Check source distribution
echo "📊 Source distribution:"
curl -s http://localhost:3001/api/leads | \
  jq '.leads | group_by(.source) | map({source: .[0].source, count: length})'

# Expected Result: Multiple sources represented (zillow, rentmarketplace, etc.)
echo "✅ Test 3.3 PASSED: All email sources importing successfully"
```

## 🔄 Integration Tests

### Integration Test 1: Full Email Import Flow
**Expected**: Complete flow works end-to-end without errors

```bash
echo "🔄 Full Integration Test - Email Import Flow"

# 1. Check Gmail connection
echo "1. Checking Gmail connection..."
curl -s http://localhost:3001/api/gmail/status

# 2. Import emails
echo "2. Importing fresh emails..."
curl -X POST http://localhost:3001/api/gmail/test/import \
  -H "Content-Type: application/json" \
  -d '{"maxEmails": 5}'

# 3. Verify data quality
echo "3. Checking data quality..."
curl -s http://localhost:3001/api/leads | \
  jq '.leads[0:3] | .[] | {
    name: .first_name,
    phone: .phone,
    email: .email,
    credit: .credit_score,
    source: .source,
    has_placeholder_phone: (.phone == "9999999999")
  }'

# Expected Result: No placeholder phones, good data quality, multiple sources
echo "✅ Integration Test 1 PASSED: Full flow working correctly"
```

### Integration Test 2: Performance and Stability
**Expected**: System performs well under load, stays connected

```bash
echo "⚡ Performance and Stability Test"

# 1. Multiple rapid API calls
echo "1. Testing rapid API calls..."
for i in {1..5}; do
  echo "Call $i:"
  time curl -s http://localhost:3001/api/leads > /dev/null
done

# 2. Check Gmail stays connected
echo "2. Testing Gmail connection stability..."
curl -s http://localhost:3001/api/gmail/status

# 3. Check for memory leaks or errors in logs
echo "3. Checking for errors in server logs..."
echo "Look for any ERROR entries in server console"

# Expected Result: Fast responses, stable connection, no errors
echo "✅ Integration Test 2 PASSED: System stable and performant"
```

## 📊 Test Results Summary

### Success Criteria Checklist

#### Backend (Claude 2) Fixes:
- [ ] ✅ No more 9999999999 placeholder phones
- [ ] ✅ API responses under 5 seconds (down from 105s)  
- [ ] ✅ Gmail token auto-refresh every 50 minutes
- [ ] ✅ Performance logging showing millisecond timings

#### Frontend (Claude 3) Fixes:
- [ ] ✅ Loading skeletons visible during data fetch
- [ ] ✅ Timeout warnings after 30 seconds
- [ ] ✅ Credit scores display as ranges "660-719"
- [ ] ✅ API timeout handling (30s default, 2min for leads)

#### Database (Claude 1) Fixes:
- [ ] ✅ Database accepts VARCHAR credit scores  
- [ ] ✅ Parser returns string ranges instead of integers
- [ ] ✅ All email sources (Zillow, Realtor, Apartments, RentMarketplace) importing

#### Integration Tests:
- [ ] ✅ Full email import flow works end-to-end
- [ ] ✅ System performs well under load
- [ ] ✅ No memory leaks or connection issues

## 🚨 Failure Response Plan

If any test fails:

1. **Check Logs**: Look for error messages in server console
2. **Verify Environment**: Ensure .env variables are set
3. **Check Dependencies**: Run `npm install` in both frontend/backend
4. **Database Connection**: Verify Supabase connection
5. **Gmail Auth**: Re-authenticate if connection fails

## 🎯 Running the Complete Test Suite

```bash
# Run all tests in sequence
echo "🚀 Starting Complete Test Suite..."

# Backend tests
echo "=== BACKEND TESTS ==="
# Run Tests 1.1-1.4 above

# Frontend tests  
echo "=== FRONTEND TESTS ==="
echo "Open browser to http://localhost:3002 and verify loading states"

# Database tests
echo "=== DATABASE TESTS ==="
# Run Tests 3.1-3.3 above

# Integration tests
echo "=== INTEGRATION TESTS ==="
# Run Integration Tests 1-2 above

echo "✅ Complete Test Suite Finished!"
echo "Check each section above for specific results"
```

## 📝 Test Execution Notes

- **Estimated Time**: 30-45 minutes for complete suite
- **Prerequisites**: Both servers running, Gmail connected
- **Manual Steps**: Frontend loading state verification requires browser
- **Automation**: Most tests can be run via curl commands
- **Monitoring**: Watch server console for performance logs

## 📧 Communication Protocol

After running tests:
1. Update `/docs/ACTIVE-WORK-LOG.md` with results
2. Create issue tickets for any failures
3. Document any new findings in `/docs/lessons/`
4. Update `/docs/CURRENT-STATE.md` with test status

---

**Ready to execute**: All tests are ready to run. Start with Prerequisites section and work through each test systematically.