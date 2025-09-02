-- Add tour_availability field to leads table for storing structured tour date information
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS tour_availability JSONB;

-- Add index for querying tour availability
CREATE INDEX IF NOT EXISTS idx_leads_tour_availability 
ON leads USING gin(tour_availability);

-- Comment on the column
COMMENT ON COLUMN leads.tour_availability IS 'Structured tour availability data including dates, times, and preferences';