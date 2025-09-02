# Data Migration Strategy - 4000+ Existing Emails

## Overview
Strategy for safely migrating 4000+ existing Gmail leads into LeadHarvest CRM with proper deduplication, validation, and progress tracking.

## Migration Phases

### Phase 1: Pre-Migration Analysis (Day 1)
```javascript
// Analyze existing emails to understand data patterns
const analyzeExistingEmails = async () => {
  const stats = {
    total: 0,
    bySource: {},
    byMonth: {},
    withPhone: 0,
    withoutPhone: 0,
    duplicatePhones: new Set()
  };
  
  // Sample 100 emails for pattern analysis
  const sample = await gmail.users.messages.list({
    userId: 'me',
    q: 'from:(zillow.com OR realtor.com OR apartments.com OR rentmarketplace.com)',
    maxResults: 100
  });
  
  // Analyze patterns
  for (const message of sample.messages) {
    const lead = await parseEmailMessage(message.id);
    updateStats(stats, lead);
  }
  
  return stats;
};
```

### Phase 2: Migration Infrastructure (Day 2)

#### 2.1 Migration Database Tables
```sql
-- Migration tracking table
CREATE TABLE email_migration_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id VARCHAR(255) NOT NULL,
  source VARCHAR(50) NOT NULL,
  total_emails INTEGER NOT NULL,
  processed INTEGER DEFAULT 0,
  successful INTEGER DEFAULT 0,
  failed INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_log JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration email mapping
CREATE TABLE email_migration_map (
  gmail_message_id VARCHAR(255) PRIMARY KEY,
  lead_id UUID REFERENCES leads(id),
  processed_at TIMESTAMPTZ,
  status VARCHAR(20),
  error_message TEXT,
  raw_data JSONB
);
```

#### 2.2 Migration Queue Setup
```javascript
const Queue = require('bull');
const migrationQueue = new Queue('email-migration', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  }
});

// Queue processor
migrationQueue.process('migrate-email', 5, async (job) => {
  const { messageId, batchId } = job.data;
  
  try {
    // Check if already processed
    const existing = await db.query(
      'SELECT * FROM email_migration_map WHERE gmail_message_id = $1',
      [messageId]
    );
    
    if (existing.rows.length > 0) {
      return { status: 'already_processed' };
    }
    
    // Parse email
    const emailData = await fetchAndParseEmail(messageId);
    
    // Create or update lead
    const lead = await leadService.createOrUpdateLead(emailData);
    
    // Record mapping
    await db.query(
      `INSERT INTO email_migration_map 
       (gmail_message_id, lead_id, processed_at, status, raw_data) 
       VALUES ($1, $2, NOW(), $3, $4)`,
      [messageId, lead.id, 'success', emailData]
    );
    
    // Update batch progress
    await updateBatchProgress(batchId, 'success');
    
    return { status: 'success', leadId: lead.id };
  } catch (error) {
    await recordMigrationError(messageId, batchId, error);
    throw error;
  }
});
```

### Phase 3: Batch Processing Strategy

#### 3.1 Intelligent Batching
```javascript
const createMigrationBatches = async () => {
  const sources = ['zillow', 'realtor', 'apartments', 'rentmarketplace'];
  const batches = [];
  
  for (const source of sources) {
    // Get all emails from source
    const emails = await getAllEmailsFromSource(source);
    
    // Create time-based batches (newest first for better dedup)
    const sortedEmails = emails.sort((a, b) => 
      new Date(b.internalDate) - new Date(a.internalDate)
    );
    
    // Batch size: 100 emails per batch
    const BATCH_SIZE = 100;
    for (let i = 0; i < sortedEmails.length; i += BATCH_SIZE) {
      batches.push({
        id: `${source}-batch-${Math.floor(i / BATCH_SIZE)}`,
        source,
        emails: sortedEmails.slice(i, i + BATCH_SIZE),
        priority: sources.indexOf(source) // Prioritize by source
      });
    }
  }
  
  return batches;
};
```

#### 3.2 Progressive Migration
```javascript
const runProgressiveMigration = async () => {
  const batches = await createMigrationBatches();
  
  console.log(`Created ${batches.length} batches for migration`);
  
  // Start with small test batch
  const testBatch = batches[0];
  await processBatch(testBatch);
  
  // Verify test batch
  const testResults = await verifyBatchResults(testBatch.id);
  if (testResults.successRate < 0.95) {
    throw new Error('Test batch failed quality check');
  }
  
  // Process remaining batches
  for (const batch of batches.slice(1)) {
    await processBatch(batch);
    
    // Throttle to avoid overload
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
};
```

### Phase 4: Deduplication Strategy

#### 4.1 Phone-Based Deduplication
```javascript
const deduplicateByPhone = async (emailData) => {
  if (!emailData.phone) {
    return { isNew: true };
  }
  
  const normalizedPhone = normalizePhone(emailData.phone);
  
  // Check existing leads
  const existing = await db.query(
    'SELECT * FROM leads WHERE phone = $1 ORDER BY created_at ASC',
    [normalizedPhone]
  );
  
  if (existing.rows.length === 0) {
    return { isNew: true };
  }
  
  // Merge strategy: Keep earliest lead, update with new info
  const existingLead = existing.rows[0];
  const mergedData = mergeLeadData(existingLead, emailData);
  
  return {
    isNew: false,
    existingId: existingLead.id,
    mergedData,
    duplicateCount: existing.rows.length
  };
};
```

#### 4.2 Data Merging Rules
```javascript
const mergeLeadData = (existing, newData) => {
  const merged = { ...existing };
  
  // Update only if new data is more complete
  const updateFields = [
    'first_name', 'last_name', 'email', 
    'credit_score', 'income', 'move_in_date',
    'pets', 'occupants', 'lease_length'
  ];
  
  for (const field of updateFields) {
    if (!merged[field] && newData[field]) {
      merged[field] = newData[field];
    }
  }
  
  // Append to notes/conversation history
  if (newData.message) {
    merged.conversation_history = merged.conversation_history || [];
    merged.conversation_history.push({
      date: newData.email_date,
      source: newData.source,
      message: newData.message
    });
  }
  
  // Update missing_info array
  merged.missing_info = detectMissingInfo(merged);
  
  return merged;
};
```

### Phase 5: Quality Assurance

#### 5.1 Validation Checks
```javascript
const validateMigratedData = async (batchId) => {
  const checks = {
    totalProcessed: 0,
    validPhones: 0,
    validEmails: 0,
    completeProfiles: 0,
    duplicatesFound: 0,
    errors: []
  };
  
  const leads = await getLeadsFromBatch(batchId);
  
  for (const lead of leads) {
    checks.totalProcessed++;
    
    // Validate phone
    if (lead.phone && isValidPhone(lead.phone)) {
      checks.validPhones++;
    }
    
    // Validate email
    if (lead.email && isValidEmail(lead.email)) {
      checks.validEmails++;
    }
    
    // Check profile completeness
    if (lead.missing_info.length === 0) {
      checks.completeProfiles++;
    }
  }
  
  return checks;
};
```

#### 5.2 Rollback Strategy
```javascript
const rollbackBatch = async (batchId) => {
  try {
    // Get all leads created in this batch
    const mappings = await db.query(
      `SELECT lead_id FROM email_migration_map 
       WHERE batch_id = $1 AND status = 'success'`,
      [batchId]
    );
    
    // Soft delete leads
    for (const mapping of mappings.rows) {
      await db.query(
        'UPDATE leads SET deleted_at = NOW() WHERE id = $1',
        [mapping.lead_id]
      );
    }
    
    // Update migration status
    await db.query(
      `UPDATE email_migration_status 
       SET status = 'rolled_back' 
       WHERE batch_id = $1`,
      [batchId]
    );
    
  } catch (error) {
    console.error('Rollback failed:', error);
    throw error;
  }
};
```

## Migration Timeline

### Day 1: Preparation
- [ ] Analyze email patterns
- [ ] Set up migration infrastructure
- [ ] Create test batch (100 emails)
- [ ] Verify parsing accuracy

### Day 2-3: Test Migration
- [ ] Process test batch
- [ ] Validate results
- [ ] Fix any parsing issues
- [ ] Optimize performance

### Day 4-7: Full Migration
- [ ] Process by source (Zillow first)
- [ ] Monitor deduplication rate
- [ ] Handle errors and retries
- [ ] Daily progress reports

### Day 8: Verification
- [ ] Full data audit
- [ ] Missing information report
- [ ] Duplicate analysis
- [ ] Performance metrics

## Monitoring Dashboard

```javascript
const getMigrationDashboard = async () => {
  const stats = await db.query(`
    SELECT 
      COUNT(*) as total_batches,
      SUM(total_emails) as total_emails,
      SUM(processed) as processed,
      SUM(successful) as successful,
      SUM(failed) as failed,
      AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) as avg_batch_time
    FROM email_migration_status
  `);
  
  const bySource = await db.query(`
    SELECT 
      source,
      COUNT(*) as count,
      SUM(successful) as successful
    FROM email_migration_status
    GROUP BY source
  `);
  
  return {
    overview: stats.rows[0],
    bySource: bySource.rows,
    successRate: stats.rows[0].successful / stats.rows[0].processed,
    estimatedCompletion: calculateETA(stats.rows[0])
  };
};
```

## Post-Migration Tasks

1. **Generate Reports**
   - Total leads imported
   - Deduplication statistics
   - Missing information summary
   - Failed email analysis

2. **Data Cleanup**
   - Archive processed emails
   - Apply "processed-lead" label
   - Clean up migration tables

3. **Enable Real-time Processing**
   - Activate Gmail webhooks
   - Start auto-reply system
   - Monitor new lead flow

## Success Metrics

- **Target**: 95%+ successful migration rate
- **Deduplication**: 20-30% expected duplicate rate
- **Processing Speed**: 500 emails/hour
- **Data Completeness**: 60%+ with phone numbers
- **Zero Data Loss**: All emails tracked in migration map