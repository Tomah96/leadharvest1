# LeadHarvest CRM - Testing Strategy

## Testing Philosophy
"Test what matters, not everything" - Focus on critical business logic and user paths.

## Testing Pyramid

```
         /\
        /  \  E2E Tests (10%)
       /----\  - Critical user journeys
      /      \  Integration Tests (30%)
     /--------\  - API endpoints, DB queries
    /          \  Unit Tests (60%)
   /____________\  - Parsers, utilities, components
```

## What to Test

### Critical Paths (MUST TEST)
1. **Email Parsing** - Each source parser with real examples
2. **Lead Deduplication** - Phone number matching logic
3. **Authentication Flow** - Login, session management
4. **Lead CRUD Operations** - Create, read, update, search
5. **Auto-reply Generation** - Template filling with missing fields

### Backend Testing

#### Unit Tests
```javascript
// backend/src/parsers/__tests__/zillow-parser.test.js
describe('ZillowParser', () => {
  it('extracts all fields from complete email', () => {
    const email = loadFixture('zillow-complete.html');
    const result = parseZillowEmail(email);
    
    expect(result).toEqual({
      first_name: 'Shane',
      last_name: 'Farmer',
      phone: '570-217-6372',
      email: 'shane.farmer@example.com',
      credit_score: '720-799',
      income: 34992,
      move_in_date: '2025-08-01',
      pets: true,
      occupants: 3,
      lease_length: 12,
      property: '1414 W Diamond St #1',
      notes: 'I would like to schedule a tour for Friday 7/18'
    });
  });
  
  it('handles missing financial info gracefully', () => {
    const email = loadFixture('zillow-no-income.html');
    const result = parseZillowEmail(email);
    
    expect(result.income).toBeNull();
    expect(result.missing_info).toContain('income');
  });
});
```

#### Integration Tests
```javascript
// backend/src/api/__tests__/leads.test.js
describe('Leads API', () => {
  beforeEach(async () => {
    await db.clear(); // Clean database
  });
  
  it('creates lead and detects duplicates', async () => {
    const lead = createTestLead({ phone: '555-1234' });
    
    // First creation should succeed
    const res1 = await request(app)
      .post('/api/leads')
      .send(lead)
      .expect(201);
      
    expect(res1.body.id).toBeDefined();
    
    // Duplicate should update existing
    const res2 = await request(app)
      .post('/api/leads')
      .send({ ...lead, first_name: 'Updated' })
      .expect(200);
      
    expect(res2.body.id).toBe(res1.body.id);
    expect(res2.body.first_name).toBe('Updated');
  });
});
```

### Frontend Testing

#### Component Tests
```javascript
// frontend/src/components/__tests__/LeadCard.test.jsx
describe('LeadCard', () => {
  it('shows conversation preview', () => {
    const lead = {
      id: '123',
      first_name: 'John',
      last_name: 'Doe',
      lastMessage: 'Interested in viewing...'
    };
    
    render(<LeadCard lead={lead} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Interested in viewing...')).toBeInTheDocument();
  });
  
  it('highlights missing information', () => {
    const lead = {
      ...createTestLead(),
      missing_info: ['phone', 'move_in_date']
    };
    
    render(<LeadCard lead={lead} />);
    
    expect(screen.getByText('Missing: phone, move-in date')).toBeInTheDocument();
    expect(screen.getByTestId('missing-info-badge')).toHaveClass('bg-yellow-100');
  });
});
```

## Test Data Management

### Fixtures Directory Structure
```
fixtures/
├── emails/
│   ├── zillow/
│   │   ├── complete.html
│   │   ├── missing-income.html
│   │   └── missing-phone.html
│   ├── realtor/
│   ├── apartments/
│   └── rentmarketplace/
└── leads/
    ├── complete-lead.json
    ├── minimal-lead.json
    └── duplicate-scenarios.json
```

### Test Data Factories
```javascript
// backend/src/test-utils/factories.js
const createLead = (overrides = {}) => ({
  first_name: faker.name.firstName(),
  last_name: faker.name.lastName(),
  phone: faker.phone.phoneNumber(),
  email: faker.internet.email(),
  property: faker.address.streetAddress(),
  source: 'zillow',
  status: 'new',
  ...overrides
});

const createZillowEmail = (overrides = {}) => {
  const lead = createLead(overrides);
  return generateZillowEmailHTML(lead);
};
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
name: Tests
on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd backend && npm ci
      - run: cd backend && npm test
      - run: cd backend && npm run test:coverage
      
  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: cd frontend && npm ci
      - run: cd frontend && npm test
      - run: cd frontend && npm run test:coverage
```

## Coverage Goals
- Overall: 80% minimum
- Critical paths: 95% minimum
- Email parsers: 100% (they're the core!)
- UI Components: 70% (focus on logic, not styles)

## Testing Commands
```bash
# Backend
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
npm run test:integration # Integration tests only

# Frontend
npm test                # Run all tests
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
npm run test:e2e       # Cypress E2E tests
```

## When to Write Tests
1. **Before fixing bugs** - Write test that reproduces bug first
2. **With new features** - TDD when possible
3. **During refactoring** - Ensure behavior doesn't change
4. **For edge cases** - Document weird email formats as tests