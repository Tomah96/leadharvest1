# Git Workflow Instructions

## For Backend Specialist Claude
```bash
# First time setup
cd /mnt/c/Users/12158/LeadHarvest
git config user.email "backend@leadharvest.local"
git config user.name "Backend Claude"
git checkout -b backend/initial-setup

# Work in your directory
cd backend/
# ... do your work ...

# Commit your changes
git add backend/
git commit -m "Backend: [description of changes]"

# Update documentation
git add docs/progress-reports.md
git commit -m "Backend: Update progress report"
```

## For Frontend Specialist Claude
```bash
# First time setup
cd /mnt/c/Users/12158/LeadHarvest
git config user.email "frontend@leadharvest.local"
git config user.name "Frontend Claude"
git checkout -b frontend/initial-setup

# Work in your directory
cd frontend/
# ... do your work ...

# Commit your changes
git add frontend/
git commit -m "Frontend: [description of changes]"

# Update documentation
git add docs/progress-reports.md
git commit -m "Frontend: Update progress report"
```

## Important Rules
1. NEVER commit directly to main branch
2. Always work in your feature branch
3. Only commit files in your designated directory
4. Exception: You can update docs/progress-reports.md and docs/blockers-and-issues.md
5. Use descriptive commit messages with your role prefix

## Branch Naming Convention
- backend/* - All backend feature branches
- frontend/* - All frontend feature branches
- integration/* - Orchestrator integration branches

The Orchestrator will handle merging branches into main.