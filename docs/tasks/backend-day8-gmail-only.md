# Backend Claude - Day 8: Gmail-Only Lead Display

## Overview
We're successfully parsing emails but need to display leads without a database. Create a Gmail-only lead storage system.

## Priority 1: In-Memory Lead Storage

### Create: `/backend/src/services/memoryLeadStore.js`

```javascript
class MemoryLeadStore {
  constructor() {
    this.leads = new Map(); // phone -> lead
    this.leadsByEmail = new Map(); // email -> lead
    this.lastId = 1000;
  }

  // Generate unique ID
  generateId() {
    return `lead_${++this.lastId}`;
  }

  // Create or update lead
  upsertLead(leadData) {
    const phone = leadData.phone || leadData.placeholder_phone;
    
    // Check if lead exists
    let existingLead = this.leads.get(phone);
    
    if (existingLead) {
      // Update existing
      const updated = {
        ...existingLead,
        ...leadData,
        updated_at: new Date().toISOString()
      };
      this.leads.set(phone, updated);
      return { lead: updated, isNew: false };
    }
    
    // Create new
    const newLead = {
      id: this.generateId(),
      ...leadData,
      status: 'new',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    this.leads.set(phone, newLead);
    if (leadData.email) {
      this.leadsByEmail.set(leadData.email, newLead);
    }
    
    return { lead: newLead, isNew: true };
  }

  // Get all leads
  getAllLeads(filters = {}) {
    const leads = Array.from(this.leads.values());
    
    // Apply filters
    let filtered = leads;
    
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(lead => 
        lead.first_name?.toLowerCase().includes(search) ||
        lead.last_name?.toLowerCase().includes(search) ||
        lead.email?.toLowerCase().includes(search) ||
        lead.phone?.includes(search) ||
        lead.property?.toLowerCase().includes(search)
      );
    }
    
    if (filters.status) {
      filtered = filtered.filter(lead => lead.status === filters.status);
    }
    
    if (filters.source) {
      filtered = filtered.filter(lead => lead.source === filters.source);
    }
    
    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const start = (page - 1) * limit;
    const paginatedLeads = filtered.slice(start, start + limit);
    
    return {
      data: paginatedLeads,
      pagination: {
        page,
        limit,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit)
      }
    };
  }

  // Get single lead
  getLeadById(id) {
    for (const lead of this.leads.values()) {
      if (lead.id === id) {
        return lead;
      }
    }
    return null;
  }

  // Update lead
  updateLead(id, updates) {
    const lead = this.getLeadById(id);
    if (!lead) return null;
    
    const updated = {
      ...lead,
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    this.leads.set(lead.phone, updated);
    return updated;
  }

  // Delete lead
  deleteLead(id) {
    const lead = this.getLeadById(id);
    if (!lead) return false;
    
    this.leads.delete(lead.phone);
    if (lead.email) {
      this.leadsByEmail.delete(lead.email);
    }
    return true;
  }

  // Clear all (for testing)
  clear() {
    this.leads.clear();
    this.leadsByEmail.clear();
    this.lastId = 1000;
  }

  // Get stats
  getStats() {
    const leads = Array.from(this.leads.values());
    return {
      total: leads.length,
      byStatus: {
        new: leads.filter(l => l.status === 'new').length,
        contacted: leads.filter(l => l.status === 'contacted').length,
        qualified: leads.filter(l => l.status === 'qualified').length,
        closed: leads.filter(l => l.status === 'closed').length
      },
      bySource: {
        zillow: leads.filter(l => l.source === 'zillow').length,
        realtor: leads.filter(l => l.source === 'realtor').length,
        apartments: leads.filter(l => l.source === 'apartments').length,
        rentmarketplace: leads.filter(l => l.source === 'rentmarketplace').length
      },
      needsPhone: leads.filter(l => l.phone === '9999999999').length
    };
  }
}

// Export singleton
module.exports = new MemoryLeadStore();
```

## Priority 2: Update Lead Service

### Modify: `/backend/src/services/leadService.js`

```javascript
const memoryLeadStore = require('./memoryLeadStore');
const { isDatabaseAvailable } = require('../utils/database');

// In processEmailLead method:
async processEmailLead(parsedData) {
  // ... validation code ...
  
  // Use memory store in Gmail-only mode
  if (!isDatabaseAvailable()) {
    const result = memoryLeadStore.upsertLead(parsedData);
    return {
      success: true,
      lead: result.lead,
      isNew: result.isNew,
      message: result.isNew ? 'Lead created in memory' : 'Lead updated in memory'
    };
  }
  
  // ... existing database code ...
}
```

## Priority 3: Update Lead Model

### Modify: `/backend/src/models/leadModel.js`

Add memory store fallback for all methods:

```javascript
const memoryLeadStore = require('../services/memoryLeadStore');

// In findAll method:
static async findAll(params) {
  if (!this.checkDatabase()) {
    // Use memory store
    return memoryLeadStore.getAllLeads(params);
  }
  // ... existing database code ...
}

// In findById method:
static async findById(id) {
  if (!this.checkDatabase()) {
    const lead = memoryLeadStore.getLeadById(id);
    return lead ? { data: [lead] } : { data: [] };
  }
  // ... existing database code ...
}

// Similar updates for create, update, delete methods
```

## Priority 4: Add Import to Memory Endpoint

### Add to: `/backend/src/controllers/gmailController.js`

```javascript
// New endpoint to import and store in memory
static importToMemory = asyncHandler(async (req, res) => {
  const { labelId, count } = req.body;
  const userId = req.user?.id || 'test-user';
  
  // Use existing import logic
  const emails = await gmailService.fetchEmailsByLabel(userId, labelId, null, count);
  
  let imported = 0;
  let parsed = 0;
  
  for (const email of emails) {
    const emailData = {
      subject: email.subject,
      body: email.body,
      from: email.from,
      date: email.date,
      gmail_message_id: email.id
    };
    
    try {
      const result = await emailParsingService.parseAndProcessEmail(emailData);
      if (result.parsed) {
        imported++;
        parsed++;
      }
    } catch (error) {
      imported++;
      console.error('Import error:', error.message);
    }
  }
  
  // Get current stats
  const stats = memoryLeadStore.getStats();
  
  res.json({
    success: true,
    imported,
    parsed,
    totalLeadsInMemory: stats.total,
    stats
  });
});
```

## Priority 5: Test Endpoints

Add console logging to verify:

```javascript
// In lead controller methods, add:
console.log(`[Gmail-Only Mode] Returning ${leads.length} leads from memory`);
```

## Testing Commands

```bash
# Import emails to memory
curl -X POST http://localhost:3001/api/gmail/import-memory \
  -H "Content-Type: application/json" \
  -d '{"labelId":"Label_16","count":10}'

# Get all leads
curl http://localhost:3001/api/leads

# Get single lead
curl http://localhost:3001/api/leads/lead_1001

# Update lead
curl -X PUT http://localhost:3001/api/leads/lead_1001 \
  -H "Content-Type: application/json" \
  -d '{"phone":"215-555-1234","status":"contacted"}'
```

## Success Criteria

1. Leads API returns data without database
2. Can import emails and store in memory
3. Frontend displays leads from memory
4. CRUD operations work in memory
5. Stats show correct counts
6. Placeholder phones can be updated