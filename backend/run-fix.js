#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function runFix() {
  try {
    console.log('🔧 Fixing conversations table...');
    
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );

    // Read the SQL file
    const sql = fs.readFileSync('./fix-conversations-table.sql', 'utf8');
    
    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_query: sql 
    }).single();

    if (error) {
      // If RPC doesn't exist, try direct query (won't work with RLS but worth trying)
      console.log('⚠️ Cannot execute SQL directly. Please run this SQL in Supabase dashboard:');
      console.log('\n' + '='.repeat(60));
      console.log(sql);
      console.log('='.repeat(60) + '\n');
      console.log('📋 Instructions:');
      console.log('1. Go to https://app.supabase.com/');
      console.log('2. Select your project');
      console.log('3. Go to SQL Editor');
      console.log('4. Paste and run the SQL above');
      console.log('5. Then try importing leads again');
      return;
    }

    console.log('✅ Conversations table created/fixed successfully!');
    console.log('🎉 You can now import leads without timeouts');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Manual fix required - Run this SQL in Supabase:');
    const sql = fs.readFileSync('./fix-conversations-table.sql', 'utf8');
    console.log('\n' + '='.repeat(60));
    console.log(sql);
    console.log('='.repeat(60));
  }
}

runFix();