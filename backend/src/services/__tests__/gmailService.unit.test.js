const gmailService = require('../gmailService');
const { google } = require('googleapis');

// Mock googleapis
jest.mock('googleapis', () => ({
  google: {
    auth: {
      OAuth2: jest.fn().mockImplementation(() => ({
        generateAuthUrl: jest.fn().mockReturnValue('https://mock-auth-url.com'),
        getToken: jest.fn().mockResolvedValue({
          tokens: {
            access_token: 'mock-access-token',
            refresh_token: 'mock-refresh-token',
            expiry_date: Date.now() + 3600000,
            token_type: 'Bearer',
            scope: 'gmail.readonly'
          }
        }),
        setCredentials: jest.fn(),
        refreshAccessToken: jest.fn().mockResolvedValue({
          credentials: {
            access_token: 'new-mock-access-token',
            expiry_date: Date.now() + 3600000
          }
        })
      }))
    },
    gmail: jest.fn().mockReturnValue({
      users: {
        messages: {
          list: jest.fn().mockResolvedValue({
            data: {
              messages: [
                { id: 'msg1', threadId: 'thread1' },
                { id: 'msg2', threadId: 'thread2' }
              ],
              nextPageToken: 'next-page',
              resultSizeEstimate: 2
            }
          }),
          get: jest.fn().mockResolvedValue({
            data: {
              id: 'msg1',
              threadId: 'thread1',
              payload: {
                headers: [
                  { name: 'Subject', value: 'Test Email' },
                  { name: 'From', value: 'test@example.com' },
                  { name: 'Date', value: 'Mon, 17 Jul 2025 10:00:00 GMT' }
                ],
                body: {
                  data: Buffer.from('Test email body').toString('base64')
                }
              },
              snippet: 'Test email snippet',
              labelIds: ['INBOX', 'UNREAD']
            }
          }),
          modify: jest.fn().mockResolvedValue({ data: {} })
        },
        labels: {
          list: jest.fn().mockResolvedValue({
            data: {
              labels: [
                { id: 'INBOX', name: 'INBOX' },
                { id: 'SENT', name: 'SENT' }
              ]
            }
          })
        },
        watch: jest.fn().mockResolvedValue({
          data: {
            historyId: '12345',
            expiration: Date.now() + 7 * 24 * 60 * 60 * 1000
          }
        })
      }
    })
  }
}));

describe('GmailService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset global tokens
    if (global.gmailTokens) {
      delete global.gmailTokens;
    }
    // Set up environment variables
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:5000/api/gmail/auth-callback';
  });

  describe('OAuth2 Authentication', () => {
    it('should generate auth URL with correct scopes', () => {
      const userId = 'test-user';
      const authUrl = gmailService.generateAuthUrl(userId);

      expect(authUrl).toBe('https://mock-auth-url.com');
      expect(gmailService.oauth2Client).toBeDefined();
    });

    it('should exchange code for tokens', async () => {
      const code = 'test-auth-code';
      const tokens = await gmailService.exchangeCodeForTokens(code);

      expect(tokens).toEqual({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expiry_date: expect.any(Number),
        token_type: 'Bearer',
        scope: 'gmail.readonly'
      });
    });

    it('should store and retrieve tokens', async () => {
      const userId = 'test-user';
      const tokens = {
        access_token: 'test-token',
        refresh_token: 'test-refresh',
        expiry_date: Date.now() + 3600000,
        token_type: 'Bearer',
        scope: 'gmail.readonly'
      };

      await gmailService.storeTokens(userId, tokens);
      const storedTokens = await gmailService.getStoredTokens(userId);

      expect(storedTokens).toEqual(tokens);
    });

    it('should refresh expired tokens', async () => {
      const userId = 'test-user';
      const expiredTokens = {
        access_token: 'old-token',
        refresh_token: 'refresh-token',
        expiry_date: Date.now() - 1000, // Expired
        token_type: 'Bearer',
        scope: 'gmail.readonly'
      };

      await gmailService.storeTokens(userId, expiredTokens);
      await gmailService.setUserCredentials(userId);

      expect(gmailService.oauth2Client.refreshAccessToken).toHaveBeenCalled();
    });
  });

  describe('Gmail API Operations', () => {
    beforeEach(async () => {
      // Set up valid tokens
      await gmailService.storeTokens('test-user', {
        access_token: 'valid-token',
        refresh_token: 'refresh-token',
        expiry_date: Date.now() + 3600000,
        token_type: 'Bearer',
        scope: 'gmail.readonly'
      });
    });

    it('should fetch messages with pagination', async () => {
      const result = await gmailService.fetchMessages('test-user', {
        query: 'is:unread',
        maxResults: 10,
        pageToken: null
      });

      expect(result).toEqual({
        messages: [
          { id: 'msg1', threadId: 'thread1' },
          { id: 'msg2', threadId: 'thread2' }
        ],
        nextPageToken: 'next-page',
        resultSizeEstimate: 2
      });
    });

    it('should get full message details', async () => {
      const message = await gmailService.getMessage('test-user', 'msg1');

      expect(message).toEqual({
        id: 'msg1',
        threadId: 'thread1',
        subject: 'Test Email',
        from: 'test@example.com',
        to: null,
        date: 'Mon, 17 Jul 2025 10:00:00 GMT',
        snippet: 'Test email snippet',
        body: 'Test email body',
        labelIds: ['INBOX', 'UNREAD'],
        headers: expect.any(Array)
      });
    });

    it('should batch get messages', async () => {
      const messages = await gmailService.batchGetMessages('test-user', ['msg1', 'msg2']);

      expect(messages).toHaveLength(2);
      expect(messages[0].id).toBe('msg1');
    });

    it('should get user labels', async () => {
      const labels = await gmailService.getLabels('test-user');

      expect(labels).toEqual([
        { id: 'INBOX', name: 'INBOX' },
        { id: 'SENT', name: 'SENT' }
      ]);
    });

    it('should mark message as read', async () => {
      const result = await gmailService.markAsRead('test-user', 'msg1');

      expect(result).toBe(true);
      expect(gmailService.gmail.users.messages.modify).toHaveBeenCalledWith({
        userId: 'me',
        id: 'msg1',
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });
    });

    it('should create watch for push notifications', async () => {
      const result = await gmailService.createWatch('test-user', 'projects/test/topics/gmail');

      expect(result).toEqual({
        historyId: '12345',
        expiration: expect.any(Number)
      });
    });
  });

  describe('Message Parsing', () => {
    it('should parse Gmail message correctly', () => {
      const rawMessage = {
        id: 'msg123',
        threadId: 'thread123',
        payload: {
          headers: [
            { name: 'Subject', value: 'New Lead Inquiry' },
            { name: 'From', value: 'John Doe <john@example.com>' },
            { name: 'To', value: 'agent@realty.com' },
            { name: 'Date', value: 'Mon, 17 Jul 2025 10:00:00 GMT' }
          ],
          parts: [{
            body: {
              data: Buffer.from('Email body content').toString('base64')
            }
          }]
        },
        snippet: 'Email preview',
        labelIds: ['INBOX']
      };

      const parsed = gmailService.parseMessage(rawMessage);

      expect(parsed).toEqual({
        id: 'msg123',
        threadId: 'thread123',
        subject: 'New Lead Inquiry',
        from: 'John Doe <john@example.com>',
        to: 'agent@realty.com',
        date: 'Mon, 17 Jul 2025 10:00:00 GMT',
        snippet: 'Email preview',
        body: 'Email body content',
        labelIds: ['INBOX'],
        headers: expect.any(Array)
      });
    });
  });

  describe('Webhook Processing', () => {
    it('should process webhook notification', async () => {
      const notification = {
        message: {
          data: Buffer.from(JSON.stringify({
            emailAddress: 'user@example.com',
            historyId: '12345'
          })).toString('base64')
        }
      };

      const result = await gmailService.processWebhookNotification(notification);

      expect(result).toEqual({
        emailAddress: 'user@example.com',
        historyId: '12345'
      });
    });

    it('should verify webhook signature', () => {
      // For now, just verify it returns true (mock implementation)
      const result = gmailService.verifyWebhookSignature({}, 'signature');
      expect(result).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing OAuth credentials', () => {
      delete process.env.GOOGLE_CLIENT_ID;
      
      expect(() => {
        gmailService.initializeOAuth2Client();
      }).toThrow('Google OAuth credentials not configured');
    });

    it('should handle token exchange failure', async () => {
      gmailService.oauth2Client.getToken = jest.fn().mockRejectedValue(new Error('Invalid code'));

      await expect(gmailService.exchangeCodeForTokens('bad-code'))
        .rejects.toThrow('Failed to exchange authorization code');
    });

    it('should handle missing tokens for user', async () => {
      await expect(gmailService.setUserCredentials('unknown-user'))
        .rejects.toThrow('No Gmail tokens found for user');
    });
  });
});