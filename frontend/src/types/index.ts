// Lead types
export interface Lead {
  id: string;
  // Contact Info
  source: "zillow" | "realtor" | "apartments" | "rentmarketplace";
  first_name: string | null;
  last_name: string | null;
  middle_name?: string | null;
  email: string | null;
  phone: string | null;
  
  // Property Info
  property_address: string | null;  // Full property address
  unit?: string;                    // Unit/Apartment number
  property_id?: string | null;
  inquiry_date: string;
  
  // Financial Info
  credit_score: string | null;
  income: number | null;
  monthly_income?: number | null;
  employment_status?: string | null;
  
  // Preferences
  move_in_date: string | null;
  pets: boolean | null;
  has_pets?: boolean | null;
  pet_details?: string | null;
  occupants: number | null;
  additional_occupants?: number | null;
  lease_length: number | null;      // Lease duration in months
  preferred_bedrooms?: number | null;
  preferred_bathrooms?: number | null;
  desired_rent_min?: number | null;
  desired_rent_max?: number | null;
  
  // Background
  has_eviction?: boolean | null;
  has_criminal_record?: boolean | null;
  
  // Lead Management
  notes: string | null;
  lead_type?: string | null;
  status: "new" | "contacted" | "qualified" | "closed";
  tags?: string[] | null;
  assigned_to?: string | null;
  last_contact?: string | null;
  
  // System fields
  gmail_message_id?: string | null;
  parsing_errors?: string[] | null;
  metadata?: any | null;
  
  created_at: string;
  updated_at: string;
}

// Message types
export interface Message {
  id: string;
  lead_id: string;
  type: "note" | "email" | "sms" | "call";
  direction: "inbound" | "outbound";
  from_name?: string;
  from_contact?: string;
  to_name?: string;
  to_contact?: string;
  subject?: string;
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// Conversation types
export interface ConversationResponse {
  lead: Lead;
  messages: Message[];
}

export interface MessageInput {
  type: "note" | "email" | "sms" | "call";
  direction: "outbound";
  content: string;
  subject?: string;
}

// Template types
export interface Template {
  id: string;
  name: string;
  subject: string;
  body: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

// API Response types
export interface PaginatedResponse<T> {
  leads: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// User types
export interface User {
  id: string;
  email: string;
  role: string;
}

// Query parameter types
export interface LeadQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  source?: string;
  missingInfo?: boolean;
}

// Gmail types
export interface GmailConnection {
  isConnected: boolean;
  email?: string;
  lastSync?: string;
}

export interface BatchProcess {
  id: string;
  total: number;
  processed: number;
  failed: number;
  status: 'idle' | 'running' | 'paused' | 'completed' | 'failed';
  startedAt?: string;
  completedAt?: string;
  estimatedTimeRemaining?: number;
}

// Gmail test types
export interface TestConnectionResponse {
  connected: boolean;
  message?: string;
  labelsCount?: number;
  hasProcessedLeadLabel?: boolean;
  labels?: Array<{
    id: string;
    name: string;
    type: string;
  }>;
}

export interface TestProcessedLeadsResponse {
  totalEmails: number;
  results: Array<{
    subject: string;
    from: string;
    date: string;
    source: string;
    parsed: 'success' | 'failed';
  }>;
  sources: {
    zillow: number;
    realtor: number;
    apartments: number;
    rentmarketplace: number;
    unknown: number;
  };
}