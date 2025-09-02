# LeadHarvest CRM - Knowledge Base & Learning Log

## Purpose
This document serves as a central knowledge repository for all Claudes working on the project. Update this with lessons learned, gotchas, and important discoveries.

## Table of Contents
1. [Architecture Decisions](#architecture-decisions)
2. [Code Standards](#code-standards)
3. [Common Patterns](#common-patterns)
4. [Gotchas & Solutions](#gotchas--solutions)
5. [Performance Optimizations](#performance-optimizations)
6. [Testing Strategies](#testing-strategies)
7. [Integration Recipes](#integration-recipes)
8. [Debugging Techniques](#debugging-techniques)
9. [Deployment Procedures](#deployment-procedures)

---

## Architecture Decisions

### Database Design
- **Decision**: Single `leads` table instead of normalized structure
- **Rationale**: Simplicity and query performance for 4k+ leads
- **Trade-offs**: Some data duplication but faster queries

### Authentication
- **Decision**: JWT in httpOnly cookies
- **Rationale**: Security (no JS access) + simplicity
- **Implementation**: See backend/src/middleware/auth.js

### Email Processing
- **Decision**: Synchronous parsing with error queue
- **Rationale**: Reliability over speed for 20 leads/day
- **Fallback**: Failed parses go to manual review queue

---

## Code Standards

### Backend Standards
```javascript
// ✅ Good: Explicit error handling
try {
  const lead = await db.leads.findByPhone(phone);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  return res.json(lead);
} catch (error) {
  logger.error('Failed to fetch lead:', error);
  return res.status(500).json({ error: 'Internal server error' });
}

// ❌ Bad: Silent failures
const lead = await db.leads.findByPhone(phone);
return res.json(lead);
```

### Frontend Standards
```javascript
// ✅ Good: Loading states and error handling
function LeadCard({ leadId }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Always handle all states
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!lead) return <EmptyState />;
  
  return <LeadDisplay lead={lead} />;
}
```

---

## Common Patterns

### API Error Handling Pattern
```javascript
// Consistent error response format
class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// Usage
throw new ApiError(400, 'INVALID_PHONE', 'Phone number is required');
```

### Database Query Pattern
```javascript
// Always use parameterized queries
const findLeadByPhone = async (phone) => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('phone', phone)
    .single();
    
  if (error && error.code !== 'PGRST116') { // Not found is ok
    throw error;
  }
  
  return data;
};
```

---

## Gotchas & Solutions

### Supabase Connection
**Gotcha**: Connection string includes pooler which may timeout
**Solution**: Use connection pooling and retry logic
```javascript
const supabase = createClient(url, key, {
  auth: { persistSession: false },
  db: { 
    schema: 'public',
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});
```

### Gmail API Rate Limits
**Gotcha**: 250 quota units per user per second
**Solution**: Implement exponential backoff
```javascript
const fetchWithRetry = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === 429 && i < retries - 1) {
        await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
      } else {
        throw error;
      }
    }
  }
};
```

### Frontend Component Patterns
```typescript
// Responsive sidebar pattern with mobile support
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

// Click outside to close pattern
useEffect(() => {
  function handleClickOutside(event: MouseEvent) {
    if (ref.current && !ref.current.contains(event.target as Node)) {
      setIsOpen(false);
    }
  }
  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);
```

### API Client Pattern
```typescript
// Centralized API client with interceptors
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api",
  withCredentials: true, // Important for httpOnly cookies
});

// Auto-redirect on 401
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
```

---

## Day 8 Additions: Gmail-Only Mode Patterns

### Memory Store Pattern
- **Pattern**: Map-based storage with phone as primary key
- **Implementation**: Singleton service pattern
- **Benefits**: O(1) lookups, natural deduplication
- **Code Location**: `/backend/src/services/memoryLeadStore.js`

```javascript
// Singleton pattern for consistent state
class MemoryLeadStore {
  constructor() {
    this.leads = new Map(); // phone -> lead
    this.leadsByEmail = new Map(); // email -> lead
  }
  
  upsertLead(leadData) {
    const phone = leadData.phone || '9999999999';
    const existing = this.leads.get(phone);
    // Merge or create logic
  }
}
module.exports = new MemoryLeadStore();
```

### Gmail-Only Mode UI Pattern
- **Pattern**: Conditional rendering based on database availability
- **Visual Indicators**: Banners, alerts, status messages
- **User Guidance**: Clear next steps and limitations

```typescript
// Frontend detection pattern
const [isGmailOnlyMode, setIsGmailOnlyMode] = useState(false);

if (error?.message?.includes('Database not configured')) {
  setIsGmailOnlyMode(true);
}

// Render appropriate UI
{isGmailOnlyMode && <GmailOnlyBanner />}
```

### Phone Management Pattern
- **Placeholder Strategy**: Use "9999999999" for missing phones
- **Quick Edit Modal**: Rapid phone entry without full form
- **Validation**: Format checking before save
- **Visual Cues**: Yellow indicators for placeholder phones

### Service Fallback Pattern
- **Pattern**: Graceful degradation from database to memory
- **Implementation**: Check database availability first
- **Transparency**: Clear messaging to users

```javascript
// Backend service pattern
async function getLeads(params) {
  if (!isDatabaseAvailable()) {
    return memoryStore.getAllLeads(params);
  }
  return databaseModel.findAll(params);
}
```

---

## Gotchas & Solutions

### Next.js App Router
**Gotcha**: Components using hooks or state need "use client" directive
**Solution**: Add directive at top of file
```typescript
"use client";
import { useState } from "react";
```

### Tailwind Dark Mode
**Gotcha**: Dark mode classes need explicit dark: prefix
**Solution**: Use consistent pattern
```typescript
className="text-gray-900 dark:text-gray-100"
```

### TypeScript Strict Mode
**Gotcha**: Null/undefined checks required for optional fields
**Solution**: Use optional chaining and nullish coalescing
```typescript
const fullName = [lead.firstName, lead.lastName].filter(Boolean).join(" ") || "Unknown";
```

---

## Performance Optimizations

### Database Indexes
```sql
-- Critical for lead lookups
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
```

### Frontend Optimizations
- Use React.memo for LeadCard components
- Implement virtual scrolling for 4k+ leads
- Lazy load conversation history

---

## Testing Strategies

### Backend Testing
```javascript
// Test file structure
__tests__/
├── unit/
│   ├── parsers/
│   └── services/
├── integration/
│   ├── api/
│   └── database/
└── fixtures/
    └── emails/
```

### Frontend Testing
```javascript
// Component testing pattern
describe('LeadCard', () => {
  it('displays all lead information', () => {
    const lead = createMockLead();
    render(<LeadCard lead={lead} />);
    
    expect(screen.getByText(lead.first_name)).toBeInTheDocument();
    expect(screen.getByText(lead.phone)).toBeInTheDocument();
  });
  
  it('handles missing information gracefully', () => {
    const lead = { ...createMockLead(), first_name: null };
    render(<LeadCard lead={lead} />);
    
    expect(screen.getByText('Unknown')).toBeInTheDocument();
  });
});

// Testing responsive components
describe('Sidebar', () => {
  it('shows mobile menu on small screens', () => {
    render(<Sidebar />);
    
    // Mobile menu should be hidden initially
    expect(screen.getByRole('navigation')).toHaveClass('-translate-x-full');
    
    // Click hamburger menu
    fireEvent.click(screen.getByLabelText('Open menu'));
    
    // Menu should slide in
    expect(screen.getByRole('navigation')).toHaveClass('translate-x-0');
  });
});

// Testing API integration
describe('API Client', () => {
  it('redirects to login on 401', async () => {
    mockAxios.onGet('/api/leads').reply(401);
    
    await expect(api.leads.getAll()).rejects.toThrow();
    expect(window.location.href).toBe('/login');
  });
});
```

---

## Lessons Learned
*Update this section as you encounter and solve problems*

### Backend Lessons
- [2025-07-17] - Supabase connection requires handling PGRST116 error code when table doesn't exist yet. This is normal during initial setup before migrations are run. Added proper error handling in supabase.js connection test.
- [2025-07-17] - Phone deduplication requires normalization. Created helper to strip non-numeric chars and handle US formats (10 digits or 11 with country code).
- [2025-07-17] - Lead upsert pattern: Use findByPhone first, then merge updates preserving non-null existing values. This prevents accidental data loss.
- [2025-07-17] - Jest mocking pattern for Supabase: Mock at the model level, not the Supabase client. This makes tests cleaner and more maintainable.
- [2025-07-17] - Validation middleware converts query params to expected types. Account for this in tests (page/limit become numbers).

### Frontend Lessons
- [2025-07-17] - Next.js App Router requires "use client" directive for interactive components. Applied to Sidebar, FilterDropdown, and pages using state hooks.
- [2025-07-17] - Tailwind's dark mode works best with CSS variables for dynamic theming. Implemented --background and --foreground variables in globals.css.
- [2025-07-17] - Mobile-first responsive design pattern: Hide sidebar by default on mobile, show hamburger menu. Used transform/translate for smooth slide-in animation.
- [2025-07-17] - TypeScript interfaces should be co-located in /types for shared use between components and API client.
- [2025-07-17] - Jest with Next.js requires careful configuration: use moduleNameMapper (not moduleNameMapping), mock Next.js router/Link in setup file.
- [2025-07-17] - React Testing Library with TypeScript works best with custom render function that includes providers and utilities.
- [2025-07-17] - Test utilities should include mock API client to avoid actual network calls during testing.
- [2025-07-17] - Component testing strategy: Test behavior not implementation - focus on user interactions and rendered output.
- [2025-07-17] - Conversation UI pattern: Separate message history from input form for better component reusability and testing.
- [2025-07-17] - Jest date testing: toLocaleDateString() varies by system locale. Use flexible matchers or test for presence of date elements instead.
- [2025-07-17] - Jest performance: Enable caching, use maxWorkers:'50%', reduce timeouts, and create test:fast script for quick runs.
- [2025-07-17] - Test organization: Group related assertions, use descriptive test names, test behavior not implementation details.

### Integration Lessons
- [2025-07-17] - Backend file structure: Email parsing logic is in `/backend/src/parsers/` with individual parser files (zillowParser.js, realtorParser.js, etc.) and orchestration in `/backend/src/services/emailParsingService.js`
- [2025-07-17] - Frontend is located at `/frontend/` relative to backend, not in the same directory
- [2025-07-17] - When referencing files in documentation, use exact filenames to avoid confusion (emailParsingService.js not emailParser.js)
- [2025-08-06] - Gmail OAuth flow requires frontend redirect handling. Success page must notify parent window and close popup.
- [2025-08-06] - Database-optional mode allows Gmail testing without Supabase. Check connection before database operations.
- [2025-08-06] - Parser fixes: Always check multiple email sender patterns (@convo.zillow.com, @zillow.com)

---

## Integration Recipes

### Frontend-Backend API Integration Pattern
```javascript
// Frontend: API call with error handling
const fetchLeads = async () => {
  try {
    setLoading(true);
    const response = await api.leads.getAll({ page, limit: 20 });
    setLeads(response.data.leads);
    setPagination(response.data.pagination);
  } catch (error) {
    console.error('Failed to fetch leads:', error);
    setError(error.response?.data?.message || 'Failed to load leads');
  } finally {
    setLoading(false);
  }
};

// Backend: Corresponding endpoint
router.get('/api/leads', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const result = await leadService.getLeads({ page, limit, status, search });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch leads' });
  }
});
```

### Gmail OAuth Integration Flow
```javascript
// Step 1: Frontend initiates OAuth
const connectGmail = () => {
  const authUrl = `${API_URL}/api/gmail/auth-url?userId=${userId}`;
  const authWindow = window.open(authUrl, 'gmail-auth', 'width=500,height=600');
  
  // Listen for success message
  window.addEventListener('message', (event) => {
    if (event.data === 'gmail-connected') {
      authWindow?.close();
      checkConnectionStatus();
    }
  });
};

// Step 2: Backend handles callback
router.get('/api/gmail/auth-callback', async (req, res) => {
  const { code, state } = req.query;
  const tokens = await oauth2Client.getToken(code);
  await gmailService.storeTokens(state, tokens);
  res.redirect(`${FRONTEND_URL}/gmail/success`);
});

// Step 3: Frontend success page
useEffect(() => {
  if (window.opener) {
    window.opener.postMessage('gmail-connected', '*');
    window.close();
  }
}, []);
```

### Database-Optional Pattern
```javascript
// Check database availability before operations
const saveLeadIfPossible = async (leadData) => {
  if (!supabase) {
    console.log('Database not available - running in Gmail-only mode');
    return { success: false, reason: 'database-unavailable', data: leadData };
  }
  
  try {
    const result = await leadModel.createOrUpdate(leadData);
    return { success: true, data: result };
  } catch (error) {
    console.error('Database error:', error);
    return { success: false, reason: 'database-error', error };
  }
};
```

---

## Debugging Techniques

### Backend Debugging

#### Server Won't Start
```bash
# Check port availability
lsof -i :3001

# Check environment variables
node -e "console.log(process.env.DATABASE_URL ? 'DB configured' : 'No DB')"

# Start with detailed logging
DEBUG=* npm run dev

# Test minimal server
node -e "require('express')().listen(3001, () => console.log('Works'))"
```

#### Gmail Integration Issues
```javascript
// Add verbose logging to OAuth flow
console.log('OAuth State:', state);
console.log('OAuth Code:', code ? 'Present' : 'Missing');
console.log('Redirect URI:', process.env.GOOGLE_REDIRECT_URI);

// Test token storage
const tokens = gmailService.getStoredTokens(userId);
console.log('Stored tokens:', tokens ? 'Found' : 'Not found');

// Check label matching
const variations = ['processed-lead', 'Processed lead', 'PROCESSED_LEAD'];
variations.forEach(v => console.log(`Testing "${v}":`, findLabel(v)));
```

### Frontend Debugging

#### Component Render Issues
```javascript
// Add render logging
useEffect(() => {
  console.log('Component rendered with props:', props);
  return () => console.log('Component unmounting');
});

// Track state changes
useEffect(() => {
  console.log('State changed:', { leads, loading, error });
}, [leads, loading, error]);

// Debug API calls
const debugApi = async () => {
  console.time('API Call');
  const result = await api.leads.getAll();
  console.timeEnd('API Call');
  console.log('API Response:', result);
};
```

#### Infinite Loop Detection
```javascript
// Check dependency arrays
useEffect(() => {
  fetchData();
}, [fetchData]); // ❌ Will cause infinite loop if fetchData changes

// Fix with useCallback
const fetchData = useCallback(() => {
  // fetch logic
}, []); // ✅ Stable reference

// Or use ref for functions
const fetchRef = useRef(fetchData);
useEffect(() => {
  fetchRef.current();
}, []); // ✅ No dependency on function
```

---

## Deployment Procedures

### Pre-Deployment Checklist
```markdown
- [ ] All tests passing (backend + frontend)
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] API documentation updated
- [ ] Performance testing completed
- [ ] Security scan performed
- [ ] Rollback plan prepared
```

### Environment Setup
```bash
# Production environment variables
DATABASE_URL=postgresql://...
OPENPHONE_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://production.com/api/gmail/callback
SESSION_SECRET=... # Generate with: openssl rand -base64 32
NODE_ENV=production
FRONTEND_URL=https://production.com
```

### Database Migration Strategy
```bash
# Test migrations locally first
npm run migrate:test

# Backup production database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Run migrations
npm run migrate:production

# Verify migrations
npm run migrate:verify
```

### Zero-Downtime Deployment
```bash
# Step 1: Deploy new version alongside old
docker build -t leadharvest:new .
docker run -d --name leadharvest-new leadharvest:new

# Step 2: Health check new version
curl http://localhost:3001/api/health

# Step 3: Switch traffic
# Update load balancer or reverse proxy

# Step 4: Monitor for issues (5 minutes)
docker logs -f leadharvest-new

# Step 5: Remove old version
docker stop leadharvest-old
docker rm leadharvest-old
```

### Rollback Procedure
```bash
# Immediate rollback (< 5 minutes)
docker stop leadharvest-new
docker start leadharvest-old

# Database rollback (if needed)
psql $DATABASE_URL < backup-$(date +%Y%m%d).sql

# Clear caches
redis-cli FLUSHALL  # If using Redis

# Notify team
echo "Rollback completed. Investigating issue."
```