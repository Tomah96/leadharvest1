# NPM Restoration Plan for LeadHarvest

## Problem Analysis

### Current State
1. **NPM Hangs**: `npm install` hangs indefinitely in the backend directory
2. **Version Mismatches**: bcrypt@5.1.1 installed but package.json requires ^6.0.0
3. **Corrupted node_modules**: Contains 154 items with strange naming patterns (.accepts-ubp1AlA7)
4. **Workarounds in Place**: Manual implementations instead of proper packages
5. **NPM Works Elsewhere**: NPM functions correctly in clean directories

### Root Cause
The backend's node_modules folder appears corrupted with incomplete package installations from interrupted npm processes. The strange folder names (e.g., `.accepts-ubp1AlA7`) indicate temporary directories from failed installations.

## Phase 1: Environment Cleanup (Orchestrator - Claude 1)

### Step 1: Backup Current State
```bash
# Create backup of current working state
cd /mnt/c/Users/12158/LeadHarvest
tar -czf backup-working-state-$(date +%Y%m%d-%H%M%S).tar.gz backend/src backend/server.js backend/.env frontend/src frontend/.env.local
```

### Step 2: Clean NPM Environment
```bash
# Clear NPM cache completely
npm cache clean --force

# Remove all node_modules and lock files
cd /mnt/c/Users/12158/LeadHarvest/backend
rm -rf node_modules package-lock.json

cd /mnt/c/Users/12158/LeadHarvest/frontend
rm -rf node_modules package-lock.json

# Clean any npm temp directories
rm -rf ~/.npm/_cacache
rm -rf ~/.npm/_logs
```

### Step 3: Create Clean Package.json Files

#### Backend package.json (Fixed Versions)
```json
{
  "name": "leadharvest-backend",
  "version": "1.0.0",
  "description": "LeadHarvest CRM backend API",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "compression": "^1.7.4",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.1",
    "googleapis": "^144.0.0",
    "helmet": "^7.1.0",
    "jsonwebtoken": "^9.0.2",
    "morgan": "^1.10.0",
    "pg": "^8.13.1",
    "@supabase/supabase-js": "^2.46.2"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "nodemon": "^3.1.7",
    "supertest": "^7.0.0"
  }
}
```

#### Frontend package.json (Fixed Versions)
```json
{
  "name": "leadharvest-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest"
  },
  "dependencies": {
    "next": "14.2.15",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.456.0",
    "@supabase/supabase-js": "^2.46.2",
    "axios": "^1.7.7"
  },
  "devDependencies": {
    "@types/node": "^22.9.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "typescript": "^5.6.3",
    "tailwindcss": "^3.4.15",
    "postcss": "^8.4.49",
    "autoprefixer": "^10.4.20",
    "jest": "^29.7.0",
    "@testing-library/react": "^16.0.1",
    "@testing-library/jest-dom": "^6.6.3",
    "jest-environment-jsdom": "^29.7.0"
  }
}
```

### Step 4: Fresh Installation
```bash
# Backend installation
cd /mnt/c/Users/12158/LeadHarvest/backend
npm install

# Frontend installation  
cd /mnt/c/Users/12158/LeadHarvest/frontend
npm install
```

## Phase 2: Code Migration (Backend - Claude 2)

### Task 1: Remove Manual Workarounds
1. **Delete** all manual wrapper files:
   - `/backend/src/utils/googleapis-wrapper.js` (if exists)
   - `/backend/src/utils/supabase-rest.js` (if exists)
   - Any other manual implementations

2. **Update** imports to use official packages:
   ```javascript
   // OLD: const bcrypt = require('bcryptjs');
   // NEW: 
   const bcrypt = require('bcrypt');
   
   // OLD: Manual googleapis wrapper
   // NEW:
   const { google } = require('googleapis');
   
   // OLD: Manual Supabase REST wrapper
   // NEW:
   const { createClient } = require('@supabase/supabase-js');
   ```

### Task 2: Gmail Integration Update
Update `/backend/src/services/gmailService.js`:
```javascript
const { google } = require('googleapis');

class GmailService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  async initialize(tokens) {
    this.oauth2Client.setCredentials(tokens);
    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }
  
  // Rest of implementation...
}
```

### Task 3: Database Service Update
Update `/backend/src/services/databaseService.js`:
```javascript
const { createClient } = require('@supabase/supabase-js');

class DatabaseService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
  }

  async query(text, params) {
    // Use Supabase client methods
    // or continue using pg for raw SQL
  }
}
```

### Task 4: Authentication Update
Update `/backend/src/middleware/auth.js`:
```javascript
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Update all bcrypt calls to use promises
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};
```

## Phase 3: Frontend Migration (Frontend - Claude 3)

### Task 1: Remove Workarounds
1. **Delete** any manual API wrappers
2. **Update** Supabase client initialization:

```typescript
// /frontend/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Task 2: Update API Calls
Update all API service files to use proper clients:
```typescript
// /frontend/src/services/api.ts
import axios from 'axios';
import { supabase } from '@/lib/supabase';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});
```

## Phase 4: Integration Testing (Orchestrator - Claude 1)

### Test Suite
1. **Unit Tests**: Run all existing tests
   ```bash
   cd /mnt/c/Users/12158/LeadHarvest/backend && npm test
   cd /mnt/c/Users/12158/LeadHarvest/frontend && npm test
   ```

2. **Integration Tests**: Verify all APIs work
   ```bash
   # Test authentication
   curl -X POST http://localhost:3001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123"}'
   
   # Test lead operations
   curl http://localhost:3001/api/leads
   
   # Test Gmail integration
   curl http://localhost:3001/api/gmail/test
   ```

3. **End-to-End Tests**: Verify full flow
   - Create a lead via frontend
   - Verify in database
   - Test Gmail import
   - Test auto-reply generation

## Delegation Instructions

### For Claude 2 (Backend Developer)
**Priority: P0 - Critical**
**Deadline: Immediate**

1. Read this plan from `/docs/npm-restoration-plan.md`
2. After Orchestrator completes Phase 1, execute Phase 2
3. Update all import statements
4. Remove all workaround files
5. Test each service after updating
6. Report completion in `/docs/progress-reports/backend-npm-restoration.md`

### For Claude 3 (Frontend Developer)
**Priority: P0 - Critical**
**Deadline: After Backend Completion**

1. Read this plan from `/docs/npm-restoration-plan.md`
2. After Backend completes Phase 2, execute Phase 3
3. Update Supabase client initialization
4. Remove any workaround implementations
5. Test all API integrations
6. Report completion in `/docs/progress-reports/frontend-npm-restoration.md`

## Success Criteria
- [ ] NPM install completes without hanging
- [ ] All official packages installed (googleapis, supabase-js, bcrypt)
- [ ] No manual workarounds remain in codebase
- [ ] All tests pass
- [ ] Gmail integration works with official googleapis
- [ ] Frontend can connect to backend APIs
- [ ] No console errors or warnings

## Rollback Plan
If issues occur:
1. Restore from backup created in Step 1
2. Document specific error in `/docs/npm-issues.md`
3. Continue with workarounds temporarily
4. Investigate alternative solutions

## Timeline
- Phase 1: 30 minutes (Orchestrator)
- Phase 2: 2 hours (Backend)
- Phase 3: 1 hour (Frontend)
- Phase 4: 1 hour (Orchestrator)
- Total: ~4.5 hours

## Notes
- Keep the backup until system is stable for 24 hours
- Document any new issues discovered
- Update tech debt tracker after completion