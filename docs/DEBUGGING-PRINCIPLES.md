# DEBUGGING PRINCIPLES FOR ALL CLAUDES

**CRITICAL**: Read this before attempting any fixes in the LeadHarvest codebase.

## 🐴 THINK HORSES, NOT ZEBRAS

When you hear hoofbeats, think horses, not zebras. Look for common problems before exotic ones.

## The 5-Minute Rule

Before creating ANY new file or workaround, spend 5 minutes checking:
1. **Import paths** - Is the right module being imported?
2. **Environment variables** - Are they loaded? Are they correct?
3. **File exists** - Does the file/module actually exist?
4. **Dependencies installed** - Is the package in node_modules?
5. **Typos** - Is everything spelled correctly?

## Debugging Priority Checklist

### Level 1: ALWAYS CHECK FIRST (90% of issues)
- [ ] Typos in variable names, function names, file paths
- [ ] Import/require statements pointing to correct files
- [ ] Environment variables loaded (check with `console.log`)
- [ ] Dependencies installed (`npm ls package-name`)
- [ ] File permissions (especially in WSL)
- [ ] Syntax errors (missing brackets, commas, etc.)

### Level 2: Common Issues (8% of issues)
- [ ] Module initialization order
- [ ] Async/await usage
- [ ] Database connection strings
- [ ] API keys and credentials
- [ ] Port conflicts
- [ ] CORS configuration

### Level 3: Complex Issues (2% of issues)
- [ ] Memory leaks
- [ ] Race conditions  
- [ ] System-level problems
- [ ] Package incompatibilities

## 🚫 NEVER DO THIS FIRST

### RED FLAGS - If you're doing these, STOP:
1. **Creating workaround files** (gmail-server.js, backend-full.js, etc.)
2. **Rewriting core modules** from scratch
3. **Installing alternative packages** to avoid fixing the real issue
4. **Creating custom implementations** of standard libraries
5. **Deleting and recreating** large portions of code

### Why These Are Bad:
- They compound problems
- They obscure the real issue
- They create technical debt
- They confuse other Claudes
- They're usually unnecessary

## ✅ CORRECT DEBUGGING APPROACH

### Step 1: Understand the Error
```javascript
// GOOD: Log the actual error
console.log('Error details:', error);
console.log('Error stack:', error.stack);
console.log('Current state:', relevantVariable);
```

### Step 2: Isolate the Problem
```javascript
// GOOD: Test the specific failing component
const testModule = require('./problematic-module');
console.log('Module loaded:', testModule);
console.log('Has expected method?', typeof testModule.expectedMethod);
```

### Step 3: Check the Basics
```bash
# GOOD: Verify environment
echo $DATABASE_URL
npm ls problematic-package
ls -la src/utils/
```

### Step 4: Minimal Fix
```javascript
// GOOD: Fix only what's broken
// Change: const { thing } = require('../wrong/path');
// To:     const { thing } = require('../correct/path');
```

## 📋 Real Examples from This Project

### ❌ BAD: Creating Workarounds
```javascript
// DON'T DO THIS
// Created gmail-server.js because main server wouldn't start
// Created backend-full.js to skip Supabase initialization  
// Created custom REST wrapper to avoid Supabase client
```

### ✅ GOOD: Fix Root Cause
```javascript
// DO THIS
// Problem: leadModel.js importing from wrong location
// Fix: Change '../utils/db' to '../utils/supabase' (1 line)

// Problem: Env vars not loaded when module initializes
// Fix: Lazy initialization pattern (10 lines)
```

## 🎯 Decision Tree for Debugging

```
Is there an error?
├─ Yes
│  ├─ Is it a "not found" error?
│  │  └─ Check paths and typos FIRST
│  ├─ Is it a "not a function" error?  
│  │  └─ Check if object is null or wrong type
│  ├─ Is it a connection error?
│  │  └─ Check env vars and credentials
│  └─ Is it a syntax error?
│     └─ Check the exact line mentioned
└─ No, but something isn't working
   ├─ Add console.log to trace execution
   ├─ Check if code is even running
   └─ Verify expected vs actual behavior
```

## 🔄 The Restoration Principle

**THE CODEBASE IS ALREADY COMPLETE**

This is a working application. If something breaks:
1. It worked before
2. Something simple changed
3. The fix is usually simple too

Don't assume features are missing. Check if they're just disconnected.

## 📝 Documentation Requirements

When you fix an issue:
1. Document what was wrong
2. Document the simple fix
3. Add to this file if it's a new pattern
4. Update CLAUDE.md if it affects development

## 🚨 Emergency Protocol

If you've been debugging for more than 30 minutes:
1. STOP creating new files
2. List all files you've created
3. Consider reverting to last known good state
4. Re-read this document
5. Check the basics again

Remember: 95% of bugs are simple issues with simple fixes.