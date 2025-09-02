# Backend Module Restoration Task - For Claude 2

## Critical Context
- NPM install is broken and hangs indefinitely
- Most modules ARE already restored (express, dotenv, cors, helmet, morgan, jsonwebtoken)
- Only missing: bcrypt and googleapis
- Pure Node.js server (full-server-with-db.js) is currently running as workaround
- Need to get original server.js working

## Your Priority Tasks

### 1. Restore Missing Modules (30 minutes)
**Missing modules to restore:**
- `bcrypt` (version 5.1.1 or compatible)
- `googleapis` (version 153.0.0 or compatible)

**Approach:**
```bash
# Since npm install doesn't work, use manual download:
cd /mnt/c/Users/12158/LeadHarvest/backend

# For bcrypt - try the restore script first
./restore-packages.sh

# If that doesn't work for bcrypt/googleapis, manually download:
# Example for googleapis:
wget https://registry.npmjs.org/googleapis/-/googleapis-153.0.0.tgz
tar -xzf googleapis-153.0.0.tgz
mkdir -p node_modules/googleapis
mv package/* node_modules/googleapis/
rm -rf package googleapis-153.0.0.tgz
```

### 2. Get Original server.js Running (20 minutes)
1. Test if server.js starts:
   ```bash
   node server.js
   ```

2. Fix any module loading issues
3. Verify endpoints work:
   - `/api/health`
   - `/api/leads`
   - `/api/gmail/status`
   - `/api/gmail/auth-url`

4. If bcrypt causes issues, temporarily mock it:
   ```javascript
   // In server.js or where bcrypt is imported
   const bcrypt = {
     hash: async (password) => 'mocked_' + password,
     compare: async (password, hash) => hash === 'mocked_' + password
   };
   ```

### 3. Document Your Progress (10 minutes)
Create `/docs/backend-restoration-report.md` with:
- [ ] List of restored modules
- [ ] Working endpoints
- [ ] Any workarounds used
- [ ] Current server status

## Testing Commands
```bash
# Test server starts
node server.js

# Test health endpoint
curl http://localhost:3001/api/health

# Test Gmail endpoints
curl http://localhost:3001/api/gmail/status
curl http://localhost:3001/api/gmail/auth-url

# Test leads endpoint
curl http://localhost:3001/api/leads
```

## Success Criteria
- [ ] server.js runs without crashes
- [ ] All API endpoints respond
- [ ] Gmail integration functional
- [ ] No critical errors in console

## If You Get Stuck
1. Document the specific error in your report
2. Implement a workaround (mock the problematic module)
3. Continue with other tasks
4. Note it for the orchestrator

## Remember
- "Toyota not BMW" - simple solutions over complex ones
- If npm doesn't work, use wget/manual download
- Focus on getting it working, not perfect
- Time limit: 1 hour total