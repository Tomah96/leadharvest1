# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📋 MANDATORY STARTUP PROCEDURE

### When Starting (New Context or Taking Over):
1. **Read System State** (1 minute):
   ```bash
   cat /mnt/c/Users/12158/LeadHarvest/docs/CURRENT-STATE.md
   cat /mnt/c/Users/12158/LeadHarvest/docs/blockers-and-issues.md | head -20
   ```

2. **Read Recent Work** (2 minutes):
   ```bash
   tail -100 /mnt/c/Users/12158/LeadHarvest/docs/ACTIVE-WORK-LOG.md
   tail -50 /mnt/c/Users/12158/LeadHarvest/docs/progress-reports.md
   ```

3. **Check Your Role** (30 seconds):
   ```bash
   # If Backend Claude:
   cat /mnt/c/Users/12158/LeadHarvest/docs/backend-claude-guide.md | head -30
   # If Frontend Claude:
   cat /mnt/c/Users/12158/LeadHarvest/docs/frontend-claude-guide.md | head -30
   # If Orchestrator:
   cat /mnt/c/Users/12158/LeadHarvest/docs/orchestrator-guide.md | head -30
   ```

4. **Verify Environment** (30 seconds):
   ```bash
   git status && ps aux | grep node
   ```

### After EVERY Task Completion:
1. **Update Work Log**:
   - Add entry to `/docs/ACTIVE-WORK-LOG.md`
   - Include timestamp, what you did, what you learned
   
2. **On Handoff/Context End**:
   - Update `/docs/CURRENT-STATE.md`
   - List any temporary files created
   - Note any running processes

3. **If You Learn Something New**:
   - Add to `/docs/lessons/` if significant
   - Update QUICK-REFERENCE.md if common issue

## 🚨 CRITICAL: READ FIRST - DEBUGGING APPROACH

### BEFORE FIXING ANY ISSUE:
1. **Check basic things first** - import paths, typos, env vars (90% of issues)
2. **The codebase is COMPLETE** - Features exist, don't recreate them
3. **NO WORKAROUNDS** - Fix root causes, not symptoms
4. **Think horses, not zebras** - Common problems before exotic ones

### NEVER DO THIS:
- ❌ Create workaround files (gmail-server.js, backend-full.js, etc.)
- ❌ Rewrite working modules from scratch
- ❌ Delete documentation files in /docs/lessons/
- ❌ Assume features are missing

### ALWAYS DO THIS:
- ✅ Read `/docs/DEBUGGING-PRINCIPLES.md` before debugging
- ✅ Read `/docs/lessons/` for previously solved issues
- ✅ Check if code already exists before creating new files
- ✅ Fix by changing 1-2 lines, not rewriting everything

### Required Reading:
- `/docs/DEBUGGING-PRINCIPLES.md` - How to debug properly
- `/docs/CLAUDE-COLLABORATION-GUIDE.md` - Working with other Claudes
- `/docs/lessons/` - Previously solved issues (don't repeat mistakes)

## 🛡️ MANDATORY DEVELOPMENT STANDARDS

### Before Writing ANY Code:
1. **Validate Requirements**:
   - List expected inputs and outputs with types
   - Identify ALL edge cases (null, undefined, empty, malformed)
   - Check if similar code already exists (search first!)
   - Create mental test cases before coding

2. **Plan Error Handling**:
   - What could go wrong? List it.
   - What should happen when it goes wrong?
   - What fallback behavior makes sense?
   - Never let the app crash from undefined data

### Code Quality & Structure Requirements:

#### Method Length & Modularity:
1. **Keep Methods Small** (50 lines max):
   - Each method should do ONE thing well
   - If a method exceeds 50 lines, split it into smaller functions
   - Name helper functions descriptively
   ```javascript
   // ❌ BAD: One giant method
   async function processLead(data) {
     // 100+ lines of validation, parsing, saving...
   }
   
   // ✅ GOOD: Split into focused methods
   async function processLead(data) {
     const validated = validateLeadData(data);
     const parsed = parseLeadFields(validated);
     const enriched = await enrichLeadData(parsed);
     return await saveLead(enriched);
   }
   ```

2. **Write Only What's Needed**:
   - Don't add features "just in case"
   - Only implement what the current feature requires
   - Avoid over-engineering and premature optimization
   - Delete unused code immediately

3. **Comprehensive Testing for Critical Code**:
   - Write tests for business-critical logic (lead parsing, deduplication)
   - Test edge cases and error conditions
   - Focus test coverage on areas that would cause data loss or corruption
   - Examples of critical areas:
     * Email parsing logic
     * Phone number deduplication
     * Payment processing
     * Authentication & authorization
     * Data validation

### 🧪 MANDATORY TESTING REQUIREMENTS:

#### 1. Unit Tests (100% Coverage for New Code):
**EVERY function/method you write MUST have unit tests**
```javascript
// For every function you write:
function calculateLeadScore(lead) {
  // Implementation
}

// You MUST write corresponding tests:
describe('calculateLeadScore', () => {
  test('returns high score for complete lead', () => {});
  test('returns low score for incomplete lead', () => {});
  test('handles null input gracefully', () => {});
  test('handles missing fields', () => {});
});
```

#### 2. Integration Tests (Every Page & API):
**EVERY API endpoint MUST have integration tests**
```javascript
// Backend API tests
describe('POST /api/leads', () => {
  test('creates lead with valid data', async () => {});
  test('rejects invalid phone number', async () => {});
  test('handles duplicate leads', async () => {});
  test('returns 401 without auth', async () => {});
});

// Frontend page tests
describe('LeadDetailsPage', () => {
  test('loads and displays lead data', async () => {});
  test('handles missing lead gracefully', async () => {});
  test('updates lead on form submit', async () => {});
});
```

#### 3. End-to-End Tests (Critical User Flows):
**Test complete user journeys**
```javascript
describe('Lead Management Flow', () => {
  test('User can create, edit, and delete a lead', async () => {
    // 1. Navigate to leads page
    // 2. Click "Add Lead"
    // 3. Fill form and submit
    // 4. Verify lead appears in list
    // 5. Edit the lead
    // 6. Delete the lead
    // 7. Verify it's removed
  });
});
```

#### 4. Snapshot Tests (UI Components):
**EVERY React component MUST have snapshot tests**
```javascript
describe('LeadCard Component', () => {
  test('matches snapshot with complete data', () => {
    const component = render(<LeadCard lead={mockLead} />);
    expect(component).toMatchSnapshot();
  });
  
  test('matches snapshot with missing data', () => {
    const component = render(<LeadCard lead={incompleteLead} />);
    expect(component).toMatchSnapshot();
  });
});
```

#### Test File Structure:
```
backend/
├── src/
│   ├── services/
│   │   ├── leadService.js
│   │   └── leadService.test.js      # Unit tests
│   └── routes/
│       ├── leadRoutes.js
│       └── leadRoutes.test.js       # Integration tests
└── __tests__/
    └── e2e/
        └── leadFlow.test.js          # End-to-end tests

frontend/
├── src/
│   ├── components/
│   │   ├── LeadCard.tsx
│   │   ├── LeadCard.test.tsx        # Unit + Snapshot tests
│   │   └── __snapshots__/
│   └── app/
│       ├── leads/
│       │   ├── page.tsx
│       │   └── page.test.tsx        # Integration tests
└── __tests__/
    └── e2e/
        └── userJourneys.test.ts     # End-to-end tests
```

#### Test Coverage Requirements:
- **Unit Tests**: 100% coverage for all new code
- **Integration Tests**: Every API endpoint, every page route
- **E2E Tests**: All critical user paths (lead creation, template usage, etc.)
- **Snapshot Tests**: Every React component

#### Before Submitting Code:
1. Run all tests: `npm test`
2. Check coverage: `npm run test:coverage`
3. Ensure 100% pass rate
4. Update snapshots if UI intentionally changed
5. Add new tests for any new functionality

#### Test Writing Standards:
- Use descriptive test names that explain the scenario
- Test both success and failure cases
- Test edge cases (null, undefined, empty arrays)
- Mock external dependencies appropriately
- Keep tests focused and independent
- Use beforeEach/afterEach for setup/cleanup

### Defensive Programming Requirements:

#### Every Data Access MUST Have Safety:
```javascript
// ❌ NEVER DO THIS
const name = response.data.user.name;

// ✅ ALWAYS DO THIS
const name = response?.data?.user?.name || 'Unknown';

// ✅ OR THIS FOR NESTED ACCESS
const name = safeGet(response, 'data.user.name', 'Unknown');
```

#### Every Array Operation MUST Check:
```javascript
// ❌ NEVER DO THIS
data.map(item => item.name)

// ✅ ALWAYS DO THIS
Array.isArray(data) ? data.map(item => item.name) : []
```

#### Every API Response MUST Validate:
```javascript
// ✅ ALWAYS validate structure
if (!response?.data?.success) {
  console.error('[Component] Invalid response structure:', response);
  // Use fallback behavior
  return defaultValue;
}
```

### Logging Standards:

#### Required Log Points:
1. **Component Mount**: `console.log('[ComponentName] Mounted', { props });`
2. **API Calls**: `console.log('[ComponentName] API call to', endpoint, { params });`
3. **API Responses**: `console.log('[ComponentName] API response', { status, data });`
4. **State Changes**: `console.log('[ComponentName] State change', { from: oldState, to: newState });`
5. **Errors**: `console.error('[ComponentName] Error:', error, { context });`

#### Log Format:
```javascript
// Always use prefix pattern: [Component/Service] Action: details
console.log('[LeadDetails] Loading lead', { leadId });
console.error('[TemplateService] Failed to load', { error, templateId });
console.warn('[API] Slow response', { endpoint, duration: `${ms}ms` });
```

### Testing Protocol - "Definition of Done":

#### Before EVER Saying "It's Fixed" or "Feature Complete":

1. **Write Tests FIRST**:
   ```bash
   # Write unit tests for new functions
   # Write integration tests for new endpoints/pages
   # Write snapshot tests for new components
   # THEN write the implementation
   ```

2. **Run All Tests**:
   ```bash
   # Backend tests
   cd backend && npm test
   
   # Frontend tests
   cd frontend && npm test
   
   # Check coverage
   npm run test:coverage
   ```

3. **Verify Compilation**:
   ```bash
   # Check backend compiled
   # Look for: "Compiled successfully" or nodemon restart
   
   # Check frontend compiled  
   # Look for: "Compiled successfully" in Next.js output
   ```

4. **Manual Testing in Browser**:
   - Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
   - Open DevTools: `F12`
   - Check Console for errors
   - Verify your console.logs appear

5. **Test Happy Path**:
   - Does the feature work with good data?
   - Are success messages logged?
   - Do all tests pass?

6. **Test Edge Cases**:
   - Empty data: Does it handle `[]` and `{}`?
   - Null/undefined: Does it handle missing data?
   - Malformed data: Does it handle unexpected structure?
   - Very long data: Does UI break with long strings?
   - Are these cases covered in your tests?

7. **Check for Regression**:
   - Run the full test suite
   - Did you break any existing tests?
   - Test related features manually

8. **Update Documentation**:
   - Update test documentation if needed
   - Update snapshots if UI intentionally changed
   - Document any new test utilities created

9. **Only Then** Say: "Feature complete with 100% test coverage"

### Error Boundary Pattern:

#### Wrap Risky Operations:
```javascript
// For components
try {
  return <RiskyComponent />;
} catch (error) {
  console.error('[Component] Render error:', error);
  return <ErrorFallback message="Unable to display content" />;
}

// For data processing
try {
  const processed = riskyOperation(data);
  return processed;
} catch (error) {
  console.error('[Service] Processing error:', error, { data });
  return fallbackValue;
}
```

### Safe Utility Functions (Add to Every Project):

```javascript
// utils/safeAccess.js
export function safeGet(obj, path, defaultValue) {
  try {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
      result = result?.[key];
    }
    return result ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

export function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export function safeParse(jsonString, fallback = {}) {
  try {
    return JSON.parse(jsonString);
  } catch {
    return fallback;
  }
}
```

### Common Pitfalls That Waste Hours:

1. **"It's Fixed!" Without Testing**
   - Always test in browser, not just in code
   - Always check console for errors
   - Always verify the fix is actually running

2. **Assuming API Response Structure**
   - Always log the actual response first
   - Always validate before using
   - Always have a fallback

3. **Not Handling Loading States**
   - Always show loading indicator
   - Always handle empty states
   - Always handle error states

4. **Browser Cache Issues**
   - If changes don't appear: Hard refresh
   - If still not working: Clear .next folder
   - Check DevTools Network tab for 304 (cached)

5. **Type Assertions Without Validation**
   ```typescript
   // ❌ NEVER
   const data = response.data as UserData;
   
   // ✅ ALWAYS  
   const data = validateUserData(response.data) ? response.data : defaultUserData;
   ```

### Performance Tracking:
```javascript
// Always measure slow operations
console.time('[Operation] FetchLeads');
const result = await slowOperation();
console.timeEnd('[Operation] FetchLeads');

// Flag slow operations
if (duration > 2000) {
  console.warn('[Performance] Slow operation:', { operation, duration });
}
```

### When You Hit an Error:

1. **First**: Check the actual error message carefully
2. **Second**: Check what data you actually have: `console.log('Actual data:', data)`
3. **Third**: Check if it's a caching issue (hard refresh)
4. **Fourth**: Check if backend is actually returning what you expect
5. **Fifth**: Add defensive code to handle this case
6. **Last**: Only then try to fix the root cause

### Remember:
- **An hour of planning saves 3 hours of debugging**
- **Console.log is your friend - use it liberally**
- **Defensive code prevents 90% of production bugs**
- **Test before claiming victory**
- **When in doubt, add more error handling**

## Project Overview

LeadHarvest is a rental property CRM that automates lead processing from Gmail. It processes 20+ daily email inquiries from Zillow, Realtor.com, Apartments.com, and RentMarketplace, with intelligent parsing, deduplication, and auto-reply capabilities.

## Multi-Claude Development Structure

This project uses an orchestrated multi-Claude development approach:
- **Orchestrator Claude**: Project coordination, integration, documentation
- **Backend Claude**: Node.js/Express API development (works in `/backend`)
- **Frontend Claude**: Next.js UI development (works in `/frontend`)

Coordination happens through documentation in `/docs` folder.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, TypeScript, Lucide Icons
- **Backend**: Node.js, Express, JWT Authentication, bcrypt
- **Database**: Supabase (PostgreSQL)
- **Integrations**: Gmail API (OAuth + Webhooks), OpenPhone API
- **Infrastructure**: Docker for development

## Key Features

1. **Email Processing**: Real-time Gmail webhook monitoring for "processed-lead" emails
2. **Intelligent Parsing**: Extract standardized data from 4 email sources
3. **Lead Management**: Phone-based deduplication, status tracking (new→contacted→qualified→closed)
4. **Conversation Hub**: Unified email/SMS view in lead details
5. **Auto-Reply System**: Template-based responses for missing information

## Database Schema

Single `leads` table with comprehensive fields:
- Contact: first_name, last_name, phone (primary key for dedup), email
- Property: property_address, inquiry_date
- Financial: credit_score, income, move_in_date
- Preferences: occupants, pets, lease_length
- System: source, status, gmail_message_id, missing_info[], parsing_errors[]

## Development Commands

```bash
# Backend
cd backend
npm install
npm run dev  # Runs on port 3001

# Frontend  
cd frontend
npm install
npm run dev  # Runs on port 3000

# Database
docker-compose up -d  # Start PostgreSQL
```

## API Structure

- `GET /api/health` - Health check
- `GET/POST /api/leads` - Lead CRUD operations
- `GET /api/conversations/:leadId` - Get conversation history
- `POST /api/gmail/webhook` - Gmail real-time updates
- `GET/POST /api/settings/templates` - Auto-reply templates

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - Supabase connection string
- `OPENPHONE_API_KEY` - For SMS integration
- `GOOGLE_CLIENT_ID/SECRET` - Gmail OAuth
- `SESSION_SECRET` - JWT signing
- `ANTHROPIC_API_KEY` - For future AI features

## Email Parsing Philosophy

"Toyota not BMW" - Simple, reliable parsing that works 95% of the time:
- Clear if/else logic over complex regex
- Explicit error handling with logging
- Graceful degradation for missing data
- Manual review queue for failed parses

## Security Considerations

- Never commit API keys or secrets
- All auth tokens in httpOnly cookies
- Input validation on all endpoints
- Rate limiting on public endpoints
- Prepared SQL statements only