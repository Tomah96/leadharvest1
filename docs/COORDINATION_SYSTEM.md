# LeadHarvest Coordination System

## Overview

This document explains our multi-Claude coordination system to prevent confusion and ensure smooth collaboration.

## File Structure

```
/docs/
├── COORDINATION_SYSTEM.md      # This file - explains the system
├── orchestrator-guide.md       # Claude 1 instructions
├── backend-claude-guide.md     # Claude 2 instructions  
├── frontend-claude-guide.md    # Claude 3 instructions
├── collaboration-status.md     # Current state & file locations
├── progress-reports.md         # Daily progress from all teams
├── api-contracts.md           # API documentation
└── tasks/                     # Daily assignments
    ├── backend-day[N].md      # Backend daily tasks
    ├── frontend-day[N].md     # Frontend daily tasks
    └── orchestrator-day[N].md # Orchestrator daily tasks
```

## How It Works

### 1. Daily Task Assignment
- Orchestrator (Claude 1) creates daily task files in `/docs/tasks/`
- Each Claude reads their specific task file
- Tasks include exact file paths and success criteria

### 2. Progress Tracking
- Each Claude updates `/docs/progress-reports.md` with their progress
- Updates include:
  - Completed tasks
  - Files created/modified (with paths)
  - Blockers encountered
  - Test results

### 3. Status Synchronization
- `/docs/collaboration-status.md` is the single source of truth
- Contains all current file locations
- Updated when new files are created
- Shows integration status between teams

### 4. Communication Protocol
- All communication happens through documentation
- No direct Claude-to-Claude communication
- Integration issues tagged in progress reports
- Orchestrator monitors and coordinates

## Key Files Explained

### orchestrator-guide.md
- Defines Claude 1's coordination role
- Lists all key file locations
- Explains daily workflow
- Integration testing responsibilities

### backend/frontend-claude-guide.md
- Role-specific instructions
- Where to find daily tasks
- How to report progress
- Key file locations for that role

### collaboration-status.md
- Current working state
- Quick reference for ALL file paths
- Recent changes
- Known issues & solutions
- Integration status

### tasks/[role]-day[N].md
- Daily assignments with priorities
- Exact file paths for each task
- Success criteria
- Integration points
- Deliverables checklist

## Benefits of This System

1. **No Confusion**: Every Claude knows exactly where to look
2. **Clear History**: Task files preserve what was assigned each day
3. **Better Tracking**: Progress is documented systematically
4. **Easy Debugging**: Can trace back through task files
5. **Integration Clarity**: Collaboration points explicitly marked

## Rules for All Claudes

1. **Always use exact file paths** from collaboration-status.md
2. **Update progress** at least twice daily
3. **Document new files** in collaboration-status.md
4. **Tag integration issues** in progress reports
5. **Check your guide** before starting each day

## Current Status (Day 8 - Enhanced Tracking)

- ✅ Documentation system restructured
- ✅ All guides created with task protocol
- ✅ Progress tracking system enhanced
- ✅ Knowledge base expanded with recipes
- ✅ System state monitoring active
- 🔄 Gmail integration ready for testing

## Active Tracking Systems

### 1. Progress Tracking
- **PROGRESS-TRACKING-SYSTEM.md** - Comprehensive tracking guide
- **progress-reports/** - Daily reports from all agents
- **AGENT-COMMUNICATION-LOG.md** - Real-time communication

### 2. Knowledge Management
- **KNOWLEDGE-BASE.md** - Lessons and solutions
- **Integration recipes** - Reusable patterns
- **Debugging techniques** - Troubleshooting guide

### 3. System Monitoring
- **system-state.md** - Current environment status
- **blockers-and-issues.md** - Active problems
- **tech-debt-tracker.md** - Technical debt log

## Communication Protocol Updates

### Morning Sync (Required)
1. Check system-state.md
2. Review AGENT-COMMUNICATION-LOG.md
3. Read daily-assignments.md
4. Update status to "IN_PROGRESS"

### During Work
1. Log decisions in AGENT-COMMUNICATION-LOG.md
2. Update blockers immediately if found
3. Document learnings in KNOWLEDGE-BASE.md

### End of Session (Required)
1. Create progress report using template
2. Update system-state.md if changed
3. Add handoff notes to communication log

## Next Steps

1. All Agents: Use new progress report template
2. Backend: Continue Gmail integration testing
3. Frontend: Test Gmail import UI with backend
4. Orchestrator: Monitor integration and resolve issues

This enhanced system ensures perfect coordination and knowledge retention!