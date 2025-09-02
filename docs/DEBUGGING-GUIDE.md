# 🔍 LeadHarvest Debugging Guide

## Quick Debugging Commands

### 1. Check if Services are Running
```bash
# Check backend
curl -s http://localhost:3001/api/health | python3 -m json.tool

# Check frontend
curl -s http://localhost:3000/ | head -5  # or 3002, 3003

# Check what's running
ps aux | grep -E "node|npm" | grep -v grep
```

### 2. Test API Endpoints
```bash
# Pretty print JSON response
curl -s http://localhost:3001/api/templates | python3 -m json.tool

# Check response structure
curl -s http://localhost:3001/api/templates | python3 -c "
import json, sys
d = json.load(sys.stdin)
print('Success:', d.get('success'))
print('Data type:', type(d.get('data')))
print('Data count:', len(d.get('data', [])) if isinstance(d.get('data'), list) else 'not array')
"

# Test CORS from frontend
curl -s -H "Origin: http://localhost:3000" http://localhost:3001/api/templates
```

### 3. Watch Logs in Real-Time
```bash
# Backend logs (if using npm run dev)
# The console output will show our custom logs

# Watch for specific patterns
# In another terminal:
curl http://localhost:3001/api/templates 2>&1 | grep "\[TemplateService\]"
```

## Common Issues and Solutions

### Issue: "X is not a function" Error
**Symptoms**: `TypeError: templates.map is not a function`

**Debug Steps**:
1. Check what backend returns:
   ```bash
   curl -s http://localhost:3001/api/endpoint | python3 -m json.tool
   ```

2. Check frontend console:
   ```javascript
   console.log('Response:', response);
   console.log('Data:', response.data);
   console.log('Is Array:', Array.isArray(response.data.data));
   ```

3. Fix: Ensure types match and add defensive checks

### Issue: CORS Errors
**Symptoms**: "Access-Control-Allow-Origin" errors

**Debug Steps**:
1. Check backend CORS config in `app.js`
2. Verify ports are in allowedOrigins array
3. Test with curl:
   ```bash
   curl -s -H "Origin: http://localhost:3000" -I http://localhost:3001/api/health
   ```

### Issue: Database Not Available
**Symptoms**: Empty responses, "Supabase not initialized"

**Debug Steps**:
1. Check environment variables:
   ```bash
   grep SUPABASE backend/.env
   ```

2. Test Supabase connection:
   ```bash
   curl -s http://localhost:3001/api/health
   ```

3. Check logs for initialization errors

### Issue: Module Not Found
**Symptoms**: `Cannot find module 'X'`

**Debug Steps**:
1. Check if package is installed:
   ```bash
   npm list packagename
   ```

2. Install if missing:
   ```bash
   npm install packagename
   ```

3. Check import path is correct

## Logging Best Practices

### Backend Logging Pattern
```javascript
// Use consistent prefixes
console.log('[ServiceName] Method started');
console.log('[ServiceName] Success:', { count: data.length });
console.error('[ServiceName] Error:', { 
  error: error.message, 
  stack: error.stack 
});
```

### Frontend Logging Pattern
```typescript
// In development, log API responses
console.log('[ComponentName] API Response:', response);
console.log('[ComponentName] Extracted data:', data);

// Log errors with context
console.error('[ComponentName] Failed:', {
  error,
  attemptedAction: 'load templates',
  state: { templates, isLoading }
});
```

## Adding Debug Logs

### Backend - Add to services
```javascript
class MyService {
  async myMethod(params) {
    console.log('[MyService] myMethod called with:', params);
    try {
      // ... do work
      console.log('[MyService] myMethod succeeded');
      return result;
    } catch (error) {
      console.error('[MyService] myMethod failed:', error);
      throw error;
    }
  }
}
```

### Frontend - Add to API calls
```typescript
const loadData = async () => {
  console.log('[Component] Loading data...');
  try {
    const response = await api.endpoint();
    console.log('[Component] Response:', response);
    
    // Validate structure
    if (!Array.isArray(response.data)) {
      console.error('[Component] Expected array, got:', typeof response.data);
    }
    
    setData(response.data);
  } catch (error) {
    console.error('[Component] Load failed:', error);
  }
};
```

## Debug Checklist

When debugging an issue:

- [ ] Check if services are running
- [ ] Test API endpoint with curl
- [ ] Check browser console for errors
- [ ] Look at network tab in browser DevTools
- [ ] Add console.log statements
- [ ] Check data types match expectations
- [ ] Verify CORS is configured
- [ ] Check environment variables
- [ ] Look for require() in wrong places
- [ ] Validate response structure

## Useful Debug Scripts

Create these in package.json for quick debugging:

```json
{
  "scripts": {
    "test:api": "curl -s http://localhost:3001/api/health",
    "test:templates": "curl -s http://localhost:3001/api/templates | python3 -m json.tool",
    "logs:backend": "tail -f backend.log",
    "debug": "NODE_ENV=development npm run dev"
  }
}
```

## Environment Variable Debugging

```bash
# Check if env vars are loaded
node -e "require('dotenv').config(); console.log(process.env.SUPABASE_URL ? 'URL set' : 'URL missing')"

# From backend directory
node -e "console.log(Object.keys(process.env).filter(k => k.includes('SUPABASE')))"
```

## Browser DevTools Tips

1. **Network Tab**: 
   - Check request/response headers
   - Look at response payload
   - Check for CORS headers

2. **Console Tab**:
   - Filter by log level
   - Search for specific prefixes like "[Template"
   - Preserve log across page refreshes

3. **Application Tab**:
   - Check localStorage
   - View cookies
   - Check session storage

## Quick Fixes Reference

| Problem | Quick Fix |
|---------|-----------|
| CORS error | Add origin to `allowedOrigins` in `app.js` |
| Module not found | `npm install` in correct directory |
| X is not a function | Add `Array.isArray()` check |
| Supabase error | Check `.env` file has credentials |
| Port in use | `pkill -f "node.*server"` |
| Types don't match | Update TypeScript definitions |

---

**Remember**: When stuck, add more logs! The answer is usually in the data structure. 🔍