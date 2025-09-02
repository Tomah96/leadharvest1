const express = require('express');
const router = express.Router();
const GmailController = require('../controllers/gmailController');
const { authenticate } = require('../middleware/auth');

// Gmail OAuth routes
router.get('/auth-url', authenticate, GmailController.getAuthUrl);
router.get('/auth-callback', GmailController.handleAuthCallback);

// Gmail API routes (all require authentication)
router.post('/token', authenticate, GmailController.storeTokens);
router.get('/messages', authenticate, GmailController.fetchMessages);
router.post('/process-batch', authenticate, GmailController.processBatch);
router.get('/labels', authenticate, GmailController.getLabels);

// Gmail webhook endpoint (no auth required as it's called by Google)
router.post('/webhook', GmailController.handleWebhook);

// Connection status endpoint (uses the new getStatus method)
router.get('/status', authenticate, GmailController.getStatus);

// Disconnect Gmail
router.post('/disconnect', authenticate, GmailController.disconnectGmail);

// Search for labels
router.get('/search-label', authenticate, GmailController.searchLabel);

// Import emails from a label
router.post('/import-emails', authenticate, GmailController.importEmails);

// Test endpoints (no database required)
router.get('/test/labels', GmailController.testSearchLabels);
router.post('/test/import', GmailController.testImportEmails);
router.get('/test/parse/:messageId', GmailController.testParseEmail);
router.post('/test/set-tokens', GmailController.testSetTokens);

module.exports = router;