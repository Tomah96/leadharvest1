# LeadHarvest Phase 2 Implementation Plan
**Created**: 2025-08-18 by Claude 1 (Orchestrator)
**Purpose**: Deployment and feature expansion roadmap based on user requirements

## User Requirements Summary

### Deployment
- **Platform**: Vercel for frontend (free tier)
- **Backend**: Railway or Render ($5-20/month)
- **Domain**: Will use Vercel's free subdomain initially
- **Database**: Keep existing Supabase

### Feature Requirements
1. **Real-time Gmail sync** (not manual import)
2. **Two-way communication** (send emails and SMS from app)
3. **Draft system** before auto-sending
4. **Tour scheduling** with Google Calendar
5. **OpenPhone integration** for SMS (user has existing webhook code)

### User Preferences
- Automatic sync, not manual imports
- Immediate acknowledgment replies (as drafts)
- No spam, no double messages
- 1-4 agents handling tours
- Time windows for tours (e.g., 3-6pm) not specific slots

## Implementation Phases

### Phase 0: Deployment (Tonight - 2-3 hours)

#### Frontend (Vercel)
```bash
# Steps:
1. Create free Vercel account
2. Import GitHub repo
3. Set environment variables:
   - NEXT_PUBLIC_API_URL=https://your-backend.railway.app
4. Deploy to leadharvest.vercel.app
```

#### Backend (Railway)
```bash
# Steps:
1. Sign up for Railway ($5/month starter)
2. Create new project from GitHub
3. Set environment variables from .env
4. Deploy with automatic builds
```

### Phase 1: Real-Time Gmail Sync (Day 1)

#### Remove Manual Import UI
- Keep backend import logic
- Remove "Import Emails" button
- Add sync status indicator

#### Enable Gmail Push Notifications
```javascript
// Backend: Set up Gmail watch
POST https://gmail.googleapis.com/gmail/v1/users/me/watch
{
  "topicName": "projects/leadharvest/topics/gmail-push",
  "labelIds": ["INBOX"]
}

// Process webhook
app.post('/api/gmail/webhook', async (req, res) => {
  const { message } = req.body;
  // Decode, fetch new emails, parse, save to DB
  // Skip if gmail_message_id already exists
});
```

### Phase 2: Two-Way Communication Hub (Days 2-3)

#### UI Design
```
┌─────────────────────────────────────┐
│ Ashlie Conboy - 2010 Walnut St     │
│ Status: New | Phone: 215-555-1234  │
├─────────────────────────────────────┤
│ Original Inquiry (via Zillow):     │
│ "I would like to schedule a tour.  │
│  Move-in: Sept 14"                 │
├─────────────────────────────────────┤
│ [Quick Actions]                    │
│ • Send Qualification Questions     │
│ • Schedule Tour                    │
│ • Request Application              │
├─────────────────────────────────────┤
│ [📧 Email] [💬 SMS]                │
│ ┌─────────────────────────────┐   │
│ │ Type your message...        │   │
│ └─────────────────────────────┘   │
│ [Template ▼] [Save Draft] [Send]  │
└─────────────────────────────────────┘
```

#### Backend APIs
```javascript
// Send email via Gmail API
POST /api/messages/send-email
{
  "leadId": "123",
  "subject": "Re: 2010 Walnut St Tour",
  "body": "Hi Ashlie...",
  "threadId": "gmail_thread_id"
}

// Send SMS via OpenPhone
POST /api/messages/send-sms
{
  "leadId": "123",
  "to": "+12155551234",
  "body": "Hi Ashlie, this is regarding..."
}

// Draft management
POST /api/messages/drafts
GET /api/messages/drafts/:leadId
```

### Phase 3: OpenPhone Integration (Day 4)

#### Webhook Handler (adapt from user's existing code)
```javascript
// Receive SMS
POST /api/openphone/webhook
{
  "type": "message.received",
  "data": {
    "from": "+12155551234",
    "body": "Yes, I'm available at 3pm",
    "conversationId": "..."
  }
}

// Map to lead by phone, save to conversations
```

#### Send SMS
```javascript
// Using OpenPhone API
const sendSMS = async (to, message) => {
  const response = await fetch('https://api.openphone.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENPHONE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      to,
      text: message,
      from: OPENPHONE_NUMBER
    })
  });
};
```

### Phase 4: Smart Templates & Auto-Draft (Day 5)

#### Template System
```javascript
const templates = {
  'initial_response': {
    subject: 'Re: {property_address} Tour Request',
    body: `Hi {first_name},

Thank you for your interest in {property_address}!

To schedule your tour, I need to verify:
{missing_fields_list}

Available tour times:
{available_slots}

Best regards,
{agent_name}`,
    requiredFields: ['credit_score', 'income', 'move_in_date']
  },
  
  'qualification_questions': {
    subject: 'Quick Questions about {property_address}',
    body: `Hi {first_name},

To process your application for {property_address}, please provide:

1. Credit score range:
   □ 580-619  □ 620-679  □ 680-739  □ 740+
   
2. Monthly income: $______

3. Desired move-in date: ______

4. Number of occupants: ______

5. Any pets? ______

Reply to this email with your answers.

Best,
{agent_name}`
  }
};

// Auto-generate draft
const generateDraft = (lead, templateName) => {
  const template = templates[templateName];
  const missingFields = detectMissingFields(lead);
  
  return fillTemplate(template, {
    first_name: lead.first_name,
    property_address: lead.property_address,
    missing_fields_list: formatMissingFields(missingFields),
    available_slots: getNextAvailableSlots(),
    agent_name: 'Leasing Team'
  });
};
```

### Phase 5: Tour Scheduling (Days 6-7)

#### Availability System
```javascript
// Agent availability
const agentAvailability = {
  'agent1': {
    monday: { start: '15:00', end: '18:00' },
    wednesday: { start: '15:00', end: '18:00' },
    friday: { start: '15:00', end: '18:00' }
  }
};

// Get next 3 available windows
const getAvailableSlots = () => {
  const slots = [];
  const now = new Date();
  
  for (let i = 0; i < 14 && slots.length < 3; i++) {
    const date = addDays(now, i);
    const dayName = format(date, 'EEEE').toLowerCase();
    
    if (agentAvailability.agent1[dayName]) {
      const { start, end } = agentAvailability.agent1[dayName];
      slots.push({
        date: format(date, 'MMM d'),
        window: `${start} - ${end}`
      });
    }
  }
  
  return slots;
};
```

#### Google Calendar Integration
```javascript
// Create calendar event
const createTourEvent = async (lead, slot) => {
  const event = {
    summary: `Tour: ${lead.first_name} ${lead.last_name} - ${lead.property_address}`,
    location: lead.property_address,
    description: `
      Lead: ${lead.first_name} ${lead.last_name}
      Phone: ${lead.phone}
      Email: ${lead.email}
      Credit: ${lead.credit_score}
      Income: ${lead.income}
      Move-in: ${lead.move_in_date}
    `,
    start: { dateTime: slot.startTime },
    end: { dateTime: slot.endTime },
    attendees: [
      { email: lead.email },
      { email: agent.email }
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 }
      ]
    }
  };
  
  const response = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
    sendUpdates: 'all'
  });
  
  return response.data;
};
```

## Database Schema Updates

### conversations table (extend existing)
```sql
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS 
  message_type VARCHAR(20) DEFAULT 'note', -- 'email', 'sms', 'note'
  direction VARCHAR(10), -- 'inbound', 'outbound'
  thread_id VARCHAR(255), -- Gmail thread ID
  external_id VARCHAR(255), -- OpenPhone message ID
  status VARCHAR(20) DEFAULT 'sent', -- 'draft', 'sent', 'failed'
  template_used VARCHAR(50),
  sent_at TIMESTAMP;
```

### agent_availability table (new)
```sql
CREATE TABLE agent_availability (
  id SERIAL PRIMARY KEY,
  agent_id INTEGER,
  day_of_week VARCHAR(10),
  start_time TIME,
  end_time TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### tour_appointments table (new)
```sql
CREATE TABLE tour_appointments (
  id SERIAL PRIMARY KEY,
  lead_id INTEGER REFERENCES leads(id),
  agent_id INTEGER,
  property_address TEXT,
  scheduled_start TIMESTAMP,
  scheduled_end TIMESTAMP,
  google_event_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Environment Variables Needed

```bash
# Existing
SUPABASE_URL=
SUPABASE_ANON_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
OPENPHONE_API_KEY=

# New Required
GOOGLE_CALENDAR_API_KEY=
GMAIL_WEBHOOK_SECRET=
OPENPHONE_WEBHOOK_SECRET=
RAILWAY_BACKEND_URL= # or RENDER_BACKEND_URL
VERCEL_URL= # auto-set by Vercel
```

## Coordination Between Claudes

### Claude 1 (Orchestrator)
- Deploy to Vercel/Railway
- System architecture decisions
- Coordinate phases between Claude 2 & 3
- Integration testing

### Claude 2 (Backend)
- Gmail Push Notification setup
- OpenPhone webhook integration  
- Message sending APIs (email/SMS)
- Template engine implementation
- Calendar API integration

### Claude 3 (Frontend)
- Remove manual import UI
- Build conversation view
- Template selector UI
- Draft management interface
- Tour scheduling UI

## Success Criteria

1. **Real-time sync**: New leads appear within 30 seconds
2. **Quick response**: Reply to leads in 2 clicks or less
3. **No duplicates**: Each email imported only once
4. **Draft safety**: All auto-replies shown as drafts first
5. **Unified view**: See all email/SMS in one place
6. **Tour automation**: Calendar invites sent automatically

## Questions for User

1. **Gmail Watch**: Watch all emails or just "processed-lead" label?
2. **OpenPhone code**: Can you share your existing webhook handler?
3. **Tour priority**: First-come-first-served or qualification-based?
4. **Draft expiry**: Auto-delete drafts after X hours?
5. **Property mapping**: How to link inquiries to specific units?

## Next Steps

1. **Tonight**: Create Vercel and Railway accounts
2. **Tomorrow**: Deploy current app and start Phase 1
3. **Share**: OpenPhone webhook code for review
4. **Decide**: Answers to questions above

---

**Note**: This plan prioritizes speed and simplicity. We're building smart automation on top of existing tools (Gmail, OpenPhone, Google Calendar) rather than replacing them. The app serves as a command center for lead communication and scheduling.