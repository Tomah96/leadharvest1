# Credentials Setup Guide

## Important: Never Commit Real Credentials!

All credentials should be stored in environment files (`.env`) which are gitignored.

## Required Environment Variables

Create a `.env` file in the `/backend` directory with the following variables:

```bash
# Database
DATABASE_URL="your-supabase-connection-string"

# APIs
OPENPHONE_API_KEY="your-openphone-api-key"

# Google OAuth (for Gmail integration)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3001/api/gmail/auth-callback"

# Authentication
SESSION_SECRET="your-session-secret"
JWT_SECRET="your-jwt-secret"

# Optional: Anthropic API for AI features
ANTHROPIC_API_KEY="your-anthropic-api-key"
```

## How to Get These Credentials

### Google OAuth Credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3001/api/gmail/auth-callback`

### Supabase Database:
1. Go to [Supabase Dashboard](https://app.supabase.com/)
2. Navigate to Settings → Database
3. Copy the connection string

### OpenPhone API:
1. Log into your OpenPhone account
2. Navigate to API settings
3. Generate an API key

## Security Best Practices

1. **Never commit `.env` files** - They're gitignored for a reason
2. **Rotate credentials regularly** - Especially if exposed
3. **Use different credentials for production** - Don't use dev credentials in production
4. **Store production credentials securely** - Use a secrets manager or environment variables in your hosting platform

## If Credentials Are Exposed

If credentials are accidentally committed:
1. **Immediately regenerate them** in their respective platforms
2. Update your local `.env` file with new credentials
3. Remove the exposed credentials from git history if needed
4. Notify your team if working collaboratively