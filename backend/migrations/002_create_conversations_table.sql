-- Create conversations table for lead message history
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Lead reference
    lead_id UUID NOT NULL,
    
    -- Message details
    type VARCHAR(20) NOT NULL, -- 'note', 'email', 'sms', 'call'
    direction VARCHAR(20) NOT NULL, -- 'inbound', 'outbound'
    
    -- Contact information
    from_contact VARCHAR(255), -- Email or phone
    to_contact VARCHAR(255), -- Email or phone
    
    -- Message content
    subject TEXT,
    body TEXT NOT NULL,
    
    -- Message status and metadata
    status VARCHAR(50) DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
    metadata JSONB, -- For storing additional message data
    
    -- External references
    external_id VARCHAR(255), -- Gmail message ID, SMS ID, etc.
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Add foreign key constraint to leads table
ALTER TABLE conversations 
ADD CONSTRAINT fk_conversations_lead_id 
FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE;

-- Create indexes for efficient querying
CREATE INDEX idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX idx_conversations_type ON conversations(type);
CREATE INDEX idx_conversations_direction ON conversations(direction);

-- Create updated_at trigger for conversations
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE
    ON conversations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();