/**
 * Safe data access utilities to prevent undefined errors
 * ALL CLAUDES MUST USE THESE FUNCTIONS
 */

/**
 * Safely access nested object properties
 * @example safeGet(user, 'profile.name', 'Unknown')
 */
function safeGet(obj, path, defaultValue) {
  try {
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      result = result?.[key];
      if (result === undefined || result === null) {
        console.log(`[SafeGet] Path "${path}" returned undefined at key "${key}"`);
        return defaultValue;
      }
    }
    
    return result ?? defaultValue;
  } catch (error) {
    console.error('[SafeGet] Error accessing path:', path, error);
    return defaultValue;
  }
}

/**
 * Ensure value is an array
 * @example safeArray(data).map(item => item.name)
 */
function safeArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  
  console.warn('[SafeArray] Expected array but got:', typeof value);
  return [];
}

/**
 * Safe JSON parsing with fallback
 * @example safeParse(jsonString, {})
 */
function safeParse(jsonString, fallback = {}) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('[SafeParse] Invalid JSON:', error.message);
    return fallback;
  }
}

/**
 * Safe function call with error handling
 * @example safeCall(() => riskyOperation(), null)
 */
function safeCall(fn, fallback, context = '') {
  try {
    return fn();
  } catch (error) {
    console.error(`[SafeCall${context ? ` ${context}` : ''}] Function failed:`, error);
    return fallback;
  }
}

/**
 * Safe async function call with error handling
 * @example await safeAsync(() => fetchData(), [])
 */
async function safeAsync(fn, fallback, context = '') {
  try {
    return await fn();
  } catch (error) {
    console.error(`[SafeAsync${context ? ` ${context}` : ''}] Async function failed:`, error);
    return fallback;
  }
}

/**
 * Validate that object has expected structure
 * @example validateStructure(data, ['id', 'name', 'email'])
 */
function validateStructure(obj, requiredKeys) {
  if (!obj || typeof obj !== 'object') {
    console.warn('[ValidateStructure] Invalid object:', obj);
    return false;
  }
  
  const missingKeys = requiredKeys.filter(key => !(key in obj));
  
  if (missingKeys.length > 0) {
    console.warn('[ValidateStructure] Missing required keys:', missingKeys);
    return false;
  }
  
  return true;
}

/**
 * Safe string operations
 * @example safeString(value).trim().toLowerCase()
 */
function safeString(value) {
  if (typeof value === 'string') {
    return value;
  }
  
  if (value === null || value === undefined) {
    return '';
  }
  
  // Try to convert to string
  try {
    return String(value);
  } catch {
    console.warn('[SafeString] Could not convert to string:', value);
    return '';
  }
}

/**
 * Safe number operations
 * @example safeNumber(value, 0)
 */
function safeNumber(value, fallback = 0) {
  const num = Number(value);
  
  if (isNaN(num)) {
    console.warn('[SafeNumber] Invalid number:', value);
    return fallback;
  }
  
  return num;
}

/**
 * Log and return value (useful for debugging chains)
 * @example logValue('After transform')(data)
 */
function logValue(label) {
  return (value) => {
    console.log(`[Debug] ${label}:`, value);
    return value;
  };
}

/**
 * Wrap Express route handler with error handling
 * @example router.get('/api/test', safeRoute(async (req, res) => {...}))
 */
function safeRoute(handler) {
  return async (req, res, next) => {
    try {
      await handler(req, res, next);
    } catch (error) {
      console.error('[SafeRoute] Route handler error:', {
        method: req.method,
        path: req.path,
        error: error.message,
        stack: error.stack
      });
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: 'Internal server error',
          message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
      }
    }
  };
}

/**
 * Performance timer utility
 * @example const timer = startTimer('Operation'); ... timer();
 */
function startTimer(label) {
  const start = Date.now();
  return () => {
    const duration = Date.now() - start;
    const level = duration > 3000 ? 'error' : duration > 1000 ? 'warn' : 'log';
    console[level](`[Timer] ${label}: ${duration}ms`);
    return duration;
  };
}

// Export all utilities
module.exports = {
  safeGet,
  safeArray,
  safeParse,
  safeCall,
  safeAsync,
  validateStructure,
  safeString,
  safeNumber,
  logValue,
  safeRoute,
  startTimer
};