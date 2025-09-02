# Frontend Day 4 Tasks - LeadHarvest CRM

Date: 2025-07-17
Claude: Frontend Developer (Claude 3)

## 🔴 Priority 1: Fix Jest Configuration

### Task: Resolve Jest preset error
**File**: `/frontend/jest.config.js`

**Error**: "Module next/jest should have jest-preset.js"
**Solution approach**:
1. Check if `next/jest` is properly installed
2. Update jest.config.js to use correct preset
3. Verify all test dependencies are installed
4. Run `npm test` to confirm fix

**Alternative if needed**:
```javascript
// Try using direct configuration instead of preset
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // ... rest of config
}
```

**Success criteria**: `npm test` runs without configuration errors

---

## 🟡 Priority 2: Complete Conversations Integration

### Task 1: Connect Conversation Components to API
**Update**: `/frontend/src/components/conversations/ConversationHistory.tsx`

Connect to backend endpoints:
- `GET /api/leads/:leadId/conversations` - Fetch messages
- `POST /api/leads/:leadId/conversations` - Send message

### Task 2: Implement Message Sending
**Update**: `/frontend/src/components/conversations/MessageForm.tsx`

Features:
- Form submission calls API
- Optimistic updates (show message immediately)
- Error handling with retry option
- Clear form after successful send

### Task 3: Update Conversations Page
**Update**: `/frontend/src/app/conversations/page.tsx`

Implement:
- Lead selection from list
- Auto-refresh every 30 seconds
- Show message count badges
- Handle empty states

### Task 4: Update API Client
**Update**: `/frontend/src/lib/api-client.ts`

Add methods:
```typescript
conversations: {
  getByLeadId: (leadId: string) => Promise<ConversationResponse>
  addMessage: (leadId: string, message: MessageInput) => Promise<Message>
  updateMessage: (id: string, updates: Partial<Message>) => Promise<Message>
}
```

---

## 🟢 Priority 3: Gmail Integration UI

### Task 1: Create Gmail Settings Page
**Create**: `/frontend/src/app/settings/gmail/page.tsx`

Features:
- Connect/disconnect Gmail button
- Show connection status
- Display last sync time
- Show email account connected

### Task 2: Build Gmail Connection Component
**Create**: `/frontend/src/components/gmail/GmailConnect.tsx`

Implement:
- OAuth flow trigger button
- Loading state during auth
- Success/error messages
- Redirect handling from OAuth callback

### Task 3: Create Batch Processor UI
**Create**: `/frontend/src/components/gmail/BatchProcessor.tsx`

Features:
- "Process 4000+ emails" button with confirmation
- Progress bar showing X of Y processed
- Error summary if any fail
- Pause/resume controls
- Time estimate display

### Task 4: Add Gmail Types
**Update**: `/frontend/src/types/index.ts`

Add types:
```typescript
interface GmailConnection {
  isConnected: boolean
  email?: string
  lastSync?: string
}

interface BatchProcess {
  id: string
  total: number
  processed: number
  failed: number
  status: 'running' | 'paused' | 'completed' | 'failed'
}
```

---

## 📋 Testing Requirements

1. Fix existing test suite first
2. Add tests for new conversation features
3. Test Gmail components (at least mounting/rendering)
4. Verify error states are handled

---

## 🎯 Deliverables Checklist

- [ ] Jest configuration fixed, all tests passing
- [ ] Conversations fully integrated with backend
- [ ] Can send and receive messages in UI
- [ ] Gmail settings page created
- [ ] OAuth connection flow working
- [ ] Batch processor UI ready
- [ ] All new components have basic tests

---

## 🎨 UI/UX Guidelines

### Gmail Connection
- Clear CTA: "Connect Gmail Account"
- Security notice: "We only access emails labeled 'processed-lead'"
- Success state: Show connected email address

### Batch Processing
- Warning modal: "This will process 4000+ emails. Continue?"
- Real-time progress with percentage
- Estimated time remaining
- Clear error messages with retry options

### Conversations
- Message bubbles (sent right, received left)
- Timestamps on hover
- "Sending..." state for optimistic updates
- Auto-scroll to newest message

---

## 📝 Documentation Updates

Update these files:
- `/docs/progress-reports.md` - Under "Frontend Team Progress"
- `/docs/collaboration-status.md` - New component locations

---

## 🔄 Integration Points

Coordinate with Backend (Claude 2) on:
1. Conversation API response format
2. Gmail OAuth URL structure
3. Batch processing status format

Check `/docs/tasks/backend-day4.md` for their tasks.

---

## 🚨 If Blocked

1. Document in `/docs/progress-reports.md`
2. Tag "Backend Team" for API issues
3. Try alternative approaches
4. Move to next task if truly blocked

Update progress twice daily!