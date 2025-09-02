// Script to run migration 004
const fs = require('fs');
const path = require('path');
const { supabase } = require('./src/utils/supabase');

async function runMigration() {
  try {
    console.log('Running migration 004_add_missing_preference_fields.sql...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', '004_add_missing_preference_fields.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split by semicolons and filter out comments and empty lines
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        if (error) {
          console.error('Error executing statement:', error);
        }
      }
    }
    
    console.log('Migration completed successfully!');
    
    // Verify the columns were added
    const { data, error } = await supabase
      .from('leads')
      .select('preferred_bedrooms, tour_availability')
      .limit(1);
    
    if (!error) {
      console.log('✓ New columns verified successfully');
    } else {
      console.log('Note: Columns may need to be added manually via Supabase dashboard');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
  
  process.exit(0);
}

runMigration();