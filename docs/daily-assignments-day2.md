# Daily Assignments - LeadHarvest CRM - Day 2

## Date: 2025-07-17

### Backend Team - Day 2 Tasks

**Priority 1: Core Lead Management API**

1. **Implement Lead CRUD Endpoints**
   ```
   POST   /api/leads         - Create/update lead (with phone deduplication)
   GET    /api/leads         - List leads with pagination, search, filters
   GET    /api/leads/:id     - Get single lead details
   PATCH  /api/leads/:id     - Update lead status, notes
   DELETE /api/leads/:id     - Soft delete lead
   ```

2. **Lead Service Implementation**
   - Create `src/services/leadService.js` with business logic
   - Implement phone-based deduplication (upsert by phone)
   - Add search functionality (name, phone, email, property)
   - Filter by: status, source, missing_info, date range
   - Pagination with limit/offset

3. **Supabase Integration**
   - Create `src/models/leadModel.js` for database queries
   - Use Supabase client for all operations
   - Handle PGRST errors properly
   - Implement transaction support for upserts

**Priority 2: Gmail Webhook Foundation**

1. **Create Gmail Webhook Endpoint**
   ```
   POST /api/gmail/webhook   - Receive Gmail push notifications
   GET  /api/gmail/auth-url  - Get OAuth consent URL
   GET  /api/gmail/auth-callback - Handle OAuth callback
   ```

2. **Webhook Security**
   - Verify Google push notification signatures
   - Store webhook registration details
   - Queue incoming emails for processing

**Priority 3: Testing Setup**

1. **Add Jest Testing Framework**
   - Configure Jest for Node.js
   - Create test structure
   - Write tests for lead deduplication logic
   - Test API endpoints with supertest

**Deliverables for Day 2**
- [ ] Working leads API with all CRUD operations
- [ ] Phone-based deduplication functioning
- [ ] Search and filter capabilities
- [ ] Gmail webhook endpoint ready
- [ ] At least 5 unit tests passing

**Notes**
- Use transactions for lead upserts to prevent race conditions
- Return consistent error responses per API contract
- Update progress throughout the day
- Document any Supabase gotchas in knowledge-base.md

---

### Frontend Team - Day 2 Tasks

**Priority 1: Backend Integration**

1. **Connect to Real Backend API**
   - Update API client to use actual endpoints
   - Remove mock data from dashboard
   - Implement real data fetching in leads page
   - Handle loading and error states

2. **Lead Management Features**
   - Implement lead creation form (modal or page)
   - Add inline status update functionality
   - Enable search with debouncing
   - Make filters functional with API calls
   - Add pagination controls

3. **Real-time Updates**
   - Set up polling for new leads (every 30s)
   - Show notification badge for new leads
   - Update lead counts in real-time

**Priority 2: Lead Detail View**

1. **Create Lead Detail Page**
   - Route: `/leads/[id]`
   - Display all lead information
   - Show conversation placeholder
   - Add status update controls
   - Include "Add Note" functionality

2. **Missing Info Highlighting**
   - Visual indicators for missing fields
   - Quick action to send auto-reply
   - Show template preview

**Priority 3: Form Validation**

1. **Add React Hook Form**
   - Install and configure
   - Create validation schemas
   - Implement for lead creation
   - Add for settings forms

**Deliverables for Day 2**
- [ ] Leads page showing real data from backend
- [ ] Working search, filters, and pagination
- [ ] Lead creation form with validation
- [ ] Lead detail page with full information
- [ ] Loading and error states throughout

**Notes**
- Test with backend running on port 3001
- Handle API errors gracefully
- Update types based on actual API responses
- Document any integration issues

---

## Integration Testing Plan

Once both teams complete their tasks:

1. **End-to-End Lead Creation**
   - Frontend creates lead → Backend deduplicates → Frontend updates

2. **Search and Filter Testing**
   - Test all filter combinations
   - Verify pagination works correctly

3. **Error Handling**
   - Test network failures
   - Test validation errors
   - Test unauthorized access

4. **Performance Testing**
   - Load 100+ mock leads
   - Test search responsiveness
   - Check pagination performance

---

## Coordination Notes

- Backend team should complete leads API by midday for frontend integration
- Frontend should start with API client updates while waiting
- Both teams should communicate through blockers-and-issues.md
- Test integration points as soon as they're ready
- Update CHANGELOG.md with completed features

## End of Day Checklist
- [ ] Backend: All leads endpoints working and tested
- [ ] Frontend: Successfully fetching and displaying real data
- [ ] Integration: Can create, search, and update leads
- [ ] Documentation: Progress reports updated
- [ ] Testing: At least 10 tests written between both teams