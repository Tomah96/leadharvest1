const request = require('supertest');
const express = require('express');
const leadRoutes = require('../leadRoutes');
const LeadService = require('../../services/leadService');
const { errorHandler } = require('../../middleware/errorHandler');

// Mock dependencies
jest.mock('../../services/leadService');
jest.mock('../../middleware/auth', () => ({
  authenticate: (req, res, next) => {
    req.user = { id: 'test-user' };
    setImmediate(next); // Use setImmediate for faster async execution
  }
}));

// Create test app
const app = express();
app.use(express.json());
app.use('/api/leads', leadRoutes);
app.use(errorHandler);

describe('Lead Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/leads', () => {
    it('should create new lead with valid data', async () => {
      const leadData = {
        phone: '5702176372',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com'
      };

      const createdLead = {
        id: '123',
        ...leadData,
        status: 'new'
      };

      LeadService.createOrUpdateLead.mockResolvedValue({
        lead: createdLead,
        isNew: true
      });

      const response = await request(app)
        .post('/api/leads')
        .send(leadData)
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        message: 'Lead created successfully',
        lead: createdLead
      });

      expect(LeadService.createOrUpdateLead).toHaveBeenCalledWith(leadData);
    });

    it('should update existing lead based on phone', async () => {
      const leadData = {
        phone: '5702176372',
        first_name: 'John Updated'
      };

      const updatedLead = {
        id: '123',
        ...leadData,
        status: 'contacted'
      };

      LeadService.createOrUpdateLead.mockResolvedValue({
        lead: updatedLead,
        isNew: false
      });

      const response = await request(app)
        .post('/api/leads')
        .send(leadData)
        .expect(200);

      expect(response.body.message).toBe('Lead updated successfully');
    });

    it('should validate required phone field', async () => {
      const response = await request(app)
        .post('/api/leads')
        .send({
          first_name: 'John',
          email: 'john@example.com'
        })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
      expect(response.body.details).toContainEqual(
        expect.objectContaining({
          field: 'phone',
          message: 'phone is required'
        })
      );
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/leads')
        .send({
          phone: '5702176372',
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body.details).toContainEqual(
        expect.objectContaining({
          field: 'email',
          message: 'email has invalid format'
        })
      );
    });
  });

  describe('GET /api/leads', () => {
    it('should return paginated leads', async () => {
      const mockLeads = [
        { id: '1', first_name: 'John', phone: '5702176372' },
        { id: '2', first_name: 'Jane', phone: '5702176373' }
      ];

      LeadService.getAllLeads.mockResolvedValue({
        leads: mockLeads,
        pagination: {
          page: 1,
          limit: 50,
          total: 2,
          pages: 1
        }
      });

      const response = await request(app)
        .get('/api/leads')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        leads: mockLeads,
        pagination: {
          page: 1,
          limit: 50,
          total: 2,
          pages: 1
        }
      });
    });

    it('should accept filter parameters', async () => {
      LeadService.getAllLeads.mockResolvedValue({
        leads: [],
        pagination: { page: 1, limit: 50, total: 0, pages: 0 }
      });

      await request(app)
        .get('/api/leads?status=new&source=zillow&missingInfo=true&search=john')
        .expect(200);

      expect(LeadService.getAllLeads).toHaveBeenCalledWith({
        page: 1,
        limit: 50,
        status: 'new',
        source: 'zillow',
        missingInfo: 'true',
        search: 'john'
      });
    });
  });

  describe('GET /api/leads/:id', () => {
    it('should return single lead by ID', async () => {
      const mockLead = {
        id: '123',
        first_name: 'John',
        phone: '5702176372'
      };

      LeadService.getLeadById.mockResolvedValue(mockLead);

      const response = await request(app)
        .get('/api/leads/123e4567-e89b-12d3-a456-426614174000')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        lead: mockLead
      });
    });

    it('should validate UUID format', async () => {
      const response = await request(app)
        .get('/api/leads/invalid-uuid')
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('PATCH /api/leads/:id', () => {
    it('should update lead fields', async () => {
      const updates = {
        status: 'contacted',
        notes: 'Called and left voicemail'
      };

      const updatedLead = {
        id: '123',
        ...updates,
        phone: '5702176372'
      };

      LeadService.updateLead.mockResolvedValue(updatedLead);

      const response = await request(app)
        .patch('/api/leads/123e4567-e89b-12d3-a456-426614174000')
        .send(updates)
        .expect(200);

      expect(response.body.lead).toEqual(updatedLead);
      expect(LeadService.updateLead).toHaveBeenCalledWith(
        '123e4567-e89b-12d3-a456-426614174000',
        updates
      );
    });
  });

  describe('DELETE /api/leads/:id', () => {
    it('should soft delete lead', async () => {
      const deletedLead = {
        id: '123',
        status: 'deleted',
        deleted_at: new Date().toISOString()
      };

      LeadService.deleteLead.mockResolvedValue(deletedLead);

      const response = await request(app)
        .delete('/api/leads/123e4567-e89b-12d3-a456-426614174000')
        .expect(200);

      expect(response.body.message).toBe('Lead deleted successfully');
    });
  });

  describe('GET /api/leads/stats', () => {
    it('should return lead statistics', async () => {
      const mockStats = {
        total: 100,
        statusDistribution: {
          new: 40,
          contacted: 30,
          qualified: 20,
          closed: 10
        }
      };

      LeadService.getLeadStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/leads/stats')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        stats: mockStats
      });
    });
  });
});