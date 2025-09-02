# Lead Management Features - Task Delegation
**Created**: 2025-08-09 15:00 by Backend Claude
**Purpose**: Add bulk operations and improve lead display for LeadHarvest CRM
**Status**: 🚀 Implementation Phase

## 📊 Current Issues
1. **Only showing 20 leads** - Frontend hardcoded to limit: 20 (should show 50+)
2. **No bulk operations** - Can only delete one lead at a time
3. **No selection UI** - Missing checkboxes and multi-select functionality
4. **Database has 50+ leads** - But UI only displays 20

## 🎯 Feature Requirements
User wants a "Manage" button on leads page with:
- Add lead manually (already exists)
- Select individual leads (checkboxes)
- Select all leads
- Delete selected leads (bulk operation)
- Display all 50+ leads (not just 20)

---

## 📋 TASK ASSIGNMENTS

### 🔧 Backend Tasks (Claude 2 - Current Session)
**Time**: 2 hours
**Priority**: HIGH - Start immediately
**File**: `/docs/tasks/backend-bulk-operations.md`

#### Core Tasks:
1. **Bulk Delete Endpoint** ✅
   - POST `/api/leads/bulk-delete`
   - Accept array of lead IDs
   - Return success/failure counts
   - Handle partial failures gracefully

2. **Pagination Improvements** ✅
   - Support limit=50, 100, all
   - Return total count in response
   - Optimize query performance

3. **Safety & Validation** ✅
   - Transaction support for atomicity
   - Permission validation
   - Detailed error responses

**Deliverables**:
- Working bulk delete API
- Test script for verification
- Updated API documentation

---

### 🎨 Frontend Tasks (Claude 3)
**Time**: 3 hours
**Priority**: HIGH - Start after Backend API ready
**File**: `/docs/tasks/frontend-selection-ui.md`

#### Core Tasks:
1. **Fix Display Limit** (Quick - 15 min)
   - Change default from 20 to 50
   - Add limit selector dropdown

2. **Selection UI** (1.5 hours)
   - Add checkbox to each LeadCard
   - Implement "Select All" functionality
   - Track selected IDs in state
   - Show selection count

3. **Management Toolbar** (1 hour)
   - Create new toolbar component
   - Bulk actions (Delete Selected)
   - Integration with backend API

4. **Bulk Delete Flow** (30 min)
   - Confirmation dialog
   - API integration
   - Success/error handling
   - UI refresh after deletion

**Deliverables**:
- Working selection UI
- Bulk delete functionality
- All 50+ leads visible

---

### 🎯 Integration & Testing (Claude 1 - Orchestrator)
**Time**: 1 hour
**Priority**: MEDIUM - After both implementations complete
**File**: `/docs/tasks/orchestrator-integration-testing.md`

#### Core Tasks:
1. **Integration Testing**
   - Test bulk operations with 50+ leads
   - Verify UI updates correctly
   - Check error handling

2. **API Documentation**
   - Document new endpoints
   - Update API examples
   - Create usage guide

3. **Quality Assurance**
   - Performance testing with large datasets
   - Edge case validation
   - Cross-browser testing

**Deliverables**:
- Test report
- API documentation
- Deployment checklist

---

## 🔄 Coordination Points

### Checkpoint 1: Backend API Ready (T+2 hours)
- Backend Claude posts in AGENT-COMMUNICATION-LOG.md
- Provides API endpoint details
- Shares test commands

### Checkpoint 2: Frontend UI Complete (T+5 hours)
- Frontend Claude posts completion status
- Requests integration testing
- Reports any API issues

### Checkpoint 3: Integration Complete (T+6 hours)
- Orchestrator runs full test suite
- Documents any issues found
- Approves for deployment

---

## 📁 Files to Modify/Create

### Backend Files:
```
/backend/src/routes/leadRoutes.js         - Add bulk delete route
/backend/src/controllers/leadController.js - Add bulk delete controller
/backend/src/services/leadService.js      - Add bulk delete service
/backend/src/models/leadModel.js          - Add bulk delete query
/backend/test-bulk-delete.js              - NEW: Test script
```

### Frontend Files:
```
/frontend/src/app/leads/page.tsx          - Selection state, pagination
/frontend/src/components/leads/LeadCard.tsx - Add checkbox
/frontend/src/components/leads/LeadManagementToolbar.tsx - NEW: Toolbar
/frontend/src/lib/api-client.ts           - Add bulk delete call
/frontend/src/types/index.ts              - Add selection types
```

---

## 🚀 Implementation Timeline

```
Hour 0-2:   Backend implements bulk delete API
Hour 2-2.5: Backend testing & documentation
Hour 2.5:   Backend posts API ready signal
Hour 2.5-5: Frontend implements UI changes
Hour 5-5.5: Frontend testing
Hour 5.5-6: Integration testing by Orchestrator
Hour 6:     Feature complete and tested
```

---

## 📝 Communication Protocol

1. **Use AGENT-COMMUNICATION-LOG.md** for status updates
2. **Update ACTIVE-WORK-LOG.md** after completing tasks
3. **Report blockers in blockers-and-issues.md**
4. **Tag relevant Claude in messages** (@Backend, @Frontend, @Orchestrator)

---

## ✅ Success Criteria

The feature is complete when:
- [ ] User can see all 50+ leads (not just 20)
- [ ] User can select individual leads with checkboxes
- [ ] User can select all leads at once
- [ ] User can delete multiple selected leads
- [ ] Confirmation dialog prevents accidental deletion
- [ ] UI updates immediately after bulk operations
- [ ] Error handling for partial failures
- [ ] Performance remains good with 100+ leads

---

## 🔥 Current Status

**Backend Claude (Claude 2)**: Starting implementation NOW
**Frontend Claude (Claude 3)**: Waiting for backend API
**Orchestrator (Claude 1)**: Monitoring progress

---

## 💬 Notes

- Backend should prioritize bulk delete endpoint first
- Frontend can start on selection UI while waiting for API
- Use existing patterns from codebase
- Keep it simple - "Toyota not BMW" philosophy
- Test with actual data (50+ leads in database)

---

END OF DELEGATION