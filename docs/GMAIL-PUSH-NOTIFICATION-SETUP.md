# Gmail Push Notification Setup for Real-Time Lead Processing

## Overview
Get leads in your app within seconds of receiving emails using Gmail Push Notifications.

## Prerequisites
1. ✅ Gmail OAuth setup (already done)
2. ✅ Webhook endpoint (already created at `/api/gmail/webhook`)
3. ⏳ Public HTTPS URL (needed for production)
4. ⏳ Google Cloud Pub/Sub setup (needed)

## Step-by-Step Setup

### Step 1: Set Up Google Cloud Pub/Sub

1. **Enable Pub/Sub API** in Google Cloud Console:
   ```
   https://console.cloud.google.com/apis/library/pubsub.googleapis.com
   ```

2. **Create a Topic**:
   ```bash
   # Using gcloud CLI
   gcloud pubsub topics create gmail-push-notifications
   ```
   Or in Console: Pub/Sub → Topics → Create Topic → "gmail-push-notifications"

3. **Create a Subscription**:
   ```bash
   gcloud pubsub subscriptions create gmail-push-sub \
     --topic=gmail-push-notifications \
     --push-endpoint=https://yourdomain.com/api/gmail/webhook
   ```

4. **Grant Gmail Permissions**:
   Add `gmail-api-push@system.gserviceaccount.com` as a Pub/Sub Publisher to your topic.

### Step 2: Update Backend Webhook Handler

```javascript
// /backend/src/controllers/gmailController.js

static handleWebhook = asyncHandler(async (req, res) => {
  try {
    // 1. Decode the Pub/Sub message
    const message = req.body.message;
    if (!message || !message.data) {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    // Decode base64 data
    const decodedData = Buffer.from(message.data, 'base64').toString();
    const notification = JSON.parse(decodedData);
    
    console.log('📬 Gmail Push Notification received:', {
      emailAddress: notification.emailAddress,
      historyId: notification.historyId
    });

    // 2. Get email history changes
    const userId = 'default-user'; // Or map from email address
    await gmailService.setUserCredentials(userId);
    
    // Get history of changes since last historyId
    const history = await gmailService.gmail.users.history.list({
      userId: 'me',
      startHistoryId: lastKnownHistoryId, // Store this in DB
      labelId: 'Label_16', // Your "processed-lead" label ID
      historyTypes: ['messageAdded']
    });

    // 3. Process new messages
    if (history.data.history) {
      for (const record of history.data.history) {
        if (record.messagesAdded) {
          for (const added of record.messagesAdded) {
            const messageId = added.message.id;
            
            // Fetch full message
            const message = await gmailService.getMessage(userId, messageId);
            
            // Parse and process as lead
            const result = await EmailParsingService.parseAndProcessEmail({
              from: message.from,
              subject: message.subject,
              body: message.body,
              date: message.date,
              messageId: messageId
            });
            
            console.log('✅ Lead created from push notification:', result.lead.id);
          }
        }
      }
    }

    // 4. Store the new historyId for next time
    await storeHistoryId(notification.historyId);
    
    // Acknowledge receipt
    res.status(200).send('OK');
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(200).send('OK'); // Still acknowledge to prevent retries
  }
});
```

### Step 3: Set Up Gmail Watch

```javascript
// /backend/src/services/gmailService.js

async watchInbox(userId = 'default-user', labelIds = ['INBOX']) {
  try {
    await this.setUserCredentials(userId);
    
    const response = await this.gmail.users.watch({
      userId: 'me',
      requestBody: {
        labelIds: labelIds, // Or specific label like "processed-lead"
        topicName: 'projects/YOUR_PROJECT_ID/topics/gmail-push-notifications',
        labelFilterAction: 'include'
      }
    });
    
    console.log('✅ Gmail watch activated:', {
      historyId: response.data.historyId,
      expiration: new Date(parseInt(response.data.expiration))
    });
    
    // Store historyId and expiration
    await this.storeWatchData(response.data);
    
    // Watches expire after 7 days, so schedule renewal
    this.scheduleWatchRenewal(response.data.expiration);
    
    return response.data;
  } catch (error) {
    console.error('Failed to set up Gmail watch:', error);
    throw error;
  }
}

// Renew watch before expiration
scheduleWatchRenewal(expiration) {
  const renewTime = expiration - (24 * 60 * 60 * 1000); // Renew 1 day before
  const delay = renewTime - Date.now();
  
  setTimeout(async () => {
    console.log('📅 Renewing Gmail watch...');
    await this.watchInbox();
  }, delay);
}
```

### Step 4: Development Testing with ngrok

For local development, use ngrok to expose your local webhook:

```bash
# Install ngrok
npm install -g ngrok

# Expose your local backend
ngrok http 3001

# You'll get a URL like: https://abc123.ngrok.io
# Use this as your webhook endpoint during development
```

### Step 5: Production Deployment

1. **Deploy to a service with HTTPS** (Heroku, AWS, Google Cloud, etc.)

2. **Environment Variables**:
   ```env
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   PUBSUB_TOPIC=projects/your-project-id/topics/gmail-push-notifications
   WEBHOOK_URL=https://yourdomain.com/api/gmail/webhook
   ```

3. **Set up the watch on app startup**:
   ```javascript
   // In server.js
   app.listen(PORT, async () => {
     console.log(`Server running on port ${PORT}`);
     
     // Set up Gmail watch for real-time notifications
     try {
       await gmailService.watchInbox('default-user', ['Label_16']);
       console.log('✅ Gmail push notifications activated');
     } catch (error) {
       console.error('Failed to activate Gmail watch:', error);
     }
   });
   ```

## Alternative: Polling (Simpler but Less Real-Time)

If push notifications are too complex, use polling as a simpler alternative:

```javascript
// Poll Gmail every 1 minute
setInterval(async () => {
  try {
    const messages = await gmailService.fetchMessages('default-user', {
      query: 'is:unread label:processed-lead',
      maxResults: 10
    });
    
    for (const message of messages.messages) {
      // Process each new message
      await processEmailAsLead(message);
    }
  } catch (error) {
    console.error('Polling error:', error);
  }
}, 60000); // Every 60 seconds
```

## Comparison

| Method | Real-Time | Complexity | Best For |
|--------|-----------|------------|----------|
| **Push Notifications** | < 5 seconds | High | Production with many leads |
| **Polling (1 min)** | 1-2 minutes | Low | Small volume, simplicity |
| **Manual Import** | On-demand | None | Testing, backup |

## Quick Start Commands

```bash
# 1. Test webhook locally
curl -X POST http://localhost:3001/api/gmail/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "data": "eyJlbWFpbEFkZHJlc3MiOiJ0b21hQHBsdXNyZWFsdG9ycy5jb20iLCJoaXN0b3J5SWQiOiIxMjM0NTYifQ==",
      "messageId": "test-123",
      "publishTime": "2025-08-27T20:00:00Z"
    }
  }'

# 2. Set up watch
curl -X POST http://localhost:3001/api/gmail/watch \
  -H "Content-Type: application/json" \
  -d '{"labelIds": ["Label_16"]}'

# 3. Check watch status
curl http://localhost:3001/api/gmail/watch-status
```

## Monitoring & Debugging

1. **Log all webhook calls** for debugging
2. **Store historyId** in database to track position
3. **Monitor watch expiration** and auto-renew
4. **Fallback to polling** if watch fails
5. **Alert on processing errors** but still acknowledge webhook

## Security Considerations

1. **Verify webhook authenticity** using Pub/Sub tokens
2. **Rate limit webhook endpoint** to prevent abuse
3. **Process asynchronously** - acknowledge quickly, process in background
4. **Implement idempotency** - don't create duplicate leads
5. **Use HTTPS only** in production

## Next Steps

1. Enable Pub/Sub API in Google Cloud Console
2. Create topic and subscription
3. Update webhook handler with full implementation
4. Test with ngrok locally
5. Deploy and set up production webhook URL
6. Activate Gmail watch
7. Monitor and maintain