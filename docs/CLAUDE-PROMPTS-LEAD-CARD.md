# Claude Prompts for Lead Card Enhancement

## For Claude 2 (Backend Developer) - START FIRST

```
You're Claude 2, the Backend developer for LeadHarvest CRM.

FIRST, read the current state and recent work:
cat /mnt/c/Users/12158/LeadHarvest/docs/CURRENT-STATE.md
tail -50 /mnt/c/Users/12158/LeadHarvest/docs/ACTIVE-WORK-LOG.md

Your task is in: /mnt/c/Users/12158/LeadHarvest/docs/tasks/backend-fix-lead-parsing.md

The email parsers are not correctly extracting lead information. For example, Lead 299 has "First Name: Tynesia" and "Last Name: Clanton" in the notes, but first_name shows "RentMarketplace." 

Please fix the parsers, especially RentMarketplace parser which is clearly broken. Focus on:
1. Extracting names correctly from email content
2. Parsing financial data when present
3. Extracting preferences (move-in date, pets, etc.)
4. Test with existing leads and re-parse them

IMPORTANT:
1. Check existing parsers in /backend/src/services/parsers/
2. Fix the extraction logic (likely regex issues)
3. Test with lead 299 which clearly has wrong name extraction
4. Update ACTIVE-WORK-LOG.md with your fixes
5. Communicate to Claude 3 when parsing is fixed

Remember: Simple regex fixes, not complex rewrites. The data is there, just being extracted wrong.
```

## For Claude 3 (Frontend Developer) - START AFTER BACKEND

```
You're Claude 3, the Frontend developer for LeadHarvest CRM.

FIRST, read the current state and recent work:
cat /mnt/c/Users/12158/LeadHarvest/docs/CURRENT-STATE.md
tail -50 /mnt/c/Users/12158/LeadHarvest/docs/ACTIVE-WORK-LOG.md

Your task is in: /mnt/c/Users/12158/LeadHarvest/docs/tasks/frontend-enhance-lead-card.md

The lead details page works but needs better presentation. Many fields show "Not provided" which is poor UX, and there's no indication of data quality.

Please enhance the lead card display with:
1. Better empty state messages (contextual, not generic)
2. Data quality indicators (warn if parsing seems wrong)
3. Profile completeness percentage
4. Formatted phone numbers and relative dates
5. Collapsible section for original email notes

IMPORTANT:
1. Work in /frontend/src/app/leads/[id]/page.tsx
2. Keep the minimalistic design
3. Use existing Tailwind patterns
4. Wait for Claude 2 to fix parsing first
5. Update ACTIVE-WORK-LOG.md with your changes

Focus on making the existing data more presentable and adding helpful context for missing data.
```

## Coordination Instructions

### Order of Execution:
1. **Claude 2 (Backend) goes FIRST**
   - Fix the parsers (30-45 minutes)
   - Test with existing leads
   - Communicate when complete

2. **Claude 3 (Frontend) goes SECOND**
   - Wait for parsing fixes
   - Enhance the display (45-60 minutes)
   - Test with re-parsed data

### What They'll Fix:

**Backend Issues**:
- Lead 299 shows first_name as "RentMarketplace." instead of "Tynesia"
- Last name not being extracted
- Financial data not being parsed
- Preference data not being extracted

**Frontend Issues**:
- Too many "Not provided" messages
- No data quality indicators
- Poor formatting of existing data
- No indication of completeness

### Expected Outcome:
- Leads show correct names and data
- Missing fields have helpful context
- Users can see data quality at a glance
- Original email content is accessible
- Clean, informative lead cards

### Success Check:
```bash
# After Backend completes:
curl http://localhost:3001/api/leads/299 | python3 -m json.tool
# Should show first_name: "Tynesia", last_name: "Clanton"

# After Frontend completes:
# Navigate to http://localhost:3000/leads/299
# Should see properly formatted lead card with all improvements
```