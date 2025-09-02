# Backend Day 4 Tasks - LeadHarvest CRM

Date: 2025-07-17
Claude: Backend Developer (Claude 2)

## 🔴 Priority 1: Fix Test Failures

### Task: Fix 12 failing tests in leadService
**File**: `/backend/src/services/__tests__/leadService.unit.test.js`

**Issue**: Mocking problems with LeadModel methods
**Solution approach**:
1. Check mock setup in test file
2. Ensure LeadModel methods are properly mocked
3. Verify mock return values match expected format
4. Run `npm test leadService.unit.test.js` to verify

**Success criteria**: All 35 tests passing

---

## 🟡 Priority 2: Complete Gmail Integration

### Task 1: Create Gmail Service
**Create**: `/backend/src/services/gmailService.js`

```javascript
// Implement:
- OAuth token storage/refresh
- Gmail API client initialization
- Message fetching with pagination
- Batch message retrieval
- Label management
```

### Task 2: Enhance Gmail Controller
**Update**: `/backend/src/controllers/gmailController.js`

Add endpoints:
- `POST /api/gmail/token` - Store OAuth tokens
- `GET /api/gmail/messages` - Fetch messages with pagination
- `POST /api/gmail/process-batch` - Process multiple emails
- `GET /api/gmail/labels` - Get user's labels

### Task 3: Webhook Security
**Update**: `/backend/src/controllers/gmailController.js`

Implement:
- Signature verification for webhooks
- Request validation
- Proper error responses

---

## 🟢 Priority 3: Batch Processing Pipeline

### Task 1: Enhance Email Processing Service
**Update**: `/backend/src/services/emailParsingService.js`

Add methods:
```javascript
- processBatch(emails[]) - Process array of emails
- getProcessingStatus(batchId) - Check batch status
- retryFailedEmails(batchId) - Retry failures
```

### Task 2: Create Processing Queue
**Create**: `/backend/src/services/processingQueue.js`

Implement:
- In-memory queue for batch processing
- Progress tracking (X of Y completed)
- Error collection and retry logic
- Rate limiting (avoid API limits)

### Task 3: Add Status Endpoint
**Create**: `/backend/src/controllers/processingController.js`
**Update**: `/backend/src/routes/index.js`

Endpoints:
- `GET /api/processing/status/:batchId`
- `POST /api/processing/retry/:batchId`
- `GET /api/processing/history`

---

## 📋 Testing Requirements

1. Write tests for all new services
2. Ensure existing tests still pass
3. Add integration tests for Gmail flow
4. Test batch processing with 100 emails

---

## 🎯 Deliverables Checklist

- [ ] All 35 backend tests passing
- [ ] Gmail OAuth implementation complete
- [ ] Token refresh logic working
- [ ] Batch endpoint processes 100 emails successfully
- [ ] Processing status tracking functional
- [ ] Error recovery implemented
- [ ] All new code has tests

---

## 📝 Documentation Updates

Update these files with your changes:
- `/docs/progress-reports.md` - Add your progress under "Backend Team Progress"
- `/docs/collaboration-status.md` - Add new file locations
- `/docs/api-contracts.md` - Document new endpoints

---

## 🔄 Integration Points

Coordinate with Frontend (Claude 3) on:
1. Gmail OAuth URL format
2. Batch processing status response format
3. Error message standards

Check `/docs/tasks/frontend-day4.md` for their corresponding tasks.

---

## 🚨 If Blocked

1. Document the blocker in `/docs/progress-reports.md`
2. Tag "Frontend Team" if it's an integration issue
3. Suggest potential solutions
4. Continue with other tasks if possible

Remember: Update progress at least twice during the day!