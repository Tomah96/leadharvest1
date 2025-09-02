const express = require('express');
const router = express.Router();
const GmailController = require('../controllers/gmailController');
const { authenticate } = require('../middleware/auth');

// Test endpoints for Gmail integration
router.get('/gmail/test-connection', authenticate, GmailController.testConnection);
router.get('/gmail/test-processed-leads', authenticate, GmailController.testProcessedLeads);

module.exports = router;