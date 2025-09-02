# Quick Reference - Common Issues & Solutions

## 🔥 Most Common Issues (Check These First!)

### 1. "Module not found" / "Cannot find"
```bash
# Check: Is the path correct?
ls -la path/to/file
# Fix: Update import path
```

### 2. "X is not a function"
```javascript
// Check: Is the object null?
console.log(objectName);
// Fix: Ensure proper initialization
```

### 3. "Undefined environment variable"
```javascript
// Check: Is dotenv loaded first?
require('dotenv').config(); // Must be at TOP of file
// Fix: Lazy initialization or move dotenv
```

### 4. "Connection refused" / "ECONNREFUSED"
```bash
# Check: Is the service running?
ps aux | grep node
# Fix: Start the service or check port
```

### 5. "Module initialization error"
```javascript
// Check: Order of requires
// Fix: Lazy initialization pattern
```

## 🎯 The 2-Minute Debug Process

1. **Read error literally** (30 seconds)
   - "not a function" = object doesn't have that method
   - "not found" = wrong path or typo
   - "undefined" = not initialized

2. **Check the obvious** (30 seconds)
   ```bash
   ls -la file-mentioned-in-error
   grep -r "function-name" .
   echo $ENV_VAR_NAME
   ```

3. **Find existing code** (30 seconds)
   ```bash
   find . -name "*similar*"
   grep -r "feature-youre-adding"
   ```

4. **Try simplest fix** (30 seconds)
   - Change import path
   - Add missing comma
   - Fix typo

## 🚫 Red Flags - Stop If You're Doing This

- Creating files named `workaround-*`, `temp-*`, `test-*`
- Writing more than 50 lines to fix an error
- Installing new packages to avoid fixing issue
- Rewriting entire modules
- Been debugging same issue >30 minutes

## ✅ Green Flags - You're On Right Track

- Found issue in first 5 minutes
- Fix is <5 lines of code
- Using existing patterns from codebase
- Error makes logical sense
- Can explain issue in one sentence

## 📁 Where Things Live

```
/backend/
  /src/
    /routes/      # API endpoints
    /controllers/ # Request handlers
    /services/    # Business logic
    /models/      # Database models
    /utils/       # Shared utilities
    
/frontend/
  /app/          # Next.js pages
  /components/   # React components
  /lib/          # Utilities
  /api-client/   # Backend API calls
```

## 🔧 Fix Patterns That Work

### Pattern 1: Module Not Loading
```javascript
// Before: Reading env at module level
const apiKey = process.env.API_KEY; // Might be undefined

// After: Lazy initialization
function getApiKey() {
  return process.env.API_KEY;
}
```

### Pattern 2: Wrong Import Path
```javascript
// Before: Importing wrong module
const { thing } = require('../utils/custom-wrapper');

// After: Import correct module
const { thing } = require('../utils/official-module');
```

### Pattern 3: Async Not Awaited
```javascript
// Before: Forgetting await
const data = fetchData(); // Returns Promise

// After: Proper async
const data = await fetchData();
```

## 💊 If Nothing Else Works

1. **Restart clean**
   ```bash
   npm cache clean --force
   rm -rf node_modules
   npm install
   ```

2. **Check running processes**
   ```bash
   pkill node
   ps aux | grep node
   ```

3. **Verify environment**
   ```bash
   node --version  # Should be 18+
   npm --version   # Should be 8+
   ```

4. **Read the docs**
   - `/docs/DEBUGGING-PRINCIPLES.md`
   - `/docs/lessons/*.md`
   - Error's official documentation

## 🎓 Remember

- **The code already works** - You're fixing a small issue, not building from scratch
- **Simple problems have simple solutions** - If your fix is complex, reconsider
- **Errors are literal** - They mean exactly what they say
- **Check basics first** - Typos cause 30% of all bugs