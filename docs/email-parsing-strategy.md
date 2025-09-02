# Email Parsing Strategy - LeadHarvest CRM

## Overview
This document defines the parsing strategy for processing leads from 4 email sources: Zillow, Realtor.com, Apartments.com, and RentMarketplace.

## Email Source Detection

### Pattern Matching Rules
```javascript
const EMAIL_SOURCES = {
  zillow: {
    senderPatterns: ['@zillow.com', 'zillow rental manager'],
    subjectPatterns: ['new lead', 'rental inquiry'],
    identifier: 'zillow'
  },
  realtor: {
    senderPatterns: ['@realtor.com', 'move.com'],
    subjectPatterns: ['new lead from realtor.com'],
    identifier: 'realtor'
  },
  apartments: {
    senderPatterns: ['@apartments.com', 'apartmentlist'],
    subjectPatterns: ['new rental lead', 'inquiry'],
    identifier: 'apartments'
  },
  rentmarketplace: {
    senderPatterns: ['@rentmarketplace.com'],
    subjectPatterns: ['interested in'],
    identifier: 'rentmarketplace'
  }
};
```

## Parser Implementations

### 1. Zillow Parser
```javascript
const parseZillowEmail = (emailContent) => {
  const patterns = {
    property: /Property:\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*(\d{5})/,
    name: /Lead\s+Name:\s*(\w+)\s+(\w+)/,
    message: /says:\s*"([^"]+)"/,
    moveIn: /Move\s+in:\s*(\w+\s+\d{1,2},\s+\d{4})/,
    creditScore: /Credit\s+score:\s*(\d+)\s+to\s+(\d+)/,
    income: /Income:\s*\$?([\d,]+)/,
    pets: /Pets:\s*(Yes|No)/i,
    leaseLength: /Lease\s+Length:\s*(\d+)\s+months/,
    occupants: /Occupants:\s*(\d+)/
  };
  
  return {
    source: 'zillow',
    property: extractProperty(patterns.property),
    first_name: extractFirstName(patterns.name),
    last_name: extractLastName(patterns.name),
    message: extractMessage(patterns.message),
    move_in_date: parseDate(patterns.moveIn),
    credit_score: extractCreditRange(patterns.creditScore),
    income: parseIncome(patterns.income),
    pets: parseBool(patterns.pets),
    lease_length: extractNumber(patterns.leaseLength),
    occupants: extractNumber(patterns.occupants)
  };
};
```

### 2. Realtor.com Parser
```javascript
const parseRealtorEmail = (emailContent) => {
  const patterns = {
    timestamp: /Lead\s+received:\s*(.+\s+[AP]M)/,
    message: /interested\s+in\s+([^.]+)\.\s*(.+)?/,
    name: /Name:\s*(.+)/,
    phone: /Phone:\s*([\d\s\-\(\)]+)/,
    email: /Email:\s*(.+)/
  };
  
  return {
    source: 'realtor',
    timestamp: parseTimestamp(patterns.timestamp),
    property: extractFromMessage(patterns.message),
    full_name: extract(patterns.name),
    phone: cleanPhone(patterns.phone),
    email: extract(patterns.email)
  };
};
```

### 3. Apartments.com Parser
```javascript
const parseApartmentsEmail = (emailContent) => {
  const patterns = {
    name: /Name:\s*(.+)/,
    phone: /Phone:\s*([\d\s\-\(\)]+)/,
    email: /Email:\s*(.+)/,
    submitted: /Lead\s+Submitted:\s*(.+)/,
    beds: /Beds:\s*(\d+|NA)/,
    moveDate: /Move\s+Date:\s*(.+)/,
    propertyLink: /Property\s+Information:.*?https?:\/\/[^\s]+/,
    address: /Property\s+Address:\s*(.+)/
  };
  
  return {
    source: 'apartments',
    name: extract(patterns.name),
    phone: cleanPhone(patterns.phone),
    email: extract(patterns.email),
    submitted_at: parseTimestamp(patterns.submitted),
    preferences: {
      beds: parseBedsCount(patterns.beds),
      move_date: parseDate(patterns.moveDate)
    },
    property_url: extract(patterns.propertyLink),
    property: extract(patterns.address)
  };
};
```

### 4. RentMarketplace Parser
```javascript
const parseRentMarketplaceEmail = (emailContent) => {
  // Simpler format, extract from subject and body
  const patterns = {
    property: /interested\s+in\s+(.+)/i,
    contact: /From:\s*(.+)\s*<(.+)>/,
    message: /Message:\s*(.+)/s
  };
  
  return {
    source: 'rentmarketplace',
    property: extractFromSubject(patterns.property),
    name: extractName(patterns.contact),
    email: extractEmail(patterns.contact),
    message: extract(patterns.message)
  };
};
```

## Data Normalization

### Phone Number Normalization
```javascript
const normalizePhone = (phone) => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Add +1 if 10 digits
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // Already has country code
  if (digits.length === 11 && digits[0] === '1') {
    return `+${digits}`;
  }
  
  return digits; // Return as-is if format unclear
};
```

### Date Normalization
```javascript
const normalizeDate = (dateStr) => {
  // Handle various formats:
  // "Sep 01, 2025" -> "2025-09-01"
  // "08/01/2025" -> "2025-08-01"
  // "August 1st" -> Calculate year and format
  
  const parsed = new Date(dateStr);
  if (!isNaN(parsed)) {
    return parsed.toISOString().split('T')[0];
  }
  return null;
};
```

### Credit Score Handling
```javascript
const normalizeCreditScore = (min, max) => {
  // Store as single representative value (midpoint)
  if (min && max) {
    return Math.floor((parseInt(min) + parseInt(max)) / 2);
  }
  return null;
};
```

## Missing Information Detection

### Required Fields Check
```javascript
const detectMissingInfo = (lead) => {
  const required = {
    phone: 'Phone number',
    email: 'Email address',
    move_in_date: 'Move-in date',
    income: 'Income verification',
    credit_score: 'Credit score',
    occupants: 'Number of occupants'
  };
  
  const missing = [];
  for (const [field, label] of Object.entries(required)) {
    if (!lead[field]) {
      missing.push(label);
    }
  }
  
  return missing;
};
```

## Auto-Reply Templates

### Template Selection Logic
```javascript
const selectAutoReplyTemplate = (lead) => {
  const missing = lead.missing_info;
  
  if (missing.length === 0) {
    return 'complete_application';
  }
  
  if (missing.includes('Phone number')) {
    return 'request_phone';
  }
  
  if (missing.includes('Income verification') || missing.includes('Credit score')) {
    return 'request_financial';
  }
  
  return 'request_general_info';
};
```

### Sample Templates
```javascript
const REPLY_TEMPLATES = {
  request_phone: {
    subject: 'Re: Your inquiry about {property}',
    body: `Hi {first_name},

Thank you for your interest in {property}! I'd love to discuss this property with you.

Could you please provide your phone number so I can reach out to schedule a viewing?

Best regards,
{agent_name}`
  },
  
  request_financial: {
    subject: 'Re: Your inquiry about {property}',
    body: `Hi {first_name},

Thank you for your interest in {property}! To move forward with your application, I'll need:

- Proof of income (recent pay stubs or bank statements)
- Credit score estimate
- Expected move-in date

This helps ensure a smooth application process. Feel free to reply with this information or give me a call at {agent_phone}.

Best regards,
{agent_name}`
  }
};
```

## Implementation Priority

1. **Phase 1**: Basic parsing for all 4 sources
2. **Phase 2**: Phone-based deduplication
3. **Phase 3**: Auto-reply for missing information
4. **Phase 4**: Gmail webhook integration
5. **Phase 5**: Batch processing of 4000+ existing emails

## Testing Strategy

### Email Sample Tests
- Create test fixtures from real email samples
- Test each parser with edge cases
- Validate normalized output
- Test missing field detection

### Integration Tests
- Test email reception via webhook
- Test parsing and database storage
- Test deduplication logic
- Test auto-reply triggering