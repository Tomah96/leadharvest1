-- Create message_templates table for storing email/SMS templates
CREATE TABLE IF NOT EXISTS message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('initial_contact', 'follow_up', 'tour_confirmation', 'custom')),
  template TEXT NOT NULL,
  variables_used TEXT[] DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Ensure only one default per type
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_default_per_type 
ON message_templates(type, is_default) 
WHERE is_default = true;

-- Create index on type for faster queries
CREATE INDEX IF NOT EXISTS idx_message_templates_type ON message_templates(type);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_message_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_message_templates_updated_at 
BEFORE UPDATE ON message_templates 
FOR EACH ROW EXECUTE PROCEDURE update_message_templates_updated_at();

-- Insert default initial contact template
INSERT INTO message_templates (name, type, template, is_default, variables_used) 
VALUES (
  'Default Initial Contact',
  'initial_contact',
  'Hello {first_name},

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
{agent_phone}',
  true,
  ARRAY['first_name', 'property_address', 'acknowledgment_text', 'tour_availability_ack', 'missing_info', 'tour_question', 'agent_name', 'agent_company', 'agent_phone']
) ON CONFLICT DO NOTHING;

-- Insert default follow-up template
INSERT INTO message_templates (name, type, template, is_default, variables_used)
VALUES (
  'Default Follow-up',
  'follow_up',
  'Hi {first_name},

I wanted to follow up on your inquiry about {property_address}.

Are you still interested in scheduling a viewing? {tour_question}

{missing_info}

Looking forward to hearing from you.

Best regards,
{agent_name}',
  true,
  ARRAY['first_name', 'property_address', 'tour_question', 'missing_info', 'agent_name']
) ON CONFLICT DO NOTHING;