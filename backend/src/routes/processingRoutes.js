const express = require('express');
const router = express.Router();
const ProcessingController = require('../controllers/processingController');
const { authenticate } = require('../middleware/auth');

// All processing routes require authentication
router.use(authenticate);

// Queue and batch management
router.get('/queue/status', ProcessingController.getQueueStatus);
router.get('/status/:batchId', ProcessingController.getStatus);
router.post('/retry/:batchId', ProcessingController.retryBatch);
router.delete('/cancel/:batchId', ProcessingController.cancelBatch);

// History and statistics
router.get('/history', ProcessingController.getHistory);
router.get('/stats', ProcessingController.getStats);

// Configuration
router.put('/rate-limit', ProcessingController.updateRateLimit);

module.exports = router;