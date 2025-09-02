require('dotenv').config();
const fs = require('fs');
const path = require('path');
const supabaseModule = require('./src/utils/supabase');

async function runMigrations() {
  console.log('🔄 Running database migrations...\n');
  
  if (!supabaseModule.supabase) {
    console.log('❌ Database not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env');
    process.exit(1);
  }

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  for (const file of files) {
    console.log(`📝 Running migration: ${file}`);
    const sqlPath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Split by semicolon to handle multiple statements
    const statements = sql.split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      try {
        // Use raw SQL execution through Supabase
        const { error } = await supabaseModule.supabase.rpc('exec_sql', {
          sql: statement + ';'
        }).catch(async (e) => {
          // If RPC doesn't exist, try direct execution (this might not work with all Supabase setups)
          console.log('  ⚠️  exec_sql RPC not found, statement may need manual execution');
          return { error: e };
        });

        if (error) {
          console.log(`  ⚠️  Warning: ${error.message}`);
          // Continue with other statements even if one fails
        } else {
          console.log(`  ✅ Statement executed successfully`);
        }
      } catch (err) {
        console.log(`  ⚠️  Warning: ${err.message}`);
      }
    }
    console.log(`  ✅ Migration ${file} completed\n`);
  }

  console.log('✅ All migrations completed!');
  console.log('\n📌 Note: Some statements may need to be run directly in Supabase SQL Editor:');
  console.log('   1. Go to your Supabase project dashboard');
  console.log('   2. Navigate to SQL Editor');
  console.log('   3. Run the contents of the migration files if you see warnings above');
  process.exit(0);
}

runMigrations().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});