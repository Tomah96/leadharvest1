# Progress Tracking Quick Reference

## Daily Workflow Checklist

### 🌅 Start of Day (5 minutes)
```bash
□ Check /docs/system-state.md for environment status
□ Read /docs/AGENT-COMMUNICATION-LOG.md for messages
□ Review /docs/daily-assignments.md for tasks
□ Check /docs/blockers-and-issues.md for problems
□ Update communication log with session start
□ Mark assigned tasks as "IN_PROGRESS"
```

### 💼 During Work
```bash
□ Update task status when starting new work
□ Log blockers immediately in blockers-and-issues.md
□ Document decisions in AGENT-COMMUNICATION-LOG.md
□ Add learnings to KNOWLEDGE-BASE.md as discovered
□ Create feature branches for new work
□ Run tests before marking tasks complete
```

### 🌙 End of Day (10 minutes)
```bash
□ Create progress report in /docs/progress-reports/[date]-[agent]-report.md
□ Update system-state.md if environment changed
□ Mark completed tasks as "COMPLETE"
□ Add handoff notes to AGENT-COMMUNICATION-LOG.md
□ Update tech-debt-tracker.md if debt incurred
□ Commit and push all changes
```

## Key Files and Their Purpose

| File | Purpose | Update Frequency |
|------|---------|------------------|
| **AGENT-COMMUNICATION-LOG.md** | Real-time messages between agents | Multiple times daily |
| **system-state.md** | Environment and service status | When changes occur |
| **daily-assignments.md** | Today's task list | Daily by Orchestrator |
| **blockers-and-issues.md** | Active problems needing resolution | As issues arise |
| **KNOWLEDGE-BASE.md** | Lessons learned and solutions | As discoveries made |
| **progress-reports/[date]-[agent]-report.md** | Daily progress documentation | End of each session |

## Task Status Flow

```
PENDING → ASSIGNED → IN_PROGRESS → READY_FOR_REVIEW → COMPLETE
                ↓                         ↓
            BLOCKED              NEEDS_REVISION
```

## Priority Levels

- **P0**: Drop everything - Production down or blocking all work
- **P1**: Complete today - Core feature or major blocker
- **P2**: Complete this week - Important but not urgent
- **P3**: Backlog - Nice to have or technical debt

## Quick Templates

### Reporting a Blocker
```markdown
### P[0-3] [Agent] [Time] - [Brief Title]
**Issue**: [Clear description]
**Error**: [Error message if applicable]
**Impact**: [What's blocked]
**Attempted**: [What you tried]
**Need**: [What would unblock you]
@[blocking-agent]
```

### Asking a Question
```markdown
### For [Agent Name]:
**Question**: [Specific question]
**Context**: [Why you need to know]
**Blocking**: [Yes/No]
**Urgency**: P[0-3]
```

### Documenting a Learning
```markdown
## [Category]: [Title]
**Date**: [YYYY-MM-DD]
**Problem**: [What issue was encountered]
**Solution**: [How it was solved]
**Code**: ```[example]```
**Future**: [Implications for project]
```

## Communication Best Practices

### ✅ DO:
- Update status immediately when starting/completing tasks
- Document decisions with rationale
- Include file paths when mentioning code changes
- Tag other agents when you need them
- Create progress reports even for partial work

### ❌ DON'T:
- Leave blockers undocumented
- Make major decisions without documenting
- Skip end-of-session reports
- Ignore messages in communication log
- Work on tasks not in daily-assignments.md

## Emergency Procedures

### P0 Issue Response
1. **STOP** current work
2. **POST** in AGENT-COMMUNICATION-LOG.md with @all
3. **CREATE** incident report in /docs/incidents/
4. **UPDATE** blockers-and-issues.md with P0 flag
5. **FIX** with minimal change
6. **TEST** thoroughly
7. **DOCUMENT** root cause

### Can't Access Documentation
```bash
# Backup access paths
cat /mnt/c/Users/12158/LeadHarvest/docs/AGENT-COMMUNICATION-LOG.md
cat /mnt/c/Users/12158/LeadHarvest/docs/system-state.md
ls -la /mnt/c/Users/12158/LeadHarvest/docs/progress-reports/
```

## Useful Commands

```bash
# Check system status
curl http://localhost:3001/api/health
curl http://localhost:3000/

# Find recent changes
git log --oneline -10
git status
git diff

# Search for TODOs
grep -r "TODO" --include="*.js" --include="*.tsx"

# Run tests
cd backend && npm test
cd frontend && npm test

# Check for errors in logs
grep -i error backend.log
grep -i error frontend.log
```

## Contact for Help

1. **First**: Check KNOWLEDGE-BASE.md for similar issues
2. **Second**: Post in AGENT-COMMUNICATION-LOG.md
3. **Third**: Update blockers-and-issues.md if blocked
4. **Emergency**: Mark as P0 and tag @all

---

*Keep this guide handy for quick reference throughout your session!*