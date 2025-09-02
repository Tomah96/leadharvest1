# Frontend Day 5 Tasks - Gmail Integration Testing UI

Date: 2025-07-17
Claude: Frontend Developer (Claude 3)

## 🔴 Priority 1: Fix OAuth Redirect Handling

### Task: Update Gmail OAuth Flow
**File**: `/frontend/src/components/gmail/GmailConnect.tsx`

The backend redirect URI is now port 3001, but OAuth will redirect to:
`http://localhost:3001/api/gmail/auth-callback?code=...&state=...`

After backend processes, it should redirect back to frontend. Add:
```typescript
// Add to the OAuth success page route
// Create: /frontend/src/app/gmail/success/page.tsx
// This page shows "Gmail connected successfully!"
```

Update the OAuth window monitoring to handle the redirect properly.

---

## 🟡 Priority 2: Create Gmail Test Dashboard

### Task 1: Create Test Page
**Create**: `/frontend/src/app/test/gmail/page.tsx`

Build a test dashboard that shows:
1. Connection status (connected/disconnected)
2. Button to test connection
3. Button to fetch processed leads
4. Results display area
5. Console output display (for debugging)

```typescript
export default function GmailTestPage() {
  // States:
  // - connectionStatus
  // - testResults
  // - loading states
  // - console logs
  
  // Actions:
  // - Test Connection button
  // - Fetch Processed Leads button
  // - Clear Results button
}
```

### Task 2: Add Test API Methods
**Update**: `/frontend/src/lib/api-client.ts`

Add test endpoints:
```typescript
gmail: {
  // ... existing methods
  testConnection: () => get<TestConnectionResponse>('/api/gmail/test-connection'),
  testProcessedLeads: () => get<TestProcessedLeadsResponse>('/api/gmail/test-processed-leads'),
}
```

### Task 3: Create Test Types
**Update**: `/frontend/src/types/index.ts`

```typescript
interface TestConnectionResponse {
  connected: boolean;
  message?: string;
  labelsCount?: number;
  hasProcessedLeadLabel?: boolean;
}

interface TestProcessedLeadsResponse {
  totalEmails: number;
  results: Array<{
    subject: string;
    from: string;
    date: string;
    source: string;
    parsed: 'success' | 'failed';
  }>;
  sources: {
    zillow: number;
    realtor: number;
    apartments: number;
    rentmarketplace: number;
    unknown: number;
  };
}
```

---

## 🟢 Priority 3: Build Test Results Display

### Task 1: Create Results Component
**Create**: `/frontend/src/components/gmail/TestResults.tsx`

Display test results in a clear, organized way:
```typescript
interface TestResultsProps {
  results: TestProcessedLeadsResponse | null;
  connectionStatus: TestConnectionResponse | null;
}

// Show:
// - Connection status with green/red indicator
// - Email source breakdown (pie chart or bars)
// - Sample emails table
// - Parse success rate
// - Unknown emails for investigation
```

### Task 2: Add Console Output Component
**Create**: `/frontend/src/components/gmail/ConsoleOutput.tsx`

Mirror backend console logs in the UI:
```typescript
// Simulated console output showing:
// - OAuth flow steps
// - Label detection
// - Email fetching progress
// - Parsing results
// Style like a terminal with monospace font
```

### Task 3: Update Navigation
**Update**: `/frontend/src/components/layout/Sidebar.tsx`

Add temporary test link:
```typescript
// Add under Settings
{process.env.NODE_ENV === 'development' && (
  <Link href="/test/gmail" className="sidebar-link">
    <TestTube className="w-4 h-4" />
    Gmail Test
  </Link>
)}
```

---

## 🎨 UI Design Guidelines

### Test Dashboard Layout
```
┌─────────────────────────────────────┐
│ Gmail Integration Test Dashboard    │
├─────────────────────────────────────┤
│ Connection Status: ● Connected      │
│ Email: user@gmail.com               │
│                                     │
│ [Test Connection] [Fetch Emails]    │
├─────────────────────────────────────┤
│ Results:                            │
│ ┌─────────────┬─────────────┐      │
│ │ Source      │ Count       │      │
│ ├─────────────┼─────────────┤      │
│ │ Zillow      │ 3           │      │
│ │ Realtor     │ 2           │      │
│ │ Apartments  │ 4           │      │
│ │ Unknown     │ 1           │      │
│ └─────────────┴─────────────┘      │
├─────────────────────────────────────┤
│ Console Output:                     │
│ > Testing Gmail connection...       │
│ > Found 23 labels                   │
│ > Located "processed-lead" label    │
│ > Fetching emails...                │
│ > Processing 10 emails              │
│ > Complete!                         │
└─────────────────────────────────────┘
```

### Visual Indicators
- Green dot for connected
- Red dot for disconnected
- Loading spinners during operations
- Success/error toast messages

---

## 📋 Testing Steps

1. **Start frontend**: `npm run dev`
2. **Navigate to**: http://localhost:3000/test/gmail
3. **Connect Gmail**: Click through OAuth flow
4. **Test connection**: Verify label detection
5. **Fetch emails**: See parsed results
6. **Check console**: Verify all data displays correctly

---

## 🎯 Deliverables Checklist

- [ ] OAuth redirect handling fixed
- [ ] Test dashboard page created
- [ ] API methods for test endpoints added
- [ ] Results display component working
- [ ] Console output visualization
- [ ] Navigation link added (dev only)
- [ ] All data displays correctly

---

## 🔄 Integration with Backend

Coordinate with Backend (Claude 2) on:
1. OAuth redirect flow
2. Test endpoint response formats
3. Error message formats
4. Console log information to display

The backend will provide:
- `/api/gmail/test-connection` - Connection status
- `/api/gmail/test-processed-leads` - Email samples

Your UI should clearly show:
- What's working ✅
- What's not working ❌
- Parse success rates
- Unknown email patterns

---

## 🚨 Success Criteria

The test page should answer:
1. ✅ Is Gmail connected?
2. ✅ Can we find the "processed-lead" label?
3. ✅ How many emails are there?
4. ✅ What sources are detected?
5. ✅ What's the parse success rate?
6. ✅ Which emails couldn't be parsed?

This gives us confidence before importing 4000+ emails!