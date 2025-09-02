const ConversationService = require('../services/conversationService');
const { asyncHandler } = require('../middleware/errorHandler');
const { isDatabaseAvailable } = require('../utils/database');

class ConversationController {
  // Get conversation history for a lead
  static getLeadConversations = asyncHandler(async (req, res) => {
    if (!isDatabaseAvailable()) {
      return res.json({
        success: true,
        conversations: [],
        total: 0,
        message: 'Running in Gmail-only mode - database not configured'
      });
    }
    
    const { leadId } = req.params;
    
    const result = await ConversationService.getLeadConversations(leadId);
    
    res.json({
      success: true,
      ...result
    });
  });

  // Add new message to conversation
  static addMessage = asyncHandler(async (req, res) => {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Database not configured - cannot add messages in Gmail-only mode'
      });
    }
    
    const { leadId } = req.params;
    const messageData = req.body;
    
    const message = await ConversationService.addMessage(leadId, messageData);
    
    res.status(201).json({
      success: true,
      message: 'Message added successfully',
      data: message
    });
  });

  // Update existing message
  static updateMessage = asyncHandler(async (req, res) => {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Database not configured - cannot update messages in Gmail-only mode'
      });
    }
    
    const { id } = req.params;
    const updates = req.body;
    
    const message = await ConversationService.updateMessage(id, updates);
    
    res.json({
      success: true,
      message: 'Message updated successfully',
      data: message
    });
  });

  // Get conversation statistics
  static getConversationStats = asyncHandler(async (req, res) => {
    if (!isDatabaseAvailable()) {
      return res.json({
        success: true,
        stats: { total: 0, byType: {}, byDirection: {} },
        message: 'Running in Gmail-only mode - database not configured'
      });
    }
    
    const { leadId } = req.params;
    
    const stats = await ConversationService.getConversationStats(leadId);
    
    res.json({
      success: true,
      stats
    });
  });

  // Process inbound message (webhook endpoint)
  static processInboundMessage = asyncHandler(async (req, res) => {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Database not configured - cannot process messages in Gmail-only mode'
      });
    }
    
    const messageData = req.body;
    
    const result = await ConversationService.processInboundMessage(messageData);
    
    res.json({
      success: true,
      message: 'Inbound message processed',
      ...result
    });
  });
}

module.exports = ConversationController;