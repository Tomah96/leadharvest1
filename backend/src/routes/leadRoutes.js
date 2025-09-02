const express = require('express');
const router = express.Router();
const LeadController = require('../controllers/leadController');
const { validateRequest } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

// Validation schemas
const createLeadSchema = {
  body: {
    required: ['phone'],
    properties: {
      phone: { type: 'string', minLength: 10 },
      first_name: { type: 'string', maxLength: 255 },
      last_name: { type: 'string', maxLength: 255 },
      email: { type: 'string', pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$' },
      source: { 
        type: 'string', 
        enum: ['zillow', 'realtor', 'apartments', 'rentmarketplace', 'manual'] 
      },
      status: { 
        type: 'string', 
        enum: ['new', 'contacted', 'qualified', 'closed'] 
      },
      property: { type: 'string' },
      property_address: { type: 'string' },
      credit_score: { type: 'string' },
      income: { type: 'number', min: 0 },
      move_in_date: { type: 'string' },
      occupants: { type: 'number', min: 1 },
      pets: { type: 'boolean' },
      lease_length: { type: 'number', min: 1 }
    }
  }
};

const updateLeadSchema = {
  params: {
    required: ['id'],
    properties: {
      id: { type: 'string', pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' }
    }
  },
  body: {
    properties: {
      first_name: { type: 'string', maxLength: 255 },
      last_name: { type: 'string', maxLength: 255 },
      email: { type: 'string', pattern: '^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$' },
      status: { 
        type: 'string', 
        enum: ['new', 'contacted', 'qualified', 'closed'] 
      },
      property: { type: 'string' },
      property_address: { type: 'string' },
      credit_score: { type: 'string' },
      income: { type: 'number', min: 0 },
      move_in_date: { type: 'string' },
      occupants: { type: 'number', min: 1 },
      pets: { type: 'boolean' },
      lease_length: { type: 'number', min: 1 },
      notes: { type: 'string' }
    }
  }
};

const getLeadsSchema = {
  query: {
    properties: {
      page: { type: 'string', pattern: '^[0-9]+$' },
      limit: { type: 'string', pattern: '^([0-9]+|all)$' },
      search: { type: 'string' },
      status: { 
        type: 'string', 
        enum: ['new', 'contacted', 'qualified', 'closed'] 
      },
      source: { 
        type: 'string', 
        enum: ['zillow', 'realtor', 'apartments', 'rentmarketplace', 'manual'] 
      },
      missingInfo: { type: 'string', enum: ['true', 'false'] }
    }
  }
};

const getLeadByIdSchema = {
  params: {
    required: ['id'],
    properties: {
      id: { type: 'string', pattern: '^[0-9]+$' } // Accept numeric IDs
    }
  }
};

const bulkDeleteSchema = {
  body: {
    required: ['ids'],
    properties: {
      ids: { 
        type: 'array',
        minItems: 1,
        maxItems: 100,
        items: { type: 'number', minimum: 1 }
      }
    }
  }
};

// Routes
router.post('/', authenticate, validateRequest(createLeadSchema), LeadController.createLead);
router.post('/bulk-delete', authenticate, validateRequest(bulkDeleteSchema), LeadController.bulkDeleteLeads);
router.get('/', authenticate, validateRequest(getLeadsSchema), LeadController.getAllLeads);
router.get('/stats', authenticate, LeadController.getLeadStats);
router.get('/:id', authenticate, validateRequest(getLeadByIdSchema), LeadController.getLeadById);
router.patch('/:id', authenticate, validateRequest(updateLeadSchema), LeadController.updateLead);
router.delete('/:id', authenticate, validateRequest(getLeadByIdSchema), LeadController.deleteLead);

module.exports = router;