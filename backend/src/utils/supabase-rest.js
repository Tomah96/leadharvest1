/**
 * Supabase REST API Client
 * Alternative to @supabase/supabase-js which is causing import issues
 * Uses direct REST API calls to Supabase
 */

const https = require('https');
const { URL } = require('url');

class SupabaseREST {
  constructor(url, anonKey) {
    this.baseURL = url;
    this.anonKey = anonKey;
    
    // Parse the URL to get hostname
    const parsed = new URL(url);
    this.hostname = parsed.hostname;
    this.basePath = '/rest/v1';
  }

  /**
   * Make a REST API request to Supabase
   */
  async request(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.hostname,
        path: `${this.basePath}${path}`,
        method: method,
        headers: {
          'apikey': this.anonKey,
          'Authorization': `Bearer ${this.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        
        res.on('data', (chunk) => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          try {
            const parsed = responseData ? JSON.parse(responseData) : null;
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ data: parsed, error: null });
            } else {
              resolve({ 
                data: null, 
                error: {
                  message: parsed?.message || `HTTP ${res.statusCode}`,
                  code: parsed?.code || res.statusCode,
                  details: parsed
                }
              });
            }
          } catch (e) {
            resolve({ 
              data: null, 
              error: {
                message: 'Failed to parse response',
                details: responseData
              }
            });
          }
        });
      });

      // Add 5-second timeout
      req.setTimeout(5000, () => {
        req.abort();
        resolve({ 
          data: null, 
          error: {
            message: 'Request timeout after 5 seconds',
            code: 'TIMEOUT'
          }
        });
      });

      req.on('error', (error) => {
        // Don't double-resolve on abort
        if (error.code !== 'ECONNRESET') {
          reject(error);
        }
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  /**
   * Query builder for the leads table
   */
  from(table) {
    const self = this;
    let queryPath = `/${table}`;
    let queryParams = [];
    
    const queryBuilder = {
      select(columns = '*', options = {}) {
        queryParams.push(`select=${columns}`);
        
        // Add query parameters
        if (options.count === 'exact') {
          queryParams.push('count=exact');
        }
        
        // Return the query builder for chaining
        return {
          ...queryBuilder,
          async execute() {
            const path = queryPath + '?' + queryParams.join('&');
            const result = await self.request('GET', path);
            
            // Extract count from headers if requested
            if (options.count === 'exact' && result.headers) {
              result.count = parseInt(result.headers['content-range']?.split('/')[1] || '0');
            }
            
            return result;
          },
          // Make the query builder itself a thenable so it can be awaited
          then(onFulfilled, onRejected) {
            return this.execute().then(onFulfilled, onRejected);
          }
        };
      },

      async insert(data) {
        const result = await self.request('POST', `/${table}`, data);
        return result;
      },

      async update(data) {
        return {
          eq(column, value) {
            return self.request('PATCH', `/${table}?${column}=eq.${value}`, data);
          }
        };
      },

      async upsert(data) {
        const result = await self.request('POST', `/${table}?on_conflict=phone`, data);
        return result;
      },

      eq(column, value) {
        return {
          async single() {
            const result = await self.request('GET', `/${table}?${column}=eq.${value}&limit=1`);
            if (result.data && Array.isArray(result.data)) {
              result.data = result.data[0] || null;
            }
            return result;
          },
          async update(data) {
            return self.request('PATCH', `/${table}?${column}=eq.${value}`, data);
          }
        };
      },

      or(conditions) {
        return {
          async select() {
            const orQuery = conditions.replace(/,/g, ',or=');
            const result = await self.request('GET', `/${table}?or=(${orQuery})`);
            return result;
          }
        };
      },

      range(from, to) {
        return {
          order(column, options = {}) {
            return {
              async select() {
                const order = options.ascending === false ? `${column}.desc` : `${column}.asc`;
                const result = await self.request('GET', 
                  `/${table}?order=${order}&limit=${to - from + 1}&offset=${from}`
                );
                return result;
              }
            };
          }
        };
      }
    };
  }
}

// Create client if environment variables are available
let supabase = null;
let supabaseAdmin = null;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (supabaseUrl && supabaseAnonKey) {
  console.log('🔄 Using REST API client for Supabase');
  try {
    console.log('Creating SupabaseREST client...');
    supabase = new SupabaseREST(supabaseUrl, supabaseAnonKey);
    console.log('SupabaseREST client created successfully');
    
    if (supabaseServiceKey) {
      console.log('Creating SupabaseREST admin client...');
      supabaseAdmin = new SupabaseREST(supabaseUrl, supabaseServiceKey);
      console.log('SupabaseREST admin client created successfully');
    }
  } catch (error) {
    console.error('Error creating SupabaseREST client:', error);
  }
} else {
  console.warn('Missing Supabase environment variables - database features will be disabled');
}

// Test connection function
const testConnection = async () => {
  if (!supabase) {
    console.warn('Supabase not configured - database features disabled');
    return false;
  }
  
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*', { count: 'exact' });
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    console.log('✅ Supabase REST API connection successful');
    return true;
  } catch (error) {
    console.error('Supabase connection failed:', error.message || error);
    return false;
  }
};

module.exports = {
  supabase,
  supabaseAdmin,
  testConnection
};