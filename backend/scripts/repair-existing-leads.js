#!/usr/bin/env node

/**
 * One-time script to repair existing leads in the database
 * Fixes:
 * 1. Missing last names for Zillow leads (extracts from notes field)
 * 2. Income typos (80004 → 80000)
 * 3. Pets "false" string → null
 * 
 * Run: node scripts/repair-existing-leads.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function repairLeads() {
  console.log('Starting lead repair process...\n');
  
  try {
    // 1. Fetch all leads
    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .order('id');
    
    if (error) throw error;
    
    console.log(`Found ${leads.length} total leads to check\n`);
    
    let repaired = 0;
    
    for (const lead of leads) {
      let updates = {};
      let changes = [];
      
      // Fix 1: Extract last name from notes if missing
      if (lead.first_name && (!lead.last_name || lead.last_name === '')) {
        // Check notes for "About FirstName LastName" pattern
        if (lead.notes) {
          const aboutMatch = lead.notes.match(/About\s+(\w+)\s+(\w+)/i);
          if (aboutMatch && aboutMatch[1].toLowerCase() === lead.first_name.toLowerCase()) {
            updates.last_name = aboutMatch[2];
            changes.push(`Added last name: ${aboutMatch[2]}`);
          }
          
          // Also check for "See FirstName LastName" pattern
          if (!updates.last_name) {
            const seeMatch = lead.notes.match(/See\s+(\w+)\s+(\w+)/i);
            if (seeMatch && seeMatch[1].toLowerCase() === lead.first_name.toLowerCase()) {
              updates.last_name = seeMatch[2];
              changes.push(`Added last name from 'See' pattern: ${seeMatch[2]}`);
            }
          }
        }
      }
      
      // Fix 2: Correct income typo
      if (lead.income === 80004 || lead.income === '80004') {
        updates.income = 80000;
        changes.push('Fixed income: 80004 → 80000');
      }
      
      // Fix 3: Convert pets "false" string to null
      if (lead.pets === 'false' || lead.pets === 'False' || lead.pets === 'no' || lead.pets === 'No') {
        updates.pets = null;
        changes.push(`Fixed pets: "${lead.pets}" → null`);
      }
      
      // Apply updates if any changes needed
      if (Object.keys(updates).length > 0) {
        const { error: updateError } = await supabase
          .from('leads')
          .update(updates)
          .eq('id', lead.id);
        
        if (updateError) {
          console.error(`❌ Failed to update lead ${lead.id} (${lead.first_name} ${lead.last_name || ''}):`, updateError.message);
        } else {
          console.log(`✅ Repaired lead ${lead.id} (${lead.first_name} ${updates.last_name || lead.last_name || ''}):`);
          changes.forEach(change => console.log(`   - ${change}`));
          repaired++;
        }
      }
    }
    
    console.log(`\n=== Repair Summary ===`);
    console.log(`Total leads checked: ${leads.length}`);
    console.log(`Leads repaired: ${repaired}`);
    console.log(`Leads unchanged: ${leads.length - repaired}`);
    
    // Show specific fixes for key leads
    console.log('\n=== Key Lead Verification ===');
    
    // Check Mackenzie (ID 392)
    const { data: mackenzie } = await supabase
      .from('leads')
      .select('first_name, last_name')
      .eq('id', 392)
      .single();
    
    if (mackenzie) {
      console.log(`Lead 392 (Mackenzie): ${mackenzie.first_name} ${mackenzie.last_name || '[no last name]'}`);
    }
    
    // Check Diamond (ID 412)
    const { data: diamond } = await supabase
      .from('leads')
      .select('first_name, last_name, pets, income')
      .eq('id', 412)
      .single();
    
    if (diamond) {
      console.log(`Lead 412 (Diamond): pets=${diamond.pets}, income=${diamond.income}`);
    }
    
  } catch (error) {
    console.error('Error during repair:', error);
    process.exit(1);
  }
}

// Run the repair
repairLeads().then(() => {
  console.log('\n✅ Repair script completed');
  process.exit(0);
});