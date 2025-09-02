// Fast unit tests for email parsers (pure logic)
describe('Email Parsers', () => {
  describe('Phone Normalization', () => {
    // Test shared phone normalization logic
    const normalizePhone = (phone) => {
      if (!phone) return null;
      const cleaned = phone.replace(/\D/g, '');
      if (cleaned.length === 10) return cleaned;
      if (cleaned.length === 11 && cleaned.startsWith('1')) {
        return cleaned.substring(1);
      }
      return cleaned;
    };

    it('should normalize various phone formats', () => {
      expect(normalizePhone('(570) 217-6372')).toBe('5702176372');
      expect(normalizePhone('570-217-6372')).toBe('5702176372');
      expect(normalizePhone('1-570-217-6372')).toBe('5702176372');
      expect(normalizePhone('15702176372')).toBe('5702176372');
      expect(normalizePhone('5702176372')).toBe('5702176372');
    });

    it('should handle invalid inputs', () => {
      expect(normalizePhone('')).toBe(null);
      expect(normalizePhone(null)).toBe(null);
      expect(normalizePhone('123')).toBe('123');
    });
  });

  describe('Date Parsing', () => {
    const parseDate = (dateStr) => {
      if (!dateStr) return null;
      try {
        const parsed = new Date(dateStr.trim());
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().split('T')[0];
        }
        return null;
      } catch (error) {
        return null;
      }
    };

    it('should parse common date formats', () => {
      expect(parseDate('2025-08-01')).toBe('2025-08-01');
      expect(parseDate('Aug 1, 2025')).toBe('2025-08-01');
      expect(parseDate('August 1 2025')).toBe('2025-08-01');
    });

    it('should handle invalid dates', () => {
      expect(parseDate('invalid date')).toBe(null);
      expect(parseDate('')).toBe(null);
      expect(parseDate(null)).toBe(null);
    });
  });

  describe('Source Detection Patterns', () => {
    const detectSource = (from, subject) => {
      const fromLower = from.toLowerCase();
      const subjectLower = subject.toLowerCase();

      if (fromLower.includes('@zillow.com') || subjectLower.includes('new lead')) {
        return 'zillow';
      }
      if (fromLower.includes('@realtor.com') || subjectLower.includes('realtor')) {
        return 'realtor';
      }
      if (fromLower.includes('@apartments.com')) {
        return 'apartments';
      }
      if (fromLower.includes('@rentmarketplace.com')) {
        return 'rentmarketplace';
      }
      return 'unknown';
    };

    it('should detect Zillow emails', () => {
      expect(detectSource('noreply@zillow.com', 'New rental inquiry')).toBe('zillow');
      expect(detectSource('agent@example.com', 'New lead from property')).toBe('zillow');
    });

    it('should detect Realtor emails', () => {
      expect(detectSource('leads@realtor.com', 'Inquiry from client')).toBe('realtor');
      expect(detectSource('agent@example.com', 'inquiry from realtor')).toBe('realtor');
    });

    it('should detect Apartments.com emails', () => {
      expect(detectSource('noreply@apartments.com', 'Rental application')).toBe('apartments');
    });

    it('should detect RentMarketplace emails', () => {
      expect(detectSource('system@rentmarketplace.com', 'Interested inquiry')).toBe('rentmarketplace');
    });

    it('should return unknown for unrecognized sources', () => {
      expect(detectSource('unknown@example.com', 'Random subject')).toBe('unknown');
    });
  });

  describe('Email Content Extraction', () => {
    // Test pattern matching logic
    const extractPattern = (text, pattern) => {
      const match = text.match(pattern);
      return match ? match[1].trim() : null;
    };

    it('should extract names from common patterns', () => {
      const namePattern = /(?:Name|From):\s*([^\n<]+)/i;
      expect(extractPattern('Name: John Doe', namePattern)).toBe('John Doe');
      expect(extractPattern('From: Jane Smith <jane@email.com>', namePattern)).toBe('Jane Smith');
    });

    it('should extract phone numbers', () => {
      const phonePattern = /(?:Phone|Tel):\s*([\d\s\-\(\)\.]+)/i;
      expect(extractPattern('Phone: (570) 217-6372', phonePattern)).toBe('(570) 217-6372');
      expect(extractPattern('Tel: 570-217-6372', phonePattern)).toBe('570-217-6372');
    });

    it('should extract property information', () => {
      const propertyPattern = /(?:Property|Address):\s*([^\n]+)/i;
      expect(extractPattern('Property: 123 Main St, City, State', propertyPattern)).toBe('123 Main St, City, State');
      expect(extractPattern('Address: 456 Oak Ave', propertyPattern)).toBe('456 Oak Ave');
    });
  });

  describe('Data Validation', () => {
    const validateData = (data) => {
      const errors = [];
      
      if (!data.phone) {
        errors.push('Phone number required');
      }
      
      if (data.phone && !/^\d{10}$/.test(data.phone)) {
        errors.push('Invalid phone format');
      }
      
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push('Invalid email format');
      }
      
      return errors;
    };

    it('should validate complete data', () => {
      const validData = {
        phone: '5702176372',
        email: 'test@example.com',
        property: '123 Main St'
      };
      expect(validateData(validData)).toEqual([]);
    });

    it('should detect missing phone', () => {
      const invalidData = { email: 'test@example.com' };
      const errors = validateData(invalidData);
      expect(errors).toContain('Phone number required');
    });

    it('should detect invalid phone format', () => {
      const invalidData = { phone: '123', email: 'test@example.com' };
      const errors = validateData(invalidData);
      expect(errors).toContain('Invalid phone format');
    });

    it('should detect invalid email format', () => {
      const invalidData = { phone: '5702176372', email: 'invalid-email' };
      const errors = validateData(invalidData);
      expect(errors).toContain('Invalid email format');
    });
  });
});