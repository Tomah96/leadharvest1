# LeadHarvest CRM - Daily Assignments

## Date: 2025-07-16

### Backend Specialist Claude - Day 1 Tasks

**Priority: High**
1. **Initialize Backend Project**
   - Create Node.js project in `/backend` directory
   - Install core dependencies: express, cors, dotenv, pg (for Supabase)
   - Set up basic Express server structure with middleware
   - Create `server.js` with health check endpoint

2. **Supabase Database Connection**
   - Set up database connection using existing credentials in .env
   - Create database service module for connection pooling
   - Test connection with simple query

3. **Project Structure Setup**
   - Create folder structure: routes/, services/, middleware/, utils/
   - Set up environment variable configuration
   - Create basic error handling middleware

4. **Authentication Foundation**
   - Install bcryptjs and jsonwebtoken
   - Create auth middleware skeleton
   - Prepare for session-based authentication

**Update progress in docs/progress-reports.md after each major task**

---

### Frontend Specialist Claude - Day 1 Tasks

**Priority: High**
1. **Initialize Frontend Project**
   - Create Next.js 14 app in `/frontend` directory using App Router
   - Set up Tailwind CSS with custom configuration
   - Configure TypeScript support
   - Create basic folder structure

2. **Layout and Navigation**
   - Create root layout with sidebar navigation component
   - Design sidebar with: Leads, Conversations, Settings sections
   - Implement responsive design (mobile-friendly)
   - Use Lucide React for icons

3. **Leads Page Foundation**
   - Create `/leads` route and page component
   - Build LeadCard component structure (placeholder data)
   - Implement basic grid layout for lead cards
   - Add search bar and filter UI components

4. **API Client Setup**
   - Create API client utility for backend communication
   - Set up axios with base configuration
   - Prepare for authentication headers

**Update progress in docs/progress-reports.md after each major task**

---

## Coordination Notes
- Backend should prioritize health check endpoint so Frontend can test connectivity
- Both teams should commit to feature branches: `backend/initial-setup` and `frontend/initial-setup`
- API contracts will be defined tomorrow once basic structure is in place
- Focus on foundation - don't implement business logic yet

## End of Day Checklist
- [ ] Backend: Express server running on port 3001
- [ ] Backend: Supabase connection verified
- [ ] Frontend: Next.js app running on port 3000
- [ ] Frontend: Basic navigation and leads page visible
- [ ] Both: Progress updated in documentation