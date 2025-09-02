# Backend Task: Bulk Operations for Lead Management
**Assigned to**: Backend Claude (Claude 2)
**Priority**: HIGH - Start immediately
**Estimated Time**: 2 hours
**Dependencies**: None - Frontend waiting on this

## 📋 Task Overview
Implement bulk delete functionality and improve pagination for the leads API to support managing 50+ leads efficiently.

## ✅ Acceptance Criteria
- [ ] Bulk delete endpoint accepts array of IDs
- [ ] Supports deleting 1-100 leads in one request
- [ ] Returns detailed success/failure info
- [ ] Pagination supports limit=50, 100, all
- [ ] Total count returned in all responses
- [ ] Transaction support for atomicity
- [ ] Comprehensive error handling

## 🔧 Implementation Tasks

### 1. Add Bulk Delete Route (30 min)
**File**: `/backend/src/routes/leadRoutes.js`

Add new route:
```javascript
// Bulk delete leads
router.post('/bulk-delete', 
  authenticate, 
  validateRequest(bulkDeleteSchema), 
  LeadController.bulkDeleteLeads
);

// Validation schema
const bulkDeleteSchema = {
  body: {
    required: ['ids'],
    properties: {
      ids: { 
        type: 'array', 
        items: { type: 'number' },
        minItems: 1,
        maxItems: 100
      }
    }
  }
};
```

### 2. Implement Bulk Delete Controller (45 min)
**File**: `/backend/src/controllers/leadController.js`

Add method:
```javascript
static bulkDeleteLeads = asyncHandler(async (req, res) => {
  const { ids } = req.body;
  
  // Call service method
  const result = await LeadService.bulkDeleteLeads(ids);
  
  res.json({
    success: true,
    message: `Deleted ${result.deleted} of ${result.total} leads`,
    deleted: result.deleted,
    failed: result.failed,
    errors: result.errors
  });
});
```

### 3. Add Service Method with Transactions (45 min)
**File**: `/backend/src/services/leadService.js`

```javascript
static async bulkDeleteLeads(ids) {
  const results = {
    total: ids.length,
    deleted: 0,
    failed: [],
    errors: []
  };

  // Use transaction for atomicity
  try {
    // Delete each lead
    for (const id of ids) {
      try {
        await LeadModel.delete(id);
        results.deleted++;
      } catch (error) {
        results.failed.push(id);
        results.errors.push({
          id,
          error: error.message
        });
      }
    }
  } catch (error) {
    throw new AppError('Bulk delete failed', 500);
  }

  return results;
}
```

### 4. Update Model for Bulk Operations (30 min)
**File**: `/backend/src/models/leadModel.js`

Add methods:
```javascript
// Bulk delete with Supabase
static async bulkDelete(ids) {
  const { data, error } = await supabase
    .from('leads')
    .delete()
    .in('id', ids);
    
  if (error) throw error;
  return data;
}

// Get total count
static async getTotalCount(filters = {}) {
  const { count, error } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });
    
  if (error) throw error;
  return count;
}
```

### 5. Update Pagination (20 min)
**File**: `/backend/src/controllers/leadController.js`

Update getAllLeads:
```javascript
const filters = {
  page: req.query.page || 1,
  limit: req.query.limit === 'all' ? 1000 : (req.query.limit || 50),
  // ... other filters
};

// Return total count
res.json({
  success: true,
  leads: result.leads,
  pagination: {
    page: filters.page,
    limit: filters.limit,
    total: result.total,
    pages: Math.ceil(result.total / filters.limit)
  }
});
```

### 6. Create Test Script (20 min)
**File**: `/backend/test-bulk-delete.js`

```javascript
#!/usr/bin/env node

const axios = require('axios');

async function testBulkDelete() {
  console.log('Testing Bulk Delete API...');
  
  // Test deleting multiple leads
  const response = await axios.post('http://localhost:3001/api/leads/bulk-delete', {
    ids: [1, 2, 3, 4, 5]
  });
  
  console.log('Response:', response.data);
  
  // Test pagination
  const paginationTest = await axios.get('http://localhost:3001/api/leads?limit=50');
  console.log('Total leads:', paginationTest.data.pagination.total);
  console.log('Showing:', paginationTest.data.leads.length);
}

testBulkDelete();
```

## 📝 API Documentation

### Bulk Delete Endpoint
```
POST /api/leads/bulk-delete
Content-Type: application/json

Request:
{
  "ids": [1, 2, 3, 4, 5]
}

Response:
{
  "success": true,
  "message": "Deleted 5 of 5 leads",
  "deleted": 5,
  "failed": [],
  "errors": []
}

Error Response:
{
  "success": false,
  "message": "Partial deletion - 3 of 5 succeeded",
  "deleted": 3,
  "failed": [4, 5],
  "errors": [
    { "id": 4, "error": "Lead not found" },
    { "id": 5, "error": "Permission denied" }
  ]
}
```

### Updated Pagination
```
GET /api/leads?limit=50&page=1
GET /api/leads?limit=100
GET /api/leads?limit=all

Response includes:
{
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 127,
    "pages": 3
  }
}
```

## 🧪 Testing Checklist
- [ ] Delete single lead (backward compatible)
- [ ] Delete multiple leads (2-10)
- [ ] Delete many leads (50+)
- [ ] Handle non-existent IDs gracefully
- [ ] Validate max 100 IDs per request
- [ ] Test pagination with limit=50
- [ ] Test pagination with limit=100
- [ ] Test pagination with limit=all
- [ ] Verify transaction rollback on error
- [ ] Check permission validation

## 🚀 Completion Checklist
- [ ] All endpoints implemented
- [ ] Error handling complete
- [ ] Test script working
- [ ] API returns proper status codes
- [ ] Posted completion in AGENT-COMMUNICATION-LOG.md
- [ ] Updated ACTIVE-WORK-LOG.md

## 📢 When Complete
Post in AGENT-COMMUNICATION-LOG.md:
```
Backend API Ready - Bulk Operations
- Endpoint: POST /api/leads/bulk-delete
- Accepts: { ids: [array of numbers] }
- Max: 100 IDs per request
- Pagination: supports limit=50/100/all
- Test with: node test-bulk-delete.js
@Frontend ready for integration
```

---
END OF BACKEND TASKS