const LeadModel = require('../models/leadModel');
const { AppError } = require('../middleware/errorHandler');
const AddressParser = require('../utils/addressParser');

class LeadService {
  // Normalize phone number for consistent deduplication
  static normalizePhone(phone) {
    if (!phone) return null;
    
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Handle US phone numbers (10 digits)
    if (cleaned.length === 10) {
      return cleaned;
    }
    
    // Handle US phone numbers with country code (11 digits starting with 1)
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return cleaned.substring(1);
    }
    
    // Return cleaned version for other formats
    return cleaned;
  }

  // Determine missing information fields
  static determineMissingInfo(lead) {
    const missingInfo = [];
    const requiredFields = {
      first_name: 'First name',
      last_name: 'Last name',
      phone: 'Phone number',
      email: 'Email address',
      move_in_date: 'Move-in date',
      income: 'Income',
      credit_score: 'Credit score'
    };

    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!lead[field] || lead[field] === '') {
        missingInfo.push(label);
      }
    });

    return missingInfo;
  }

  // Create or update lead with deduplication
  static async createOrUpdateLead(leadData) {
    try {
      // Determine deduplication key - use phone if available, else email
      let deduplicationKey;
      let deduplicationField;
      
      if (leadData.phone) {
        // Normalize phone for deduplication
        const normalizedPhone = this.normalizePhone(leadData.phone);
        if (!normalizedPhone) {
          throw new AppError('Invalid phone number format', 400);
        }
        leadData.phone = normalizedPhone;
        deduplicationKey = normalizedPhone;
        deduplicationField = 'phone';
      } else if (leadData.email) {
        // Use email for deduplication if no phone
        deduplicationKey = leadData.email.toLowerCase();
        deduplicationField = 'email';
        // Generate unique placeholder phone to satisfy DB constraint
        leadData.phone = '999' + Date.now().toString().slice(-7);
        if (leadData.parsing_errors) {
          leadData.parsing_errors.push('Generated placeholder phone for DB constraint');
        }
      } else {
        throw new AppError('Either phone or email is required for lead creation', 400);
      }

      // Determine missing information
      // DISABLED: Database doesn't have missing_info column
      // leadData.missing_info = this.determineMissingInfo(leadData);

      // Set default values
      leadData.status = leadData.status || 'new';
      leadData.source = leadData.source || 'manual';
      
      // Ensure required fields are not null (database constraints)
      leadData.first_name = leadData.first_name || '';
      leadData.last_name = leadData.last_name || '';

      // Parse financial fields if they're strings
      if (leadData.income && typeof leadData.income === 'string') {
        leadData.income = parseFloat(leadData.income.replace(/[^0-9.-]+/g, ''));
      }

      // Upsert lead (create or update based on deduplication key)
      const lead = await LeadModel.upsert(leadData, deduplicationKey, deduplicationField);

      return {
        lead,
        isNew: !lead.updated_at || lead.created_at === lead.updated_at
      };
    } catch (error) {
      console.error('Lead creation/update failed:', {
        error: error.message,
        leadData: leadData,
        phone: leadData.phone,
        stack: error.stack
      });
      if (error instanceof AppError) throw error;
      throw new AppError(`Failed to create or update lead: ${error.message}`, 500);
    }
  }

  // Get all leads with filters
  static async getAllLeads(filters) {
    try {
      return await LeadModel.findAll(filters);
    } catch (error) {
      throw new AppError('Failed to fetch leads', 500);
    }
  }

  // Get single lead by ID
  static async getLeadById(id) {
    try {
      const lead = await LeadModel.findById(id);
      
      if (!lead) {
        throw new AppError('Lead not found', 404);
      }

      return lead;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to fetch lead', 500);
    }
  }

  // Update lead
  static async updateLead(id, updates) {
    try {
      // Don't allow phone updates through regular update
      delete updates.phone;
      
      // Recalculate missing info if relevant fields are updated
      if (updates.first_name !== undefined || 
          updates.last_name !== undefined || 
          updates.email !== undefined ||
          updates.move_in_date !== undefined ||
          updates.income !== undefined ||
          updates.credit_score !== undefined) {
        
        // Get current lead data
        const currentLead = await LeadModel.findById(id);
        if (!currentLead) {
          throw new AppError('Lead not found', 404);
        }

        // Merge updates with current data
        const mergedData = { ...currentLead, ...updates };
        // DISABLED: Database doesn't have missing_info column
        // updates.missing_info = this.determineMissingInfo(mergedData);
      }

      const lead = await LeadModel.update(id, updates);
      
      if (!lead) {
        throw new AppError('Lead not found', 404);
      }

      return lead;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to update lead', 500);
    }
  }

  // Delete lead (soft delete)
  static async deleteLead(id) {
    try {
      const lead = await LeadModel.delete(id);
      
      if (!lead) {
        throw new AppError('Lead not found', 404);
      }

      return lead;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('Failed to delete lead', 500);
    }
  }

  // Bulk delete leads
  static async bulkDeleteLeads(ids) {
    const results = {
      total: ids.length,
      deleted: 0,
      failed: [],
      errors: []
    };

    // Process deletions
    for (const id of ids) {
      try {
        const lead = await LeadModel.delete(id);
        if (lead) {
          results.deleted++;
        } else {
          results.failed.push(id);
          results.errors.push({
            id,
            error: 'Lead not found'
          });
        }
      } catch (error) {
        results.failed.push(id);
        results.errors.push({
          id,
          error: error.message || 'Delete failed'
        });
      }
    }

    return results;
  }

  // Get lead statistics
  static async getLeadStats() {
    try {
      return await LeadModel.getStats();
    } catch (error) {
      throw new AppError('Failed to fetch lead statistics', 500);
    }
  }

  // Process lead from email parser
  static async processEmailLead(emailData) {
    try {
      // Parse the address to extract unit
      const fullAddress = emailData.property || emailData.property_address;
      const { address, unit } = AddressParser.parseAddress(fullAddress);
      
      // Process credit score - keep as string to preserve ranges
      // Database column is VARCHAR(50) so we can store ranges like "660-719"
      let creditScore = emailData.credit_score;
      
      // Just ensure it's properly formatted if it's a range
      if (creditScore && typeof creditScore === 'string' && creditScore.includes('-')) {
        // Clean up the format: "660-719" or "660 to 719" -> "660-719"
        creditScore = creditScore.replace(/\s+to\s+/i, '-').replace(/\s+/g, '');
        console.log(`  Storing credit score range: ${creditScore}`);
      }
      
      // Keep credit score as is - either a range string or a single number

      // Extract lead data from email
      const leadData = {
        source: emailData.source,
        first_name: emailData.first_name || '',
        last_name: emailData.last_name || '',
        phone: emailData.phone,
        email: emailData.email,
        property_address: address, // Use parsed address
        unit: unit, // Extracted unit
        lease_length: emailData.lease_length, // Now supported in database
        inquiry_date: emailData.inquiry_date || new Date().toISOString(),
        credit_score: creditScore,
        income: emailData.income,
        move_in_date: emailData.move_in_date,
        occupants: emailData.occupants,
        pets: emailData.pets,
        preferred_bedrooms: emailData.preferred_bedrooms || null,
        tour_availability: emailData.tour_availability || null
      };

      // Add any notes
      if (emailData.notes || emailData.message) {
        leadData.notes = emailData.notes || emailData.message;
      }

      // Create or update the lead
      const result = await this.createOrUpdateLead(leadData);

      // TEMPORARILY DISABLED: Conversation creation during import
      // Re-enable after running the fix-conversations-table.sql in Supabase
      /*
      if (result.isNew && (emailData.notes || emailData.message)) {
        try {
          const ConversationService = require('./conversationService');
          await ConversationService.createInitialInquiry(
            result.lead.id,
            emailData.notes || emailData.message,
            emailData.inquiry_date,
            emailData.source
          );
        } catch (error) {
          console.error('Failed to create initial inquiry message:', error);
          // Don't fail the lead creation if conversation fails
        }
      }
      */
      console.log('⚠️ Conversation creation disabled - run fix-conversations-table.sql in Supabase');

      return result;
    } catch (error) {
      console.error('Error processing email lead:', error);
      throw error;
    }
  }
}

module.exports = LeadService;