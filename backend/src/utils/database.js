// Don't destructure to avoid immediate initialization
const supabaseModule = require('./supabase');

/**
 * Check if database is available
 */
const isDatabaseAvailable = () => {
  // Access supabase lazily through the module
  return !!supabaseModule.supabase;
};

/**
 * Middleware to require database for certain endpoints
 */
const requireDatabase = (req, res, next) => {
  if (!isDatabaseAvailable()) {
    return res.status(503).json({
      success: false,
      message: 'Database not configured - running in Gmail-only mode',
      error: 'DATABASE_UNAVAILABLE'
    });
  }
  next();
};

/**
 * Return empty result for database operations when DB is unavailable
 */
const handleDatabaseUnavailable = (operation) => {
  console.warn(`Database operation '${operation}' attempted but database is not configured`);
  
  // Return appropriate empty results based on operation type
  const emptyResults = {
    findAll: { data: [], pagination: { page: 1, limit: 50, total: 0, pages: 0 } },
    findOne: null,
    create: null,
    update: null,
    delete: null,
    count: 0,
    stats: { total: 0 }
  };
  
  return emptyResults[operation] || null;
};

module.exports = {
  isDatabaseAvailable,
  requireDatabase,
  handleDatabaseUnavailable
};