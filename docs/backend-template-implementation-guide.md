# Backend Implementation Guide for Message Templates

## Overview
This guide provides detailed implementation instructions for the Backend Claude to add message template functionality to the LeadHarvest API.

## Priority Order
1. **Database migrations first** - This unblocks frontend development
2. **Tour date parser utility** - Shared by all parsers, critical path
3. **Update parsers incrementally** - Can be done in parallel
4. **Template API last** - Depends on database and parser

## 1. Database Migrations

### Migration 1: Add tour_availability to leads
```sql
-- File: /backend/migrations/002_add_tour_availability.sql

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS tour_availability JSONB;

-- Add index for querying
CREATE INDEX IF NOT EXISTS idx_leads_tour_availability 
ON leads USING gin(tour_availability);

-- Update existing leads with null value (safe migration)
UPDATE leads 
SET tour_availability = null 
WHERE tour_availability IS NULL;
```

### Migration 2: Create message_templates table
```sql
-- File: /backend/migrations/003_create_message_templates.sql

CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('initial_contact', 'follow_up', 'tour_confirmation', 'custom')),
  template TEXT NOT NULL,
  variables_used TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure only one default per type
CREATE UNIQUE INDEX idx_one_default_per_type 
ON message_templates(type, is_default) 
WHERE is_default = true;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_message_templates_updated_at 
BEFORE UPDATE ON message_templates 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert default templates
INSERT INTO message_templates (name, type, template, is_default, variables_used) VALUES
('Initial Contact Default', 'initial_contact', 'Hello {first_name},

Thank you for your interest in {property_address}.

{acknowledgment_text} {tour_availability_ack}

{missing_info} {tour_question}

To qualify for this property, applicants must have:
- Income of 3x the monthly rent
- Credit score of 650+
- Valid references from previous landlords

Please let me know if you have any questions.

Best regards,
{agent_name}
{agent_company}
{agent_phone}', true, ARRAY['first_name', 'property_address', 'acknowledgment_text', 'tour_availability_ack', 'missing_info', 'tour_question', 'agent_name', 'agent_company', 'agent_phone']);
```

## 2. Tour Date Parser Implementation

### File: `/backend/src/utils/tourDateParser.js`

```javascript
const moment = require('moment-timezone');

class TourDateParser {
  constructor(timezone = 'America/New_York') {
    this.timezone = timezone;
    this.patterns = {
      // Date patterns
      slashDate: /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/g,
      writtenDate: /(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(\d{4}))?/gi,
      
      // Time patterns
      time12Hour: /(\d{1,2}):?(\d{0,2})?\s*(am|pm|AM|PM)/g,
      time24Hour: /(\d{1,2}):(\d{2})(?::(\d{2}))?/g,
      timeWords: /(morning|afternoon|evening|noon|midnight)/gi,
      
      // Relative dates
      relativeDays: /(today|tomorrow|yesterday)/gi,
      weekdays: /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
      relativeWeeks: /(this|next)\s+(week|weekend|monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
      
      // Ranges
      dateRange: /(\d{1,2})\/(\d{1,2})\s*-\s*(\d{1,2})\/(\d{1,2})/g,
      dayRange: /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\s*-\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi
    };
  }

  /**
   * Main parsing function
   * @param {string} text - Raw text containing tour availability
   * @returns {Object} Structured tour availability object
   */
  parse(text) {
    if (!text) {
      return {
        parsed: false,
        slots: [],
        preferences: {},
        raw_text: text
      };
    }

    const slots = [];
    const preferences = {
      preferred_days: [],
      preferred_times: [],
      avoid_times: []
    };

    // Extract dates
    const dates = this.extractDates(text);
    const times = this.extractTimes(text);
    
    // Combine dates and times intelligently
    if (dates.length > 0) {
      dates.forEach((date, index) => {
        const slot = {
          date: date.format('YYYY-MM-DD'),
          confidence: date.confidence || 0.8
        };
        
        // Try to match times with dates
        if (times.length > index) {
          slot.time = times[index].value;
          slot.time_confidence = times[index].confidence;
        }
        
        slots.push(slot);
      });
    }

    // Extract preferences
    preferences.preferred_days = this.extractPreferredDays(text);
    preferences.preferred_times = this.extractPreferredTimes(text);

    return {
      parsed: slots.length > 0 || preferences.preferred_days.length > 0,
      slots,
      preferences,
      raw_text: text
    };
  }

  extractDates(text) {
    const dates = [];
    let match;

    // Slash dates (8/4, 08/04/2025)
    while ((match = this.patterns.slashDate.exec(text)) !== null) {
      const month = parseInt(match[1]);
      const day = parseInt(match[2]);
      const year = match[3] ? 
        (match[3].length === 2 ? 2000 + parseInt(match[3]) : parseInt(match[3])) : 
        moment().year();
      
      if (month <= 12 && day <= 31) {
        dates.push({
          date: moment.tz(`${year}-${month}-${day}`, this.timezone),
          confidence: 0.95
        });
      }
    }

    // Written dates (August 4th, Aug 4)
    this.patterns.writtenDate.lastIndex = 0;
    while ((match = this.patterns.writtenDate.exec(text)) !== null) {
      const monthName = match[1];
      const day = parseInt(match[2]);
      const year = match[3] || moment().year();
      
      dates.push({
        date: moment.tz(`${monthName} ${day}, ${year}`, 'MMMM D, YYYY', this.timezone),
        confidence: 0.9
      });
    }

    // Relative dates (tomorrow, next Monday)
    this.patterns.relativeDays.lastIndex = 0;
    while ((match = this.patterns.relativeDays.exec(text)) !== null) {
      const relative = match[1].toLowerCase();
      let date;
      
      switch(relative) {
        case 'today':
          date = moment.tz(this.timezone);
          break;
        case 'tomorrow':
          date = moment.tz(this.timezone).add(1, 'day');
          break;
        case 'yesterday':
          date = moment.tz(this.timezone).subtract(1, 'day');
          break;
      }
      
      if (date) {
        dates.push({
          date,
          confidence: 0.85
        });
      }
    }

    return dates;
  }

  extractTimes(text) {
    const times = [];
    let match;

    // 12-hour times (2pm, 2:30 PM)
    while ((match = this.patterns.time12Hour.exec(text)) !== null) {
      const hour = parseInt(match[1]);
      const minute = match[2] || '00';
      const meridiem = match[3].toUpperCase();
      
      let hour24 = hour;
      if (meridiem === 'PM' && hour !== 12) hour24 += 12;
      if (meridiem === 'AM' && hour === 12) hour24 = 0;
      
      times.push({
        value: `${hour24.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`,
        confidence: 0.95
      });
    }

    // Time words (morning, afternoon)
    this.patterns.timeWords.lastIndex = 0;
    while ((match = this.patterns.timeWords.exec(text)) !== null) {
      const timeWord = match[1].toLowerCase();
      times.push({
        value: timeWord,
        confidence: 0.7
      });
    }

    return times;
  }

  extractPreferredDays(text) {
    const days = [];
    let match;

    // Weekday mentions
    this.patterns.weekdays.lastIndex = 0;
    while ((match = this.patterns.weekdays.exec(text)) !== null) {
      const day = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
      if (!days.includes(day)) {
        days.push(day);
      }
    }

    // Check for "weekdays" or "weekends"
    if (/weekdays/i.test(text)) {
      days.push('weekdays');
    }
    if (/weekend/i.test(text)) {
      days.push('weekends');
    }

    return days;
  }

  extractPreferredTimes(text) {
    const times = [];
    
    if (/morning/i.test(text)) times.push('morning');
    if (/afternoon/i.test(text)) times.push('afternoon');
    if (/evening/i.test(text)) times.push('evening');
    if (/after (\d+)/i.test(text)) {
      const match = text.match(/after (\d+)/i);
      times.push(`after ${match[1]}pm`);
    }

    return times;
  }
}

module.exports = TourDateParser;
```

## 3. Parser Update Example

### Update each parser to use tourDateParser:

```javascript
// In zillowParser.js, realtorParser.js, etc.
const TourDateParser = require('../utils/tourDateParser');

class ZillowParser {
  constructor() {
    this.tourParser = new TourDateParser();
  }

  parse(emailContent) {
    // Existing parsing logic...
    
    // Extract tour availability
    const tourAvailability = this.extractTourAvailability(emailContent);
    
    return {
      // ... existing fields
      tour_availability: tourAvailability
    };
  }

  extractTourAvailability(content) {
    // Look for tour-related text patterns
    const tourPatterns = [
      /available[^.]*?(?:on|at|for)[^.]+/gi,
      /tour[^.]*?(?:on|at|available)[^.]+/gi,
      /can (?:tour|visit|see)[^.]+/gi,
      /(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)[^.]*(?:work|good|available)/gi
    ];

    let tourText = '';
    for (const pattern of tourPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        tourText += matches.join(' ') + ' ';
      }
    }

    // Parse the extracted text
    return this.tourParser.parse(tourText.trim());
  }
}
```

## 4. Template Service Implementation

### File: `/backend/src/services/templateService.js`

```javascript
const supabase = require('../utils/supabase');

class TemplateService {
  /**
   * Process template with lead data
   */
  async processTemplate(templateId, leadId) {
    // Get template and lead
    const [template, lead] = await Promise.all([
      this.getTemplate(templateId),
      this.getLead(leadId)
    ]);

    if (!template || !lead) {
      throw new Error('Template or lead not found');
    }

    // Process variables
    const processed = this.substituteVariables(template.template, lead);
    
    return {
      processed_content: processed.content,
      missing_variables: processed.missing,
      substitutions: processed.substitutions
    };
  }

  substituteVariables(template, lead) {
    let content = template;
    const substitutions = {};
    const missing = [];

    // Simple variables
    const simpleVars = {
      first_name: lead.first_name || lead.full_name?.split(' ')[0],
      last_name: lead.last_name,
      full_name: lead.full_name || `${lead.first_name} ${lead.last_name}`,
      email: lead.email,
      phone: lead.phone,
      property_address: lead.property_address,
      move_in_date: this.formatDate(lead.move_in_date),
      income: lead.income ? `$${lead.income.toLocaleString()}` : null,
      credit_score: lead.credit_score,
      occupants: lead.occupants,
      pets: lead.pets
    };

    // Process simple variables
    for (const [key, value] of Object.entries(simpleVars)) {
      const regex = new RegExp(`\\{${key}\\}`, 'gi');
      if (template.includes(`{${key}}`)) {
        if (value) {
          content = content.replace(regex, value);
          substitutions[key] = value;
        } else {
          missing.push(key);
        }
      }
    }

    // Process smart sections
    content = this.processSmartSections(content, lead);

    return { content, substitutions, missing };
  }

  processSmartSections(template, lead) {
    let content = template;

    // Acknowledgment text
    const ackText = this.generateAcknowledgmentText(lead);
    content = content.replace(/{acknowledgment_text}/gi, ackText);

    // Tour availability acknowledgment and question
    const tourInfo = this.processTourAvailability(lead.tour_availability);
    content = content.replace(/{tour_availability_ack}/gi, tourInfo.acknowledgment);
    content = content.replace(/{tour_question}/gi, tourInfo.question);

    // Missing info
    const missingInfo = this.generateMissingInfoText(lead);
    content = content.replace(/{missing_info}/gi, missingInfo);

    return content;
  }

  generateAcknowledgmentText(lead) {
    const parts = [];

    if (lead.income) {
      parts.push(`annual income of $${lead.income.toLocaleString()}`);
    }
    if (lead.credit_score) {
      parts.push(`credit score of ${lead.credit_score}`);
    }
    if (lead.occupants) {
      parts.push(`${lead.occupants} occupants`);
    }
    if (lead.pets) {
      parts.push(lead.pets === 'none' ? 'no pets' : `pets (${lead.pets})`);
    }
    if (lead.move_in_date) {
      parts.push(`move-in date of ${this.formatDate(lead.move_in_date)}`);
    }

    if (parts.length === 0) {
      return '';
    }

    return `I see that you have ${parts.join(', ')}.`;
  }

  processTourAvailability(tourAvailability) {
    if (!tourAvailability || !tourAvailability.slots || tourAvailability.slots.length === 0) {
      return {
        acknowledgment: '',
        question: 'What is your general availability to tour the property?'
      };
    }

    const slots = tourAvailability.slots;
    const hasDates = slots.some(slot => slot.date);
    const hasTimes = slots.some(slot => slot.time && !['morning', 'afternoon', 'evening'].includes(slot.time));

    if (hasDates && !hasTimes) {
      const dates = slots.map(slot => this.formatDate(slot.date)).join(' or ');
      return {
        acknowledgment: `I see you're available to tour on ${dates}.`,
        question: `What time works best for you on ${dates}, or would another date/time work better?`
      };
    }

    if (hasDates && hasTimes) {
      const availability = slots.map(slot => 
        `${this.formatDate(slot.date)} at ${this.formatTime(slot.time)}`
      ).join(' or ');
      return {
        acknowledgment: `I see you're available to tour on ${availability}.`,
        question: 'Would any of these times work for you, or would you prefer a different time?'
      };
    }

    if (tourAvailability.raw_text) {
      return {
        acknowledgment: `I see you mentioned "${tourAvailability.raw_text}" for touring.`,
        question: 'Could you clarify your specific availability with dates and times?'
      };
    }

    return {
      acknowledgment: '',
      question: 'What is your general availability to tour the property?'
    };
  }

  generateMissingInfoText(lead) {
    const missing = [];

    if (!lead.income) missing.push('approximate annual income');
    if (!lead.credit_score) missing.push('credit score range');
    if (!lead.move_in_date) missing.push('preferred move-in date');
    if (!lead.pets) missing.push('pet information');
    if (!lead.occupants) missing.push('number of occupants');

    if (missing.length === 0) {
      return '';
    }

    return `Could you please provide your ${missing.join(', ')}?`;
  }

  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  }

  formatTime(time) {
    if (!time) return '';
    if (['morning', 'afternoon', 'evening'].includes(time)) {
      return time;
    }
    // Convert 24h to 12h format
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours);
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12 = h > 12 ? h - 12 : (h === 0 ? 12 : h);
    return `${h12}:${minutes}${ampm}`;
  }

  // CRUD operations
  async getAllTemplates() {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .order('type', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async getTemplate(id) {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async createTemplate(templateData) {
    const { data, error } = await supabase
      .from('message_templates')
      .insert(templateData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTemplate(id, updates) {
    const { data, error } = await supabase
      .from('message_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTemplate(id) {
    const { error } = await supabase
      .from('message_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  }

  async getLead(leadId) {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error) throw error;
    return data;
  }
}

module.exports = new TemplateService();
```

## 5. Template Routes

### File: `/backend/src/routes/templateRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const templateService = require('../services/templateService');

// GET /api/templates
router.get('/', async (req, res) => {
  try {
    const templates = await templateService.getAllTemplates();
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/templates/:id
router.get('/:id', async (req, res) => {
  try {
    const template = await templateService.getTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ 
        success: false, 
        error: 'Template not found' 
      });
    }
    res.json({ success: true, data: template });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/templates
router.post('/', async (req, res) => {
  try {
    const { name, type, template, variables_used } = req.body;
    
    if (!name || !type || !template) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields' 
      });
    }

    const newTemplate = await templateService.createTemplate({
      name,
      type,
      template,
      variables_used: variables_used || []
    });

    res.status(201).json({ 
      success: true, 
      data: newTemplate 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// PUT /api/templates/:id
router.put('/:id', async (req, res) => {
  try {
    const updated = await templateService.updateTemplate(
      req.params.id,
      req.body
    );
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// DELETE /api/templates/:id
router.delete('/:id', async (req, res) => {
  try {
    await templateService.deleteTemplate(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/templates/preview
router.post('/preview', async (req, res) => {
  try {
    const { template, leadData } = req.body;
    
    // Use provided lead data or sample data
    const lead = leadData || {
      first_name: 'John',
      last_name: 'Smith',
      property_address: '123 Main St',
      income: 75000,
      credit_score: '720-780',
      tour_availability: {
        slots: [{
          date: '2025-09-01',
          time: 'afternoon'
        }]
      }
    };

    const result = templateService.substituteVariables(template, lead);
    const smartSections = templateService.processSmartSections(result.content, lead);

    res.json({
      success: true,
      data: {
        processed_content: smartSections,
        missing_variables: result.missing,
        substitutions: result.substitutions
      }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/templates/:id/apply/:leadId
router.post('/:id/apply/:leadId', async (req, res) => {
  try {
    const result = await templateService.processTemplate(
      req.params.id,
      req.params.leadId
    );
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
```

## 6. Integration into app.js

```javascript
// In app.js, add:
const templateRoutes = require('./src/routes/templateRoutes');

// Add route
app.use('/api/templates', templateRoutes);
```

## Testing Guidelines

### Unit Test Example
```javascript
// File: /backend/src/utils/__tests__/tourDateParser.test.js
const TourDateParser = require('../tourDateParser');

describe('TourDateParser', () => {
  let parser;

  beforeEach(() => {
    parser = new TourDateParser();
  });

  test('parses slash dates correctly', () => {
    const result = parser.parse('I am available 8/4 or 8/5');
    expect(result.parsed).toBe(true);
    expect(result.slots).toHaveLength(2);
    expect(result.slots[0].date).toBe('2025-08-04');
  });

  test('parses times correctly', () => {
    const result = parser.parse('Available at 2pm or 3:30 PM');
    expect(result.parsed).toBe(true);
    expect(result.slots[0].time).toBe('14:00');
    expect(result.slots[1].time).toBe('15:30');
  });

  test('handles no availability', () => {
    const result = parser.parse('');
    expect(result.parsed).toBe(false);
    expect(result.slots).toHaveLength(0);
  });
});
```

## Common Pitfalls to Avoid

1. **Don't forget timezone handling** - Always use moment-timezone
2. **Validate JSON structure** - tour_availability must be valid JSON
3. **Handle null/undefined** - Check all fields before processing
4. **Test edge cases** - Empty strings, invalid dates, etc.
5. **Keep parser modular** - Don't mix parsing with business logic
6. **Cache templates** - Don't fetch from DB on every request
7. **Use transactions** - When updating multiple tables

## Success Criteria Checklist

- [ ] Migrations run successfully
- [ ] Tour parser handles all specified formats
- [ ] All 4 email parsers updated
- [ ] Template CRUD operations work
- [ ] Variable substitution handles missing data
- [ ] Smart sections generate correctly
- [ ] API returns proper error messages
- [ ] All tests pass with >90% coverage
- [ ] No performance regression in lead parsing