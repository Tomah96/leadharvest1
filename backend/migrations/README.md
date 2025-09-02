# Database Migrations

This directory contains SQL migration files for the LeadHarvest database.

## How to Run Migrations

### Using Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of each migration file
4. Run them in order (001, 002, etc.)

### Using Supabase CLI
```bash
supabase db push
```

### Using Direct PostgreSQL Connection
```bash
psql $DATABASE_URL < migrations/001_create_leads_table.sql
```

## Migration Naming Convention
- Format: `XXX_description.sql`
- XXX = three-digit number (001, 002, etc.)
- description = brief description using underscores

## Current Migrations
1. `001_create_leads_table.sql` - Creates the main leads table with all required fields and indexes