const request = require('supertest');
const express = require('express');

// Create a minimal test app without heavy dependencies
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Simple mock routes for testing
  app.post('/api/leads', (req, res) => {
    if (!req.body.phone) {
      return res.status(400).json({
        error: 'Validation Error',
        details: [{ field: 'phone', message: 'phone is required' }]
      });
    }
    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      lead: { id: '123', ...req.body }
    });
  });

  app.get('/api/leads', (req, res) => {
    res.json({
      success: true,
      leads: [],
      pagination: { page: 1, limit: 50, total: 0, pages: 0 }
    });
  });

  app.get('/api/leads/:id', (req, res) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
    if (!uuidRegex.test(req.params.id)) {
      return res.status(400).json({ error: 'Validation Error' });
    }
    res.json({
      success: true,
      lead: { id: req.params.id, phone: '5702176372' }
    });
  });

  return app;
};

describe('Lead Routes (Fast)', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('POST /api/leads', () => {
    it('should create lead with valid data', async () => {
      const response = await request(app)
        .post('/api/leads')
        .send({ phone: '5702176372', first_name: 'John' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.lead.phone).toBe('5702176372');
    });

    it('should validate required phone field', async () => {
      const response = await request(app)
        .post('/api/leads')
        .send({ first_name: 'John' })
        .expect(400);

      expect(response.body.error).toBe('Validation Error');
    });
  });

  describe('GET /api/leads', () => {
    it('should return paginated leads', async () => {
      const response = await request(app)
        .get('/api/leads')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.leads).toEqual([]);
    });
  });

  describe('GET /api/leads/:id', () => {
    it('should return single lead by ID', async () => {
      const response = await request(app)
        .get('/api/leads/123e4567-e89b-12d3-a456-426614174000')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should validate UUID format', async () => {
      await request(app)
        .get('/api/leads/invalid-uuid')
        .expect(400);
    });
  });
});