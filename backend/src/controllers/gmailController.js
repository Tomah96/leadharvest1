const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../middleware/errorHandler');
const gmailService = require('../services/gmailService');
const emailParsingService = require('../services/emailParsingService');
const emailSourceDetector = require('../parsers/emailSourceDetector');
const { findLabelFlexible } = require('../utils/labelMatcher');

class GmailController {
  // Get OAuth consent URL
  static getAuthUrl = asyncHandler(async (req, res) => {
    const userId = req.user?.id || 'default'; // Use authenticated user ID
    const authUrl = gmailService.generateAuthUrl(userId);

    res.json({
      success: true,
      url: authUrl
    });
  });

  // Handle OAuth callback
  static handleAuthCallback = asyncHandler(async (req, res) => {
    const { code, error, state } = req.query;

    console.log('=== OAuth Callback ===');
    console.log('Code:', code ? 'received' : 'missing');
    console.log('State:', state);

    if (error) {
      console.error('OAuth error:', error);
      throw new AppError('OAuth authorization denied', 400);
    }

    if (!code) {
      throw new AppError('No authorization code received', 400);
    }

    // Exchange code for tokens
    console.log('Exchanging code for tokens...');
    const tokens = await gmailService.exchangeCodeForTokens(code);
    
    // Store tokens for the user (state contains userId)
    const userId = state || 'default-user';
    console.log(`Tokens received for user: ${userId}`);
    
    // Get user's email address for better identification
    try {
      // Temporarily set credentials to get email
      if (!gmailService.oauth2Client) {
        gmailService.initializeOAuth2Client();
      }
      gmailService.oauth2Client.setCredentials(tokens);
      
      const google = require('googleapis').google;
      const gmail = google.gmail({ version: 'v1', auth: gmailService.oauth2Client });
      const profile = await gmail.users.getProfile({
        userId: 'me'
      });
      tokens.email = profile.data.emailAddress;
      console.log(`Gmail connected for email: ${tokens.email}`);
    } catch (error) {
      console.error('Could not get email address:', error.message);
    }
    
    await gmailService.storeTokens(userId, tokens);
    console.log('Tokens saved successfully');
    
    // Start auto-refresh interval
    gmailService.startTokenRefresh(userId);

    // Redirect to frontend Gmail settings page with success
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/settings/gmail?connected=true`);
  });

  // Disconnect Gmail (remove tokens)
  static disconnectGmail = asyncHandler(async (req, res) => {
    const userId = req.user?.id || 'test-user';
    
    try {
      // Remove stored tokens
      await gmailService.removeTokens(userId);
      
      res.json({
        success: true,
        message: 'Gmail disconnected successfully'
      });
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      throw new AppError('Failed to disconnect Gmail', 500);
    }
  });

  // Get Gmail connection status with actual email
  static getStatus = asyncHandler(async (req, res) => {
    const userId = req.user?.id || 'default-user';
    
    try {
      // Use the new checkConnectionStatus method which includes auto-refresh
      const status = await gmailService.checkConnectionStatus(userId);
      
      if (!status.isConnected) {
        return res.json(status);
      }
      
      // Get user's email address from Gmail if connected
      const profile = await gmailService.gmail.users.getProfile({
        userId: 'me'
      });
      
      res.json({
        isConnected: true,
        email: profile.data.emailAddress,
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting Gmail status:', error);
      res.json({ isConnected: false });
    }
  });

  // Store OAuth tokens (for frontend to call after auth)
  static storeTokens = asyncHandler(async (req, res) => {
    const { tokens } = req.body;
    const userId = req.user?.id || 'default';

    if (!tokens || !tokens.access_token) {
      throw new AppError('Invalid token data', 400);
    }

    await gmailService.storeTokens(userId, tokens);

    res.json({
      success: true,
      message: 'Tokens stored successfully'
    });
  });

  // Fetch Gmail messages
  static fetchMessages = asyncHandler(async (req, res) => {
    const userId = req.user?.id || 'default';
    const { query, maxResults, pageToken, labelIds } = req.query;

    const result = await gmailService.fetchMessages(userId, {
      query,
      maxResults: parseInt(maxResults) || 10,
      pageToken,
      labelIds: labelIds ? labelIds.split(',') : undefined
    });

    res.json({
      success: true,
      data: result
    });
  });

  // Process batch of emails
  static processBatch = asyncHandler(async (req, res) => {
    const userId = req.user?.id || 'default';
    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds)) {
      throw new AppError('Message IDs array is required', 400);
    }

    // Create batch ID for tracking
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Start processing in background (in production, use a queue)
    setImmediate(async () => {
      try {
        // Fetch all messages
        const messages = await gmailService.batchGetMessages(userId, messageIds);
        
        // Process each message
        const results = [];
        for (const message of messages) {
          try {
            const parsedLead = await emailParsingService.parseEmail({
              subject: message.subject,
              body: message.body,
              from: message.from,
              date: message.date,
              gmail_message_id: message.id
            });

            if (parsedLead) {
              results.push({
                messageId: message.id,
                status: 'success',
                lead: parsedLead
              });

              // Mark as read
              await gmailService.markAsRead(userId, message.id);
            }
          } catch (error) {
            results.push({
              messageId: message.id,
              status: 'error',
              error: error.message
            });
          }
        }

        // Store results (in production, store in database)
        if (!global.batchResults) {
          global.batchResults = {};
        }
        global.batchResults[batchId] = {
          total: messageIds.length,
          processed: results.length,
          results,
          completedAt: new Date().toISOString()
        };
      } catch (error) {
        console.error('Batch processing error:', error);
      }
    });

    res.json({
      success: true,
      batchId,
      message: `Processing ${messageIds.length} emails in background`
    });
  });

  // Get user's Gmail labels
  static getLabels = asyncHandler(async (req, res) => {
    const userId = req.user?.id || 'default';
    const labels = await gmailService.getLabels(userId);

    res.json({
      success: true,
      data: labels
    });
  });

  // Handle Gmail webhook push notifications
  static handleWebhook = asyncHandler(async (req, res) => {
    const { message } = req.body;

    if (!message || !message.data) {
      throw new AppError('Invalid webhook payload', 400);
    }

    // Verify webhook signature
    const signature = req.headers['x-goog-signature'];
    if (!gmailService.verifyWebhookSignature(req.body, signature)) {
      throw new AppError('Invalid webhook signature', 401);
    }

    try {
      // Process the notification
      const notification = await gmailService.processWebhookNotification({ message });
      
      // Log the notification for debugging
      console.log('Gmail push notification received:', notification);

      // Queue email for processing
      // In production, add to a proper queue (Redis, RabbitMQ, etc.)
      setImmediate(async () => {
        try {
          // Fetch new messages since last history ID
          const userId = 'default'; // In production, map email to user
          const messages = await gmailService.fetchMessages(userId, {
            query: `after:${new Date(Date.now() - 3600000).toISOString().split('T')[0]}`,
            maxResults: 10
          });

          // Process new messages
          for (const message of messages.messages || []) {
            const fullMessage = await gmailService.getMessage(userId, message.id);
            await emailParsingService.parseEmail({
              subject: fullMessage.subject,
              body: fullMessage.body,
              from: fullMessage.from,
              date: fullMessage.date,
              gmail_message_id: fullMessage.id
            });
          }
        } catch (error) {
          console.error('Error processing webhook notification:', error);
        }
      });
      
      res.status(200).json({
        success: true,
        message: 'Webhook received and processing'
      });
    } catch (error) {
      console.error('Failed to process Gmail notification:', error);
      throw new AppError('Failed to process notification', 400);
    }
  });

  // Test Gmail connection
  static testConnection = asyncHandler(async (req, res) => {
    const userId = req.user?.id || 'test-user';
    const tokens = await gmailService.getTokens(userId);
    
    console.log('=== Test Connection ===');
    console.log('User ID:', userId);
    console.log('Has tokens:', !!tokens);

    if (!tokens) {
      return res.json({ 
        connected: false, 
        message: 'No Gmail connection. Please connect via /api/gmail/auth-url' 
      });
    }

    try {
      // Try to list labels as connection test
      const labels = await gmailService.listLabels(userId);
      console.log('Gmail labels:', labels.map(l => `${l.name} (${l.id})`).join(', '));
      
      const processedLabel = labels.find(l => 
        l.name.toLowerCase().includes('processed-lead') ||
        l.name.toLowerCase().includes('processed lead')
      );
      
      if (processedLabel) {
        console.log(`Found processed-lead label: ${processedLabel.name}`);
      }
      
      res.json({
        connected: true,
        labelsCount: labels.length,
        hasProcessedLeadLabel: !!processedLabel,
        processedLeadLabelId: processedLabel?.id
      });
    } catch (error) {
      console.error('Connection test error:', error);
      res.json({
        connected: false,
        error: error.message
      });
    }
  });

  // Test fetching processed leads
  static testProcessedLeads = asyncHandler(async (req, res) => {
    const userId = req.user?.id || 'test-user';
    const tokens = await gmailService.getTokens(userId);
    
    console.log('=== Test Processed Leads ===');
    
    if (!tokens) {
      return res.json({ 
        error: 'No Gmail connection. Please connect first.' 
      });
    }
    
    // 1. Find "processed-lead" label
    const labelId = await gmailService.findProcessedLeadLabel(userId);
    console.log('Found label ID:', labelId);
    
    if (!labelId) {
      return res.json({ error: 'No "processed-lead" label found' });
    }
    
    // 2. Fetch last 10 emails with this label
    const emails = await gmailService.fetchEmailsByLabel(userId, labelId, null, 10);
    console.log(`Found ${emails.length} emails`);
    
    // 3. Run through email detector and parser
    const results = [];
    for (const email of emails) {
      const emailData = {
        subject: email.subject,
        body: email.body,
        from: email.from,
        date: email.date,
        gmail_message_id: email.id
      };
      
      const source = emailSourceDetector.detectSource(emailData);
      console.log(`\nEmail from ${email.from}:`);
      console.log(`  Subject: ${email.subject}`);
      console.log(`  Detected as: ${source}`);
      
      let parsedData = null;
      let parseError = null;
      
      if (source !== 'unknown') {
        try {
          const parseResult = await emailParsingService.parseAndProcessEmail(emailData);
          if (parseResult.success) {
            parsedData = parseResult.lead;
            console.log(`  Parsed successfully:`);
            console.log(`    Name: ${parsedData.first_name} ${parsedData.last_name}`);
            console.log(`    Phone: ${parsedData.phone}`);
            console.log(`    Email: ${parsedData.email}`);
            console.log(`    Property: ${parsedData.property}`);
          } else {
            parseError = parseResult.error;
            console.log(`  Parse failed: ${parseError}`);
          }
        } catch (error) {
          parseError = error.message;
          console.error(`  Parse error: ${error.message}`);
        }
      } else {
        console.log('  Skipping - unknown source');
      }
      
      results.push({
        subject: email.subject,
        from: email.from,
        date: email.date,
        source,
        parsed: parsedData ? 'success' : 'failed',
        parseError,
        leadData: parsedData ? {
          name: `${parsedData.first_name || ''} ${parsedData.last_name || ''}`.trim(),
          phone: parsedData.phone,
          email: parsedData.email,
          property: parsedData.property
        } : null
      });
    }
    
    // 4. Return summary
    console.log('\n=== Summary ===');
    console.log('Total emails:', emails.length);
    console.log('Sources:', {
      zillow: results.filter(r => r.source === 'zillow').length,
      realtor: results.filter(r => r.source === 'realtor').length,
      apartments: results.filter(r => r.source === 'apartments').length,
      rentmarketplace: results.filter(r => r.source === 'rentmarketplace').length,
      unknown: results.filter(r => r.source === 'unknown').length
    });
    console.log('Parse results:', {
      successful: results.filter(r => r.parsed === 'success').length,
      failed: results.filter(r => r.parsed === 'failed').length
    });
    console.log('Summary sent to frontend');
    
    res.json({
      totalEmails: emails.length,
      results,
      sources: {
        zillow: results.filter(r => r.source === 'zillow').length,
        realtor: results.filter(r => r.source === 'realtor').length,
        apartments: results.filter(r => r.source === 'apartments').length,
        rentmarketplace: results.filter(r => r.source === 'rentmarketplace').length,
        unknown: results.filter(r => r.source === 'unknown').length
      },
      parseResults: {
        successful: results.filter(r => r.parsed === 'success').length,
        failed: results.filter(r => r.parsed === 'failed').length
      }
    });
  });

  // Search for a specific label
  static searchLabel = asyncHandler(async (req, res) => {
    const userId = req.user?.id || 'test-user';
    const { query } = req.query;
    
    console.log('=== Search Label ===');
    console.log('User ID:', userId);
    console.log('Search query:', query);

    if (!query) {
      return res.status(400).json({ 
        error: 'Search query is required' 
      });
    }

    try {
      const labels = await gmailService.listLabels(userId);
      console.log(`Found ${labels.length} total labels`);
      
      // Search for labels matching the query (case-insensitive)
      const matchingLabels = labels.filter(label => 
        label.name.toLowerCase().includes(query.toLowerCase())
      );
      
      console.log(`Found ${matchingLabels.length} matching labels`);
      
      // Get email count for each matching label
      const labelsWithCounts = [];
      for (const label of matchingLabels) {
        console.log(`\nChecking email count for label: ${label.name}`);
        try {
          // Set user credentials before making API call
          await gmailService.setUserCredentials(userId);
          
          // Get a small sample to check count
          const response = await gmailService.gmail.users.messages.list({
            userId: 'me',
            labelIds: [label.id],
            maxResults: 1
          });
          
          const emailCount = response.data.resultSizeEstimate || 0;
          console.log(`  - ${label.name} (ID: ${label.id}) has approximately ${emailCount} emails`);
          
          labelsWithCounts.push({
            ...label,
            emailCount
          });
        } catch (error) {
          console.error(`  - Error getting count for ${label.name}: ${error.message}`);
          labelsWithCounts.push({
            ...label,
            emailCount: 0
          });
        }
      }
      
      res.json({
        query,
        totalLabels: labels.length,
        matchingLabels: labelsWithCounts,
        found: labelsWithCounts.length > 0
      });
    } catch (error) {
      console.error('Label search error:', error);
      res.status(500).json({
        error: 'Failed to search labels',
        message: error.message
      });
    }
  });

  // Import emails from a specific label
  static importEmails = asyncHandler(async (req, res) => {
    const userId = req.user?.id || 'test-user';
    let { labelId, labelName, maxResults = 50 } = req.body;
    
    // Limit maxResults for testing
    if (maxResults > 10) {
      console.log(`Limiting maxResults from ${maxResults} to 10 for testing`);
      maxResults = 10;
    }
    
    console.log('=== Import Emails ===');
    console.log('User ID:', userId);
    console.log('Label ID:', labelId);
    console.log('Label Name:', labelName);
    console.log('Max Results:', maxResults);

    if (!labelId) {
      return res.status(400).json({ 
        error: 'Label ID is required' 
      });
    }

    try {
      // Fetch emails with the specified label
      console.log(`\nFetching emails with label ${labelName || labelId}...`);
      const emails = await gmailService.fetchEmailsByLabel(userId, labelId, null, maxResults);
      console.log(`Retrieved ${emails.length} emails`);

      // Process each email
      const results = {
        total: emails.length,
        processed: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        leads: [],
        errors: [],
        emailDetails: []  // New: detailed results for each email
      };

      console.log('\n=== Processing Emails ===');
      for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        console.log(`\n${'='.repeat(60)}`);
        console.log(`[${i + 1}/${emails.length}] Processing email:`);
        console.log(`  Gmail ID: ${email.id}`);
        console.log(`  From: ${email.from}`);
        console.log(`  Subject: ${email.subject}`);
        console.log(`  Date: ${email.date}`);
        console.log(`  Body preview: ${email.body?.substring(0, 100)}...`);

        const emailData = {
          subject: email.subject,
          body: email.body,
          from: email.from,
          date: email.date,
          gmail_message_id: email.id
        };

        // Create detailed result object
        const emailDetail = {
          gmailId: email.id,
          from: email.from,
          subject: email.subject,
          date: email.date,
          rawContent: {
            subject: email.subject,
            body: email.body?.substring(0, 500) + '...'  // First 500 chars
          },
          sourceDetection: null,
          parsingResult: null,
          leadData: null,
          errors: []
        };

        // Detect source
        console.log('\n  >> Step 1: Source Detection');
        const source = emailSourceDetector.detectSource(emailData);
        console.log(`     Detected source: ${source}`);
        emailDetail.sourceDetection = {
          source,
          confidence: source !== 'unknown' ? 'high' : 'none'
        };

        if (source === 'unknown') {
          console.log('     Result: SKIPPED (unknown source)');
          emailDetail.errors.push('Unknown email source - skipping');
          results.skipped++;
          results.errors.push({
            emailId: email.id,
            subject: email.subject,
            error: 'Unknown email source'
          });
          results.emailDetails.push(emailDetail);
          continue;
        }

        // Try to parse and save
        try {
          console.log('\n  >> Step 2: Email Parsing');
          console.log('     Running parser for source:', source);
          
          // Get parser for the source
          const Parser = emailParsingService.PARSERS[source];
          if (Parser) {
            console.log('     Extracting fields...');
            const parsedData = Parser.parse(emailData);
            
            console.log('     Parsed data:');
            console.log(`       Name: ${parsedData.first_name} ${parsedData.last_name}`);
            console.log(`       Phone: ${parsedData.phone}`);
            console.log(`       Email: ${parsedData.email}`);
            console.log(`       Property: ${parsedData.property}`);
            console.log(`       Move-in date: ${parsedData.move_in_date}`);
            console.log(`       Income: ${parsedData.income}`);
            console.log(`       Credit score: ${parsedData.credit_score}`);
            console.log(`       Parsing errors: ${parsedData.parsing_errors?.length || 0}`);
            
            emailDetail.parsingResult = {
              success: true,
              parsedFields: parsedData,
              parsingErrors: parsedData.parsing_errors || []
            };
          }
          
          console.log('\n  >> Step 3: Lead Processing');
          
          // Wrap the actual processing in its own try-catch
          let parseResult;
          try {
            parseResult = await emailParsingService.parseAndProcessEmail(emailData);
          } catch (processError) {
            // Log the specific error but don't crash
            console.error('     ERROR during parseAndProcessEmail:', processError.message);
            console.error('     Stack:', processError.stack);
            
            // Create a failed result instead of throwing
            parseResult = {
              success: false,
              error: `Processing failed: ${processError.message}`,
              source: source
            };
          }
          
          if (parseResult.success) {
            console.log('     Result: SUCCESS');
            console.log(`     Lead ID: ${parseResult.lead.id}`);
            console.log(`     New Lead: ${parseResult.isNew ? 'YES' : 'NO (updated existing)'}`);
            console.log(`     Missing info: ${parseResult.lead.missing_info?.join(', ') || 'None'}`);
            
            emailDetail.leadData = {
              leadId: parseResult.lead.id,
              isNew: parseResult.isNew,
              data: parseResult.lead
            };
            
            results.successful++;
            results.leads.push({
              leadId: parseResult.lead.id,
              name: `${parseResult.lead.first_name || ''} ${parseResult.lead.last_name || ''}`.trim(),
              phone: parseResult.lead.phone,
              email: parseResult.lead.email,
              property: parseResult.lead.property,
              source: parseResult.source,
              isNew: parseResult.isNew,
              missingInfo: parseResult.lead.missing_info
            });
          } else {
            console.log('     Result: FAILED');
            console.log(`     Error: ${parseResult.error}`);
            emailDetail.errors.push(parseResult.error);
            
            results.failed++;
            results.errors.push({
              emailId: email.id,
              subject: email.subject,
              error: parseResult.error
            });
          }
        } catch (error) {
          console.log('\n  >> Step 3: Processing ERROR');
          console.log(`     Error: ${error.message}`);
          emailDetail.errors.push(error.message);
          
          results.failed++;
          results.errors.push({
            emailId: email.id,
            subject: email.subject,
            error: error.message
          });
        }

        results.emailDetails.push(emailDetail);
        results.processed++;
      }

      // Summary
      console.log(`\n${'='.repeat(60)}`);
      console.log('=== Import Summary ===');
      console.log(`Total emails fetched: ${results.total}`);
      console.log(`Emails processed: ${results.processed}`);
      console.log(`Successfully parsed: ${results.successful}`);
      console.log(`Failed to parse: ${results.failed}`);
      console.log(`Skipped (unknown source): ${results.skipped}`);
      console.log(`New leads created: ${results.leads.filter(l => l.isNew).length}`);
      console.log(`Existing leads updated: ${results.leads.filter(l => !l.isNew).length}`);
      
      // Source breakdown
      const sourceBreakdown = {};
      results.emailDetails.forEach(detail => {
        const source = detail.sourceDetection?.source || 'unknown';
        sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
      });
      console.log('\nEmails by source:');
      Object.entries(sourceBreakdown).forEach(([source, count]) => {
        console.log(`  ${source}: ${count}`);
      });
      
      console.log(`\nImport completed at: ${new Date().toISOString()}`);
      console.log('='.repeat(60));

      res.json({
        success: true,
        labelId,
        labelName,
        summary: {
          total: results.total,
          processed: results.processed,
          successful: results.successful,
          failed: results.failed,
          skipped: results.skipped,
          newLeads: results.leads.filter(l => l.isNew).length,
          updatedLeads: results.leads.filter(l => !l.isNew).length,
          sourceBreakdown
        },
        leads: results.leads,
        errors: results.errors,
        emailDetails: results.emailDetails
      });
    } catch (error) {
      console.error('Import error:', error);
      res.status(500).json({
        error: 'Failed to import emails',
        message: error.message
      });
    }
  });

  // Test endpoints (no auth required)
  static testSearchLabels = asyncHandler(async (req, res) => {
    const { q } = req.query;
    const userId = 'test-user';
    
    console.log('=== TEST: Search Labels ===');
    console.log('Query:', q);
    
    try {
      // Check if we have stored tokens
      const tokens = await gmailService.getTokens(userId);
      if (!tokens) {
        return res.json({
          error: 'No Gmail connection',
          message: 'Please connect Gmail account first',
          labels: []
        });
      }
      
      const labels = await gmailService.listLabels(userId);
      const filtered = q ? 
        labels.filter(l => l.name.toLowerCase().includes(q.toLowerCase())) : 
        labels;
      
      // Get counts for filtered labels
      const labelsWithCounts = [];
      for (const label of filtered.slice(0, 10)) { // Limit to 10 for speed
        try {
          await gmailService.setUserCredentials(userId);
          const response = await gmailService.gmail.users.messages.list({
            userId: 'me',
            labelIds: [label.id],
            maxResults: 1
          });
          
          labelsWithCounts.push({
            id: label.id,
            name: label.name,
            count: response.data.resultSizeEstimate || 0
          });
        } catch (error) {
          labelsWithCounts.push({
            id: label.id,
            name: label.name,
            count: 0
          });
        }
      }
      
      res.json({
        query: q,
        labels: labelsWithCounts,
        total: filtered.length
      });
    } catch (error) {
      console.error('Test label search error:', error);
      res.status(500).json({
        error: 'Failed to search labels',
        message: error.message
      });
    }
  });

  static testImportEmails = asyncHandler(async (req, res) => {
    const { labelId, count } = req.body;
    const userId = 'test-user';
    
    console.log('\n===== TEST IMPORT EMAILS =====');
    console.log('Label ID:', labelId);
    console.log('Count:', count);
    console.log('Time:', new Date().toISOString());
    
    try {
      // Get label details
      const labels = await gmailService.listLabels(userId);
      const targetLabel = findLabelFlexible(labels, labelId);
      
      if (!targetLabel) {
        return res.status(404).json({
          error: 'Label not found',
          message: `Label "${labelId}" not found in Gmail`
        });
      }
      
      // Fetch emails
      const actualCount = count;
      
      const emails = await gmailService.fetchEmailsByLabel(userId, targetLabel.id, null, actualCount);
      console.log(`\nFetched ${emails.length} emails from "${targetLabel.name}"`);
      
      // Initialize results object properly
      const results = {
        total: emails.length,
        processed: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        leads: [],
        errors: [],
        emailDetails: []
      };
      
      // Process each email
      for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        console.log(`\n===== PROCESSING EMAIL ${i + 1}/${emails.length} =====`);
        console.log('From:', email.from);
        console.log('Subject:', email.subject);
        console.log('Date:', email.date);
        
        const emailData = {
          subject: email.subject,
          body: email.body,
          from: email.from,
          date: email.date,
          gmail_message_id: email.id
        };
        
        // Detect source
        const source = emailSourceDetector.detectSource(emailData);
        console.log('Detected source:', source);
        
        if (source === 'unknown') {
          console.log('SKIPPED - Unknown source');
          results.skipped++;
          results.errors.push({
            emailId: email.id,
            subject: email.subject,
            error: 'Unknown email source'
          });
          continue;
        }
        
        // Try to parse and save
        try {
          let parseResult;
          try {
            parseResult = await emailParsingService.parseAndProcessEmail(emailData);
          } catch (processError) {
            console.error('ERROR during processing:', processError.message);
            parseResult = {
              success: false,
              error: `Processing failed: ${processError.message}`,
              source: source
            };
          }
          
          if (parseResult.success) {
            console.log('SUCCESS - Lead processed');
            console.log(`Lead ID: ${parseResult.lead?.id}`);
            console.log(`New: ${parseResult.isNew ? 'YES' : 'NO'}`);
            
            results.successful++;
            results.leads.push({
              leadId: parseResult.lead?.id,
              name: `${parseResult.lead?.first_name || ''} ${parseResult.lead?.last_name || ''}`.trim(),
              phone: parseResult.lead?.phone,
              email: parseResult.lead?.email,
              property: parseResult.lead?.property,
              source: source,
              isNew: parseResult.isNew,
              missingInfo: parseResult.lead?.missing_info
            });
            
            results.emailDetails.push({
              gmailId: email.id,
              subject: email.subject,
              sourceDetection: { source },
              leadData: parseResult.lead,
              success: true
            });
          } else {
            console.log('FAILED -', parseResult.error);
            results.failed++;
            results.errors.push({
              emailId: email.id,
              subject: email.subject,
              error: parseResult.error
            });
            
            results.emailDetails.push({
              gmailId: email.id,
              subject: email.subject,
              sourceDetection: { source },
              errors: [parseResult.error],
              success: false
            });
          }
        } catch (error) {
          console.error('Unexpected error:', error.message);
          results.failed++;
          results.errors.push({
            emailId: email.id,
            subject: email.subject,
            error: error.message
          });
        }
        
        results.processed++;
      }
      
      // Summary
      console.log('\n===== IMPORT SUMMARY =====');
      console.log('Total:', results.total);
      console.log('Processed:', results.processed);
      console.log('Successful:', results.successful);
      console.log('Failed:', results.failed);
      console.log('Skipped:', results.skipped);
      console.log('New Leads:', results.leads.filter(l => l.isNew).length);
      console.log('Updated Leads:', results.leads.filter(l => !l.isNew).length);
      
      // Source breakdown
      const sourceBreakdown = {};
      results.emailDetails.forEach(detail => {
        const source = detail.sourceDetection?.source || 'unknown';
        sourceBreakdown[source] = (sourceBreakdown[source] || 0) + 1;
      });
      console.log('\nSources:');
      Object.entries(sourceBreakdown).forEach(([source, count]) => {
        console.log(`  ${source}: ${count}`);
      });
      
      // Return in the format the frontend expects
      res.json({
        imported: results.total,
        parsed: results.successful,
        errors: results.errors.map(e => e.error || e), // Extract just the error message
        results: results.emailDetails.map(detail => ({
          messageId: detail.gmailId,
          subject: detail.subject,
          parsed: detail.success === true,
          data: detail.leadData || {},
          error: detail.errors?.[0]
        }))
      });
    } catch (error) {
      console.error('Test import error:', error);
      res.status(500).json({
        error: 'Import failed',
        message: error.message
      });
    }
  });

  static testParseEmail = asyncHandler(async (req, res) => {
    const { messageId } = req.params;
    const userId = 'test-user';
    
    console.log('=== TEST: Parse Email ===');
    console.log('Message ID:', messageId);
    
    try {
      // Fetch single email
      await gmailService.setUserCredentials(userId);
      const message = await gmailService.gmail.users.messages.get({
        userId: 'me',
        id: messageId
      });
      
      // Extract email data
      const headers = message.data.payload.headers;
      const subject = headers.find(h => h.name === 'Subject')?.value || '';
      const from = headers.find(h => h.name === 'From')?.value || '';
      const date = headers.find(h => h.name === 'Date')?.value || '';
      
      let body = '';
      const parts = message.data.payload.parts || [message.data.payload];
      for (const part of parts) {
        if (part.mimeType === 'text/plain' && part.body.data) {
          body += Buffer.from(part.body.data, 'base64').toString();
        }
      }
      
      const emailData = {
        subject,
        body,
        from,
        date,
        gmail_message_id: messageId
      };
      
      // Parse
      console.log('\nParsing email...');
      const source = emailSourceDetector.detectSource(emailData);
      const parseResult = await emailParsingService.parseAndProcessEmail(emailData);
      
      console.log('Source:', source);
      console.log('Parse success:', parseResult.success);
      if (parseResult.lead) {
        console.log('Parsed data:', JSON.stringify(parseResult.lead, null, 2));
      }
      
      res.json({
        messageId,
        email: emailData,
        source,
        parseResult
      });
    } catch (error) {
      console.error('Test parse error:', error);
      res.status(500).json({
        error: 'Failed to parse email',
        message: error.message
      });
    }
  });

  // Test endpoint to manually set tokens for terminal testing
  static testSetTokens = asyncHandler(async (req, res) => {
    const { tokens } = req.body;
    const userId = 'test-user';
    
    console.log('=== TEST: Set Tokens ===');
    console.log('User ID:', userId);
    console.log('Has access token:', !!tokens?.access_token);
    console.log('Has refresh token:', !!tokens?.refresh_token);
    
    if (!tokens || !tokens.access_token || !tokens.refresh_token) {
      return res.status(400).json({
        error: 'Invalid token data',
        message: 'Both access_token and refresh_token are required'
      });
    }
    
    try {
      await gmailService.storeTokens(userId, tokens);
      console.log('Tokens stored successfully');
      
      // Test the tokens by fetching profile
      await gmailService.setUserCredentials(userId);
      const profile = await gmailService.gmail.users.getProfile({
        userId: 'me'
      });
      
      console.log('Gmail account:', profile.data.emailAddress);
      console.log('Tokens are valid!');
      
      res.json({
        success: true,
        message: 'Tokens stored and validated',
        email: profile.data.emailAddress
      });
    } catch (error) {
      console.error('Failed to set/validate tokens:', error);
      res.status(500).json({
        error: 'Failed to set tokens',
        message: error.message
      });
    }
  });
}

module.exports = GmailController;