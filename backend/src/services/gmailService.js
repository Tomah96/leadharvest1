// Lazy load googleapis to avoid startup hang
let google = null;
let googleLoadAttempted = false;

function getGoogle() {
  if (google || googleLoadAttempted) return google;
  
  try {
    const googleapis = require('googleapis');
    google = googleapis.google;
  } catch (error) {
    console.error('Failed to load googleapis:', error.message);
    google = null;
  }
  googleLoadAttempted = true;
  return google;
}
const { AppError } = require('../middleware/errorHandler');
const fs = require('fs').promises;
const path = require('path');

class GmailService {
  constructor() {
    this.gmail = null;
    this.oauth2Client = null;
    this.refreshInterval = null;
  }

  // Initialize OAuth2 client
  initializeOAuth2Client() {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new AppError('Google OAuth credentials not configured', 500);
    }

    const googleApi = getGoogle();
    if (!googleApi) {
      throw new AppError('Failed to load Google APIs', 500);
    }
    this.oauth2Client = new googleApi.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/api/gmail/auth-callback'
    );

    this.gmail = googleApi.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  // Generate OAuth URL for user consent
  generateAuthUrl(userId) {
    if (!this.oauth2Client) {
      this.initializeOAuth2Client();
    }

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.labels'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId // Pass user ID in state for callback
    });
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code) {
    try {
      if (!this.oauth2Client) {
        this.initializeOAuth2Client();
      }

      const { tokens } = await this.oauth2Client.getToken(code);
      return tokens;
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw new AppError('Failed to exchange authorization code', 400);
    }
  }

  // Temporary storage (replace with database later)
  tokenStore = new Map();
  
  // Token file path for development persistence
  getTokenFilePath() {
    const dataDir = path.join(__dirname, '../../.data');
    return path.join(dataDir, 'gmail-tokens.json');
  }
  
  // Load tokens from file on startup
  async loadTokensFromFile() {
    try {
      const tokenFile = this.getTokenFilePath();
      const data = await fs.readFile(tokenFile, 'utf8');
      const tokens = JSON.parse(data);
      
      // Load into memory store
      Object.entries(tokens).forEach(([userId, userTokens]) => {
        this.tokenStore.set(userId, userTokens);
      });
      
      console.log(`Loaded tokens for ${Object.keys(tokens).length} users from file`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error('Error loading tokens from file:', error);
      }
    }
  }
  
  // Save tokens to file for persistence
  async saveTokensToFile() {
    try {
      const tokenFile = this.getTokenFilePath();
      const dataDir = path.dirname(tokenFile);
      
      // Ensure directory exists
      await fs.mkdir(dataDir, { recursive: true });
      
      // Convert Map to object
      const tokens = {};
      this.tokenStore.forEach((value, key) => {
        tokens[key] = value;
      });
      
      // Save to file
      await fs.writeFile(tokenFile, JSON.stringify(tokens, null, 2));
      console.log('Tokens saved to file');
    } catch (error) {
      console.error('Error saving tokens to file:', error);
    }
  }

  // Store OAuth tokens (in production, store in database)
  async storeTokens(userId, tokens) {
    // In a real implementation, store these securely in the database
    // For now, we'll store in memory (not production-ready)
    if (!global.gmailTokens) {
      global.gmailTokens = {};
    }
    
    global.gmailTokens[userId] = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: tokens.expiry_date,
      token_type: tokens.token_type,
      scope: tokens.scope
    };

    // Also store in tokenStore for easier access
    this.tokenStore.set(userId, tokens);
    console.log(`Tokens saved for user ${userId}`);
    
    // Save to file in development
    if (process.env.NODE_ENV === 'development') {
      await this.saveTokensToFile();
    }

    return true;
  }

  // Get stored tokens for a user
  async getStoredTokens(userId) {
    // Check tokenStore first
    if (this.tokenStore.has(userId)) {
      return this.tokenStore.get(userId);
    }
    
    // Fallback to global storage
    if (!global.gmailTokens || !global.gmailTokens[userId]) {
      return null;
    }
    
    return global.gmailTokens[userId];
  }

  // Remove tokens for a user
  async removeTokens(userId) {
    // Remove from tokenStore
    this.tokenStore.delete(userId);
    
    // Remove from global storage
    if (global.gmailTokens && global.gmailTokens[userId]) {
      delete global.gmailTokens[userId];
    }
    
    console.log(`Tokens removed for user ${userId}`);
    
    // Save to file in development
    if (process.env.NODE_ENV === 'development') {
      await this.saveTokensToFile();
    }
    
    return true;
  }

  // Alias for getStoredTokens
  async getTokens(userId) {
    return this.getStoredTokens(userId);
  }

  // Save tokens (alias for storeTokens)
  async saveTokens(userId, tokens) {
    return this.storeTokens(userId, tokens);
  }

  // Set credentials and refresh if needed
  async setUserCredentials(userId) {
    const tokens = await this.getStoredTokens(userId);
    
    if (!tokens) {
      throw new AppError('No Gmail tokens found for user', 401);
    }

    if (!this.oauth2Client) {
      this.initializeOAuth2Client();
    }

    this.oauth2Client.setCredentials(tokens);

    // Check if token needs refresh
    if (tokens.expiry_date && tokens.expiry_date <= Date.now()) {
      try {
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        await this.storeTokens(userId, credentials);
        this.oauth2Client.setCredentials(credentials);
      } catch (error) {
        console.error('Error refreshing token:', error);
        throw new AppError('Failed to refresh Gmail token', 401);
      }
    }
  }

  // Fetch messages with pagination
  async fetchMessages(userId, options = {}) {
    try {
      await this.setUserCredentials(userId);

      const {
        query = 'is:unread',
        maxResults = 10,
        pageToken = null,
        labelIds = ['INBOX']
      } = options;

      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
        pageToken,
        labelIds
      });

      return {
        messages: response.data.messages || [],
        nextPageToken: response.data.nextPageToken,
        resultSizeEstimate: response.data.resultSizeEstimate
      };
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw new AppError('Failed to fetch Gmail messages', 500);
    }
  }

  // Get full message details
  async getMessage(userId, messageId) {
    try {
      await this.setUserCredentials(userId);

      const response = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full'
      });

      return this.parseMessage(response.data);
    } catch (error) {
      console.error('Error fetching message:', error);
      throw new AppError('Failed to fetch message details', 500);
    }
  }

  // Batch retrieve messages
  async batchGetMessages(userId, messageIds) {
    try {
      await this.setUserCredentials(userId);

      const messages = await Promise.all(
        messageIds.map(id => this.getMessage(userId, id))
      );

      return messages;
    } catch (error) {
      console.error('Error batch fetching messages:', error);
      throw new AppError('Failed to batch fetch messages', 500);
    }
  }

  // Get user's labels
  async getLabels(userId) {
    try {
      await this.setUserCredentials(userId);

      const response = await this.gmail.users.labels.list({
        userId: 'me'
      });

      return response.data.labels || [];
    } catch (error) {
      console.error('Error fetching labels:', error);
      throw new AppError('Failed to fetch Gmail labels', 500);
    }
  }

  // Mark message as read
  async markAsRead(userId, messageId) {
    try {
      await this.setUserCredentials(userId);

      await this.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });

      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw new AppError('Failed to mark message as read', 500);
    }
  }

  // Parse Gmail message to extract relevant data
  parseMessage(message) {
    const headers = message.payload.headers || [];
    const getHeader = (name) => {
      const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
      return header ? header.value : null;
    };

    // Extract body
    let body = '';
    const extractBody = (part) => {
      if (part.body && part.body.data) {
        body += Buffer.from(part.body.data, 'base64').toString('utf-8');
      }
      if (part.parts) {
        part.parts.forEach(extractBody);
      }
    };
    
    if (message.payload) {
      extractBody(message.payload);
    }

    return {
      id: message.id,
      threadId: message.threadId,
      subject: getHeader('Subject'),
      from: getHeader('From'),
      to: getHeader('To'),
      date: getHeader('Date'),
      snippet: message.snippet,
      body: body,
      labelIds: message.labelIds || [],
      headers: headers
    };
  }

  // Verify webhook push notification
  verifyWebhookSignature(requestBody, signature) {
    // In production, implement proper signature verification
    // using Google's public key to verify the push notification
    // For now, return true for development
    console.log('Webhook signature verification not yet implemented');
    return true;
  }

  // Create or update watch for push notifications
  async createWatch(userId, topicName) {
    try {
      await this.setUserCredentials(userId);

      const response = await this.gmail.users.watch({
        userId: 'me',
        requestBody: {
          labelIds: ['INBOX'],
          topicName: topicName // e.g., 'projects/PROJECT_ID/topics/TOPIC_NAME'
        }
      });

      return {
        historyId: response.data.historyId,
        expiration: response.data.expiration
      };
    } catch (error) {
      console.error('Error creating watch:', error);
      throw new AppError('Failed to create Gmail watch', 500);
    }
  }

  // Process webhook notification
  async processWebhookNotification(notification) {
    try {
      const data = JSON.parse(Buffer.from(notification.message.data, 'base64').toString());
      
      return {
        emailAddress: data.emailAddress,
        historyId: data.historyId
      };
    } catch (error) {
      console.error('Error processing webhook notification:', error);
      throw new AppError('Failed to process webhook notification', 400);
    }
  }

  // Find the label ID for "processed-lead"
  async findProcessedLeadLabel(userId) {
    try {
      await this.setUserCredentials(userId);

      // List all labels
      const response = await this.gmail.users.labels.list({
        userId: 'me'
      });

      const labels = response.data.labels || [];
      console.log(`Found ${labels.length} labels for user`);

      // Find one matching "processed-lead" (case-insensitive)
      const processedLabel = labels.find(label => 
        label.name.toLowerCase().includes('processed-lead') ||
        label.name.toLowerCase().includes('processed lead')
      );

      if (processedLabel) {
        console.log(`Found "processed-lead" label: ${processedLabel.name} (ID: ${processedLabel.id})`);
        return processedLabel.id;
      } else {
        console.log('No "processed-lead" label found');
        return null;
      }
    } catch (error) {
      console.error('Error finding processed-lead label:', error);
      throw new AppError('Failed to find processed-lead label', 500);
    }
  }

  // Fetch emails by label with pagination
  async fetchEmailsByLabel(userId, labelId, pageToken = null, maxResults = 10) {
    try {
      await this.setUserCredentials(userId);

      console.log(`Fetching emails with label ${labelId}...`);

      // Use gmail.users.messages.list with labelIds filter
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        labelIds: [labelId],
        maxResults,
        pageToken
      });

      const messageIds = response.data.messages || [];
      console.log(`Found ${messageIds.length} message IDs`);

      if (messageIds.length === 0) {
        return [];
      }

      // Fetch full message details for each
      const emails = [];
      for (const message of messageIds) {
        try {
          const fullMessage = await this.getMessage(userId, message.id);
          emails.push(fullMessage);
        } catch (error) {
          console.error(`Error fetching message ${message.id}:`, error.message);
        }
      }

      console.log(`Successfully fetched ${emails.length} full emails`);
      console.log(`Sample: ${emails[0]?.subject} from ${emails[0]?.from}`);

      return emails;
    } catch (error) {
      console.error('Error fetching emails by label:', error);
      throw new AppError('Failed to fetch emails by label', 500);
    }
  }

  // List all labels (alias for getLabels for consistency)
  async listLabels(userId) {
    return this.getLabels(userId);
  }

  // Start automatic token refresh interval
  startTokenRefresh(userId = 'default-user') {
    // Clear any existing interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Set up refresh interval (every 50 minutes)
    this.refreshInterval = setInterval(async () => {
      try {
        console.log('[Gmail] Starting automatic token refresh...');
        
        // Get current tokens
        const tokens = await this.getStoredTokens(userId);
        if (!tokens || !tokens.refresh_token) {
          console.log('[Gmail] No refresh token available, skipping refresh');
          return;
        }

        // Initialize OAuth client if needed
        if (!this.oauth2Client) {
          this.initializeOAuth2Client();
        }

        // Set current credentials
        this.oauth2Client.setCredentials(tokens);

        // Refresh the access token
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        
        // Store new tokens
        await this.storeTokens(userId, credentials);
        this.oauth2Client.setCredentials(credentials);
        
        console.log('[Gmail] Token refreshed successfully, expires at:', 
          new Date(credentials.expiry_date).toISOString());
      } catch (error) {
        console.error('[Gmail] Token refresh failed:', error.message);
      }
    }, 50 * 60 * 1000); // 50 minutes

    console.log('[Gmail] Token auto-refresh interval started (every 50 minutes)');
  }

  // Stop automatic token refresh
  stopTokenRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log('[Gmail] Token auto-refresh interval stopped');
    }
  }

  // Check connection status with refresh
  async checkConnectionStatus(userId = 'default-user') {
    try {
      const tokens = await this.getStoredTokens(userId);
      
      if (!tokens) {
        return { isConnected: false };
      }

      // Start auto-refresh if we have tokens
      if (tokens.refresh_token && !this.refreshInterval) {
        this.startTokenRefresh(userId);
      }

      await this.setUserCredentials(userId);
      
      // Try to get labels to verify connection
      const googleApi = getGoogle();
      this.gmail = googleApi.gmail({ version: 'v1', auth: this.oauth2Client });
      
      const response = await this.gmail.users.labels.list({ userId: 'me' });
      
      return {
        isConnected: true,
        email: tokens.email || 'connected',
        lastSync: new Date().toISOString(),
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null
      };
    } catch (error) {
      console.error('Connection check failed:', error.message);
      return { isConnected: false, error: error.message };
    }
  }
}

// Create singleton instance
const gmailService = new GmailService();

// Load tokens on startup and start refresh interval
setImmediate(async () => {
  try {
    await gmailService.loadTokensFromFile();
    
    // Check if we have tokens and start refresh if needed
    const userId = 'default-user';
    const tokens = await gmailService.getStoredTokens(userId);
    if (tokens && tokens.refresh_token) {
      console.log('[Gmail] Starting auto-refresh on startup');
      gmailService.startTokenRefresh(userId);
    }
  } catch (err) {
    console.error('Failed to initialize Gmail service:', err);
  }
});

module.exports = gmailService;