export interface MessageTemplate {
  id: string;
  name: string;
  type: 'initial_contact' | 'follow_up' | 'tour_confirmation' | 'custom';
  template: string;
  variables_used: string[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface TourAvailability {
  slots: TourSlot[];
  preferences: TourPreferences;
  raw_text?: string;
}

export interface TourSlot {
  date: string;
  time?: string;
  timezone?: string;
  duration?: number;
  status?: 'proposed' | 'confirmed' | 'cancelled';
  confidence?: number;
}

export interface TourPreferences {
  preferred_days: string[];
  preferred_times: string[];
  avoid_times?: string[];
}

export interface TemplateVariable {
  field: string;
  description: string;
  category: 'lead_info' | 'property' | 'acknowledgment' | 'questions' | 'agent';
  example?: string;
}

export interface ProcessedTemplate {
  processed_content: string;
  missing_variables: string[];
  substitutions: Record<string, string>;
}