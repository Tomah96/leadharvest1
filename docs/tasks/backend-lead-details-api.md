# Task Assignment: Lead Details API Endpoint

**Assigned to**: Claude 3 (Backend)
**Date**: 2025-01-08
**Priority**: High
**Related**: Frontend lead details page (Claude 2)

## Objective
Ensure the GET /api/leads/:id endpoint returns complete lead information for the details page display.

## Requirements

### 1. Endpoint Specification
- **Method**: GET
- **Path**: `/api/leads/:id`
- **Purpose**: Fetch single lead with all details

### 2. Response Format

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "first_name": "John",
    "last_name": "Smith",
    "phone": "5551234567",
    "email": "john@email.com",
    "status": "new",
    
    "property_address": "123 Main St",
    "unit": "4B",
    "inquiry_date": "2025-01-05T10:00:00Z",
    "move_in_date": "2025-02-01",
    
    "credit_score": 720,
    "income": 5000,
    "lease_length": "12 months",
    
    "occupants": 2,
    "pets": "1 small dog",
    "source": "zillow",
    
    "notes": "Interested in corner unit",
    "gmail_message_id": "msg_12345",
    
    "created_at": "2025-01-05T10:00:00Z",
    "updated_at": "2025-01-05T10:00:00Z"
  }
}
```

### 3. Error Responses

**Lead Not Found**:
```json
{
  "success": false,
  "error": "Lead not found",
  "statusCode": 404
}
```

**Invalid ID Format**:
```json
{
  "success": false,
  "error": "Invalid lead ID format",
  "statusCode": 400
}
```

### 4. Implementation Checklist

- [ ] Verify endpoint exists in `/backend/src/routes/leadRoutes.js`
- [ ] Check controller in `/backend/src/controllers/leadController.js`
- [ ] Ensure LeadModel.findById() returns all fields
- [ ] Add proper error handling for not found
- [ ] Validate ID format before query
- [ ] Test with actual lead IDs from database

### 5. Fields to Ensure Are Returned

**Required Fields** (never null):
- id, first_name, last_name, phone, status, created_at

**Optional Fields** (can be null):
- email, property_address, unit, inquiry_date, move_in_date
- credit_score, income, lease_length
- occupants, pets, source, notes
- gmail_message_id, updated_at

### 6. Testing Requirements

Test with curl:
```bash
# Test successful fetch
curl http://localhost:3001/api/leads/[valid-id]

# Test not found
curl http://localhost:3001/api/leads/nonexistent-id

# Test invalid format
curl http://localhost:3001/api/leads/not-a-uuid
```

## Current Status Check

The endpoint likely already exists since we have CRUD operations working. Your task is to:

1. **Verify** it returns ALL fields needed
2. **Enhance** if any fields are missing
3. **Test** with real lead IDs
4. **Document** any changes made

## Implementation Notes

**File Locations**:
- Routes: `/backend/src/routes/leadRoutes.js`
- Controller: `/backend/src/controllers/leadController.js`
- Model: `/backend/src/models/leadModel.js`
- Service: `/backend/src/services/leadService.js`

**Check Existing Code First**:
```bash
# See if endpoint exists
grep -n "/:id" /backend/src/routes/leadRoutes.js

# Check controller method
grep -n "getLeadById" /backend/src/controllers/leadController.js

# Verify model method
grep -n "findById" /backend/src/models/leadModel.js
```

## Communication Protocol

1. **Before Starting**:
   ```bash
   cat /mnt/c/Users/12158/LeadHarvest/docs/CURRENT-STATE.md
   tail -50 /mnt/c/Users/12158/LeadHarvest/docs/ACTIVE-WORK-LOG.md
   ```

2. **Coordinate with Frontend**:
   - Add entry to `/docs/AGENT-COMMUNICATION-LOG.md` when endpoint is ready
   - Note the exact response format for Claude 2

3. **When Complete**:
   - Update `/docs/ACTIVE-WORK-LOG.md` with endpoint status
   - Update `/docs/progress-reports.md` with completion
   - Document in `/docs/api-contracts.md` if needed

## Definition of Done
- [ ] GET /api/leads/:id returns complete lead data
- [ ] All fields listed above are included
- [ ] 404 handling for non-existent leads
- [ ] 400 handling for invalid ID format
- [ ] Tested with real lead IDs
- [ ] Response format documented
- [ ] Frontend can successfully fetch and display data

## Remember
- The endpoint probably already exists - CHECK FIRST
- Don't recreate what's already there
- Focus on ensuring all fields are returned
- Keep it simple - this is a basic GET operation