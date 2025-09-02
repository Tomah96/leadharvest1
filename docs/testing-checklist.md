# Testing Checklist - MUST Complete Before Saying "Ready"

## Pre-Deployment Verification

### 1. Backend Health Checks
- [ ] `curl http://localhost:3001/api/health` returns 200 OK
- [ ] `curl http://localhost:3001/api/leads` returns valid JSON (even if empty)
- [ ] Check server logs for any errors or warnings
- [ ] Verify console shows proper startup messages

### 2. Frontend Compilation & Health
- [ ] No compilation errors in terminal
- [ ] `curl -I http://localhost:3000` returns 200 OK (not 500)
- [ ] Check browser console for JavaScript errors
- [ ] Verify page actually loads without errors

### 3. Feature-Specific Tests
- [ ] Test each modified endpoint with curl
- [ ] Test UI components in browser
- [ ] Check network tab for failed API calls
- [ ] Verify error handling works as expected

### 4. Integration Tests
- [ ] Frontend can communicate with backend
- [ ] Authentication flow works (if applicable)
- [ ] Data flows correctly between services
- [ ] Error states are handled gracefully

## Common Issues to Check

1. **Compilation Errors**
   - TypeScript errors
   - Import/export mismatches
   - Missing dependencies

2. **Runtime Errors**
   - Undefined variables
   - Null pointer exceptions
   - Async/await issues

3. **Configuration Issues**
   - Wrong ports
   - Missing environment variables
   - CORS problems

## Testing Commands

```bash
# Backend health
curl -s http://localhost:3001/api/health | jq

# Frontend health
curl -I http://localhost:3000

# Check processes
ps aux | grep -E "node|next" | grep -v grep

# Check logs
tail -f backend.log
tail -f frontend.log
```

## IMPORTANT: Never Say "Ready" Without:
1. Actually accessing the URL in a browser (or simulating it)
2. Checking for compilation/runtime errors
3. Verifying the specific feature works end-to-end
4. Reviewing error logs

## If Something Fails:
1. Check error logs immediately
2. Test individual components
3. Verify all dependencies are running
4. Document the actual error for debugging