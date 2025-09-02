# Missing Features Design Document
**Date**: 2025-08-08  
**Backend Claude**: Missing Feature Implementation Plan

## Overview
This document outlines the design for three critical missing features that need implementation once the NPM infrastructure is restored:

1. **Real-time Gmail Webhook Processing**
2. **Auto-reply Template System**  
3. **OpenPhone SMS Integration**

---

## 1. Real-time Gmail Webhook Processing

### Current Status
- Basic webhook handler exists but uses inefficient polling
- No proper queue system for real-time processing
- Missing webhook verification and error handling

### Proposed Implementation

#### A. Enhanced Webhook Handler
```javascript
// src/controllers/gmailController.js - Enhanced handleWebhook method
static handleWebhook = asyncHandler(async (req, res) => {
  // Immediate response to Google (must respond within 5 seconds)
  res.status(200).json({ received: true });
  
  const { message } = req.body;
  if (!message?.data) return;

  try {
    // Decode notification
    const data = JSON.parse(Buffer.from(message.data, 'base64').toString());
    
    // Process async (don't block webhook response)
    await processWebhookAsync(data);
  } catch (error) {
    console.error('Webhook processing failed:', error);
  }
});

async function processWebhookAsync(data) {
  const { emailAddress, historyId } = data;
  
  // Find user by email
  const userId = await findUserByEmail(emailAddress);
  if (!userId) return;
  
  // Get history changes since last sync
  const changes = await gmailService.getHistory(userId, historyId);
  
  // Process new messages only
  for (const message of changes.messagesAdded || []) {
    await processIncomingEmail(userId, message.message.id);
  }
}
```

#### B. Real-time Email Processing Pipeline
```javascript
// src/services/emailProcessingQueue.js - New service
class EmailProcessingQueue {
  async processIncomingEmail(userId, messageId) {
    try {
      // 1. Fetch full message
      const email = await gmailService.getMessage(userId, messageId);
      
      // 2. Check if it's a rental inquiry
      const source = EmailSourceDetector.detectSource(email);
      if (source === 'unknown') return; // Skip non-rental emails
      
      // 3. Parse email content
      const leadData = await emailParsingService.parseEmail(email);
      
      // 4. Create/update lead with deduplication
      const { lead, isNew } = await LeadService.createOrUpdateLead(leadData);
      
      // 5. Store conversation record
      await ConversationService.addMessage(lead.id, {
        type: 'email',
        direction: 'inbound',
        from: email.from,
        subject: email.subject,
        body: email.body,
        gmail_message_id: messageId
      });
      
      // 6. Check if auto-reply needed
      if (isNew) {
        await this.checkForAutoReply(lead, leadData.parsing_errors);
      }
      
      return { lead, processed: true };
    } catch (error) {
      console.error('Email processing failed:', error);
      throw error;
    }
  }
}
```

---

## 2. Auto-reply Template System

### Requirements
- Templates for different missing information scenarios
- Configurable delay (immediate vs scheduled)
- Support for personalization (first name, property address)
- Track which auto-replies were sent to prevent duplicates

### Implementation Plan

#### A. Template Storage Structure
```sql
-- Migration: 004_create_auto_reply_templates.sql
CREATE TABLE auto_reply_templates (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  trigger_condition JSONB NOT NULL, -- What missing info triggers this
  subject_template VARCHAR(255) NOT NULL,
  body_template TEXT NOT NULL,
  delay_minutes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track sent auto-replies to prevent duplicates
CREATE TABLE auto_reply_sent (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT REFERENCES leads(id),
  template_id BIGINT REFERENCES auto_reply_templates(id),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_via VARCHAR(20) DEFAULT 'email' -- 'email' or 'sms'
);
```

#### B. Template Service
```javascript
// src/services/autoReplyService.js - New service
class AutoReplyService {
  // Get active templates for missing info
  static async getMatchingTemplates(missingInfo) {
    const templates = await TemplateModel.findActive();
    
    return templates.filter(template => {
      const condition = template.trigger_condition;
      return missingInfo.some(missing => 
        condition.missing_fields?.includes(missing.toLowerCase())
      );
    });
  }
  
  // Send auto-reply if conditions met
  static async checkAndSendAutoReply(lead, missingInfo) {
    if (!lead.email || missingInfo.length === 0) return;
    
    // Check if we already sent a reply to this lead
    const alreadySent = await AutoReplySentModel.findByLead(lead.id);
    if (alreadySent.length > 0) return;
    
    // Find matching template
    const templates = await this.getMatchingTemplates(missingInfo);
    if (templates.length === 0) return;
    
    const template = templates[0]; // Use first matching template
    
    // Schedule or send immediately
    if (template.delay_minutes > 0) {
      await this.scheduleAutoReply(lead, template);
    } else {
      await this.sendAutoReply(lead, template);
    }
  }
  
  // Send auto-reply email
  static async sendAutoReply(lead, template) {
    const personalizedContent = this.personalizeTemplate(template, lead);
    
    // Send via Gmail API
    await gmailService.sendEmail({
      to: lead.email,
      subject: personalizedContent.subject,
      body: personalizedContent.body
    });
    
    // Record that we sent it
    await AutoReplySentModel.create({
      lead_id: lead.id,
      template_id: template.id,
      sent_via: 'email'
    });
    
    // Add to conversation history
    await ConversationService.addMessage(lead.id, {
      type: 'email',
      direction: 'outbound',
      to: lead.email,
      subject: personalizedContent.subject,
      body: personalizedContent.body
    });
  }
  
  // Personalize template with lead data
  static personalizeTemplate(template, lead) {
    const replacements = {
      '{{first_name}}': lead.first_name || 'there',
      '{{last_name}}': lead.last_name || '',
      '{{property_address}}': lead.property_address || 'the property',
      '{{inquiry_date}}': lead.inquiry_date || 'recently'
    };
    
    let subject = template.subject_template;
    let body = template.body_template;
    
    Object.entries(replacements).forEach(([placeholder, value]) => {
      subject = subject.replace(new RegExp(placeholder, 'g'), value);
      body = body.replace(new RegExp(placeholder, 'g'), value);
    });
    
    return { subject, body };
  }
}
```

#### C. Template Management API
```javascript
// src/routes/templateRoutes.js - New route file
const express = require('express');
const router = express.Router();
const TemplateController = require('../controllers/templateController');

router.get('/templates', TemplateController.getAllTemplates);
router.post('/templates', TemplateController.createTemplate);
router.put('/templates/:id', TemplateController.updateTemplate);
router.delete('/templates/:id', TemplateController.deleteTemplate);
router.post('/templates/:id/test', TemplateController.testTemplate);

module.exports = router;
```

#### D. Default Templates
```javascript
// Default templates to seed the system
const DEFAULT_TEMPLATES = [
  {
    name: 'Missing Contact Info',
    trigger_condition: { 
      missing_fields: ['phone number', 'email address'] 
    },
    subject_template: 'Re: Your inquiry about {{property_address}}',
    body_template: `Hi {{first_name}},

Thank you for your interest in {{property_address}}! 

To process your rental application efficiently, we need a few additional details:
- Phone number for quick contact
- Email confirmation

Please reply with this information at your earliest convenience.

Best regards,
LeadHarvest Property Management`,
    delay_minutes: 30
  },
  {
    name: 'Missing Financial Info', 
    trigger_condition: {
      missing_fields: ['income', 'credit score']
    },
    subject_template: 'Next steps for {{property_address}}',
    body_template: `Hi {{first_name}},

Thanks for your interest in {{property_address}}!

To move forward with your application, we'll need:
- Monthly income information
- Credit score or recent credit report

This helps us process applications quickly and fairly.

Looking forward to hearing from you!

Best,
Property Management Team`,
    delay_minutes: 60
  }
];
```

---

## 3. OpenPhone SMS Integration

### Requirements
- Send SMS messages through OpenPhone API
- Unified conversation view (email + SMS)
- Webhook handling for incoming SMS
- Rate limiting (10 requests/second max)

### Implementation Plan

#### A. OpenPhone Service
```javascript
// src/services/openPhoneService.js - New service
const https = require('https');

class OpenPhoneService {
  constructor() {
    this.apiKey = process.env.OPENPHONE_API_KEY;
    this.baseUrl = 'https://api.openphone.com/v1';
    this.rateLimit = new RateLimit(10, 1000); // 10 per second
  }
  
  // Send SMS message
  async sendSMS(to, message, fromNumber = null) {
    await this.rateLimit.wait();
    
    const payload = {
      to: this.normalizePhone(to),
      text: message,
      from: fromNumber || process.env.OPENPHONE_DEFAULT_NUMBER
    };
    
    return this.makeRequest('/messages', 'POST', payload);
  }
  
  // Get conversation history
  async getConversationHistory(phoneNumber, limit = 50) {
    await this.rateLimit.wait();
    
    const params = new URLSearchParams({
      'filter[phoneNumber]': this.normalizePhone(phoneNumber),
      'limit': limit.toString(),
      'sort': '-createdAt'
    });
    
    return this.makeRequest(`/messages?${params}`);
  }
  
  // Make authenticated API request
  async makeRequest(endpoint, method = 'GET', body = null) {
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    };
    
    const url = `${this.baseUrl}${endpoint}`;
    
    return new Promise((resolve, reject) => {
      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const result = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(result);
            } else {
              reject(new Error(`OpenPhone API error: ${result.message}`));
            }
          } catch (e) {
            reject(new Error(`Invalid JSON response: ${data}`));
          }
        });
      });
      
      req.on('error', reject);
      
      if (body) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }
  
  normalizePhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10 ? `+1${cleaned}` : `+${cleaned}`;
  }
}
```

#### B. SMS Integration with Auto-Reply
```javascript
// Enhanced AutoReplyService for SMS
class AutoReplyService {
  static async sendAutoReplySMS(lead, template) {
    if (!lead.phone) return;
    
    const personalizedContent = this.personalizeTemplate(template, lead);
    
    // Send SMS via OpenPhone
    await openPhoneService.sendSMS(
      lead.phone, 
      personalizedContent.body // SMS doesn't use subject
    );
    
    // Record sent SMS
    await AutoReplySentModel.create({
      lead_id: lead.id,
      template_id: template.id,
      sent_via: 'sms'
    });
    
    // Add to conversation
    await ConversationService.addMessage(lead.id, {
      type: 'sms',
      direction: 'outbound',
      to_contact: lead.phone,
      body: personalizedContent.body
    });
  }
}
```

#### C. SMS Webhook Handler
```javascript
// src/controllers/smsController.js - New controller
class SMSController {
  static handleWebhook = asyncHandler(async (req, res) => {
    // Respond immediately to OpenPhone
    res.status(200).json({ received: true });
    
    const { data } = req.body;
    if (data.type !== 'message.created') return;
    
    const message = data.object;
    if (message.direction !== 'incoming') return;
    
    // Process incoming SMS async
    setImmediate(async () => {
      try {
        await ConversationService.processInboundMessage({
          type: 'sms',
          from_phone: message.from,
          to_phone: message.to,
          body: message.text,
          timestamp: message.createdAt
        });
      } catch (error) {
        console.error('SMS processing failed:', error);
      }
    });
  });
}
```

---

## Implementation Timeline

### Phase 1: Gmail Webhook Enhancement (1 hour)
- Implement async webhook processing
- Add proper error handling and logging
- Test with real Gmail notifications

### Phase 2: Auto-Reply System (2 hours)
- Create database migrations for templates
- Implement template service and models
- Create template management API
- Add default templates
- Integrate with email processing pipeline

### Phase 3: OpenPhone Integration (1.5 hours)
- Implement OpenPhone service with rate limiting
- Create SMS webhook handler
- Update conversation service for SMS
- Test SMS sending and receiving

### Phase 4: Integration Testing (30 minutes)
- End-to-end workflow testing
- Performance optimization
- Error handling verification

---

## API Endpoints to Implement

```
# Auto-Reply Templates
GET    /api/templates                    - List all templates
POST   /api/templates                    - Create new template  
PUT    /api/templates/:id               - Update template
DELETE /api/templates/:id               - Delete template
POST   /api/templates/:id/test          - Test template with sample data

# SMS Management
POST   /api/sms/send                    - Send SMS to lead
POST   /api/sms/webhook                 - OpenPhone webhook handler
GET    /api/conversations/:leadId/sms   - Get SMS history for lead

# Enhanced Gmail
POST   /api/gmail/webhook               - Real-time webhook (enhanced)
GET    /api/gmail/history               - Get Gmail history changes
POST   /api/gmail/send-reply            - Send reply email
```

This comprehensive design ensures we can achieve the 10/10 production readiness target once the NPM infrastructure is restored.