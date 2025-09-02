-- Migration: Add property fields to leads table
-- Date: 2025-08-08
-- Purpose: Add property_address, unit, and lease_length fields that are missing from production database

-- Add property_address column for full property address
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS property_address TEXT;

-- Add unit column for apartment/unit numbers
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS unit VARCHAR(50);

-- Add lease_length column (in months)
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS lease_length INTEGER;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_property_address ON leads(property_address);
CREATE INDEX IF NOT EXISTS idx_leads_unit ON leads(unit);

-- Verify the columns were added successfully
-- Run this query after migration to confirm:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns  
-- WHERE table_name = 'leads'
-- AND column_name IN ('property_address', 'unit', 'lease_length')
-- ORDER BY column_name;

-- Expected result:
-- column_name      | data_type | is_nullable
-- -----------------+-----------+-------------
-- lease_length     | integer   | YES
-- property_address | text      | YES  
-- unit             | character varying | YES

COMMENT ON COLUMN leads.property_address IS 'Full property address without unit number';
COMMENT ON COLUMN leads.unit IS 'Apartment or unit number/letter extracted from address';
COMMENT ON COLUMN leads.lease_length IS 'Desired lease duration in months';