require('dotenv').config();

const app = require('./app');

// Don't destructure to avoid immediate initialization
const supabaseModule = require('./src/utils/supabase');

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`LeadHarvest Backend Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  if (!supabaseModule.supabase) {
    console.log('\n⚠️  Database not configured - running in Gmail-only mode');
    console.log('✅ Gmail integration available at /api/gmail/*');
    console.log('❌ Lead management endpoints disabled\n');
  } else {
    console.log('✅ Database connected - full functionality available');
  }
});

// Prevent server crashes from unhandled errors
process.on('uncaughtException', (error) => {
  console.error('\n🔥 UNCAUGHT EXCEPTION - Server kept alive');
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
  // In production, you might want to gracefully restart
  // For now, we keep the server running to debug
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n⚠️  UNHANDLED REJECTION - Server kept alive');
  console.error('Promise:', promise);
  console.error('Reason:', reason);
  // Log but don't exit - this helps us identify async issues
});