-- Create conversations table if it doesn't exist
CREATE TABLE IF NOT EXISTS conversations (
  id BIGSERIAL PRIMARY KEY,
  lead_id BIGINT REFERENCES leads(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'email', 'sms', 'phone', 'note'
  direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound', 'internal'
  
  -- Message content
  subject TEXT,
  body TEXT,
  
  -- Metadata
  from_email VARCHAR(255),
  to_email VARCHAR(255),
  from_phone VARCHAR(20),
  to_phone VARCHAR(20),
  
  -- Tracking
  status VARCHAR(50) DEFAULT 'sent', -- 'draft', 'sent', 'delivered', 'read', 'failed'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Gmail specific
  gmail_message_id VARCHAR(255),
  gmail_thread_id VARCHAR(255)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at);
CREATE INDEX IF NOT EXISTS idx_conversations_type ON conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_gmail_message ON conversations(gmail_message_id);

-- Grant permissions
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversations TO service_role;
GRANT ALL ON conversations TO anon;

-- Enable RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable all operations for all users" ON conversations
  FOR ALL USING (true) WITH CHECK (true);