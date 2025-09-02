-- Migration: Add missing preference fields to leads table
-- Date: 2025-08-28
-- Purpose: Add preferred_bedrooms and tour_availability fields for better lead tracking

-- Add preferred_bedrooms column for number of bedrooms the lead wants
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS preferred_bedrooms INTEGER;

-- Add tour_availability column for storing parsed tour availability data
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS tour_availability JSONB;

-- Add index for better query performance on bedrooms
CREATE INDEX IF NOT EXISTS idx_leads_preferred_bedrooms ON leads(preferred_bedrooms);

-- Add comments for documentation
COMMENT ON COLUMN leads.preferred_bedrooms IS 'Number of bedrooms the lead is looking for';
COMMENT ON COLUMN leads.tour_availability IS 'Parsed tour availability data including dates/times when lead can tour';

-- Verify the columns were added successfully
-- Run this query after migration to confirm:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns  
-- WHERE table_name = 'leads'
-- AND column_name IN ('preferred_bedrooms', 'tour_availability')
-- ORDER BY column_name;