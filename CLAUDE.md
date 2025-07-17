# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LeadHarvest is a rental property CRM that automates lead processing from Gmail. It processes 20+ daily email inquiries from Zillow, Realtor.com, Apartments.com, and RentMarketplace, with intelligent parsing, deduplication, and auto-reply capabilities.

## Multi-Claude Development Structure

This project uses an orchestrated multi-Claude development approach:
- **Orchestrator Claude**: Project coordination, integration, documentation
- **Backend Claude**: Node.js/Express API development (works in `/backend`)
- **Frontend Claude**: Next.js UI development (works in `/frontend`)

Coordination happens through documentation in `/docs` folder.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), Tailwind CSS, TypeScript, Lucide Icons
- **Backend**: Node.js, Express, JWT Authentication, bcrypt
- **Database**: Supabase (PostgreSQL)
- **Integrations**: Gmail API (OAuth + Webhooks), OpenPhone API
- **Infrastructure**: Docker for development

## Key Features

1. **Email Processing**: Real-time Gmail webhook monitoring for "processed-lead" emails
2. **Intelligent Parsing**: Extract standardized data from 4 email sources
3. **Lead Management**: Phone-based deduplication, status tracking (new→contacted→qualified→closed)
4. **Conversation Hub**: Unified email/SMS view in lead details
5. **Auto-Reply System**: Template-based responses for missing information

## Database Schema

Single `leads` table with comprehensive fields:
- Contact: first_name, last_name, phone (primary key for dedup), email
- Property: property_address, inquiry_date
- Financial: credit_score, income, move_in_date
- Preferences: occupants, pets, lease_length
- System: source, status, gmail_message_id, missing_info[], parsing_errors[]

## Development Commands

```bash
# Backend
cd backend
npm install
npm run dev  # Runs on port 3001

# Frontend  
cd frontend
npm install
npm run dev  # Runs on port 3000

# Database
docker-compose up -d  # Start PostgreSQL
```

## API Structure

- `GET /api/health` - Health check
- `GET/POST /api/leads` - Lead CRUD operations
- `GET /api/conversations/:leadId` - Get conversation history
- `POST /api/gmail/webhook` - Gmail real-time updates
- `GET/POST /api/settings/templates` - Auto-reply templates

## Environment Variables

Required in `.env`:
- `DATABASE_URL` - Supabase connection string
- `OPENPHONE_API_KEY` - For SMS integration
- `GOOGLE_CLIENT_ID/SECRET` - Gmail OAuth
- `SESSION_SECRET` - JWT signing
- `ANTHROPIC_API_KEY` - For future AI features

## Email Parsing Philosophy

"Toyota not BMW" - Simple, reliable parsing that works 95% of the time:
- Clear if/else logic over complex regex
- Explicit error handling with logging
- Graceful degradation for missing data
- Manual review queue for failed parses

## Security Considerations

- Never commit API keys or secrets
- All auth tokens in httpOnly cookies
- Input validation on all endpoints
- Rate limiting on public endpoints
- Prepared SQL statements only