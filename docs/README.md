# LeadHarvest Documentation Index
**Last Updated**: 2025-08-27

## 📁 Documentation Structure

### 🎯 Core Documentation
Essential files for understanding and operating the system.

| File | Purpose | Update Frequency |
|------|---------|------------------|
| [`CLAUDE.md`](/CLAUDE.md) | Main instructions for all Claudes | As needed |
| [`CURRENT-STATE.md`](./CURRENT-STATE.md) | Live system status | Daily |
| [`ACTIVE-WORK-LOG.md`](./ACTIVE-WORK-LOG.md) | Real-time work tracking | Every task |
| [`blockers-and-issues.md`](./blockers-and-issues.md) | Active problems tracking | As issues arise |

### 📊 Progress & Reports
Track development progress and milestones.

| Directory/File | Contents |
|----------------|----------|
| [`progress-reports/`](./progress-reports/) | Daily/weekly summaries |
| [`progress-reports.md`](./progress-reports.md) | Consolidated progress log |
| [`CHANGELOG.md`](./CHANGELOG.md) | Feature releases and fixes |

### 👥 Collaboration & Coordination
Multi-Claude coordination documents.

| File | Purpose |
|------|---------|
| [`CLAUDE-COLLABORATION-GUIDE.md`](./CLAUDE-COLLABORATION-GUIDE.md) | How Claudes work together |
| [`orchestrator-guide.md`](./orchestrator-guide.md) | Orchestrator Claude instructions |
| [`backend-claude-guide.md`](./backend-claude-guide.md) | Backend Claude (Claude 2) guide |
| [`frontend-claude-guide.md`](./frontend-claude-guide.md) | Frontend Claude (Claude 3) guide |
| [`AGENT-COMMUNICATION-LOG.md`](./AGENT-COMMUNICATION-LOG.md) | Inter-Claude messages |
| [`COORDINATION_SYSTEM.md`](./COORDINATION_SYSTEM.md) | Coordination protocols |

### 📋 Task Management
Active and completed task assignments.

| Directory | Contents |
|-----------|----------|
| [`tasks/`](./tasks/) | All task assignments |
| `tasks/backend-*.md` | Backend specific tasks |
| `tasks/frontend-*.md` | Frontend specific tasks |
| `tasks/day*-*.md` | Daily task batches |

**Recent Task Documents**:
- [`ZILLOW-PARSER-FIX-PLAN.md`](./tasks/ZILLOW-PARSER-FIX-PLAN.md) - Parser fixes
- [`CONVERSATION-WINDOW-IMPLEMENTATION.md`](./tasks/CONVERSATION-WINDOW-IMPLEMENTATION.md) - Current task

### 🧠 Knowledge Base
Permanent learning and best practices.

| Directory/File | Purpose |
|----------------|---------|
| [`lessons/`](./lessons/) | Lessons learned (permanent) |
| [`lessons/QUICK-REFERENCE.md`](./lessons/QUICK-REFERENCE.md) | Common solutions |
| [`DEBUGGING-PRINCIPLES.md`](./DEBUGGING-PRINCIPLES.md) | Debug methodology |
| [`KNOWLEDGE-CONTINUITY-SYSTEM.md`](./KNOWLEDGE-CONTINUITY-SYSTEM.md) | Knowledge preservation |
| [`LESSONS_LEARNED.md`](./LESSONS_LEARNED.md) | Historical lessons |

### 🔧 Technical Documentation
System design and implementation details.

| File | Purpose |
|------|---------|
| [`app-development-status.md`](./app-development-status.md) | Feature completion status |
| [`database-update-instructions.md`](./database-update-instructions.md) | DB migration guide |
| [`gmail-integration-plan.md`](./gmail-integration-plan.md) | Gmail feature specs |
| [`email-parsing-strategy.md`](./email-parsing-strategy.md) | Parser architecture |
| [`testing-strategy.md`](./testing-strategy.md) | Test approach |
| [`tech-debt-tracker.md`](./tech-debt-tracker.md) | Technical debt items |

### 📅 Historical Records
Day-by-day development history.

| Pattern | Description |
|---------|-------------|
| `day*-*.md` | Daily summaries and plans |
| `*-SESSION-*.md` | Session context handoffs |
| `*-REPORT.md` | Completion reports |
| `*-PLAN.md` | Implementation plans |

### 🚀 Deployment & Operations
Production readiness documentation.

| File | Purpose |
|------|---------|
| [`testing-checklist.md`](./testing-checklist.md) | Pre-deployment testing |
| [`npm-wsl-workaround.md`](./npm-wsl-workaround.md) | WSL-specific fixes |
| [`missing-features-design.md`](./missing-features-design.md) | Feature roadmap |

## 📝 Documentation Guidelines

### When to Update Each File

**Every Task Completion**:
- ✅ Update `ACTIVE-WORK-LOG.md`
- ✅ Update `progress-reports.md` if significant

**Daily**:
- ✅ Update `CURRENT-STATE.md`
- ✅ Review `blockers-and-issues.md`

**On Handoff**:
- ✅ Create session context file
- ✅ Update `CURRENT-STATE.md`
- ✅ Clear completed items from `blockers-and-issues.md`

**When Learning Something New**:
- ✅ Add to `lessons/` if permanent solution
- ✅ Update `QUICK-REFERENCE.md` if common issue

### File Naming Conventions

- `UPPERCASE.md` - Critical system files
- `lowercase-kebab.md` - Regular documentation
- `day#-description.md` - Daily records
- `backend-*/frontend-*` - Role-specific tasks

### Archive Policy

**Keep Forever**:
- All files in `lessons/`
- `CLAUDE.md`, `DEBUGGING-PRINCIPLES.md`
- Completed task files with important learnings

**Archive After 30 Days**:
- Daily files (`day*-*.md`)
- Session context files
- Completed task files

**Can Delete**:
- Duplicate or superseded documents
- Empty or abandoned plans
- Test/temporary documentation

## 🔍 Quick Links

### Current Active Work
- [Current System State](./CURRENT-STATE.md)
- [Active Work Log](./ACTIVE-WORK-LOG.md)
- [Current Blockers](./blockers-and-issues.md)
- [Latest Task](./tasks/CONVERSATION-WINDOW-IMPLEMENTATION.md)

### Most Referenced
- [Debugging Principles](./DEBUGGING-PRINCIPLES.md)
- [Quick Reference](./lessons/QUICK-REFERENCE.md)
- [Collaboration Guide](./CLAUDE-COLLABORATION-GUIDE.md)

### Reports
- [Latest Progress](./progress-reports.md)
- [Changelog](./CHANGELOG.md)
- [Tech Debt](./tech-debt-tracker.md)

## 📊 Statistics
- **Total Documentation Files**: 100+
- **Active Task Files**: 15
- **Lessons Learned**: 5
- **Progress Reports**: 10+
- **Days of Development**: 27

---

*This index is the source of truth for documentation organization. Update this file when adding new documentation categories.*