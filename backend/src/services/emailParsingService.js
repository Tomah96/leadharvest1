const EmailSourceDetector = require('../parsers/emailSourceDetector');
const ZillowParser = require('../parsers/zillowParser');
const RealtorParser = require('../parsers/realtorParserEnhanced');
const ApartmentsParser = require('../parsers/apartmentsParser');
const RentMarketplaceParser = require('../parsers/rentMarketplaceParser');
// Lazy load LeadService to avoid circular dependency
let LeadService;

class EmailParsingService {
  static PARSERS = {
    zillow: ZillowParser,
    realtor: RealtorParser,
    apartments: ApartmentsParser,
    rentmarketplace: RentMarketplaceParser
  };

  static async parseAndProcessEmail(emailData) {
    let parsedData = null; // Declare outside try block for error handling
    
    try {
      console.log('\n📧 ========== PARSING EMAIL ==========');
      console.log('From:', emailData.from);
      console.log('Subject:', emailData.subject);
      console.log('Date:', emailData.date);
      console.log('Gmail ID:', emailData.gmail_message_id || 'N/A');
      
      // Detect email source
      const source = EmailSourceDetector.detectSource(emailData);
      console.log('Detected Source:', source.toUpperCase());
      
      if (source === 'unknown') {
        console.log('❌ Unknown email source, skipping parsing');
        console.log('=====================================\n');
        return {
          success: false,
          error: 'Unknown email source',
          source: 'unknown'
        };
      }

      // Get appropriate parser
      const Parser = this.PARSERS[source];
      if (!Parser) {
        throw new Error(`No parser available for source: ${source}`);
      }

      // Parse email content
      console.log(`\n🔍 Using ${source} parser...`);
      parsedData = Parser.parse(emailData);
      
      // Add Gmail message ID if available
      if (emailData.messageId) {
        parsedData.gmail_message_id = emailData.messageId;
      }
      
      // Log parsed data
      console.log('\n✅ PARSED DATA:');
      console.log('  Name:', `${parsedData.first_name || ''} ${parsedData.last_name || ''}`.trim() || 'Not found');
      console.log('  Phone:', parsedData.phone || 'Not found');
      console.log('  Email:', parsedData.email || 'Not found');
      console.log('  Property:', parsedData.property || parsedData.property_address || 'Not found');
      console.log('  Move-in Date:', parsedData.move_in_date || 'Not found');
      console.log('  Credit Score:', parsedData.credit_score || 'Not found');
      console.log('  Income:', parsedData.income || 'Not found');
      console.log('  Occupants:', parsedData.occupants || 'Not found');
      console.log('  Pets:', parsedData.pets || 'Not found');

      // Validate parsed data
      const validationErrors = this.validateParsedData(parsedData);
      if (validationErrors.length > 0) {
        // Log validation errors but don't add to parsedData (field doesn't exist in DB)
        console.log('\n⚠️  VALIDATION ERRORS:');
        validationErrors.forEach(err => console.log('  -', err));
      }

      // Check if database is available
      // Don't destructure to avoid immediate initialization
      const supabaseModule = require('../utils/supabase');
      
      if (!supabaseModule.supabase) {
        // Database not available - return parsed data without saving
        console.log('\n📊 PROCESSING RESULT:');
        console.log('  Status: 📝 PARSED (Database not available)');
        console.log('  Name:', `${parsedData.first_name || ''} ${parsedData.last_name || ''}`.trim());
        console.log('  Phone:', parsedData.phone);
        console.log('  Parsing Errors:', parsedData.parsing_errors?.length || 0);
        console.log('=====================================\n');
        
        return {
          success: true,
          source,
          lead: parsedData,
          isNew: true,
          parsingErrors: validationErrors || []
        };
      }
      
      // Database available - save the lead
      if (!LeadService) {
        LeadService = require('./leadService');
      }
      
      const result = await LeadService.processEmailLead(parsedData);
      
      console.log('\n📊 PROCESSING RESULT:');
      console.log('  Status:', result.isNew ? '🆕 NEW LEAD CREATED' : '🔄 EXISTING LEAD UPDATED');
      console.log('  Lead ID:', result.lead.id || 'N/A');
      console.log('  Parsing Errors:', parsedData.parsing_errors?.length || 0);
      console.log('=====================================\n');
      
      return {
        success: true,
        source,
        lead: result.lead,
        isNew: result.isNew,
        parsingErrors: validationErrors || []
      };

    } catch (error) {
      console.error('\n❌ EMAIL PARSING FAILED:');
      console.error('  Error:', error.message);
      console.error('  Lead Data:', JSON.stringify(parsedData, null, 2));
      console.error('  Stack:', error.stack);
      console.log('=====================================\n');
      return {
        success: false,
        error: error.message,
        source: emailData.source || 'unknown'
      };
    }
  }

  static validateParsedData(data) {
    const errors = [];

    // Check for required phone number
    if (!data.phone) {
      errors.push('Phone number not found - manual review required');
    }

    // Validate phone format
    if (data.phone && !/^\d{10}$/.test(data.phone)) {
      errors.push('Invalid phone number format');
    }

    // Validate email format
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Invalid email format');
    }

    // Check for property information
    if (!data.property && !data.property_address) {
      errors.push('Property information not found');
    }

    return errors;
  }

  static async batchProcessEmails(emails) {
    console.log('\n📦 ========== BATCH PROCESSING ==========');
    console.log(`Processing ${emails.length} emails...`);
    console.log('=====================================\n');
    
    const results = [];
    
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      console.log(`\n[📧 ${i + 1}/${emails.length}] Processing email...`);
      
      try {
        const result = await this.parseAndProcessEmail(email);
        results.push(result);
        
        // Add small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`[❌ ${i + 1}/${emails.length}] Failed to process email:`, error.message);
        results.push({
          success: false,
          error: error.message,
          source: 'unknown'
        });
      }
    }

    // Summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    console.log('\n📋 BATCH PROCESSING SUMMARY:');
    console.log(`  Total: ${emails.length}`);
    console.log(`  Successful: ${successful}`);
    console.log(`  Failed: ${failed}`);
    console.log('=====================================\n');

    return results;
  }

  // Enhanced batch processing with status tracking
  static async processBatch(emails) {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const status = {
      batchId,
      total: emails.length,
      processed: 0,
      successful: 0,
      failed: 0,
      startedAt: new Date().toISOString(),
      completedAt: null,
      results: []
    };

    // Store initial status
    if (!global.batchProcessingStatus) {
      global.batchProcessingStatus = {};
    }
    global.batchProcessingStatus[batchId] = status;

    // Process emails
    for (let i = 0; i < emails.length; i++) {
      try {
        const result = await this.parseAndProcessEmail(emails[i]);
        status.processed++;
        
        if (result.success) {
          status.successful++;
        } else {
          status.failed++;
        }
        
        status.results.push({
          index: i,
          emailId: emails[i].gmail_message_id || emails[i].id,
          ...result
        });

        // Update status in real-time
        global.batchProcessingStatus[batchId] = { ...status };
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        status.processed++;
        status.failed++;
        status.results.push({
          index: i,
          emailId: emails[i].gmail_message_id || emails[i].id,
          success: false,
          error: error.message
        });
      }
    }

    status.completedAt = new Date().toISOString();
    global.batchProcessingStatus[batchId] = status;
    
    return status;
  }

  // Get batch processing status
  static getProcessingStatus(batchId) {
    if (!global.batchProcessingStatus || !global.batchProcessingStatus[batchId]) {
      return null;
    }
    
    return global.batchProcessingStatus[batchId];
  }

  // Retry failed emails from a batch
  static async retryFailedEmails(batchId) {
    const status = this.getProcessingStatus(batchId);
    
    if (!status) {
      throw new Error('Batch not found');
    }

    const failedEmails = status.results
      .filter(r => !r.success)
      .map(r => ({ index: r.index, emailId: r.emailId }));

    if (failedEmails.length === 0) {
      return { message: 'No failed emails to retry', batchId };
    }

    // Create new batch for retries
    const retryEmails = failedEmails.map(f => ({ 
      gmail_message_id: f.emailId,
      // In production, fetch actual email data from storage
    }));

    return await this.processBatch(retryEmails);
  }

  static getSupportedSources() {
    return EmailSourceDetector.getSupportedSources();
  }

  static async testParser(source, emailContent) {
    try {
      const Parser = this.PARSERS[source];
      if (!Parser) {
        throw new Error(`No parser available for source: ${source}`);
      }

      const result = Parser.parse(emailContent);
      const validationErrors = this.validateParsedData(result);
      
      return {
        success: true,
        parsedData: result,
        validationErrors
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = EmailParsingService;