# Quick Fix: Enable Supabase Database

## The Simple Solution

You're right - we already have Supabase credentials! Let's just use them instead of building complex in-memory storage.

## For Backend Claude

### Step 1: Enable Database in .env
Uncomment these lines in `/backend/.env`:

```bash
DATABASE_URL="postgresql://postgres.zobnidmljwwrthebnizf:SupaBase6991Rules!!!@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
SUPABASE_URL=https://test.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test
SUPABASE_SERVICE_KEY=test-service-key
```

### Step 2: Initialize Database Tables
Run the migration to create the leads table:

```bash
cd backend
npm run db:migrate
```

Or manually:
```bash
psql "postgresql://postgres.zobnidmljwwrthebnizf:SupaBase6991Rules!!!@aws-0-us-east-1.pooler.supabase.com:5432/postgres" < migrations/001_create_leads_table.sql
```

### Step 3: Test Database Connection
```bash
# Restart the backend server
npm run dev

# Test health check
curl http://localhost:3001/api/health
```

## For Frontend Claude

No changes needed! The frontend already expects the database to work.

## Testing

1. Import emails from Gmail settings page
2. Leads should save to database
3. View leads in the leads page
4. Everything should work!

## Benefits

- No complex in-memory code needed
- Data persists permanently
- All existing features work
- Much simpler solution!

## If Database Connection Fails

Only then consider the in-memory approach as a fallback.