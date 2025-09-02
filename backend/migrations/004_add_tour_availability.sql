-- Add tour_availability column to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS tour_availability JSONB;

-- Add index for querying tour availability
CREATE INDEX IF NOT EXISTS idx_leads_tour_availability 
ON leads USING gin(tour_availability);

-- Comment for documentation
COMMENT ON COLUMN leads.tour_availability IS 'Structured JSON containing parsed tour availability dates, times, and preferences';