const { asyncHandler } = require('../middleware/errorHandler');
const { AppError } = require('../middleware/errorHandler');
const processingQueue = require('../services/processingQueue');
const emailParsingService = require('../services/emailParsingService');

class ProcessingController {
  // Get batch processing status
  static getStatus = asyncHandler(async (req, res) => {
    const { batchId } = req.params;

    // Try processing queue first
    let status = processingQueue.getBatchStatus(batchId);
    
    // If not found, check email parsing service
    if (!status) {
      status = emailParsingService.getProcessingStatus(batchId);
    }

    if (!status) {
      throw new AppError('Batch not found', 404);
    }

    res.json({
      success: true,
      data: status
    });
  });

  // Retry failed emails in a batch
  static retryBatch = asyncHandler(async (req, res) => {
    const { batchId } = req.params;

    // Get the batch status first
    const status = processingQueue.getBatchStatus(batchId) || 
                   emailParsingService.getProcessingStatus(batchId);

    if (!status) {
      throw new AppError('Batch not found', 404);
    }

    if (status.status === 'processing') {
      throw new AppError('Cannot retry batch that is currently processing', 400);
    }

    // Extract failed emails
    const failedEmails = status.results
      .filter(r => !r.success)
      .map(r => ({ 
        gmail_message_id: r.emailId,
        // In production, fetch actual email data
      }));

    if (failedEmails.length === 0) {
      return res.json({
        success: true,
        message: 'No failed emails to retry'
      });
    }

    // Queue for retry
    const retryResult = await processingQueue.enqueue(failedEmails);

    res.json({
      success: true,
      data: {
        originalBatchId: batchId,
        retryBatchId: retryResult.batchId,
        failedCount: failedEmails.length,
        message: `Retrying ${failedEmails.length} failed emails`
      }
    });
  });

  // Get processing history
  static getHistory = asyncHandler(async (req, res) => {
    const { limit = 10, offset = 0 } = req.query;

    const history = processingQueue.getHistory(parseInt(limit));

    res.json({
      success: true,
      data: {
        batches: history,
        total: history.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });
  });

  // Get queue status
  static getQueueStatus = asyncHandler(async (req, res) => {
    const status = processingQueue.getQueueStatus();

    res.json({
      success: true,
      data: status
    });
  });

  // Cancel a queued batch
  static cancelBatch = asyncHandler(async (req, res) => {
    const { batchId } = req.params;

    const cancelledBatch = processingQueue.cancelBatch(batchId);

    res.json({
      success: true,
      message: 'Batch cancelled successfully',
      data: cancelledBatch
    });
  });

  // Update rate limits
  static updateRateLimit = asyncHandler(async (req, res) => {
    const { maxConcurrent, delayMs } = req.body;

    if (maxConcurrent && (maxConcurrent < 1 || maxConcurrent > 20)) {
      throw new AppError('maxConcurrent must be between 1 and 20', 400);
    }

    if (delayMs && (delayMs < 50 || delayMs > 5000)) {
      throw new AppError('delayMs must be between 50 and 5000', 400);
    }

    processingQueue.updateRateLimit(maxConcurrent, delayMs);

    res.json({
      success: true,
      message: 'Rate limits updated',
      data: processingQueue.rateLimit
    });
  });

  // Get processing statistics
  static getStats = asyncHandler(async (req, res) => {
    const history = processingQueue.getHistory(100);
    
    const stats = {
      totalBatches: history.length,
      totalEmails: history.reduce((sum, b) => sum + b.total, 0),
      successfulEmails: history.reduce((sum, b) => sum + b.successful, 0),
      failedEmails: history.reduce((sum, b) => sum + b.failed, 0),
      averageProcessingTime: 0,
      successRate: 0
    };

    if (stats.totalEmails > 0) {
      stats.successRate = Math.round((stats.successfulEmails / stats.totalEmails) * 100);
    }

    // Calculate average processing time
    const completedBatches = history.filter(b => b.completedAt && b.startedAt);
    if (completedBatches.length > 0) {
      const totalTime = completedBatches.reduce((sum, b) => {
        const start = new Date(b.startedAt);
        const end = new Date(b.completedAt);
        return sum + (end - start);
      }, 0);
      stats.averageProcessingTime = Math.round(totalTime / completedBatches.length);
    }

    res.json({
      success: true,
      data: stats
    });
  });
}

module.exports = ProcessingController;