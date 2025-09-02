# Orchestrator Guide (Claude 1)

## Role & Responsibilities

The Orchestrator (Claude 1) coordinates all development efforts across the LeadHarvest project:

1. **Project Coordination**
   - Review daily progress from Backend (Claude 2) and Frontend (Claude 3) teams
   - Create and assign daily tasks based on project needs
   - Ensure integration between frontend and backend components
   - Track overall project progress and blockers

2. **Documentation Management**
   - Maintain this orchestrator guide
   - Update daily assignments
   - Consolidate progress reports
   - Ensure file paths are accurate and up-to-date

3. **Integration Testing**
   - Test API endpoints work correctly
   - Verify frontend-backend communication
   - Identify integration issues early

## Key File Locations

### Documentation Files
- `/docs/orchestrator-guide.md` - This file (Claude 1 instructions)
- `/docs/backend-claude-guide.md` - Backend team instructions (Claude 2)
- `/docs/frontend-claude-guide.md` - Frontend team instructions (Claude 3)
- `/docs/progress-reports.md` - Consolidated progress from all teams
- `/docs/daily-assignments-day[N].md` - Daily task assignments
- `/docs/collaboration-status.md` - Current status and file mappings

### Backend Files (Port 3001)
- `/backend/src/controllers/` - API endpoint controllers
- `/backend/src/services/` - Business logic services
- `/backend/src/models/` - Database models
- `/backend/src/parsers/` - Email parsing logic
  - `emailSourceDetector.js` - Detects email source
  - `zillowParser.js` - Zillow email parser
  - `realtorParser.js` - Realtor.com parser
  - `apartmentsParser.js` - Apartments.com parser
  - `rentMarketplaceParser.js` - RentMarketplace parser
- `/backend/src/services/emailParsingService.js` - Main parsing orchestrator

### Frontend Files (Port 3000)
- `/frontend/src/app/` - Next.js app router pages
- `/frontend/src/components/` - React components
  - `layout/Sidebar.tsx` - Navigation sidebar
  - `leads/LeadCard.tsx` - Lead display card
  - `conversations/ConversationHistory.tsx` - Message history
  - `conversations/MessageForm.tsx` - Message input form
- `/frontend/src/lib/api-client.ts` - API client configuration
- `/frontend/src/types/index.ts` - TypeScript definitions
- `/frontend/src/hooks/` - Custom React hooks

## Daily Workflow

1. **Start of Day**
   - Read progress reports from previous day
   - Check collaboration-status.md for current state
   - Test running applications (backend:3001, frontend:3000)
   - Identify blockers and integration issues

2. **Create Assignments**
   - Update daily-assignments-day[N].md with new tasks
   - Ensure file paths are specific and accurate
   - Assign priorities based on project needs
   - Update collaboration-status.md with task assignments

3. **Monitor Progress**
   - Check for updates in progress-reports.md
   - Test new features as they're implemented
   - Update documentation with any file changes
   - Coordinate between teams on integration points

4. **End of Day**
   - Consolidate progress reports
   - Update collaboration-status.md
   - Plan next day's priorities
   - Document any new blockers or changes

## Integration Points

Key areas requiring coordination:
1. **API Contracts** - Ensure frontend expects what backend provides
2. **Authentication** - JWT tokens in httpOnly cookies
3. **Conversations** - Backend API ↔ Frontend UI
4. **Email Processing** - Gmail webhook → Parser → Database → UI
5. **Real-time Updates** - Polling/webhooks for new data

## Current Project Status (Day 3 Complete)

### ✅ Completed Features
- Lead CRUD API with phone deduplication
- Email parsers for all 4 sources
- Conversations API and UI
- Testing infrastructure (Jest/RTL)
- Basic authentication structure

### 🚧 In Progress
- Gmail OAuth integration
- Auto-reply system
- Batch processing for 4000+ emails

### 📋 Upcoming
- Production deployment
- Real-time notifications
- OpenPhone SMS integration