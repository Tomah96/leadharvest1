# Backend Claude - Day 6 Tasks

## Priority 1: Make Database Optional for Gmail Testing

### Context
The server currently fails to start with test Supabase credentials. We need Gmail-only testing to work without a database.

### Tasks

1. **Modify Lead Endpoints to Handle No Database**
   - In `/backend/src/controllers/leadController.js`:
     - Add database availability checks using `leadModel.checkDatabase()`
     - Return appropriate messages when database is unavailable
     - For GET /api/leads: Return empty array or mock data
     - For POST /api/leads: Return success with mock response

2. **Create Gmail Test Endpoints**
   - Add new routes that don't require database:
     - `GET /api/gmail/test/labels` - Search labels and show email counts
     - `POST /api/gmail/test/import` - Import 3/5/10 emails from a label
     - `GET /api/gmail/test/parse/:messageId` - Parse a specific email and return console output

3. **Enhanced Console Logging**
   - When parsing emails, console.log the parsed data in a clear format:
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

4. **Server Startup Message**
   - Add clear console message when database is not available:
     ```
     ⚠️  Database not configured - running in Gmail-only mode
     ✅ Gmail integration available at /api/gmail/*
     ❌ Lead management endpoints disabled
     ```

### Success Criteria
- Server starts successfully without valid Supabase credentials
- Gmail test endpoints work independently
- Clear console output for parsed emails
- Frontend can test Gmail integration without database

### Files to Modify
- `/backend/src/controllers/leadController.js`
- `/backend/src/routes/gmailRoutes.js`
- `/backend/src/services/gmailService.js`
- `/backend/server.js`