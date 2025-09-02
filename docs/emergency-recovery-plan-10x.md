# Emergency Recovery Plan: Getting to 10/10 Production Ready
**Date**: 2025-08-08  
**Current Status**: 3/10 (Backend limping, Frontend dead, NPM broken)  
**Target**: 10/10 Production Ready Application  
**Timeline**: 4-6 hours with parallel execution

## Critical Issue: NPM on WSL
The root cause of all problems is NPM hanging on Windows filesystem (`/mnt/c/`). We need to work around this completely.

## PARALLEL EXECUTION PLAN

### Claude 1 (Orchestrator) - System Infrastructure
**START IMMEDIATELY**

#### Task 1: Fix NPM Infrastructure (1 hour)
```bash
# Move entire project to Linux filesystem
cp -r /mnt/c/Users/12158/LeadHarvest ~/LeadHarvest-Fixed
cd ~/LeadHarvest-Fixed

# Install all dependencies in Linux filesystem
cd backend && npm install
cd ../frontend && npm install

# Create sync script to copy back to Windows
cat > sync-to-windows.sh << 'EOF'
#!/bin/bash
rsync -av --exclude=node_modules ~/LeadHarvest-Fixed/ /mnt/c/Users/12158/LeadHarvest/
EOF
```

#### Task 2: Docker Alternative (Parallel)
Create Docker containers if Linux filesystem fails:
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports: 
      - "3001:3001"
    environment:
      - DATABASE_URL=${DATABASE_URL}
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
```

#### Task 3: Production Deployment Prep
- Set up environment variables properly
- Create startup scripts
- Document all endpoints
- Create health monitoring

---

### Claude 2 (Backend) - Fix Backend Properly
**START IMMEDIATELY**

#### Task 1: Restore Proper Express Server (1 hour)
1. **Stop using workarounds** - Wait for Claude 1's NPM fix
2. **Restore original server.js**:
```javascript
// Use actual packages once NPM is fixed
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcrypt'); // Not bcryptjs
const { createClient } = require('@supabase/supabase-js');
const { google } = require('googleapis');
```

#### Task 2: Complete Missing Features (2 hours)
Priority order:
1. **Gmail Webhook** - Implement real webhook handler
2. **Auto-reply System** - Template-based responses
3. **OpenPhone Integration** - SMS functionality
4. **Lead Deduplication** - Phone-based dedup logic
5. **Conversation Aggregation** - Unified email/SMS view

#### Task 3: API Hardening (1 hour)
- Add proper error handling
- Implement rate limiting
- Add request validation
- Set up proper logging
- Add JWT authentication

#### Task 4: Testing Suite
```bash
# Create comprehensive tests
npm test -- --coverage
# Must achieve >80% coverage
```

---

### Claude 3 (Frontend) - Rebuild Frontend Completely
**START IMMEDIATELY**

#### Task 1: Emergency Static Build (30 min)
While waiting for NPM fix, create static HTML version:
```html
<!-- emergency-ui.html -->
<!DOCTYPE html>
<html>
<head>
    <title>LeadHarvest Emergency UI</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
    <div id="root"></div>
    <script>
        // Pure React app without build tools
        const App = () => {
            // Implement lead list, forms, etc.
        }
    </script>
</body>
</html>
```

#### Task 2: Restore Next.js App (2 hours)
Once NPM is fixed:
1. **Install all dependencies properly**
2. **Fix all TypeScript errors**
3. **Implement missing pages**:
   - `/leads` - Lead list with filtering
   - `/leads/[id]` - Lead details with conversations
   - `/gmail/import` - Gmail import UI
   - `/settings/templates` - Auto-reply templates

#### Task 3: UI Polish (1 hour)
- Mobile responsiveness
- Loading states
- Error boundaries
- Toast notifications
- Form validation

#### Task 4: Integration Testing
- Test all API endpoints
- Verify Gmail import flow
- Test lead creation/editing
- Verify conversation display

---

## COORDINATION POINTS

### Checkpoint 1 (After 1 hour)
All Claudes report status:
- Claude 1: NPM infrastructure status
- Claude 2: Backend restoration progress  
- Claude 3: Emergency UI availability

### Checkpoint 2 (After 2 hours)
- Claude 1: Provides working node_modules to others
- Claude 2: Provides API documentation to Claude 3
- Claude 3: Shows UI mockups for review

### Checkpoint 3 (After 3 hours)
- Integration testing begins
- All Claudes test cross-component functionality

---

## SUCCESS CRITERIA FOR 10/10

### Backend (Claude 2)
- [ ] Express server with all proper dependencies
- [ ] All 5 email parsers working (Zillow, Realtor, etc.)
- [ ] Gmail webhook receiving real-time updates
- [ ] Auto-reply system sending templates
- [ ] Lead deduplication by phone
- [ ] Conversation aggregation working
- [ ] All endpoints documented
- [ ] >80% test coverage

### Frontend (Claude 3)
- [ ] Next.js running with all dependencies
- [ ] Lead list with search/filter
- [ ] Lead details with conversations
- [ ] Gmail import interface
- [ ] Auto-reply template management
- [ ] Mobile responsive
- [ ] Real-time updates working
- [ ] No console errors

### Infrastructure (Claude 1)
- [ ] NPM working properly
- [ ] Both servers starting cleanly
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Monitoring in place
- [ ] Documentation complete
- [ ] Deployment ready

---

## EMERGENCY FALLBACK PLAN

If NPM absolutely cannot be fixed:
1. **Use CDN versions** of all packages
2. **Build a single-file Node.js server** with embedded dependencies
3. **Create static HTML frontend** with vanilla JavaScript
4. **Deploy to cloud** where NPM works (Heroku, Vercel, etc.)

---

## DELEGATION INSTRUCTIONS

### To Claude 1 (Orchestrator)
1. Read this plan at `/docs/emergency-recovery-plan-10x.md`
2. Execute infrastructure tasks immediately
3. Fix NPM by moving to Linux filesystem
4. Coordinate checkpoints every hour
5. Report: `/docs/progress-reports/infrastructure-recovery.md`

### To Claude 2 (Backend)
1. Read this plan at `/docs/emergency-recovery-plan-10x.md`
2. Start with Task 1 - prepare for proper Express
3. Document all API changes
4. Coordinate with Claude 3 on endpoints
5. Report: `/docs/progress-reports/backend-recovery.md`

### To Claude 3 (Frontend)
1. Read this plan at `/docs/emergency-recovery-plan-10x.md`
2. Create emergency UI immediately
3. Prepare for Next.js restoration
4. Coordinate with Claude 2 on API integration
5. Report: `/docs/progress-reports/frontend-recovery.md`

---

## Timeline
- **Hour 1**: NPM fix + Emergency UI + Backend prep
- **Hour 2**: Full restoration begins
- **Hour 3**: Feature completion
- **Hour 4**: Integration testing
- **Hour 5**: Polish and optimization
- **Hour 6**: Final testing and documentation

**LET'S GET TO 10/10! 🚀**