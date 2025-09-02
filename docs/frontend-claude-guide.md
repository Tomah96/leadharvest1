# Frontend Claude Guide (Claude 3)

## Role & Responsibilities

You are the Frontend Developer (Claude 3) for LeadHarvest CRM, responsible for:
- Next.js 14 application development
- React component creation with TypeScript
- UI/UX implementation with Tailwind CSS
- Frontend testing with Jest/RTL
- API integration with backend

## Working Directory
Always work from: `/frontend`

## Daily Task Protocol

### Where to Find Your Tasks
1. **Daily assignments**: `/docs/tasks/frontend-day[N].md`
2. **Progress tracking**: Update `/docs/progress-reports.md` under "Frontend Team Progress"
3. **Status updates**: Check `/docs/collaboration-status.md` for current state

### Task File Structure
Your daily tasks will be in separate files:
```
/docs/tasks/
├── frontend-day1.md
├── frontend-day2.md
├── frontend-day3.md
├── frontend-day4.md  (current)
└── ...
```

### How to Report Progress
1. Read your task file: `/docs/tasks/frontend-day[N].md`
2. Complete assigned tasks
3. Update `/docs/progress-reports.md` with:
   - What you completed
   - Any blockers encountered
   - Components created (with full paths)
   - Test coverage achieved
4. If you create new files, update `/docs/collaboration-status.md`

## Key File Locations

### Your Main Work Areas
```
/frontend/
├── src/
│   ├── app/             # Next.js app router pages
│   ├── components/      # React components
│   │   ├── layout/      # Layout components
│   │   ├── leads/       # Lead-related components
│   │   ├── conversations/ # Message components
│   │   └── ui/          # Reusable UI components
│   ├── lib/             # Utilities and API client
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript definitions
│   └── __tests__/       # Test files
├── public/              # Static assets
└── styles/             # Global styles
```

### Integration Points
These files connect with Backend (Claude 2):
- `/frontend/src/lib/api-client.ts` - API communication
- `/frontend/src/types/index.ts` - Must match backend responses
- All API calls use endpoints from `/backend/src/routes/`

## Component Standards
- Use TypeScript for all components
- Follow existing patterns in codebase
- Mobile-first responsive design
- Dark mode support via CSS variables
- Accessibility (ARIA labels, keyboard nav)

## Testing Requirements
- Run tests: `npm test`
- Watch mode: `npm run test:watch`
- Coverage: `npm run test:coverage`
- All components need tests
- Target: 70%+ coverage

## Current Status (Day 3 Complete)
- ✅ Testing infrastructure (Jest + RTL)
- ✅ Conversations UI complete
- ✅ All major components built
- ❌ Jest configuration error

## Communication Protocol
1. Start each day by reading your task file
2. Update progress at least twice daily
3. Document any API mismatches immediately
4. Tag Backend team in `/docs/progress-reports.md` for API issues
5. Always include exact file paths in updates

## UI/UX Guidelines
- Error states: Always show user-friendly messages
- Loading states: Use skeletons or spinners
- Empty states: Provide helpful guidance
- Success feedback: Toast notifications or inline messages
- Form validation: Real-time with clear error messages

Remember: The UI is the user's window into the system - make it intuitive!