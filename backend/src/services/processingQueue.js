const { AppError } = require('../middleware/errorHandler');

class ProcessingQueue {
  constructor() {
    // In-memory queue (in production, use Redis or RabbitMQ)
    this.queue = [];
    this.processing = false;
    this.currentBatch = null;
    this.rateLimit = {
      maxConcurrent: 5,
      delayMs: 100
    };
  }

  // Add emails to queue
  async enqueue(emails) {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const batch = {
      id: batchId,
      emails,
      status: 'queued',
      total: emails.length,
      processed: 0,
      successful: 0,
      failed: 0,
      createdAt: new Date().toISOString(),
      startedAt: null,
      completedAt: null,
      results: []
    };

    this.queue.push(batch);
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return {
      batchId,
      position: this.queue.length,
      estimatedTimeMs: this.queue.length * emails.length * this.rateLimit.delayMs
    };
  }

  // Process queue
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.shift();
      this.currentBatch = batch;
      batch.status = 'processing';
      batch.startedAt = new Date().toISOString();

      try {
        await this.processBatch(batch);
        batch.status = 'completed';
      } catch (error) {
        console.error('Batch processing error:', error);
        batch.status = 'failed';
        batch.error = error.message;
      }

      batch.completedAt = new Date().toISOString();
      this.currentBatch = null;
    }

    this.processing = false;
  }

  // Process individual batch
  async processBatch(batch) {
    const emailParsingService = require('./emailParsingService');
    
    // Process emails in chunks to avoid overload
    const chunkSize = this.rateLimit.maxConcurrent;
    
    for (let i = 0; i < batch.emails.length; i += chunkSize) {
      const chunk = batch.emails.slice(i, i + chunkSize);
      
      // Process chunk in parallel
      const chunkResults = await Promise.all(
        chunk.map(async (email) => {
          try {
            const result = await emailParsingService.parseAndProcessEmail(email);
            batch.processed++;
            
            if (result.success) {
              batch.successful++;
            } else {
              batch.failed++;
            }
            
            return {
              emailId: email.gmail_message_id || email.id,
              ...result
            };
          } catch (error) {
            batch.processed++;
            batch.failed++;
            
            return {
              emailId: email.gmail_message_id || email.id,
              success: false,
              error: error.message
            };
          }
        })
      );

      batch.results.push(...chunkResults);
      
      // Rate limiting between chunks
      if (i + chunkSize < batch.emails.length) {
        await new Promise(resolve => setTimeout(resolve, this.rateLimit.delayMs));
      }
    }
  }

  // Get queue status
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      currentBatch: this.currentBatch ? {
        id: this.currentBatch.id,
        progress: `${this.currentBatch.processed}/${this.currentBatch.total}`,
        percentComplete: Math.round((this.currentBatch.processed / this.currentBatch.total) * 100)
      } : null
    };
  }

  // Get batch status
  getBatchStatus(batchId) {
    // Check current batch
    if (this.currentBatch && this.currentBatch.id === batchId) {
      return this.currentBatch;
    }

    // Check queue
    const queuedBatch = this.queue.find(b => b.id === batchId);
    if (queuedBatch) {
      return queuedBatch;
    }

    // Check completed batches (in production, fetch from database)
    const completed = global.batchProcessingStatus?.[batchId];
    if (completed) {
      return completed;
    }

    return null;
  }

  // Cancel batch
  cancelBatch(batchId) {
    const index = this.queue.findIndex(b => b.id === batchId);
    
    if (index !== -1) {
      const [batch] = this.queue.splice(index, 1);
      batch.status = 'cancelled';
      batch.completedAt = new Date().toISOString();
      return batch;
    }

    if (this.currentBatch && this.currentBatch.id === batchId) {
      throw new AppError('Cannot cancel batch that is currently processing', 400);
    }

    throw new AppError('Batch not found', 404);
  }

  // Get processing history
  getHistory(limit = 10) {
    // In production, fetch from database
    const history = [];
    
    if (global.batchProcessingStatus) {
      const batches = Object.values(global.batchProcessingStatus)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, limit);
      
      history.push(...batches);
    }

    return history;
  }

  // Update rate limits
  updateRateLimit(maxConcurrent, delayMs) {
    this.rateLimit = {
      maxConcurrent: maxConcurrent || this.rateLimit.maxConcurrent,
      delayMs: delayMs || this.rateLimit.delayMs
    };
  }
}

// Create singleton instance
const processingQueue = new ProcessingQueue();

module.exports = processingQueue;