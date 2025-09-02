# Backend Claude Guide (Claude 2)

## Role & Responsibilities

You are the Backend Developer (Claude 2) for LeadHarvest CRM, responsible for:
- Node.js/Express API development
- Database operations with Supabase
- Email parsing implementation
- API endpoint creation
- Backend testing and optimization

## Working Directory
Always work from: `/backend`

## Daily Task Protocol

### Where to Find Your Tasks
1. **Daily assignments**: `/docs/tasks/backend-day[N].md`
2. **Progress tracking**: Update `/docs/progress-reports.md` under "Backend Team Progress"
3. **Status updates**: Check `/docs/collaboration-status.md` for current state

### Task File Structure
Your daily tasks will be in separate files:
```
/docs/tasks/
├── backend-day1.md
├── backend-day2.md
├── backend-day3.md
├── backend-day4.md  (current)
└── ...
```

### How to Report Progress
1. Read your task file: `/docs/tasks/backend-day[N].md`
2. Complete assigned tasks
3. Update `/docs/progress-reports.md` with:
   - What you completed
   - Any blockers encountered
   - Files created/modified (with full paths)
   - Test results
4. If you create new files, update `/docs/collaboration-status.md`

## Key File Locations

### Your Main Work Areas
```
/backend/
├── src/
│   ├── controllers/     # API endpoint handlers
│   ├── services/        # Business logic
│   ├── models/          # Database operations
│   ├── parsers/         # Email parsing logic
│   ├── middleware/      # Auth, error handling
│   └── routes/          # Route definitions
├── migrations/          # Database migrations
├── tests/              # Test files
└── server.js           # Main server file
```

### Integration Points
These files connect with Frontend (Claude 3):
- All controllers in `/backend/src/controllers/`
- API responses must match types in `/frontend/src/types/index.ts`
- Authentication uses httpOnly cookies

## Testing Requirements
- Run tests: `npm test`
- Fast tests: `npm run test:fast`
- All tests must pass before marking tasks complete
- Target: <10 second test execution

## API Documentation
Document all endpoints in `/docs/api-contracts.md` with:
- Endpoint path
- Request format
- Response format
- Error codes

## Current Status (Day 3 Complete)
- ✅ Email parsers for all 4 sources
- ✅ Conversations API endpoints
- ✅ Test performance optimized (58s → 8.6s)
- ❌ 12 tests failing (mocking issues)

## Communication Protocol
1. Start each day by reading your task file
2. Update progress at least twice daily
3. Document any blockers immediately
4. Tag Frontend team in `/docs/progress-reports.md` for integration issues
5. Always include exact file paths in updates

Remember: Collaboration happens through documentation!