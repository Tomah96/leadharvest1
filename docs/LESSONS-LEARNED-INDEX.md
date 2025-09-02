# Lessons Learned Index & Documentation Map

Quick reference to ALL documentation in the LeadHarvest project.

## 🔴 PRIMARY TRACKING DOCUMENTS (Update These!)

1. **[ACTIVE-WORK-LOG.md](./ACTIVE-WORK-LOG.md)** - Living work log (UPDATE AFTER EACH TASK)
2. **[CURRENT-STATE.md](./CURRENT-STATE.md)** - System snapshot (UPDATE ON HANDOFF)
3. **[blockers-and-issues.md](./blockers-and-issues.md)** - Current problems
4. **[progress-reports.md](./progress-reports.md)** - Completed work
5. **[daily-assignments.md](./daily-assignments.md)** - Task planning

## Critical Lessons (Read First)

1. **[Supabase Initialization Issue](./lessons/supabase-initialization-issue.md)**
   - 4-hour debug that should have been 30 minutes
   - Import path issue + env var timing
   - **Key**: Always check import paths first

2. **[Quick Reference Guide](./lessons/QUICK-REFERENCE.md)**
   - Most common issues and 2-minute fixes
   - Red flags to watch for
   - Green flags you're on right track

## Core Principles

3. **[Debugging Principles](./DEBUGGING-PRINCIPLES.md)**
   - Think horses, not zebras
   - 5-minute rule before workarounds
   - The restoration principle

4. **[Collaboration Guide](./CLAUDE-COLLABORATION-GUIDE.md)**  
   - Multi-Claude coordination
   - Handoff protocols
   - File organization rules

5. **[Knowledge Continuity System](./KNOWLEDGE-CONTINUITY-SYSTEM.md)**
   - How to maintain knowledge across context resets
   - Work log format
   - Archive protocols

## 📂 Collaboration & Coordination Docs

1. **[AGENT-COMMUNICATION-LOG.md](./AGENT-COMMUNICATION-LOG.md)** - Inter-Claude messages
2. **[COORDINATION_SYSTEM.md](./COORDINATION_SYSTEM.md)** - How we coordinate
3. **[collaboration-status.md](./collaboration-status.md)** - Team status
4. **[orchestrator-guide.md](./orchestrator-guide.md)** - Orchestrator Claude guide
5. **[backend-claude-guide.md](./backend-claude-guide.md)** - Backend Claude guide
6. **[frontend-claude-guide.md](./frontend-claude-guide.md)** - Frontend Claude guide

## 📊 Progress Tracking

1. **[PROGRESS-TRACKING-SYSTEM.md](./PROGRESS-TRACKING-SYSTEM.md)** - How to track progress
2. **[progress-reports/](./progress-reports/)** - Daily/weekly reports
3. **[day8-complete-summary.md](./day8-complete-summary.md)** - Latest milestone
4. **[CHANGELOG.md](./CHANGELOG.md)** - Version history

## 📋 Task Management

1. **[tasks/](./tasks/)** - All task assignments by day and Claude
2. **[daily-assignments-day*.md](.)** - Historical daily tasks
3. **[tech-debt-tracker.md](./tech-debt-tracker.md)** - Technical debt items

## 🔧 System Documentation

1. **[api-contracts.md](./api-contracts.md)** - API specifications
2. **[database-update-instructions.md](./database-update-instructions.md)** - DB schema
3. **[email-parsing-strategy.md](./email-parsing-strategy.md)** - Email parsing logic
4. **[gmail-integration-plan.md](./gmail-integration-plan.md)** - Gmail setup
5. **[git-workflow.md](./git-workflow.md)** - Git procedures

## Common Issues & Solutions

### Import/Module Issues
- **Wrong import path**: Check actual file location
- **Module not found**: Verify npm install completed
- **X is not a function**: Object is null or wrong type

### Environment Issues  
- **Undefined env vars**: Move dotenv.config() to top
- **Env timing issues**: Use lazy initialization
- **Connection refused**: Service not running

### Database Issues
- **Supabase null**: Check env vars loaded
- **Method not available**: Wrong client imported
- **Connection timeout**: Check DATABASE_URL

## Anti-Patterns to Avoid

❌ **Never Do**:
- Create workaround files (gmail-server.js, etc.)
- Rewrite working modules
- Delete documentation
- Assume features missing

✅ **Always Do**:
- Check existing code first
- Fix root causes
- Document learnings
- Update work logs

## Search Hints

Finding solutions in our docs:
```bash
# Find specific error solutions
grep -r "error message" docs/lessons/

# Find issues by component
grep -r "supabase" docs/lessons/
grep -r "gmail" docs/lessons/

# Find by pattern
grep -r "import.*from" docs/lessons/
```

## Adding New Lessons

When documenting a new lesson:
1. Create file in `/docs/lessons/[issue-name].md`
2. Add entry to this index
3. Update QUICK-REFERENCE.md if common
4. Note in ACTIVE-WORK-LOG.md

## Remember

> "When you hear hoofbeats, think horses, not zebras"

Most problems are simple with simple solutions. The codebase is complete - you're just reconnecting wires, not rebuilding the engine.