# LeadHarvest CRM - Master Project Plan

## Project Overview
LeadHarvest is a rental property lead management CRM designed to automate the processing of email inquiries from multiple sources (Zillow, Realtor.com, Apartments.com, RentMarketplace). The system processes 20+ daily leads and manages a historical database of 4,000+ leads.

## Core Features
1. **Gmail Integration**: Real-time webhook monitoring of "processed-lead" emails
2. **Intelligent Parsing**: Extract standardized data from 4 different email sources
3. **Lead Management**: Deduplication by phone number, status tracking, search/filter
4. **Conversation Hub**: Unified email/SMS view with OpenPhone integration
5. **Auto-Reply System**: Template-based responses for missing information
6. **Dashboard**: Lead cards with conversation previews, detailed lead views

## Technical Stack
- **Frontend**: Next.js 14, Tailwind CSS, TypeScript
- **Backend**: Node.js, Express, JWT Authentication
- **Database**: Supabase (PostgreSQL)
- **Integrations**: Gmail API, OpenPhone API
- **Infrastructure**: Docker for development

## Data Model
### Lead Fields (Standardized across all sources):
- **Contact**: first_name, last_name, phone, email
- **Property**: property_address, inquiry_details
- **Financial**: credit_score, income, move_in_date
- **Preferences**: occupants, pets, availability_to_tour
- **Communication**: initial_message/notes
- **System**: source, status, gmail_message_id, missing_info[]

## Development Phases
### Phase 1: Foundation (Week 1)
- Project setup and infrastructure
- Basic authentication and API structure
- Database schema implementation
- Gmail OAuth connection

### Phase 2: Core Features (Week 2)
- Email parsing for all 4 sources
- Lead management with deduplication
- Conversation system implementation
- Basic UI with search/filter

### Phase 3: Polish & Integration (Week 3)
- Auto-reply system with templates
- OpenPhone SMS integration
- Performance optimization
- Production readiness

## Success Metrics
- Parse 95%+ of emails successfully
- Dashboard loads in <2 seconds with 4k+ leads
- Real-time processing of new leads
- Accurate missing info detection
- Reliable phone-based deduplication

## Future Enhancements (Post-MVP)
- AI-powered message assistance
- Google Calendar integration for showings
- Advanced analytics dashboard
- Mobile application
- Document management system