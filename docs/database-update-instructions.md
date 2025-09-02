# Database Update Instructions - URGENT

## Overview
Your Supabase database is missing critical columns that are preventing lead imports. This guide will help you add the required fields.

## Step 1: Access Supabase SQL Editor

1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query" button

## Step 2: Run the Migration

Copy and paste this entire SQL block into the editor:

```sql
-- Add missing columns to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS property_address TEXT;

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS unit VARCHAR(50);

ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS lease_length INTEGER;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_property_address ON leads(property_address);
CREATE INDEX IF NOT EXISTS idx_leads_unit ON leads(unit);

-- Add column comments
COMMENT ON COLUMN leads.property_address IS 'Full property address without unit number';
COMMENT ON COLUMN leads.unit IS 'Apartment or unit number/letter extracted from address';
COMMENT ON COLUMN leads.lease_length IS 'Desired lease duration in months';
```

## Step 3: Execute the Query

1. Click the "Run" button or press Ctrl+Enter
2. You should see "Success. No rows returned" message
3. If you get any errors, please share them

## Step 4: Verify the Changes

Run this verification query in a new SQL tab:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns  
WHERE table_name = 'leads'
AND column_name IN ('property_address', 'unit', 'lease_length')
ORDER BY column_name;
```

You should see:
- `lease_length` - integer - YES
- `property_address` - text - YES
- `unit` - character varying - YES

## Step 5: Test with Existing Data

Check if your existing leads are still accessible:

```sql
SELECT id, first_name, last_name, phone, property_address, unit, lease_length
FROM leads
LIMIT 5;
```

## What These Fields Do

- **property_address**: Stores the main address (e.g., "123 Main St")
- **unit**: Stores the unit/apartment number (e.g., "408", "2B", "A")
- **lease_length**: Stores desired lease duration in months (e.g., 12, 6)

## After Database Update

Once you've run the migration:

1. **Tell Claude 1** (Orchestrator): "Database migration complete"
2. **Claude 2** (Backend) can then update the backend code
3. **Claude 3** (Frontend) can update the UI components
4. Test importing your 5 emails again

## Troubleshooting

If you get an error like "permission denied":
- Make sure you're using the Supabase dashboard SQL editor
- Check that you're in the correct project

If columns already exist:
- That's fine! The `IF NOT EXISTS` clause prevents errors
- Proceed to verification step

## Why This Is Needed

Your code expects these fields but the database doesn't have them:
- The migration file (`001_create_leads_table.sql`) defined them
- But they weren't created in your actual Supabase database
- This mismatch causes all the "column not found" errors

After this update, your lead imports will finally work!

---
*Created by Claude 1 (Orchestrator)*
*Date: 2025-08-08*