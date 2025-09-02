/**
 * Performance Logger Utility
 * Tracks and logs operation timing to identify bottlenecks
 */

class PerformanceLogger {
  /**
   * Log timing for an operation
   * @param {string} operation - Name of the operation
   * @param {number} startTime - Start time from Date.now()
   * @returns {number} Duration in milliseconds
   */
  static logTiming(operation, startTime) {
    const duration = Date.now() - startTime;
    
    // Log with appropriate severity based on duration
    if (duration > 5000) {
      console.error(`[CRITICAL] ${operation} took ${duration}ms (>5 seconds!)`);
    } else if (duration > 1000) {
      console.warn(`[SLOW] ${operation} took ${duration}ms`);
    } else if (duration > 500) {
      console.log(`[PERF] ${operation} took ${duration}ms`);
    } else {
      // Only log fast operations in debug mode
      if (process.env.LOG_LEVEL === 'debug') {
        console.log(`[PERF] ${operation} took ${duration}ms`);
      }
    }
    
    return duration;
  }

  /**
   * Measure an async operation
   * @param {string} operation - Name of the operation
   * @param {Function} fn - Async function to measure
   * @returns {Promise<any>} Result of the function
   */
  static async measureAsync(operation, fn) {
    const start = Date.now();
    
    try {
      const result = await fn();
      this.logTiming(operation, start);
      return result;
    } catch (error) {
      this.logTiming(`${operation} (failed)`, start);
      throw error;
    }
  }

  /**
   * Measure a sync operation
   * @param {string} operation - Name of the operation
   * @param {Function} fn - Function to measure
   * @returns {any} Result of the function
   */
  static measure(operation, fn) {
    const start = Date.now();
    
    try {
      const result = fn();
      this.logTiming(operation, start);
      return result;
    } catch (error) {
      this.logTiming(`${operation} (failed)`, start);
      throw error;
    }
  }

  /**
   * Start a timer for manual timing
   * @param {string} operation - Name of the operation
   * @returns {Function} End timer function
   */
  static startTimer(operation) {
    const start = Date.now();
    
    return (success = true) => {
      const label = success ? operation : `${operation} (failed)`;
      return this.logTiming(label, start);
    };
  }

  /**
   * Log API request
   * @param {string} method - HTTP method
   * @param {string} path - Request path
   * @param {number} status - Response status code
   * @param {number} duration - Duration in milliseconds
   */
  static logAPIRequest(method, path, status, duration) {
    const level = duration > 1000 ? 'warn' : 'log';
    const slowIndicator = duration > 1000 ? ' [SLOW]' : '';
    
    console[level](
      `[API]${slowIndicator} ${method} ${path} -> ${status} (${duration}ms)`
    );
  }

  /**
   * Log database query
   * @param {string} operation - Query operation (SELECT, INSERT, etc.)
   * @param {string} table - Table name
   * @param {number} duration - Duration in milliseconds
   * @param {number} rowCount - Number of rows affected/returned
   */
  static logDatabaseQuery(operation, table, duration, rowCount = null) {
    const level = duration > 1000 ? 'warn' : 'log';
    const slowIndicator = duration > 1000 ? ' [SLOW]' : '';
    const rowInfo = rowCount !== null ? ` (${rowCount} rows)` : '';
    
    console[level](
      `[DB]${slowIndicator} ${operation} on ${table}${rowInfo} (${duration}ms)`
    );
  }
}

module.exports = PerformanceLogger;