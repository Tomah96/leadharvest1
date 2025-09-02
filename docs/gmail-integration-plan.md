# Gmail API Integration Plan - LeadHarvest CRM

## Overview
This document outlines the complete Gmail API integration strategy for processing 4000+ existing emails and monitoring new leads in real-time.

## Phase 1: Gmail API Setup

### 1.1 Google Cloud Console Setup
```bash
# Required APIs to enable:
- Gmail API
- Google Cloud Pub/Sub API (for webhooks)

# OAuth 2.0 Scopes needed:
- https://www.googleapis.com/auth/gmail.readonly
- https://www.googleapis.com/auth/gmail.modify (for marking as read)
- https://www.googleapis.com/auth/gmail.send (for auto-replies)
```

### 1.2 Authentication Flow
```javascript
const { google } = require('googleapis');

// OAuth2 Configuration
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Generate auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.send'
  ]
});

// Exchange code for tokens
const { tokens } = await oauth2Client.getToken(code);
oauth2Client.setCredentials(tokens);
```

## Phase 2: Webhook Setup for Real-time Processing

### 2.1 Create Pub/Sub Topic
```javascript
const { PubSub } = require('@google-cloud/pubsub');

const pubsub = new PubSub();
const topicName = 'leadharvest-gmail-webhook';

// Create topic
const [topic] = await pubsub.createTopic(topicName);

// Create subscription
const [subscription] = await topic.createSubscription('leadharvest-sub');
```

### 2.2 Register Gmail Push Notifications
```javascript
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

// Watch for changes in INBOX with "processed-lead" label
const res = await gmail.users.watch({
  userId: 'me',
  requestBody: {
    labelIds: ['INBOX'],
    topicName: `projects/${PROJECT_ID}/topics/${topicName}`,
    labelFilterAction: 'include'
  }
});

// Store watch expiration (renew before expiry)
const watchExpiration = res.data.expiration;
```

### 2.3 Webhook Endpoint
```javascript
// In gmailRoutes.js
router.post('/webhook', async (req, res) => {
  const message = req.body.message;
  
  if (!message) {
    return res.status(400).send('Bad Request');
  }
  
  // Decode Pub/Sub message
  const data = JSON.parse(
    Buffer.from(message.data, 'base64').toString()
  );
  
  // Queue for processing
  await emailQueue.add('process-email', {
    historyId: data.historyId,
    emailAddress: data.emailAddress
  });
  
  res.status(200).send();
});
```

## Phase 3: Email Processing Pipeline

### 3.1 Fetch New Messages
```javascript
const getNewMessages = async (historyId) => {
  const res = await gmail.users.history.list({
    userId: 'me',
    startHistoryId: historyId,
    labelId: 'INBOX',
    historyTypes: ['messageAdded']
  });
  
  const messages = [];
  if (res.data.history) {
    for (const history of res.data.history) {
      if (history.messagesAdded) {
        messages.push(...history.messagesAdded);
      }
    }
  }
  
  return messages;
};
```

### 3.2 Parse Email Content
```javascript
const parseEmailMessage = async (messageId) => {
  const res = await gmail.users.messages.get({
    userId: 'me',
    id: messageId
  });
  
  const message = res.data;
  const headers = message.payload.headers;
  
  // Extract metadata
  const from = headers.find(h => h.name === 'From')?.value;
  const subject = headers.find(h => h.name === 'Subject')?.value;
  const date = headers.find(h => h.name === 'Date')?.value;
  
  // Extract body
  const body = extractBody(message.payload);
  
  // Detect source
  const source = detectEmailSource(from, subject);
  
  // Parse based on source
  const lead = await parseEmailBySource(source, {
    from,
    subject,
    body,
    date
  });
  
  return lead;
};
```

### 3.3 Apply "processed-lead" Label
```javascript
const markAsProcessed = async (messageId) => {
  // Get or create label
  const labels = await gmail.users.labels.list({ userId: 'me' });
  let processedLabel = labels.data.labels.find(
    l => l.name === 'processed-lead'
  );
  
  if (!processedLabel) {
    processedLabel = await gmail.users.labels.create({
      userId: 'me',
      requestBody: {
        name: 'processed-lead',
        labelListVisibility: 'labelShow',
        messageListVisibility: 'show'
      }
    });
  }
  
  // Apply label
  await gmail.users.messages.modify({
    userId: 'me',
    id: messageId,
    requestBody: {
      addLabelIds: [processedLabel.id],
      removeLabelIds: ['UNREAD']
    }
  });
};
```

## Phase 4: Batch Processing Existing Emails

### 4.1 Search for Unprocessed Leads
```javascript
const findUnprocessedLeads = async () => {
  const queries = [
    'from:zillow.com -label:processed-lead',
    'from:realtor.com -label:processed-lead',
    'from:apartments.com -label:processed-lead',
    'from:rentmarketplace.com -label:processed-lead'
  ];
  
  const allMessages = [];
  
  for (const query of queries) {
    let pageToken;
    do {
      const res = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        pageToken,
        maxResults: 500
      });
      
      if (res.data.messages) {
        allMessages.push(...res.data.messages);
      }
      
      pageToken = res.data.nextPageToken;
    } while (pageToken);
  }
  
  return allMessages;
};
```

### 4.2 Batch Processing Strategy
```javascript
const processBatchEmails = async () => {
  const messages = await findUnprocessedLeads();
  console.log(`Found ${messages.length} unprocessed emails`);
  
  // Process in batches to avoid rate limits
  const BATCH_SIZE = 50;
  const DELAY_MS = 1000;
  
  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    
    await Promise.all(
      batch.map(async (message) => {
        try {
          const lead = await parseEmailMessage(message.id);
          await leadService.createOrUpdateLead(lead);
          await markAsProcessed(message.id);
        } catch (error) {
          console.error(`Failed to process ${message.id}:`, error);
        }
      })
    );
    
    // Rate limit delay
    await new Promise(resolve => setTimeout(resolve, DELAY_MS));
    
    console.log(`Processed ${i + batch.length} of ${messages.length}`);
  }
};
```

## Phase 5: Auto-Reply System

### 5.1 Send Auto-Reply
```javascript
const sendAutoReply = async (lead, template) => {
  if (!lead.email) return;
  
  const emailContent = renderTemplate(template, lead);
  
  const message = [
    `To: ${lead.email}`,
    `Subject: ${emailContent.subject}`,
    `Content-Type: text/plain; charset=utf-8`,
    '',
    emailContent.body
  ].join('\n');
  
  const encodedMessage = Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  await gmail.users.messages.send({
    userId: 'me',
    requestBody: {
      raw: encodedMessage
    }
  });
  
  // Log auto-reply
  await logAutoReply(lead.id, template);
};
```

## Implementation Timeline

### Week 1: Foundation
- [ ] Set up Google Cloud Project
- [ ] Implement OAuth2 flow
- [ ] Create webhook endpoint
- [ ] Basic email fetching

### Week 2: Processing
- [ ] Implement email parsers
- [ ] Set up lead deduplication
- [ ] Create processing queue
- [ ] Test with sample emails

### Week 3: Automation
- [ ] Batch process existing emails
- [ ] Implement auto-reply system
- [ ] Set up monitoring
- [ ] Performance optimization

## Rate Limits & Best Practices

### Gmail API Limits
- 250 quota units per user per second
- 1,000,000,000 quota units per day
- Each message.get = 5 units
- Each message.send = 100 units

### Optimization Strategies
1. Use batch requests when possible
2. Cache message data locally
3. Implement exponential backoff
4. Use fields parameter to limit response size
5. Process webhooks asynchronously

## Monitoring & Maintenance

### Key Metrics
- Emails processed per hour
- Processing latency
- Deduplication rate
- Auto-reply success rate
- API quota usage

### Maintenance Tasks
- Renew watch registration (every 7 days)
- Clean up processed emails
- Monitor quota usage
- Review failed processing queue