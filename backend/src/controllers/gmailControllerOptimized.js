// Optimized Gmail controller with batch processing
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
const gmailService = require('../services/gmailService');
const emailParsingService = require('../services/emailParsingService');
const EmailSourceDetector = require('../parsers/emailSourceDetector');

// Helper function to find label flexibly
function findLabelFlexible(labels, searchTerm) {
  if (!searchTerm) return null;
  
  const search = searchTerm.toLowerCase().replace(/[\s-_]/g, '');
  
  return labels.find(label => {
    const labelName = label.name.toLowerCase().replace(/[\s-_]/g, '');
    const labelId = label.id.toLowerCase();
    
    return labelName === search || 
           labelId === search ||
           labelName.includes(search) ||
           (search.includes('processed') && labelName.includes('processed')) ||
           (search.includes('lead') && labelName.includes('lead'));
  });
}

class GmailControllerOptimized {
  // Optimized batch import with parallel processing
  static testImportEmailsBatch = asyncHandler(async (req, res) => {
    const { labelId, count } = req.body;
    const userId = 'test-user';
    
    console.log('\n===== OPTIMIZED BATCH IMPORT =====');
    console.log('Label ID:', labelId);
    console.log('Count:', count);
    console.log('Time:', new Date().toISOString());
    
    try {
      // Set response timeout to 5 minutes for large imports
      req.setTimeout(300000);
      
      // Get label details
      const labels = await gmailService.listLabels(userId);
      const targetLabel = findLabelFlexible(labels, labelId);
      
      if (!targetLabel) {
        return res.status(404).json({
          error: 'Label not found',
          message: `Label "${labelId}" not found in Gmail`
        });
      }
      
      // Fetch emails (this is already optimized with batch fetching)
      console.log(`Fetching ${count} emails from "${targetLabel.name}"...`);
      const emails = await gmailService.fetchEmailsByLabel(userId, targetLabel.id, null, count);
      console.log(`✅ Fetched ${emails.length} emails`);
      
      // Process emails in batches for better performance
      const BATCH_SIZE = 10; // Process 10 emails at a time
      const results = {
        total: emails.length,
        processed: 0,
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [],
        bySource: {},
        emailDetails: [] // Track details for frontend
      };
      
      // Process emails in batches
      for (let i = 0; i < emails.length; i += BATCH_SIZE) {
        const batch = emails.slice(i, Math.min(i + BATCH_SIZE, emails.length));
        console.log(`\n📦 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(emails.length/BATCH_SIZE)} (${batch.length} emails)`);
        
        // Process batch in parallel
        const batchPromises = batch.map(async (email) => {
          try {
            const emailData = {
              subject: email.subject,
              body: email.body,
              from: email.from,
              date: email.date,
              gmail_message_id: email.id
            };
            
            // Detect source
            const source = EmailSourceDetector.detectSource(emailData);
            
            // Track by source
            results.bySource[source] = (results.bySource[source] || 0) + 1;
            
            if (source === 'unknown') {
              console.log(`⚠️ Skipped unknown source: ${email.from}`);
              results.skipped++;
              
              // Add to emailDetails for frontend
              results.emailDetails.push({
                gmailId: email.id,
                subject: email.subject,
                success: false,
                error: 'Unknown email source',
                leadData: null
              });
              
              return { status: 'skipped', source, from: email.from };
            }
            
            // Parse and process (with timeout)
            const parsePromise = emailParsingService.parseAndProcessEmail(emailData);
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Parse timeout')), 10000) // 10 second timeout per email
            );
            
            const parseResult = await Promise.race([parsePromise, timeoutPromise]);
            
            if (parseResult.success) {
              results.success++;
              console.log(`✅ Processed ${source} lead from ${email.from}`);
              
              // Add to emailDetails for frontend
              results.emailDetails.push({
                gmailId: email.id,
                subject: email.subject,
                success: true,
                leadData: parseResult.lead,
                error: null
              });
              
              return { status: 'success', source, from: email.from, lead: parseResult.lead };
            } else {
              results.failed++;
              const error = parseResult.error || 'Unknown parsing error';
              results.errors.push({ from: email.from, error });
              console.log(`❌ Failed to process ${source} lead from ${email.from}: ${error}`);
              
              // Add to emailDetails for frontend
              results.emailDetails.push({
                gmailId: email.id,
                subject: email.subject,
                success: false,
                error: error,
                leadData: null
              });
              
              return { status: 'failed', source, from: email.from, error };
            }
          } catch (error) {
            results.failed++;
            const errorMsg = error.message || 'Unknown error';
            results.errors.push({ from: email.from, error: errorMsg });
            console.error(`❌ Error processing email from ${email.from}:`, errorMsg);
            
            // Add to emailDetails for frontend
            results.emailDetails.push({
              gmailId: email.id,
              subject: email.subject,
              success: false,
              error: errorMsg,
              leadData: null
            });
            
            return { status: 'error', from: email.from, error: errorMsg };
          }
        });
        
        // Wait for batch to complete
        try {
          await Promise.all(batchPromises);
        } catch (batchError) {
          console.error('Batch processing error:', batchError);
        }
        
        results.processed += batch.length;
        console.log(`Batch complete. Progress: ${results.processed}/${results.total}`);
        
        // Small delay between batches to prevent overwhelming the system
        if (i + BATCH_SIZE < emails.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      // Summary
      console.log('\n===== IMPORT COMPLETE =====');
      console.log(`Total: ${results.total}`);
      console.log(`Success: ${results.success}`);
      console.log(`Failed: ${results.failed}`);
      console.log(`Skipped: ${results.skipped}`);
      console.log('\nBy Source:');
      Object.entries(results.bySource).forEach(([source, count]) => {
        console.log(`  ${source}: ${count}`);
      });
      
      // Return in the format the frontend expects
      res.json({
        imported: results.total,
        parsed: results.success,
        errors: results.errors.map(e => e.error || e.message || e),
        results: results.emailDetails.map(detail => ({
          messageId: detail.gmailId,
          subject: detail.subject,
          parsed: detail.success === true,
          data: detail.leadData || {},
          error: detail.error
        }))
      });
      
    } catch (error) {
      console.error('Import failed:', error);
      res.status(500).json({
        success: false,
        error: 'Import failed',
        message: error.message
      });
    }
  });
}

module.exports = GmailControllerOptimized;