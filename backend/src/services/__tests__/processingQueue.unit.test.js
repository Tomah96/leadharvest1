const processingQueue = require('../processingQueue');

// Mock the email parsing service
jest.mock('../emailParsingService', () => ({
  parseAndProcessEmail: jest.fn().mockImplementation((email) => {
    if (email.shouldFail) {
      throw new Error('Parsing failed');
    }
    return {
      success: true,
      source: 'zillow',
      lead: { id: 'lead123', phone: '5551234567' },
      isNew: true,
      parsingErrors: []
    };
  })
}));

describe('ProcessingQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset queue state
    processingQueue.queue = [];
    processingQueue.processing = false;
    processingQueue.currentBatch = null;
    // Clear global state
    if (global.batchProcessingStatus) {
      delete global.batchProcessingStatus;
    }
  });

  describe('Queue Management', () => {
    it('should enqueue emails and return batch info', async () => {
      const emails = [
        { gmail_message_id: 'msg1', subject: 'Test 1' },
        { gmail_message_id: 'msg2', subject: 'Test 2' }
      ];

      const result = await processingQueue.enqueue(emails);

      expect(result).toEqual({
        batchId: expect.stringMatching(/^batch_\d+_[a-z0-9]+$/),
        position: 1,
        estimatedTimeMs: 200 // 1 batch * 2 emails * 100ms delay
      });

      expect(processingQueue.queue).toHaveLength(1);
      expect(processingQueue.queue[0].emails).toEqual(emails);
    });

    it('should start processing automatically when emails are queued', async () => {
      const emails = [{ gmail_message_id: 'msg1' }];

      jest.spyOn(processingQueue, 'processQueue');
      await processingQueue.enqueue(emails);

      // Wait for async processing to start
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(processingQueue.processQueue).toHaveBeenCalled();
    });

    it('should process emails in FIFO order', async () => {
      // Stop automatic processing for this test
      processingQueue.processing = true;
      
      const batch1 = [{ gmail_message_id: 'msg1' }];
      const batch2 = [{ gmail_message_id: 'msg2' }];

      await processingQueue.enqueue(batch1);
      await processingQueue.enqueue(batch2);

      // Reset processing flag
      processingQueue.processing = false;

      // Check queue order - batches should be processed FIFO
      expect(processingQueue.queue.length).toBe(2);
      expect(processingQueue.queue[0].emails[0].gmail_message_id).toBe('msg1');
      expect(processingQueue.queue[1].emails[0].gmail_message_id).toBe('msg2');
    });
  });

  describe('Batch Processing', () => {
    it('should process batch successfully', async () => {
      const emails = [
        { gmail_message_id: 'msg1' },
        { gmail_message_id: 'msg2' },
        { gmail_message_id: 'msg3' }
      ];

      const batch = {
        id: 'test-batch',
        emails,
        status: 'processing',
        total: 3,
        processed: 0,
        successful: 0,
        failed: 0,
        results: []
      };

      await processingQueue.processBatch(batch);

      expect(batch.processed).toBe(3);
      expect(batch.successful).toBe(3);
      expect(batch.failed).toBe(0);
      expect(batch.results).toHaveLength(3);
    });

    it('should handle processing failures', async () => {
      const emails = [
        { gmail_message_id: 'msg1' },
        { gmail_message_id: 'msg2', shouldFail: true },
        { gmail_message_id: 'msg3' }
      ];

      const batch = {
        id: 'test-batch',
        emails,
        status: 'processing',
        total: 3,
        processed: 0,
        successful: 0,
        failed: 0,
        results: []
      };

      await processingQueue.processBatch(batch);

      expect(batch.processed).toBe(3);
      expect(batch.successful).toBe(2);
      expect(batch.failed).toBe(1);
      expect(batch.results[1].success).toBe(false);
      expect(batch.results[1].error).toBe('Parsing failed');
    });

    it('should process emails in chunks with rate limiting', async () => {
      // Set smaller chunk size for testing
      processingQueue.rateLimit.maxConcurrent = 2;

      const emails = Array(5).fill(null).map((_, i) => ({
        gmail_message_id: `msg${i}`
      }));

      const batch = {
        id: 'test-batch',
        emails,
        status: 'processing',
        total: 5,
        processed: 0,
        successful: 0,
        failed: 0,
        results: []
      };

      const startTime = Date.now();
      await processingQueue.processBatch(batch);
      const endTime = Date.now();

      // Should have processed in 3 chunks (2+2+1) with delays
      expect(batch.processed).toBe(5);
      expect(endTime - startTime).toBeGreaterThanOrEqual(200); // At least 2 delays
    });
  });

  describe('Status Tracking', () => {
    it('should get queue status', () => {
      const status = processingQueue.getQueueStatus();

      expect(status).toEqual({
        queueLength: 0,
        processing: false,
        currentBatch: null
      });
    });

    it('should track current batch progress', async () => {
      const emails = Array(10).fill(null).map((_, i) => ({
        gmail_message_id: `msg${i}`
      }));

      await processingQueue.enqueue(emails);
      
      // Start processing
      processingQueue.processing = true;
      processingQueue.currentBatch = {
        id: 'batch123',
        total: 10,
        processed: 3
      };

      const status = processingQueue.getQueueStatus();

      expect(status.currentBatch).toEqual({
        id: 'batch123',
        progress: '3/10',
        percentComplete: 30
      });
    });

    it('should get batch status by ID', async () => {
      // Stop automatic processing
      processingQueue.processing = true;
      
      const emails = [{ gmail_message_id: 'msg1' }];
      const result = await processingQueue.enqueue(emails);

      const batchStatus = processingQueue.getBatchStatus(result.batchId);

      expect(batchStatus).toBeDefined();
      expect(batchStatus.id).toBe(result.batchId);
      expect(batchStatus.status).toBe('queued');
      
      // Reset
      processingQueue.processing = false;
    });

    it('should return null for unknown batch ID', () => {
      const status = processingQueue.getBatchStatus('unknown-batch');
      expect(status).toBeNull();
    });
  });

  describe('Batch Cancellation', () => {
    it('should cancel queued batch', async () => {
      // Stop automatic processing
      processingQueue.processing = true;
      
      const emails = [{ gmail_message_id: 'msg1' }];
      const result = await processingQueue.enqueue(emails);

      // Reset processing flag before cancellation
      processingQueue.processing = false;

      const cancelled = processingQueue.cancelBatch(result.batchId);

      expect(cancelled.status).toBe('cancelled');
      expect(cancelled.completedAt).toBeDefined();
      expect(processingQueue.queue).toHaveLength(0);
    });

    it('should not cancel currently processing batch', () => {
      processingQueue.currentBatch = {
        id: 'batch123',
        status: 'processing'
      };

      expect(() => {
        processingQueue.cancelBatch('batch123');
      }).toThrow('Cannot cancel batch that is currently processing');
    });

    it('should throw error for unknown batch', () => {
      expect(() => {
        processingQueue.cancelBatch('unknown-batch');
      }).toThrow('Batch not found');
    });
  });

  describe('Processing History', () => {
    it('should get processing history', () => {
      // Set up some completed batches
      global.batchProcessingStatus = {
        batch1: {
          id: 'batch1',
          createdAt: new Date('2025-07-17T10:00:00Z').toISOString(),
          status: 'completed'
        },
        batch2: {
          id: 'batch2',
          createdAt: new Date('2025-07-17T11:00:00Z').toISOString(),
          status: 'completed'
        }
      };

      const history = processingQueue.getHistory(10);

      expect(history).toHaveLength(2);
      expect(history[0].id).toBe('batch2'); // Most recent first
      expect(history[1].id).toBe('batch1');
    });

    it('should limit history results', () => {
      // Set up many completed batches
      global.batchProcessingStatus = {};
      for (let i = 0; i < 20; i++) {
        global.batchProcessingStatus[`batch${i}`] = {
          id: `batch${i}`,
          createdAt: new Date(Date.now() - i * 1000).toISOString(),
          status: 'completed'
        };
      }

      const history = processingQueue.getHistory(5);
      expect(history).toHaveLength(5);
    });
  });

  describe('Rate Limiting', () => {
    it('should update rate limits', () => {
      processingQueue.updateRateLimit(10, 500);

      expect(processingQueue.rateLimit).toEqual({
        maxConcurrent: 10,
        delayMs: 500
      });
    });

    it('should keep existing value if not provided', () => {
      const originalDelay = processingQueue.rateLimit.delayMs;
      
      processingQueue.updateRateLimit(15);

      expect(processingQueue.rateLimit.maxConcurrent).toBe(15);
      expect(processingQueue.rateLimit.delayMs).toBe(originalDelay);
    });
  });
});