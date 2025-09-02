# Knowledge Continuity System for LeadHarvest

## Purpose
Maintain project knowledge across Claude context resets and between different Claude instances.

## 🔄 The System

### 1. ACTIVE WORK LOG (Primary Communication)
**File**: `/docs/ACTIVE-WORK-LOG.md`
- Current Claude writes after EVERY significant action
- When full (>500 lines), archive and start new
- Archive naming: `work-log-2025-01-08-001.md`

### 2. Knowledge Chain Files (EXISTING STRUCTURE)

```
/docs/
├── 🔴 PRIMARY TRACKING (Update these!)
│   ├── ACTIVE-WORK-LOG.md           # Current work log
│   ├── CURRENT-STATE.md             # System state snapshot
│   ├── blockers-and-issues.md       # Current problems
│   ├── progress-reports.md          # Completed work
│   └── daily-assignments.md         # Task planning
│
├── 📂 COLLABORATION DOCS
│   ├── AGENT-COMMUNICATION-LOG.md   # Inter-Claude messages
│   ├── COORDINATION_SYSTEM.md       # How we coordinate
│   ├── collaboration-status.md      # Team status
│   ├── orchestrator-guide.md        # Orchestrator guide
│   ├── backend-claude-guide.md      # Backend guide
│   └── frontend-claude-guide.md     # Frontend guide
│
├── 📚 PERMANENT KNOWLEDGE
│   ├── DEBUGGING-PRINCIPLES.md      # Core debugging approach
│   ├── CLAUDE-COLLABORATION-GUIDE.md # Multi-Claude coordination
│   ├── LESSONS-LEARNED-INDEX.md     # Documentation map
│   └── lessons/                     # Specific lessons
│       ├── supabase-initialization-issue.md
│       └── QUICK-REFERENCE.md
│
├── 📊 PROGRESS HISTORY
│   ├── progress-reports/            # Daily/weekly reports
│   ├── tasks/                       # Task assignments
│   └── CHANGELOG.md                 # Version history
│
└── 🔧 SYSTEM DOCS
    ├── api-contracts.md             # API specs
    ├── database-update-instructions.md # DB schema
    └── gmail-integration-plan.md    # Gmail setup
```

## 📝 Work Log Entry Format

```markdown
## [2025-01-08 14:30] - Claude 1 (Backend)

### Task: Fix Gmail import error
**Status**: Completed
**Time Spent**: 15 minutes

### What I Did:
1. Changed import path in leadModel.js from '../utils/db' to '../utils/supabase'
2. This fixed the ".eq is not a function" error

### Key Learning:
- Always check import paths first
- The db.js wrapper doesn't support method chaining

### Files Modified:
- `/backend/src/models/leadModel.js` - line 2

### System State After:
- Gmail import: ✅ Working
- Lead creation: ✅ Working
- Frontend display: ✅ Working

### Next Claude Should:
- Monitor for any side effects
- Consider removing unused db.js wrapper

---
```

## 🚀 Claude Startup Protocol

### When Context Resets or New Claude Arrives:

```bash
# 1. READ in this order (5 minutes max):
cat /mnt/c/Users/12158/LeadHarvest/docs/CURRENT-STATE.md
tail -100 /mnt/c/Users/12158/LeadHarvest/docs/ACTIVE-WORK-LOG.md
cat /mnt/c/Users/12158/LeadHarvest/docs/LESSONS-LEARNED-INDEX.md

# 2. Understand current situation
git status
npm ls 2>/dev/null | head -5
ps aux | grep node

# 3. Continue from last entry in ACTIVE-WORK-LOG.md
```

## 📊 Current State File Template

```markdown
# Current System State
**Last Updated**: 2025-01-08 14:30 by Claude 1

## What's Working
- ✅ Gmail OAuth connection
- ✅ Email import and parsing
- ✅ Lead CRUD operations
- ✅ Frontend display

## Known Issues
- ⚠️ [Issue description if any]

## Running Processes
- Frontend: localhost:3000 (npm run dev)
- Backend: localhost:3001 (node backend-full.js)

## Recent Changes
- Fixed Supabase initialization (see work log)
- Updated leadModel.js import path

## Environment Notes
- Using WSL2 on Windows
- Node v18.x
- Supabase for database

## Critical Files Modified Recently
- /backend/src/utils/supabase.js - lazy initialization
- /backend/src/models/leadModel.js - import fix
```

## 🎯 Implementation in CLAUDE.md

Add this to the TOP of CLAUDE.md:

```markdown
## 📋 MANDATORY STARTUP PROCEDURE

When you start (new context or taking over):
1. Run: `cat /mnt/c/Users/12158/LeadHarvest/docs/CURRENT-STATE.md`
2. Run: `tail -100 /mnt/c/Users/12158/LeadHarvest/docs/ACTIVE-WORK-LOG.md`
3. Read last 3 entries to understand recent work

After EVERY task completion:
1. Update `/docs/ACTIVE-WORK-LOG.md` with your work
2. If switching Claudes, update `/docs/CURRENT-STATE.md`
3. If you learned something new, add to `/docs/lessons/`
```

## 🔧 Automation Helper Script

Create `/backend/scripts/claude-log.js`:

```javascript
#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const logEntry = (type, message) => {
  const timestamp = new Date().toISOString().replace('T', ' ').split('.')[0];
  const logFile = path.join(__dirname, '../../docs/ACTIVE-WORK-LOG.md');
  
  const entry = `
## [${timestamp}] - Auto-logged

${message}

---
`;
  
  fs.appendFileSync(logFile, entry);
  console.log('✅ Logged to ACTIVE-WORK-LOG.md');
};

// Usage: node claude-log.js "Fixed import issue in leadModel.js"
if (process.argv[2]) {
  logEntry('task', process.argv[2]);
}
```

## 📈 Benefits of This System

1. **No Lost Knowledge**: Every solution is preserved
2. **Fast Onboarding**: New Claude productive in 5 minutes
3. **Pattern Recognition**: Repeated issues become obvious
4. **Progress Tracking**: Clear trail of what's been done
5. **Debugging History**: Can trace when issues started

## 🚨 Critical Rules

1. **NEVER DELETE** work logs - archive them
2. **ALWAYS LOG** after significant changes
3. **READ BEFORE WRITING** - don't repeat work
4. **TIME ENTRIES** - include timestamps
5. **BE SPECIFIC** - file names and line numbers

## 📊 Success Metrics

Good continuity looks like:
- New Claude productive within 5 minutes
- No repeated mistakes
- Clear progress trajectory
- Issues solved faster over time

Bad continuity looks like:
- Recreating same workarounds
- No knowledge of recent changes
- Solving same problem multiple times
- Lost work between contexts

## 🔄 Archive Protocol

When ACTIVE-WORK-LOG.md exceeds 500 lines:
```bash
# Archive current log
mv docs/ACTIVE-WORK-LOG.md docs/work-logs/work-log-$(date +%Y-%m-%d-%H%M).md

# Create new log with header
echo "# Active Work Log\nContinued from previous log\n\n---\n" > docs/ACTIVE-WORK-LOG.md

# Update index
echo "- Archived log at $(date)" >> docs/work-logs/INDEX.md
```

## Alternative Approach Comparison

### Current Approach vs Alternatives:

**Our System** (Structured Logs + State Files):
- ✅ Simple to implement
- ✅ Works with any Claude
- ✅ Survives context resets
- ✅ Human readable
- ⚠️ Requires discipline

**Alternative 1** (Git Commits Only):
- ✅ Automatic with commits
- ❌ Loses debugging process
- ❌ No failed attempt history
- ❌ Hard to read quickly

**Alternative 2** (Single Massive File):
- ✅ Everything in one place
- ❌ Becomes unwieldy
- ❌ Slow to parse
- ❌ No structure

**Alternative 3** (Database/Tool):
- ✅ Structured data
- ❌ Requires setup
- ❌ Another system to maintain
- ❌ Not readable in emergency

## Recommendation

This structured log system is optimal because:
1. It's simple enough to maintain
2. It's readable by humans and Claudes
3. It preserves all knowledge
4. It's searchable with grep
5. It requires no special tools

The key is DISCIPLINE - every Claude must log their work.