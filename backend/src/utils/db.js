/**
 * Direct PostgreSQL Database Connection
 * Alternative to Supabase client due to import issues
 */

const { Pool } = require('pg');

// Parse the DATABASE_URL for connection
const DATABASE_URL = process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL;

if (!DATABASE_URL) {
  console.warn('⚠️  No database URL configured');
}

// Create connection pool
const pool = DATABASE_URL ? new Pool({
  connectionString: DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
}) : null;

// Test connection function
const testConnection = async () => {
  if (!pool) {
    console.warn('Database not configured');
    return false;
  }
  
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Direct PostgreSQL connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Supabase-compatible interface
const db = {
  // Direct query method
  query: (text, params) => pool ? pool.query(text, params) : Promise.resolve({ rows: [] }),
  
  // Mimic Supabase's from() interface
  from: (table) => ({
    // SELECT
    select: async (columns = '*', options = {}) => {
      if (!pool) return { data: null, error: 'Database not configured' };
      
      try {
        let query = `SELECT ${columns} FROM ${table}`;
        const params = [];
        
        // Add WHERE clause if filters provided
        if (options.filters) {
          const conditions = Object.entries(options.filters).map(([key, value], i) => {
            params.push(value);
            return `${key} = $${i + 1}`;
          });
          query += ` WHERE ${conditions.join(' AND ')}`;
        }
        
        // Add LIMIT
        if (options.limit) {
          query += ` LIMIT ${options.limit}`;
        }
        
        // Add ORDER BY
        if (options.order) {
          query += ` ORDER BY ${options.order}`;
        }
        
        const result = await pool.query(query, params);
        return { data: result.rows, error: null };
      } catch (error) {
        console.error('Select error:', error);
        return { data: null, error: error.message };
      }
    },
    
    // INSERT
    insert: async (data) => {
      if (!pool) return { data: null, error: 'Database not configured' };
      
      try {
        const records = Array.isArray(data) ? data : [data];
        const insertedRows = [];
        
        for (const record of records) {
          const keys = Object.keys(record).filter(k => record[k] !== undefined);
          const values = keys.map(k => record[k]);
          const placeholders = values.map((_, i) => `$${i + 1}`).join(',');
          
          const query = `
            INSERT INTO ${table} (${keys.join(',')}) 
            VALUES (${placeholders}) 
            RETURNING *
          `;
          
          const result = await pool.query(query, values);
          insertedRows.push(result.rows[0]);
        }
        
        return { 
          data: insertedRows.length === 1 ? insertedRows[0] : insertedRows, 
          error: null 
        };
      } catch (error) {
        console.error('Insert error:', error);
        return { data: null, error: error.message };
      }
    },
    
    // UPDATE
    update: async (updates) => {
      if (!pool) return { data: null, error: 'Database not configured' };
      
      return {
        eq: async (column, value) => {
          try {
            const keys = Object.keys(updates).filter(k => updates[k] !== undefined);
            const values = keys.map(k => updates[k]);
            const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(',');
            values.push(value);
            
            const query = `
              UPDATE ${table} 
              SET ${setClause}, updated_at = NOW()
              WHERE ${column} = $${values.length}
              RETURNING *
            `;
            
            const result = await pool.query(query, values);
            return { data: result.rows, error: null };
          } catch (error) {
            console.error('Update error:', error);
            return { data: null, error: error.message };
          }
        }
      };
    },
    
    // DELETE
    delete: async () => {
      if (!pool) return { data: null, error: 'Database not configured' };
      
      return {
        eq: async (column, value) => {
          try {
            const query = `DELETE FROM ${table} WHERE ${column} = $1 RETURNING *`;
            const result = await pool.query(query, [value]);
            return { data: result.rows, error: null };
          } catch (error) {
            console.error('Delete error:', error);
            return { data: null, error: error.message };
          }
        }
      };
    },
    
    // UPSERT (for phone-based deduplication)
    upsert: async (data, options = {}) => {
      if (!pool) return { data: null, error: 'Database not configured' };
      
      try {
        const record = Array.isArray(data) ? data[0] : data;
        const keys = Object.keys(record).filter(k => record[k] !== undefined);
        const values = keys.map(k => record[k]);
        
        // For leads, upsert based on phone
        const conflictColumn = options.onConflict || 'phone';
        const updateColumns = keys.filter(k => k !== conflictColumn);
        const updateClause = updateColumns.map(k => `${k} = EXCLUDED.${k}`).join(',');
        
        const query = `
          INSERT INTO ${table} (${keys.join(',')})
          VALUES (${values.map((_, i) => `$${i + 1}`).join(',')})
          ON CONFLICT (${conflictColumn})
          DO UPDATE SET ${updateClause}, updated_at = NOW()
          RETURNING *
        `;
        
        const result = await pool.query(query, values);
        return { data: result.rows[0], error: null };
      } catch (error) {
        console.error('Upsert error:', error);
        return { data: null, error: error.message };
      }
    }
  })
};

// Create a Supabase-compatible object
const supabase = pool ? db : null;

// Also export individual functions for compatibility
module.exports = {
  supabase,
  testConnection,
  pool,
  query: db.query
};