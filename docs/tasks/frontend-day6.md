# Frontend Claude - Day 6 Tasks

## Priority 0: Fix Dashboard TypeError

### Context
The dashboard is throwing an error: `Cannot read properties of undefined (reading 'total')` at line 75 in `/frontend/src/app/page.tsx`. This happens when `leadsData.pagination` is undefined.

### Task
1. **Fix the undefined pagination error**
   - In `/frontend/src/app/page.tsx`, add proper null checking:
   ```typescript
   const totalLeads = leadsData?.pagination?.total || 0;
   ```
   - Ensure all pagination accesses are safely handled
   - Add defensive checks throughout the component

### Files to Modify
- `/frontend/src/app/page.tsx`

## Priority 1: Connect Gmail UI to Backend Endpoints

### Context
The Gmail UI components are built but need to connect to the backend's new test endpoints. The backend is adding database-optional mode and new Gmail test endpoints.

### Tasks

1. **Update API Client with New Endpoints**
   - In `/frontend/src/lib/api-client.ts`, add:
     ```typescript
     // Gmail test endpoints (no database required)
     searchLabels: (query: string) => 
       get(`/api/gmail/test/labels?q=${encodeURIComponent(query)}`),
     
     importEmails: (label: string, count: number) =>
       post('/api/gmail/test/import', { label, count }),
     
     parseEmail: (messageId: string) =>
       get(`/api/gmail/test/parse/${messageId}`),
     ```

2. **Update Components to Use Real Endpoints**
   - In `LabelSearch.tsx`: Replace mock search with `api.searchLabels()`
   - In `ImportControls.tsx`: Use `api.importEmails()` instead of test endpoint
   - Handle and display parsing results in console output

3. **Enhanced Console Output Display**
   - Parse and format the backend's console output:
     ```
     ===== PARSED EMAIL =====
     Source: Zillow
     Name: John Doe
     Phone: 555-1234
     Email: john@example.com
     Property: 123 Main St
     Move-in: 2024-02-01
     Missing Info: [credit_score, income]
     =======================
     ```
   - Color code by source (Zillow=blue, Realtor=green, etc.)
   - Show success/error counts

4. **Error Handling for No Database**
   - Detect when backend is in Gmail-only mode
   - Show appropriate message in Dashboard: "Running in Gmail-only mode - Lead storage disabled"
   - Disable lead-related navigation when database is unavailable

5. **Test the Complete Flow**
   - Ensure OAuth connection works
   - Test label search with real Gmail data
   - Import 5 emails and verify console output
   - Confirm parsed data displays correctly

### Success Criteria
- Can search Gmail labels and see email counts
- Can import 5/10/50 emails with visual feedback
- Console shows clearly formatted parsed email data
- Error messages are user-friendly
- Works without database (Gmail-only mode)

### Files to Modify
- `/frontend/src/lib/api-client.ts`
- `/frontend/src/components/gmail/LabelSearch.tsx`
- `/frontend/src/components/gmail/ImportControls.tsx`
- `/frontend/src/components/gmail/ConsoleOutput.tsx`
- `/frontend/src/app/dashboard/page.tsx`

### Testing Steps
1. Start backend (should show Gmail-only mode message)
2. Navigate to Settings → Gmail
3. Connect Gmail account
4. Search for "processed-lead" label
5. Click "Import 5"
6. Verify console shows parsed data