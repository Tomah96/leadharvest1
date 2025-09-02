const express = require('express');
const router = express.Router();
const ConversationController = require('../controllers/conversationController');
const { validateRequest } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');

// Validation schemas
const addMessageSchema = {
  params: {
    required: ['leadId'],
    properties: {
      leadId: { type: 'string', pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' }
    }
  },
  body: {
    required: ['type', 'direction', 'body'],
    properties: {
      type: { type: 'string', enum: ['note', 'email', 'sms', 'call'] },
      direction: { type: 'string', enum: ['inbound', 'outbound'] },
      body: { type: 'string', minLength: 1 },
      subject: { type: 'string' },
      from: { type: 'string' },
      to: { type: 'string' },
      metadata: { type: 'object' }
    }
  }
};

const updateMessageSchema = {
  params: {
    required: ['id'],
    properties: {
      id: { type: 'string', pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' }
    }
  },
  body: {
    properties: {
      body: { type: 'string', minLength: 1 },
      subject: { type: 'string' },
      status: { type: 'string' }
    }
  }
};

const getConversationsSchema = {
  params: {
    required: ['leadId'],
    properties: {
      leadId: { type: 'string', pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' }
    }
  }
};

// Routes
router.get('/leads/:leadId/conversations', authenticate, validateRequest(getConversationsSchema), ConversationController.getLeadConversations);
router.post('/leads/:leadId/conversations', authenticate, validateRequest(addMessageSchema), ConversationController.addMessage);
router.get('/leads/:leadId/conversations/stats', authenticate, validateRequest(getConversationsSchema), ConversationController.getConversationStats);
router.patch('/conversations/:id', authenticate, validateRequest(updateMessageSchema), ConversationController.updateMessage);

// Webhook endpoint for processing inbound messages (no auth required)
router.post('/conversations/inbound', ConversationController.processInboundMessage);

module.exports = router;