# Day 4 Assignments - LeadHarvest CRM

Date: 2025-07-17

## 🎯 Day 4 Goals

Focus on Gmail integration and preparing for the 4000+ email migration. Fix critical test failures and complete integration between frontend and backend.

---

## Backend Team (Claude 2)

### Priority 1: Fix Test Failures 🔴
**Location**: `/backend/src/services/__tests__/leadService.unit.test.js`
- Fix 12 failing tests related to mocking issues
- Ensure all unit tests pass with proper mocks
- Target: 100% test pass rate

### Priority 2: Complete Gmail Integration 🟡
**Files to modify**:
- `/backend/src/controllers/gmailController.js`
- `/backend/src/services/gmailService.js` (create new)

**Tasks**:
1. Implement OAuth token storage and refresh
2. Create Gmail API client with proper authentication
3. Implement message fetching with batch support
4. Add webhook signature verification
5. Create endpoint: `POST /api/gmail/process-batch` for bulk processing

### Priority 3: Email Processing Pipeline 🟢
**Files to enhance**:
- `/backend/src/services/emailParsingService.js`
- `/backend/src/controllers/leadController.js`

**Tasks**:
1. Add batch processing support (process array of emails)
2. Implement progress tracking for large batches
3. Add error recovery and retry logic
4. Create processing queue to handle 4000+ emails
5. Add endpoint: `GET /api/processing/status` for batch status

### Deliverables:
- [ ] All backend tests passing
- [ ] Gmail OAuth flow complete with token refresh
- [ ] Batch processing endpoint ready
- [ ] Can process 100 emails without errors

---

## Frontend Team (Claude 3)

### Priority 1: Fix Jest Configuration 🔴
**Location**: `/frontend/jest.config.js` and `/frontend/package.json`
- Fix "Module next/jest should have jest-preset.js" error
- Ensure all tests run successfully
- Verify coverage reporting works

### Priority 2: Complete Conversations Integration 🟡
**Files to modify**:
- `/frontend/src/app/conversations/page.tsx`
- `/frontend/src/components/conversations/ConversationHistory.tsx`
- `/frontend/src/lib/api-client.ts`

**Tasks**:
1. Connect to backend conversations API endpoints
2. Implement real-time message sending
3. Add loading states for message operations
4. Handle errors gracefully with user feedback
5. Test full conversation flow (view → send → refresh)

### Priority 3: Gmail Integration UI 🟢
**New files to create**:
- `/frontend/src/app/settings/gmail/page.tsx`
- `/frontend/src/components/gmail/GmailConnect.tsx`
- `/frontend/src/components/gmail/BatchProcessor.tsx`

**Tasks**:
1. Create Gmail connection page with OAuth button
2. Show connection status and last sync time
3. Build batch processing UI with progress bar
4. Add email processing history table
5. Create "Process 4000+ emails" button with confirmation

### Deliverables:
- [ ] All frontend tests passing
- [ ] Conversations fully integrated with backend
- [ ] Gmail connection UI complete
- [ ] Batch processing UI ready

---

## Integration Team (Claude 1 - Orchestrator)

### Priority 1: Test Full Integration 🔴
1. Verify leads API works end-to-end
2. Test conversation creation and display
3. Document any API contract mismatches
4. Create integration test checklist

### Priority 2: Prepare Migration Plan 🟡
**Create**: `/docs/data-migration-plan.md`
1. Design batch processing strategy for 4000+ emails
2. Calculate processing time estimates
3. Plan for error handling and retries
4. Create rollback strategy

### Priority 3: Auto-Reply System Design 🟢
**Create**: `/docs/auto-reply-architecture.md`
1. Design template management system
2. Plan trigger conditions (missing info detection)
3. Design template variable system
4. Plan Gmail send integration

---

## Collaboration Points

### Backend ↔ Frontend
1. **Conversations API Contract**
   - Endpoint: `GET /api/leads/:leadId/conversations`
   - Response format must match frontend expectations
   
2. **Gmail OAuth Flow**
   - Backend provides: `GET /api/gmail/auth-url`
   - Frontend redirects to URL, backend handles callback

3. **Batch Processing Status**
   - Backend: WebSocket or polling endpoint
   - Frontend: Progress bar updates

### All Teams
- Update `/docs/progress-reports.md` with your progress
- Update `/docs/collaboration-status.md` if you create new files
- Check for integration issues before end of day

---

## Success Metrics

1. **Tests**: All tests passing in both backend and frontend
2. **Integration**: Can create lead → view lead → add conversation → see update
3. **Gmail**: OAuth flow works, can fetch user's emails
4. **Performance**: Can process 100 emails in under 1 minute

## Blockers Protocol

If blocked:
1. Document in `/docs/progress-reports.md`
2. Update `/docs/collaboration-status.md` with issue
3. Tag the blocking team in your update
4. Suggest potential solutions

Remember: Always use exact file paths from `/docs/collaboration-status.md`!