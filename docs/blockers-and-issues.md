# LeadHarvest CRM - Blockers and Issues Log

## How to Use This File
When you encounter a blocker:
1. Add entry with timestamp and your role
2. Describe the issue clearly
3. Mark priority: P0 Critical, P1 High, P2 Medium, P3 Low
4. Tag blocking agent with @[agent-name]
5. Orchestrator will review and provide resolution

## Priority Definitions
- **P0 (Critical)**: Blocks all development or production down
- **P1 (High)**: Blocks feature completion or major functionality
- **P2 (Medium)**: Workaround exists but needs fixing
- **P3 (Low)**: Minor issue, can be deferred

---

## Active Blockers

_No active blockers at this time_

---

## In Progress

---

## Resolved

### ✅ P0 [Database] 2025-08-13 - Credit Score VARCHAR Constraint
**Issue**: Database credit_score column was INTEGER, couldn't accept ranges
**Error**: "invalid input syntax for type integer: 580-619"
**Resolution**: Changed column type to VARCHAR(50) in Supabase
**Fixed By**: Claude 1 (Orchestrator) with user database access
**Impact**: All Zillow leads with credit score ranges now import successfully

### ✅ P1 [Backend] 2025-08-13 - Phone Extraction Issue
**Issue**: All leads getting phone number 9999999999
**Error**: HTML parser extracting wrong data from Zillow emails
**Resolution**: Fixed phone extraction logic in zillowParser.js
**Fixed By**: Claude 2 (Backend)
**Impact**: Correct phone numbers now extracted from all sources Issues
*None yet*

---

## Format Example:
```
### 🔴 [Backend] 2025-07-16 15:30 - Database Connection Failure
**Issue**: Cannot connect to Supabase using provided credentials
**Error**: `ECONNREFUSED`
**Attempted Solutions**: 
- Verified .env file exists
- Checked connection string format
**Status**: BLOCKED - Need Orchestrator assistance
```