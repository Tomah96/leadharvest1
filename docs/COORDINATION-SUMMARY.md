# Task Coordination Summary - Zillow Parser & Display Fixes

**Date**: 2025-08-14
**Orchestrator**: Claude 1
**Status**: Tasks Assigned

## Problem Summary

The Mackenzie Bohs lead (and other Zillow leads) have three main issues:
1. **Missing last names** - Only showing "Mackenzie" not "Mackenzie Bohs"
2. **Wrong pets display** - Shows "Has pets" when data says "No pets"
3. **Wrong income display** - $120,000 annual shows as "$120,000/mo ($1,440,000/yr)"

## Root Causes Identified

1. **Name Issue**: Parser extracts from subject line first (only has "Mackenzie"), doesn't use body which has full name "Mackenzie Bohs says:"
2. **Pets Issue**: Storing "false" as string which JavaScript treats as truthy
3. **Income Issue**: No detection of whether income is monthly or annual

## Task Assignments

### Claude 2 (Backend) - `/docs/CLAUDE-2-BACKEND-TASKS.md`
1. Fix name extraction - Use "X says:" pattern to get full name
2. Fix pets storage - Store null for no pets, pet type for yes
3. Add income type detection - Check for annual/monthly keywords

### Claude 3 (Frontend) - `/docs/CLAUDE-3-FRONTEND-TASKS.md`
1. Fix pets display - Handle string "false" correctly
2. Fix income display - Detect annual (>$10k) vs monthly
3. Display full names when available

## Implementation Order
1. Both Claudes can work in parallel (20 min each)
2. Test with Mackenzie lead (ID 365)
3. Re-import emails to update all data
4. Verify all displays are correct

## Test Lead - Mackenzie (ID 365)

**Current (Wrong)**:
- Name: Mackenzie (missing Bohs)
- Pets: Has pets (should be No pets)
- Income: $120,000/mo ($1,440,000/yr) (should be $120,000/yr)

**Expected (After Fix)**:
- Name: Mackenzie Bohs
- Pets: No pets
- Income: $120,000/yr

## Communication
- Claude 2 and 3: Report progress in `/docs/AGENT-COMMUNICATION-LOG.md`
- Update `/docs/ACTIVE-WORK-LOG.md` when complete
- Notify Claude 1 for integration testing

## Success Metrics
- ✅ All Zillow leads show full names
- ✅ Pets display correctly (No/Yes with type)
- ✅ Income displays with correct frequency (/yr or /mo)