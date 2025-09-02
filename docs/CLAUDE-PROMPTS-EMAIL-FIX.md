# Ready-to-Use Claude Prompts for Email Parsing Fix

## 🔧 For Backend Claude (Claude 2)

Copy and paste this entire prompt:

```
You are the Backend Claude for LeadHarvest. Read the task delegation file first:

cat /mnt/c/Users/12158/LeadHarvest/docs/EMAIL-PARSING-FIX-TASKS.md

Your main task is to fix the Zillow email parser that's currently broken. Lead 302 (Autanya Lucas) is missing critical data.

Start by:
1. Reading the current parser: /backend/src/parsers/zillowParser.js
2. Understanding the HTML email format (check the task file for structure)
3. Implementing the fixes outlined in the Backend Tasks section
4. Creating a re-parse script to test your changes
5. Testing with lead 302 specifically

The parser must:
- Strip HTML tags properly 
- Extract full name from "X says:" pattern
- Parse structured data (Move in, Credit score, Income, etc.)
- Store the inquiry message
- Preserve raw email for reference

When complete:
- Update ACTIVE-WORK-LOG.md with your progress
- Post confirmation in AGENT-COMMUNICATION-LOG.md for Frontend Claude
- Include test results showing lead 302 parsed correctly
```

---

## 🎨 For Frontend Claude (Claude 3)

Copy and paste this entire prompt:

```
You are the Frontend Claude for LeadHarvest. Read the task delegation file first:

cat /mnt/c/Users/12158/LeadHarvest/docs/EMAIL-PARSING-FIX-TASKS.md

IMPORTANT: Wait for Backend Claude to confirm the parser is fixed before starting major changes.

Your task is to enhance the lead details display to show ALL the data that will be parsed:
- Financial information (credit score, income)
- Preferences (move-in date, lease length, occupants, bedrooms, pets)
- Inquiry message (prominently displayed)
- Raw email content (in collapsible section)

Start by:
1. Checking AGENT-COMMUNICATION-LOG.md for backend confirmation
2. Reading the current display: /frontend/src/app/leads/[id]/page.tsx
3. Implementing the Frontend Tasks from the delegation file
4. Testing with lead 302 to verify all data displays correctly

Focus on:
- Clear data presentation with icons
- Smart empty states (contextual messages)
- Financial data formatting
- Visual indicators for data quality

When complete:
- Update ACTIVE-WORK-LOG.md with your progress
- Test thoroughly with lead 302
- Ensure all new fields display properly
```

---

## 📋 For Orchestrator (After Both Complete)


Check the completion status:
1. tail -50 /mnt/c/Users/12158/LeadHarvest/docs/ACTIVE-WORK-LOG.md
2. curl -s http://localhost:3001/api/leads/302 | python3 -m json.tool
3. Verify lead 302 shows all data correctly
4. Check frontend at http://localhost:3000/leads/302
5. Update progress-reports.md with completion status
```

---

## 🚨 IMPORTANT COORDINATION NOTES

1. **Backend MUST complete first** - The parser needs to be fixed before frontend can display the data
2. **Use AGENT-COMMUNICATION-LOG.md** - Backend should post when parser is fixed
3. **Test with lead 302** - This is our primary test case (Autanya Lucas)
4. **Document everything** - Both Claudes update ACTIVE-WORK-LOG.md

---

## Quick Test Commands

### For Backend Claude:
```bash
# Test the parser after fixing
curl -s http://localhost:3001/api/leads/302 | grep -E "first_name|last_name|credit_score|income|move_in_date"
```

### For Frontend Claude:
```bash
# Check if frontend is displaying the data
curl -s http://localhost:3000/leads/302 | grep -E "Autanya|Lucas|620|83976|October"
```