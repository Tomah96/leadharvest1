# Claude Prompts for Lead Details Feature

## For Claude 2 (Backend Developer)

```
You're Claude 2, the Backend developer for LeadHarvest CRM. 

FIRST, read the current state and recent work:
cat /mnt/c/Users/12158/LeadHarvest/docs/CURRENT-STATE.md
tail -50 /mnt/c/Users/12158/LeadHarvest/docs/ACTIVE-WORK-LOG.md

Your task is in: /mnt/c/Users/12158/LeadHarvest/docs/tasks/backend-lead-details-api.md

Please verify (and enhance if needed) the GET /api/leads/:id endpoint to ensure it returns all required fields for the lead details display. This endpoint probably already exists - check first before creating anything new.

IMPORTANT:
1. First check if the endpoint exists in /backend/src/routes/leadRoutes.js
2. Test with actual lead IDs from the database
3. Once verified, communicate the exact response format to Claude 3 via AGENT-COMMUNICATION-LOG.md
4. Update ACTIVE-WORK-LOG.md with:
   - Endpoint status (existing/modified/created)
   - Response format
   - Any changes made
5. If any issues, document in blockers-and-issues.md
6. When done, update progress-reports.md

Remember: The endpoint likely exists already. Don't recreate - just verify and document. Think horses not zebras.
```

## For Claude 3 (Frontend Developer)

```
You're Claude 3, the Frontend developer for LeadHarvest CRM.

FIRST, read the current state and recent work:
cat /mnt/c/Users/12158/LeadHarvest/docs/CURRENT-STATE.md
tail -50 /mnt/c/Users/12158/LeadHarvest/docs/ACTIVE-WORK-LOG.md

Your task is in: /mnt/c/Users/12158/LeadHarvest/docs/tasks/frontend-lead-details-page.md

Please implement the lead details page that displays comprehensive lead information when clicking on a lead from the leads list. Focus on minimalistic design using our existing Tailwind patterns.

IMPORTANT:
1. Check if Claude 2 has confirmed the API endpoint format in AGENT-COMMUNICATION-LOG.md
2. Use existing patterns from /frontend/app/leads/page.tsx
3. After completing, update ACTIVE-WORK-LOG.md with:
   - What you implemented
   - Any issues encountered
   - Files modified
4. If blocked, document in blockers-and-issues.md
5. When done, update progress-reports.md

Remember: The codebase is complete - check for existing components and patterns first. Think horses not zebras - simple solutions over complex ones.
```

## Coordination Instructions for User

### Starting Order:
1. **Start Claude 2 (Backend) FIRST** - They need to verify/prepare the API
2. **Wait for Claude 2 to confirm** endpoint is ready
3. **Then start Claude 3 (Frontend)** with the API format confirmed

### What to Monitor:
- Check AGENT-COMMUNICATION-LOG.md for inter-Claude messages
- Check blockers-and-issues.md if either gets stuck
- Check ACTIVE-WORK-LOG.md for progress updates
- Check progress-reports.md for completions

### Expected Timeline:
- Claude 2 (Backend): 15-30 minutes to verify/test endpoint
- Claude 3 (Frontend): 45-60 minutes to implement UI
- Total: ~1.5 hours for complete feature

### Success Criteria:
✅ Click on lead in list → navigates to /leads/[id]
✅ Lead details page shows all information
✅ Clean, minimalistic design
✅ Both Claudes have updated documentation

## Quick Check Commands

After both complete, verify with:
```bash
# Check what was done
tail -100 /mnt/c/Users/12158/LeadHarvest/docs/ACTIVE-WORK-LOG.md

# Check for issues
cat /mnt/c/Users/12158/LeadHarvest/docs/blockers-and-issues.md

# Check completion
tail -50 /mnt/c/Users/12158/LeadHarvest/docs/progress-reports.md

# Test the feature
curl http://localhost:3001/api/leads/[some-id]  # Backend
# Then navigate to http://localhost:3000/leads/[some-id] in browser  # Frontend
```