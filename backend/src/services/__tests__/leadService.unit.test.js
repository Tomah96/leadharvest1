const LeadService = require('../leadService');
const LeadModel = require('../../models/leadModel');
const { AppError } = require('../../middleware/errorHandler');

// Mock the LeadModel
jest.mock('../../models/leadModel', () => ({
  upsert: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  getStats: jest.fn()
}));

describe('LeadService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('normalizePhone', () => {
    it('should normalize 10-digit US phone numbers', () => {
      expect(LeadService.normalizePhone('(570) 217-6372')).toBe('5702176372');
      expect(LeadService.normalizePhone('570-217-6372')).toBe('5702176372');
      expect(LeadService.normalizePhone('570.217.6372')).toBe('5702176372');
      expect(LeadService.normalizePhone('5702176372')).toBe('5702176372');
    });

    it('should normalize 11-digit US phone numbers with country code', () => {
      expect(LeadService.normalizePhone('1-570-217-6372')).toBe('5702176372');
      expect(LeadService.normalizePhone('15702176372')).toBe('5702176372');
      expect(LeadService.normalizePhone('+1 (570) 217-6372')).toBe('5702176372');
    });

    it('should return cleaned version for other formats', () => {
      expect(LeadService.normalizePhone('123')).toBe('123');
      expect(LeadService.normalizePhone('123456789012')).toBe('123456789012');
    });

    it('should return null for empty phone', () => {
      expect(LeadService.normalizePhone('')).toBe(null);
      expect(LeadService.normalizePhone(null)).toBe(null);
      expect(LeadService.normalizePhone(undefined)).toBe(null);
    });
  });

  describe('determineMissingInfo', () => {
    it('should return empty array when all required fields are present', () => {
      const lead = {
        first_name: 'John',
        last_name: 'Doe',
        phone: '5702176372',
        email: 'john@example.com',
        move_in_date: '2025-08-01',
        income: 50000,
        credit_score: '720-799'
      };

      expect(LeadService.determineMissingInfo(lead)).toEqual([]);
    });

    it('should identify missing required fields', () => {
      const lead = {
        first_name: 'John',
        phone: '5702176372',
        email: '',
        income: null
      };

      const missing = LeadService.determineMissingInfo(lead);
      expect(missing).toContain('Last name');
      expect(missing).toContain('Email address');
      expect(missing).toContain('Move-in date');
      expect(missing).toContain('Income');
      expect(missing).toContain('Credit score');
      expect(missing).not.toContain('First name');
      expect(missing).not.toContain('Phone number');
    });
  });

  describe('createOrUpdateLead', () => {
    it('should create new lead when phone does not exist', async () => {
      const leadData = {
        first_name: 'John',
        last_name: 'Doe',
        phone: '(570) 217-6372',
        email: 'john@example.com'
      };

      const now = new Date().toISOString();
      const createdLead = {
        id: '123',
        ...leadData,
        phone: '5702176372',
        created_at: now,
        updated_at: now
      };

      LeadModel.upsert.mockResolvedValue(createdLead);

      const result = await LeadService.createOrUpdateLead(leadData);

      expect(result.lead).toEqual(createdLead);
      expect(result.isNew).toBe(true);
      expect(LeadModel.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          phone: '5702176372',
          status: 'new',
          source: 'manual',
          missing_info: expect.any(Array)
        }),
        '5702176372'
      );
    });

    it('should update existing lead when phone exists', async () => {
      const leadData = {
        first_name: 'John Updated',
        phone: '(570) 217-6372',
        email: 'john.updated@example.com'
      };

      const updatedLead = {
        id: '123',
        ...leadData,
        phone: '5702176372',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: new Date().toISOString()
      };

      LeadModel.upsert.mockResolvedValue(updatedLead);

      const result = await LeadService.createOrUpdateLead(leadData);

      expect(result.lead).toEqual(updatedLead);
      expect(result.isNew).toBe(false);
    });

    it('should throw error when phone is missing', async () => {
      const leadData = {
        first_name: 'John',
        email: 'john@example.com'
      };

      await expect(LeadService.createOrUpdateLead(leadData))
        .rejects.toThrow(AppError);
      
      await expect(LeadService.createOrUpdateLead(leadData))
        .rejects.toThrow('Phone number is required');
    });

    it('should parse income from string format', async () => {
      const leadData = {
        phone: '5702176372',
        income: '$50,000.00'
      };

      LeadModel.upsert.mockResolvedValue({
        id: '123',
        ...leadData,
        income: 50000
      });

      await LeadService.createOrUpdateLead(leadData);

      expect(LeadModel.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          income: 50000
        }),
        '5702176372'
      );
    });
  });

  describe('processEmailLead', () => {
    it('should process email lead data correctly', async () => {
      const emailData = {
        source: 'zillow',
        first_name: 'Shane',
        last_name: 'Farmer',
        phone: '570-217-6372',
        email: 'shane.farmer@example.com',
        property: '1414 W Diamond St #1',
        credit_score: '720-799',
        income: 34992,
        move_in_date: '2025-08-01',
        pets: true,
        occupants: 3,
        lease_length: 12,
        gmail_message_id: 'msg123',
        notes: 'I would like to schedule a tour'
      };

      const processedLead = {
        id: '123',
        ...emailData,
        phone: '5702176372'
      };

      LeadModel.upsert.mockResolvedValue(processedLead);

      const result = await LeadService.processEmailLead(emailData);

      expect(result.lead).toEqual(processedLead);
      expect(LeadModel.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          source: 'zillow',
          phone: '5702176372',
          property: '1414 W Diamond St #1',
          property_address: '1414 W Diamond St #1',
          gmail_message_id: 'msg123'
        }),
        '5702176372'
      );
    });

    it('should handle legacy property_address field', async () => {
      const emailData = {
        phone: '5702176372',
        property_address: '123 Main St'
      };

      LeadModel.upsert.mockResolvedValue({ id: '123' });

      await LeadService.processEmailLead(emailData);

      expect(LeadModel.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          property: '123 Main St',
          property_address: '123 Main St'
        }),
        '5702176372'
      );
    });
  });
});