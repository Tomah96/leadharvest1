# Message Templates Feature Implementation

## Overview
Implementing a comprehensive message template system with smart tour availability handling for the LeadHarvest CRM. This feature allows users to create, manage, and apply message templates with dynamic variable substitution based on lead data.

## Key Features
1. Multiple template types (initial contact, follow-up, tour confirmation)
2. Dynamic variable substitution with lead data
3. Smart tour availability questions based on provided information
4. Live preview with sample data
5. Integration with ConversationWindow for quick template application

## Database Changes Required

### 1. Add tour_availability to leads table
```sql
ALTER TABLE leads 
ADD COLUMN tour_availability JSONB;
```

**Structure:**
```json
{
  "slots": [
    {
      "date": "2025-08-04",
      "time": "14:00",
      "timezone": "EST",
      "duration": 30,
      "status": "proposed"
    },
    {
      "date": "2025-08-05",
      "time": "morning",
      "flexible": true
    }
  ],
  "preferences": {
    "preferred_days": ["weekdays", "Monday", "Tuesday"],
    "preferred_times": ["morning", "after 3pm"],
    "avoid_times": ["lunch", "evenings"]
  },
  "raw_text": "I'm available 8/4 at 2pm or 8/5 morning"
}
```

### 2. Create message_templates table
```sql
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'initial_contact', 'follow_up', 'tour_confirmation'
  template TEXT NOT NULL,
  variables_used TEXT[],
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add trigger for updated_at
CREATE TRIGGER update_message_templates_updated_at 
BEFORE UPDATE ON message_templates 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
```

## API Endpoints

### Template Management
- `GET /api/templates` - List all templates
- `GET /api/templates/:id` - Get specific template
- `POST /api/templates` - Create new template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `POST /api/templates/preview` - Preview with sample/real data
- `POST /api/templates/:id/apply/:leadId` - Apply to specific lead

### Request/Response Format
```typescript
// Create/Update Template
{
  "name": "Initial Contact",
  "type": "initial_contact",
  "template": "Hello {first_name},\n\nThank you for your interest in {property_address}...",
  "variables_used": ["first_name", "property_address", "tour_question"]
}

// Apply Template Response
{
  "success": true,
  "data": {
    "processed_content": "Hello John,\n\nThank you for your interest in 123 Main St...",
    "missing_variables": [],
    "substitutions": {
      "first_name": "John",
      "property_address": "123 Main St"
    }
  }
}
```

## Template Variables

### Lead Information
- `{first_name}` - Lead's first name
- `{last_name}` - Lead's last name
- `{full_name}` - Full name
- `{email}` - Email address
- `{phone}` - Phone number

### Property Information
- `{property_address}` - Property address
- `{move_in_date}` - Desired move-in date
- `{inquiry_date}` - Date of inquiry

### Lead Details
- `{income}` - Annual income
- `{credit_score}` - Credit score or range
- `{occupants}` - Number of occupants
- `{pets}` - Pet information
- `{lease_length}` - Desired lease length

### Smart Sections
- `{acknowledgment_text}` - Auto-generated based on provided info
- `{missing_info}` - List of missing required information
- `{tour_question}` - Smart tour availability question
- `{tour_availability_ack}` - Acknowledgment of provided tour dates
- `{qualification_criteria}` - Property qualification requirements

### Agent Information
- `{agent_name}` - Agent's full name
- `{agent_company}` - Company name
- `{agent_phone}` - Agent phone
- `{agent_email}` - Agent email
- `{agent_signature}` - Full signature block

## Smart Tour Question Logic

### Scenarios:
1. **No availability provided:**
   - Question: "What is your general availability to tour the property?"

2. **Dates only (no times):**
   - Acknowledgment: "I see you're available to tour on August 4th or August 5th."
   - Question: "What time works best for you on August 4th or August 5th, or would another date/time work better?"

3. **Complete date and time:**
   - Acknowledgment: "I see you're available to tour on August 4th at 2pm."
   - Question: "Would this time work for you, or would you prefer a different time?"

4. **Vague availability:**
   - Acknowledgment: "I see you mentioned 'weekends' for touring."
   - Question: "Could you clarify your specific availability with dates and times?"

## Frontend Components

### Settings Page Structure
```
/app/settings/templates/
├── page.tsx              # Main settings page
├── TemplateEditor.tsx    # Editor component
├── TemplatePreview.tsx   # Live preview panel
├── VariablePalette.tsx   # Variable insertion UI
└── templateTypes.ts      # Type definitions
```

### ConversationWindow Integration
- Add template dropdown selector above compose area
- Load templates based on type and context
- Process variables with current lead data
- Allow editing before sending
- Save recently used templates

## Tour Date Parser Specifications

### Input Formats to Handle:
- Specific dates: "8/4", "08/04", "8/4/25", "August 4th", "Aug 4"
- Date ranges: "8/4-8/6", "August 4-6"
- Times: "2pm", "2:00 PM", "14:00", "afternoon", "morning"
- Relative dates: "tomorrow", "next Monday", "this weekend"
- Combined: "8/4 at 2pm", "Monday morning", "weekends after 3"

### Output Format:
```javascript
{
  parsed: true,
  slots: [
    {date: "2025-08-04", time: "14:00", confidence: 0.95},
    {date: "2025-08-05", time: "morning", confidence: 0.80}
  ],
  preferences: {
    preferred_days: ["Monday", "Tuesday"],
    preferred_times: ["afternoon"]
  },
  raw_text: "original input text"
}
```

## Testing Requirements

### Unit Tests
- Tour date parser with various formats
- Template variable substitution
- Smart question generation logic
- API endpoint validation

### Integration Tests
- Create template → Save → Load → Apply workflow
- Parser integration with lead creation
- ConversationWindow template application
- Variable substitution with incomplete data

### E2E Tests
- Complete template creation and usage flow
- Template application in conversation
- Preview functionality with real data
- Error handling for missing variables

## Default Templates

### Initial Contact
```
Hello {first_name},

Thank you for your interest in {property_address}.

{acknowledgment_text} {tour_availability_ack}

{missing_info} {tour_question}

To qualify for this property, applicants must have:
- Income of 3x the monthly rent
- Credit score of 650+
- Valid references from previous landlords

Please let me know if you have any questions.

Best regards,
{agent_name}
{agent_company}
{agent_phone}
```

### Follow-up
```
Hi {first_name},

I wanted to follow up on your inquiry about {property_address}.

Are you still interested in scheduling a viewing? {tour_question}

{missing_info}

Looking forward to hearing from you.

Best regards,
{agent_name}
```

## Implementation Priority
1. Database migrations (non-blocking for frontend)
2. Tour date parser utility (shared component)
3. Update email parsers to extract tour dates
4. Template API and service layer
5. Settings page UI components
6. ConversationWindow integration
7. Testing and refinement

## Success Criteria
- [ ] All email parsers extract tour availability
- [ ] Templates save and load correctly
- [ ] Variables substitute with actual lead data
- [ ] Smart tour questions adapt to available info
- [ ] ConversationWindow shows template dropdown
- [ ] Preview shows realistic output
- [ ] No existing functionality broken
- [ ] All tests passing