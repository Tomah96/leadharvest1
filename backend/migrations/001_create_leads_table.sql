-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Contact Info
    source VARCHAR(50),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20) UNIQUE NOT NULL,
    
    -- Property Info
    property VARCHAR(500),
    property_address TEXT, -- Legacy field, use property
    inquiry_date TIMESTAMP,
    
    -- Financial Info
    credit_score VARCHAR(50), -- e.g., "720-799"
    income DECIMAL(10, 2),
    move_in_date DATE,
    pets BOOLEAN,
    occupants INTEGER,
    lease_length INTEGER, -- months
    
    -- Lead Management
    notes TEXT,
    lead_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new',
    
    -- System Fields
    missing_info TEXT[],
    gmail_message_id VARCHAR(255),
    parsing_errors TEXT[],
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    deleted_at TIMESTAMP -- For soft deletes
);

-- Create index on phone for faster lookups (deduplication)
CREATE INDEX idx_leads_phone ON leads(phone);

-- Create index on status for filtering
CREATE INDEX idx_leads_status ON leads(status);

-- Create index on created_at for sorting
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE
    ON leads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();