# Day 8: Database Schema Fix & Property Fields Implementation

## Problem Summary
The lead import is failing because of a mismatch between the database schema and the code. The actual Supabase database is missing key fields that the migration file defines, and we need to properly handle property addresses with unit extraction.

## Current Database Analysis

### Fields that EXIST in Supabase:
- ✅ `first_name`, `last_name`, `phone`, `email`
- ✅ `source`, `status`, `notes`
- ✅ `income`, `credit_score`, `move_in_date`, `pets`, `occupants`
- ✅ `property_id`, `inquiry_date`

### Fields that DON'T EXIST (but code expects):
- ❌ `property_address` - Need to add
- ❌ `property` - Need to add or use property_address
- ❌ `unit` - Need to add for unit extraction
- ❌ `lease_length` - Need to add
- ❌ `missing_info` - Skip (use frontend only)
- ❌ `parsing_errors` - Skip (use logging only)

## Requirements
1. Add `property_address` field to store full address
2. Add `unit` field to extract and store unit numbers/letters
3. Add `lease_length` field for lease duration
4. Extract units from addresses (e.g., "123 Main St 408" → unit: "408")
5. Allow NULL values for missing information

## Task Division

### Claude 1 (Orchestrator) - Database & Integration
**Priority: CRITICAL - Do First**
1. Create SQL migration script for Supabase
2. Document the SQL commands for manual execution
3. Test database connection after schema update
4. Coordinate between teams
5. Perform final integration testing

**Files to create/modify:**
- `/backend/migrations/003_add_property_fields.sql` (CREATE)
- `/docs/database-update-instructions.md` (CREATE)

### Claude 2 (Backend) - API & Parsing Logic
**Priority: HIGH - Start after Claude 1 creates migration**
1. Update `leadService.js` to use new fields
2. Create unit extraction utility function
3. Update email parsing to extract units
4. Ensure NULL handling for missing data
5. Test with the 5 sample emails

**Files to modify:**
- `/backend/src/services/leadService.js`
- `/backend/src/utils/addressParser.js` (CREATE)
- `/backend/src/parsers/*.js` (update to use new fields)

**Unit Extraction Logic:**
```javascript
// Extract unit from addresses like:
// "123 Main St 408" → {address: "123 Main St", unit: "408"}
// "5914 Tackawanna St #A" → {address: "5914 Tackawanna St", unit: "A"}
// "1820 N 17th St, Unit 2B" → {address: "1820 N 17th St", unit: "2B"}
```

### Claude 3 (Frontend) - Display Updates
**Priority: MEDIUM - Can start immediately**
1. Update lead display to show property_address and unit
2. Add lease_length to lead details view
3. Update ImportReview component to display new fields
4. Add unit field to lead edit forms
5. Update type definitions

**Files to modify:**
- `/frontend/src/types/index.ts`
- `/frontend/src/components/leads/LeadCard.tsx`
- `/frontend/src/components/leads/LeadDetails.tsx`
- `/frontend/src/components/gmail/ImportReview.tsx`
- `/frontend/src/components/leads/LeadForm.tsx`

## Implementation Order

### Phase 1: Database Setup (Claude 1)
```sql
-- Run this in Supabase SQL Editor
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS property_address TEXT,
ADD COLUMN IF NOT EXISTS unit VARCHAR(50),
ADD COLUMN IF NOT EXISTS lease_length INTEGER;

-- Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'leads' 
AND column_name IN ('property_address', 'unit', 'lease_length');
```

### Phase 2: Backend Updates (Claude 2)
1. Remove references to non-existent fields
2. Add new field mappings
3. Implement unit extraction
4. Test parsing with sample emails

### Phase 3: Frontend Updates (Claude 3)
1. Update TypeScript interfaces
2. Display new fields in UI
3. Add form inputs for new fields
4. Test import review flow

## Success Criteria
- [ ] Database has new columns: property_address, unit, lease_length
- [ ] Backend correctly extracts units from addresses
- [ ] All 5 test emails import successfully
- [ ] Frontend displays property address and unit separately
- [ ] No more "column not found" errors
- [ ] Lease length and occupants save when available

## Test Data
The 5 emails to test with:
1. RentMarketplace - 646 W Huntingdon St unit 1
2. Zillow - 5914 Tackawanna St
3. Zillow - 1820 N 17th St #A
4. Zillow - 5914 Tackawanna St
5. Zillow - 5914 Tackawanna St

## Communication Protocol
1. Claude 1 creates migration and notifies when database is ready
2. Claude 2 waits for database update before modifying backend
3. Claude 3 can start frontend work immediately
4. All teams update status in this document
5. Use `/docs/collaboration-status.md` for real-time updates

## Status Updates

### Claude 1 (Orchestrator) Status:
- [ ] Migration SQL created
- [ ] Database update instructions written
- [ ] Database columns verified
- [ ] Integration test plan ready

### Claude 2 (Backend) Status:
- [ ] leadService.js updated
- [ ] addressParser utility created
- [ ] Unit extraction working
- [ ] Email parsing updated
- [ ] Backend tests passing

### Claude 3 (Frontend) Status:
- [ ] Type definitions updated
- [ ] Lead display components updated
- [ ] Import review shows new fields
- [ ] Lead forms include new fields
- [ ] Frontend tests passing

---
*Last Updated: [timestamp]*
*Coordinator: Claude 1 (Orchestrator)*