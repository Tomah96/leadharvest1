const ConversationModel = require('../models/conversationModel');
const LeadModel = require('../models/leadModel');
const { AppError } = require('../middleware/errorHandler');

class ConversationService {
  // Get all conversations for a lead
  static async getLeadConversations(leadId) {
    try {
      // Verify lead exists
      const lead = await LeadModel.findById(leadId);
      if (!lead) {
        throw new AppError('Lead not found', 404);
      }

      const conversations = await ConversationModel.findByLeadId(leadId);
      
      return {
        lead,
        messages: conversations
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch conversations', 500);
    }
  }

  // Add new message/note to conversation
  static async addMessage(leadId, messageData) {
    try {
      // Verify lead exists
      const lead = await LeadModel.findById(leadId);
      if (!lead) {
        throw new AppError('Lead not found', 404);
      }

      // Validate message data
      const validatedData = this.validateMessageData(messageData);
      
      // Add lead_id and timestamp
      const conversationData = {
        ...validatedData,
        lead_id: leadId,
        created_at: new Date().toISOString()
      };

      const message = await ConversationModel.create(conversationData);
      
      return message;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to add message', 500);
    }
  }

  // Update existing message
  static async updateMessage(messageId, updates) {
    try {
      // Get existing message
      const existingMessage = await ConversationModel.findById(messageId);
      if (!existingMessage) {
        throw new AppError('Message not found', 404);
      }

      // Only allow certain fields to be updated
      const allowedUpdates = ['body', 'subject', 'status'];
      const filteredUpdates = {};
      
      Object.keys(updates).forEach(key => {
        if (allowedUpdates.includes(key)) {
          filteredUpdates[key] = updates[key];
        }
      });

      filteredUpdates.updated_at = new Date().toISOString();

      const message = await ConversationModel.update(messageId, filteredUpdates);
      
      return message;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update message', 500);
    }
  }

  // Process inbound email/SMS
  static async processInboundMessage(messageData) {
    try {
      // Try to find lead by phone or email
      let lead = null;
      
      if (messageData.from_phone) {
        const normalizedPhone = this.normalizePhone(messageData.from_phone);
        lead = await LeadModel.findByPhone(normalizedPhone);
      }
      
      if (!lead && messageData.from_email) {
        // Could add email lookup if needed
      }

      if (!lead) {
        // Create new lead from message
        const leadData = {
          phone: this.normalizePhone(messageData.from_phone),
          email: messageData.from_email,
          first_name: messageData.from_name || 'Unknown',
          source: 'inbound_message',
          status: 'new'
        };
        
        const LeadService = require('./leadService');
        const result = await LeadService.createOrUpdateLead(leadData);
        lead = result.lead;
      }

      // Add message to conversation
      const conversationData = {
        lead_id: lead.id,
        type: messageData.type || 'email',
        direction: 'inbound',
        from_contact: messageData.from_email || messageData.from_phone,
        to_contact: messageData.to_email || messageData.to_phone,
        subject: messageData.subject,
        body: messageData.body,
        created_at: messageData.timestamp || new Date().toISOString(),
        metadata: messageData.metadata || {}
      };

      const message = await ConversationModel.create(conversationData);

      return {
        lead,
        message
      };
    } catch (error) {
      console.error('Error processing inbound message:', error);
      throw new AppError('Failed to process inbound message', 500);
    }
  }

  // Validate message data
  static validateMessageData(data) {
    const errors = [];

    // Required fields
    if (!data.body || data.body.trim().length === 0) {
      errors.push('Message body is required');
    }

    // Type validation
    const validTypes = ['note', 'email', 'sms', 'call'];
    if (!data.type || !validTypes.includes(data.type)) {
      errors.push('Valid message type is required (note, email, sms, call)');
    }

    // Direction validation
    const validDirections = ['inbound', 'outbound'];
    if (!data.direction || !validDirections.includes(data.direction)) {
      errors.push('Valid direction is required (inbound, outbound)');
    }

    if (errors.length > 0) {
      throw new AppError(`Validation errors: ${errors.join(', ')}`, 400);
    }

    return {
      type: data.type,
      direction: data.direction,
      from_contact: data.from || null,
      to_contact: data.to || null,
      subject: data.subject || null,
      body: data.body.trim(),
      metadata: data.metadata || {}
    };
  }

  // Helper: normalize phone number
  static normalizePhone(phone) {
    if (!phone) return null;
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) return cleaned;
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return cleaned.substring(1);
    }
    return cleaned;
  }

  // Get conversation statistics
  static async getConversationStats(leadId) {
    try {
      return await ConversationModel.getLeadStats(leadId);
    } catch (error) {
      throw new AppError('Failed to fetch conversation stats', 500);
    }
  }

  // Create initial inquiry message when lead is created from email
  static async createInitialInquiry(leadId, inquiryText, inquiryDate, source = 'zillow') {
    try {
      // Skip if no inquiry text
      if (!inquiryText || inquiryText.trim() === '') {
        return null;
      }

      // Create the initial inquiry message
      const messageData = {
        lead_id: leadId,
        type: 'email',
        direction: 'inbound',
        from_contact: 'Lead',
        to_contact: 'Property Manager',
        subject: `Initial Inquiry from ${source}`,
        body: inquiryText.trim(),
        metadata: {
          is_initial_inquiry: true,
          source: `${source}_import`,
          auto_created: true
        }
      };

      // Use the inquiry date if provided, otherwise use current date
      if (inquiryDate) {
        messageData.created_at = new Date(inquiryDate).toISOString();
      }

      // Create the conversation message
      const message = await ConversationModel.create(messageData);
      console.log(`Created initial inquiry message for lead ${leadId}`);
      
      return message;
    } catch (error) {
      console.error('Error creating initial inquiry:', error);
      // Don't throw - this is a nice-to-have feature
      return null;
    }
  }
}

module.exports = ConversationService;