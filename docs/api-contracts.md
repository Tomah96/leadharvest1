# LeadHarvest CRM - API Contracts

## Overview
This document defines the API contracts between Frontend and Backend. All endpoints use JSON for request/response bodies.

## Base Configuration
- Backend URL: `http://localhost:3001/api`
- Authentication: JWT in httpOnly cookie
- Headers: `Content-Type: application/json`

## Endpoints

### Health Check
```
GET /api/health
Response: {
  status: "healthy",
  timestamp: "2025-07-16T19:30:00Z",
  version: "1.0.0"
}
```

### Authentication
```
POST /api/auth/login
Body: {
  email: string,
  password: string
}
Response: {
  success: boolean,
  user: {
    id: string,
    email: string,
    role: string
  }
}
```

### Leads Management
```
GET /api/leads
Query params:
  - page: number (default: 1)
  - limit: number (default: 50)
  - search: string (searches name, phone, email, address)
  - status: string (new|contacted|qualified|closed)
  - source: string (zillow|realtor|apartments|rentmarketplace)
  - missingInfo: boolean

Response: {
  leads: Lead[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    pages: number
  }
}

GET /api/leads/:id
Response: Lead

POST /api/leads
Body: Lead (without id, created_at, updated_at)
Response: Lead

PATCH /api/leads/:id
Body: Partial<Lead>
Response: Lead
```

### Lead Model
```typescript
interface Lead {
  id: string;
  // Contact Info
  source: 'zillow' | 'realtor' | 'apartments' | 'rentmarketplace';
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  
  // Property Info
  property: string;
  inquiry_date: string; // ISO timestamp
  
  // Financial Info
  credit_score: string | null; // e.g., "720-799"
  income: number | null;
  move_in_date: string | null; // ISO date
  pets: boolean | null;
  occupants: number | null;
  lease_length: number | null; // months
  
  // Lead Management
  notes: string | null;
  lead_type: string | null;
  status: 'new' | 'contacted' | 'qualified' | 'closed';
  
  // System Fields
  missing_info: string[];
  gmail_message_id: string;
  parsing_errors: string[];
  
  created_at: string;
  updated_at: string;
}
```

### Conversations
```
GET /api/conversations/:leadId
Response: {
  lead: Lead,
  messages: Message[]
}

interface Message {
  id: string;
  lead_id: string;
  type: 'email' | 'sms';
  direction: 'inbound' | 'outbound';
  from: string;
  to: string;
  subject?: string;
  body: string;
  timestamp: string;
  metadata?: any;
}
```

### Settings - Auto Reply Templates
```
GET /api/settings/templates
Response: {
  templates: Template[]
}

POST /api/settings/templates
Body: {
  name: string,
  subject: string,
  body: string,
  active: boolean
}

interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Gmail Integration
```
GET /api/gmail/auth-url
Response: {
  url: string // OAuth consent URL
}

GET /api/gmail/auth-callback?code=xxx
Response: {
  success: boolean,
  message: string
}

POST /api/gmail/webhook
Body: Gmail push notification payload
Response: { success: boolean }
```

## Error Responses
All errors follow this format:
```
{
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

Status codes:
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error