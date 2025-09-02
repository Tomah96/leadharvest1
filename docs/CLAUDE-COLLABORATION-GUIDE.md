# Multi-Claude Collaboration Guidelines

**Purpose**: Ensure all Claudes work effectively together without creating conflicts or redundant work.

## 🎭 Claude Roles in LeadHarvest

### Current Team Structure:
- **Orchestrator Claude**: Project coordination, integration, documentation
- **Backend Claude**: Node.js/Express API development (works in `/backend`)
- **Frontend Claude**: Next.js UI development (works in `/frontend`)

## 📜 Golden Rules for All Claudes

### Rule 1: Check Existing Code First
**NEVER** assume something doesn't exist. The codebase is complete.
```bash
# Before creating ANY new file, check:
find . -name "*similar-name*"
grep -r "functionality-youre-adding"
ls -la relevant-directory/
```

### Rule 2: No Workarounds Without Discussion
If you're creating a workaround file:
1. STOP
2. Document why the original isn't working
3. Try to fix the original instead
4. Only create new file if absolutely necessary

### Rule 3: Communicate Through Documentation
```markdown
# When you make changes, update:
1. /docs/daily-assignments.md - What you're working on
2. /docs/blockers-and-issues.md - Problems you encounter
3. /docs/progress-reports.md - What you completed
```

## 🔄 Handoff Protocol

### When Switching Between Claudes:

#### Leaving Claude Should:
1. **Document current state**
   ```markdown
   ## Current State - [Date/Time]
   - What's working: Gmail import, lead display
   - What's broken: [specific issue]
   - What I tried: [list attempts]
   - Next steps: [recommendations]
   ```

2. **List any temporary files created**
   ```markdown
   ## Temporary Files Created
   - /backend/test-file.js - Can be deleted
   - /backend/workaround.js - DO NOT DELETE until issue fixed
   ```

3. **Note any running processes**
   ```bash
   # Running servers:
   - Frontend: port 3000 (npm run dev)
   - Backend: port 3001 (node backend-full.js)
   ```

#### Arriving Claude Should:
1. **Read recent documentation**
   - Check /docs/blockers-and-issues.md
   - Check recent commit messages
   - Check for URGENT flags

2. **Verify environment state**
   ```bash
   git status
   npm ls  # Check dependencies
   ps aux | grep node  # Check running processes
   ```

3. **Continue, don't restart**
   - Don't recreate work already done
   - Build on existing solutions
   - Fix root causes, not symptoms

## 🚨 Conflict Resolution

### When Claudes Disagree on Approach:

1. **Document both perspectives**
   ```markdown
   ## Approach Conflict: [Issue Name]
   
   ### Claude 1 Perspective:
   - Proposes: [solution]
   - Reasoning: [why]
   
   ### Claude 2 Perspective:  
   - Proposes: [different solution]
   - Reasoning: [why]
   ```

2. **Apply decision criteria**
   - Simpler solution wins (Occam's Razor)
   - Fewer new files wins
   - Less code change wins
   - Fix root cause, not symptom

3. **Test both if quick**
   - If both can be tested in <5 minutes, try both
   - Document which worked

## 🗂️ File Organization Rules

### Never Delete These Files:
```
/docs/lessons/*.md           # Lessons learned
/docs/DEBUGGING-PRINCIPLES.md # Core debugging guide
/docs/CLAUDE-COLLABORATION-GUIDE.md # This file
/CLAUDE.md                   # Main Claude instructions
```

### Temporary Files:
- Prefix with `temp-` or `test-`
- Add comment at top: `// TEMPORARY - Can be deleted after [issue] is fixed`
- List in handoff documentation

### Workaround Files:
- Prefix with `workaround-`
- Add comment explaining why needed
- Plan to remove once root cause fixed

## 📊 Success Metrics

### Good Collaboration Looks Like:
- ✅ Each Claude builds on previous work
- ✅ No duplicate efforts
- ✅ Clear documentation trail
- ✅ Steady progress toward goals
- ✅ Root causes get fixed

### Bad Collaboration Looks Like:
- ❌ Multiple workaround files
- ❌ Conflicting changes
- ❌ Recreating existing functionality
- ❌ No documentation of attempts
- ❌ Same issues recurring

## 🎯 Problem-Solving Hierarchy

### Order of Operations:
1. **Check if already solved** - Read docs/lessons/
2. **Check if being worked on** - Read docs/blockers-and-issues.md
3. **Apply debugging principles** - Read DEBUGGING-PRINCIPLES.md
4. **Coordinate if complex** - Update docs/daily-assignments.md
5. **Document when solved** - Update docs/lessons/

## 💬 Communication Templates

### Reporting an Issue:
```markdown
## Issue: [Name]
- **Severity**: Critical/High/Medium/Low
- **Affects**: [What functionality]
- **Error**: [Exact error message]
- **Tried**: [What you attempted]
- **Suspected cause**: [Your hypothesis]
- **Next Claude should**: [Specific action]
```

### Reporting Success:
```markdown
## Fixed: [Issue Name]
- **Problem**: [What was broken]
- **Root cause**: [Why it was broken]
- **Solution**: [What fixed it]
- **Files changed**: [List files]
- **Testing done**: [How you verified]
```

## 🔍 Discovery Before Creation

### The 80/20 Rule:
- 80% of "missing" features already exist
- 20% might actually need creation
- Spend 80% of time finding existing code
- Spend 20% of time writing new code

### Search Commands Every Claude Should Know:
```bash
# Find all routes
grep -r "router\." --include="*.js"

# Find all API endpoints
grep -r "app\.(get|post|put|delete)" --include="*.js"

# Find all database models
find . -path "*/models/*.js"

# Find all React components
find . -path "*/components/*.jsx" -o -path "*/components/*.tsx"

# Find environment variable usage
grep -r "process.env\." --include="*.js"
```

## 🚀 Efficiency Tips

1. **Read errors literally** - They usually mean exactly what they say
2. **Test smallest change first** - One line fix before rewrite
3. **Use existing patterns** - Copy similar working code
4. **Document as you go** - Don't wait until the end
5. **Ask "Is this already done?"** - Before creating anything

## 📝 Remember

The codebase is like a working car with a loose wire. Don't rebuild the engine when you just need to reconnect a cable.