-- Create message_templates table
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

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_message_templates_updated_at 
BEFORE UPDATE ON message_templates 
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert default templates
INSERT INTO message_templates (name, type, template, is_default, variables_used) VALUES
('Initial Contact Default', 'initial_contact', 'Hello {first_name},

Thank you for your interest in {property_address}.

{acknowledgment_text} {tour_availability_ack}

{missing_info} {tour_question}

To qualify for this property, applicants must have:
- Income of 3x the monthly rent
- Credit score of 650+
- Valid references from previous landlords

Please let me know if you have any questions.

Best regards,
Tom
Plus Realtors
(216) 555-8888', true, ARRAY['first_name', 'property_address', 'acknowledgment_text', 'tour_availability_ack', 'missing_info', 'tour_question']),

('Follow Up Default', 'follow_up', 'Hi {first_name},

I wanted to follow up on your inquiry about {property_address}. 

{missing_info}

{tour_question}

Please let me know if you''re still interested or if you have any questions.

Best regards,
Tom', true, ARRAY['first_name', 'property_address', 'missing_info', 'tour_question']),

('Tour Confirmation Default', 'tour_confirmation', 'Hi {first_name},

Great! I''ve confirmed your tour for {property_address} on {tour_date} at {tour_time}.

The property address is: {property_address}

Please let me know if you need to reschedule.

See you then!
Tom', true, ARRAY['first_name', 'property_address', 'tour_date', 'tour_time']);