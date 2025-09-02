# Day 5 Assignments - Gmail Integration Testing

Date: 2025-07-17

## 🎯 Day 5 Goal: Test Gmail Integration with Console Logging

Today we'll connect Gmail, fetch "processed-lead" emails, and analyze them with console logging before any database operations.

---

## Task Division

### Backend Team (Claude 2)
**Focus**: Gmail API integration and email detection
**Key Files**: 
- `/backend/.env` - Add real credentials
- `/backend/src/services/gmailService.js` - Add label detection
- `/backend/src/controllers/gmailController.js` - Create test endpoints

**Deliverables**:
1. OAuth flow working with real credentials
2. Can find "processed-lead" label
3. Test endpoints return email data
4. Console shows parsing results

### Frontend Team (Claude 3)
**Focus**: Test UI for Gmail integration
**Key Files**:
- `/frontend/src/app/test/gmail/page.tsx` - Test dashboard
- `/frontend/src/components/gmail/TestResults.tsx` - Results display
- `/frontend/src/lib/api-client.ts` - Add test methods

**Deliverables**:
1. Gmail test dashboard page
2. OAuth flow UI working
3. Display test results clearly
4. Show console output in UI

---

## Integration Points

1. **OAuth Flow**:
   - Frontend initiates → Backend handles → Redirects back
   - Port 3001 for all callbacks

2. **Test Endpoints**:
   - `/api/gmail/test-connection` - Check if connected
   - `/api/gmail/test-processed-leads` - Fetch sample emails

3. **Response Formats**:
   - Both teams use types defined in frontend-day5.md
   - Console logs should be descriptive

---

## Success Metrics

By end of day, we should see:
1. ✅ Gmail OAuth completes successfully
2. ✅ "processed-lead" label found
3. ✅ 10 sample emails fetched and analyzed
4. ✅ Source detection working (zillow, realtor, etc.)
5. ✅ Parse success rate visible
6. ✅ Unknown emails identified for investigation

---

## Timeline

- **Morning**: Set up credentials and OAuth flow
- **Midday**: Test email fetching and detection
- **Afternoon**: Build UI to display results
- **End of Day**: Full test showing email analysis

---

## Important Notes

1. **No Database Operations**: Just console.log and return data
2. **Real Credentials**: Backend needs the provided Google OAuth credentials
3. **Port Consistency**: Everything on port 3001
4. **Error Handling**: Log all errors clearly

Remember: This is a test phase to verify our parsers work with real emails before importing 4000+ emails!