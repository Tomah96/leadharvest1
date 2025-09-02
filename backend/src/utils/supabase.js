/**
 * Supabase Client Wrapper
 * Using the official @supabase/supabase-js client with lazy initialization
 */

const { createClient } = require('@supabase/supabase-js');

let supabase = null;
let supabaseAdmin = null;
let initialized = false;

/**
 * Initialize Supabase clients on first access
 * This ensures environment variables are loaded before reading them
 */
function initializeSupabase() {
  if (initialized) return;
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  
  if (supabaseUrl && supabaseAnonKey) {
    try {
      console.log('🔄 Initializing Supabase client...');
      
      // Create client with timeout protection
      // If createClient hangs, we catch it and continue without database
      const timeoutId = setTimeout(() => {
        if (!supabase) {
          console.error('❌ Supabase initialization timeout after 5 seconds');
          console.log('⚠️  Continuing in Gmail-only mode without database');
          initialized = true;
        }
      }, 5000);
      
      // Try to create the client
      try {
        supabase = createClient(supabaseUrl, supabaseAnonKey);
        clearTimeout(timeoutId);
        console.log('✅ Supabase client initialized');
        
        if (supabaseServiceKey) {
          supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
          console.log('✅ Supabase admin client initialized');
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error('❌ Failed to create Supabase client:', error.message);
        console.log('⚠️  Continuing in Gmail-only mode without database');
        supabase = null;
        supabaseAdmin = null;
      }
    } catch (error) {
      console.error('❌ Supabase initialization error:', error.message);
      console.log('⚠️  Continuing in Gmail-only mode without database');
      supabase = null;
      supabaseAdmin = null;
    }
  } else {
    console.warn('Missing Supabase environment variables - database features will be disabled');
  }
  
  initialized = true;
}

const testConnection = async () => {
  // Ensure initialization before testing
  initializeSupabase();
  
  if (!supabase) {
    console.warn('Supabase not configured - database features disabled');
    return false;
  }
  
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*', { count: 'exact', head: true });
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error.message || error);
    return false;
  }
};

// Export with getters that initialize on first access
module.exports = {
  get supabase() {
    initializeSupabase();
    return supabase;
  },
  get supabaseAdmin() {
    initializeSupabase();
    return supabaseAdmin;
  },
  testConnection
};