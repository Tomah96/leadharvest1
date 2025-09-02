# Auto-Reply Template System - LeadHarvest CRM

## Overview
Smart auto-reply system that automatically responds to leads with missing information, helping convert more inquiries into qualified applications.

## Template Categories

### 1. Missing Contact Information

#### 1.1 Missing Phone Number
```yaml
template_id: missing_phone
trigger: 
  - missing_info contains "phone"
  - has_email: true
subject: "Re: Your inquiry about {property_address}"
body: |
  Hi {first_name},
  
  Thank you for your interest in {property_address}! I'd love to discuss this property with you and schedule a showing.
  
  Could you please provide your phone number so I can reach out directly? This will help us coordinate a viewing time that works best for you.
  
  You can reply to this email or call me at {agent_phone}.
  
  Looking forward to helping you find your next home!
  
  Best regards,
  {agent_name}
  {agent_title}
```

#### 1.2 Missing Email (SMS Template)
```yaml
template_id: missing_email_sms
trigger:
  - missing_info contains "email"
  - has_phone: true
channel: sms
body: |
  Hi {first_name}, thanks for your interest in {property_address}! 
  Please reply with your email address so I can send you more details and application materials. 
  - {agent_name}
```

### 2. Missing Financial Information

#### 2.1 Income and Credit Score
```yaml
template_id: missing_financial
trigger:
  - missing_info contains ["income", "credit_score"]
  - or: missing_info contains "financial_info"
subject: "Next steps for {property_address}"
body: |
  Hi {first_name},
  
  Great news! {property_address} is still available and I think it could be a perfect fit for you.
  
  To move forward with your application, I'll need some additional information:
  
  • Proof of income (recent pay stubs or bank statements)
  • Credit score estimate (don't worry if it's not perfect - we work with all credit situations)
  • Expected move-in date
  
  This information helps ensure a smooth application process and gets you one step closer to your new home.
  
  Feel free to:
  - Reply to this email with the information
  - Call me at {agent_phone} to discuss
  - Schedule a showing first: {scheduling_link}
  
  Best regards,
  {agent_name}
```

#### 2.2 Income Only
```yaml
template_id: missing_income
trigger:
  - missing_info contains "income"
  - not: missing_info contains "credit_score"
subject: "Quick question about your application for {property_address}"
body: |
  Hi {first_name},
  
  Thanks for reaching out about {property_address}!
  
  To ensure you qualify for this property (rent is ${monthly_rent}/month), could you please share your approximate monthly income? This helps me confirm this property fits your budget comfortably.
  
  The general requirement is income of at least {income_requirement}x the monthly rent.
  
  Reply to this email or give me a call at {agent_phone}.
  
  Thanks!
  {agent_name}
```

### 3. Missing Move-in Date

```yaml
template_id: missing_move_date
trigger:
  - missing_info contains "move_in_date"
subject: "When are you looking to move? - {property_address}"
body: |
  Hi {first_name},
  
  I'm excited about your interest in {property_address}!
  
  When are you looking to move in? This property is:
  {availability_status}
  
  Knowing your timeline helps me:
  - Reserve the property if needed
  - Coordinate with the current tenant (if applicable)
  - Schedule your move-in inspection
  
  Let me know your ideal move-in date and we can make it happen!
  
  Best,
  {agent_name}
```

### 4. Missing Occupancy Details

```yaml
template_id: missing_occupancy
trigger:
  - missing_info contains ["occupants", "pets"]
subject: "A few quick questions - {property_address}"
body: |
  Hi {first_name},
  
  Thanks for your interest in {property_address}! I have a few quick questions to ensure this property is the right fit:
  
  1. How many people will be living in the unit?
  2. Do you have any pets? If yes, what type and how many?
  
  This property:
  - Allows up to {max_occupants} occupants
  - Pet policy: {pet_policy}
  
  Once I have this information, I can proceed with your application right away!
  
  Best regards,
  {agent_name}
```

### 5. Complete Information - Scheduling

```yaml
template_id: complete_ready_to_schedule
trigger:
  - missing_info is empty
  - status: "new"
subject: "Ready to see {property_address}?"
body: |
  Hi {first_name},
  
  Wonderful! I have all the information I need from you regarding {property_address}.
  
  The next step is to schedule a showing. Here are some available times:
  
  {available_showing_times}
  
  You can also:
  - Book directly: {scheduling_link}
  - Call me: {agent_phone}
  - Reply with your preferred time
  
  After the showing, if you'd like to proceed, we can submit your application immediately.
  
  Looking forward to showing you your potential new home!
  
  Best regards,
  {agent_name}
```

## Template Variables

### Lead Variables
- `{first_name}` - Lead's first name
- `{last_name}` - Lead's last name  
- `{email}` - Lead's email
- `{phone}` - Lead's phone number
- `{move_in_date}` - Preferred move-in date
- `{occupants}` - Number of occupants
- `{pets}` - Pet information
- `{income}` - Monthly income
- `{credit_score}` - Credit score range

### Property Variables
- `{property_address}` - Full property address
- `{property}` - Property name/title
- `{monthly_rent}` - Monthly rent amount
- `{availability_status}` - "Available now" or "Available from [date]"
- `{max_occupants}` - Maximum allowed occupants
- `{pet_policy}` - Pet policy description
- `{income_requirement}` - Income multiplier (e.g., "3")

### Agent Variables
- `{agent_name}` - Agent's full name
- `{agent_phone}` - Agent's phone number
- `{agent_email}` - Agent's email
- `{agent_title}` - Agent's title
- `{company_name}` - Company name
- `{scheduling_link}` - Calendly or scheduling link

### Dynamic Variables
- `{available_showing_times}` - Generated list of times
- `{days_since_inquiry}` - Days since initial inquiry
- `{previous_messages_count}` - Number of previous messages

## Template Selection Logic

```javascript
const selectAutoReplyTemplate = async (lead) => {
  // Priority order for template selection
  const templatePriority = [
    {
      condition: () => !lead.phone && lead.email,
      template: 'missing_phone'
    },
    {
      condition: () => !lead.email && lead.phone,
      template: 'missing_email_sms'
    },
    {
      condition: () => !lead.income && !lead.credit_score,
      template: 'missing_financial'
    },
    {
      condition: () => !lead.income && lead.credit_score,
      template: 'missing_income'
    },
    {
      condition: () => !lead.move_in_date,
      template: 'missing_move_date'
    },
    {
      condition: () => !lead.occupants || lead.pets === null,
      template: 'missing_occupancy'
    },
    {
      condition: () => lead.missing_info.length === 0 && lead.status === 'new',
      template: 'complete_ready_to_schedule'
    }
  ];
  
  // Find first matching template
  for (const { condition, template } of templatePriority) {
    if (condition()) {
      return template;
    }
  }
  
  // Default: no auto-reply needed
  return null;
};
```

## Template Rendering

```javascript
const renderTemplate = (templateId, lead, property, agent) => {
  const template = templates[templateId];
  if (!template) return null;
  
  // Merge all variables
  const variables = {
    // Lead data
    first_name: lead.first_name || 'there',
    last_name: lead.last_name || '',
    email: lead.email,
    phone: formatPhone(lead.phone),
    
    // Property data
    property_address: property.address,
    property: property.name,
    monthly_rent: property.rent,
    availability_status: getAvailabilityStatus(property),
    
    // Agent data
    agent_name: agent.name,
    agent_phone: formatPhone(agent.phone),
    agent_email: agent.email,
    agent_title: agent.title || 'Leasing Agent',
    
    // Dynamic data
    available_showing_times: generateShowingTimes(property),
    days_since_inquiry: daysSince(lead.created_at),
    income_requirement: property.income_requirement || 3
  };
  
  // Replace variables in template
  let subject = template.subject;
  let body = template.body;
  
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
  }
  
  return { subject, body };
};
```

## Auto-Reply Rules

### Timing Rules
1. **Initial Reply**: Send within 5 minutes of receiving lead
2. **Follow-up**: If no response, send reminder after 24 hours
3. **Final Follow-up**: Send final reminder after 72 hours
4. **Stop**: No more auto-replies after 3 attempts

### Exclusion Rules
Don't send auto-reply if:
- Lead status is not "new"
- Lead has been contacted by agent
- Lead explicitly opted out
- Email bounced previously
- Lead is marked as spam

### Rate Limiting
- Maximum 1 auto-reply per lead per 24 hours
- Maximum 3 total auto-replies per lead
- Respect unsubscribe requests

## Settings & Configuration

```javascript
const autoReplySettings = {
  enabled: true, // Global on/off switch
  
  timing: {
    initial_delay_minutes: 5,
    followup_1_hours: 24,
    followup_2_hours: 72,
    max_attempts: 3
  },
  
  templates: {
    use_personalization: true,
    include_property_photos: false,
    include_application_link: true,
    include_scheduling_link: true
  },
  
  channels: {
    email: true,
    sms: false, // Future feature
    whatsapp: false // Future feature
  },
  
  tracking: {
    track_opens: true,
    track_clicks: true,
    track_replies: true
  }
};
```

## Analytics & Reporting

### Key Metrics
1. **Response Rate**: % of auto-replies that get responses
2. **Completion Rate**: % of missing info that gets provided
3. **Conversion Rate**: % that become qualified leads
4. **Template Performance**: Which templates work best

### Template A/B Testing
```javascript
const abTestTemplates = {
  missing_phone_a: { /* Original */ },
  missing_phone_b: { /* Shorter version */ },
  missing_phone_c: { /* More urgent */ }
};

// Randomly assign template variant
const selectTemplateVariant = (templateId) => {
  const variants = Object.keys(abTestTemplates)
    .filter(k => k.startsWith(templateId));
  
  if (variants.length > 1) {
    return variants[Math.floor(Math.random() * variants.length)];
  }
  
  return templateId;
};
```

## Implementation Checklist

- [ ] Create template management UI in settings
- [ ] Implement template variable system
- [ ] Build template selection engine
- [ ] Add email sending queue
- [ ] Create analytics dashboard
- [ ] Set up A/B testing framework
- [ ] Add unsubscribe handling
- [ ] Implement rate limiting
- [ ] Create template preview feature
- [ ] Add custom template creation