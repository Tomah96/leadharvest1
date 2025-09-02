// Use official Supabase client for proper method chaining support
// Don't destructure to avoid immediate initialization
const supabaseModule = require('../utils/supabase');
const { isDatabaseAvailable, handleDatabaseUnavailable } = require('../utils/database');
const PerformanceLogger = require('../utils/performanceLogger');

class LeadModel {
  // Check if database is available
  static checkDatabase() {
    return isDatabaseAvailable();
  }

  // Get all leads with pagination and filters
  static async findAll({ page = 1, limit = 50, search, status, source, missingInfo }) {
    const timer = PerformanceLogger.startTimer('LeadModel.findAll');
    
    if (!this.checkDatabase()) {
      timer(false);
      return handleDatabaseUnavailable('findAll');
    }
    
    try {
      let query = supabaseModule.supabase
        .from('leads')
        .select('*', { count: 'exact' });

      // Search functionality
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,property_address.ilike.%${search}%,unit.ilike.%${search}%`);
      }

      // Filter by status
      if (status) {
        query = query.eq('status', status);
      }

      // Filter by source
      if (source) {
        query = query.eq('source', source);
      }

      // Filter by missing info - removed as field doesn't exist in database
      // Keeping parameter for API compatibility but not filtering
      if (missingInfo === 'true') {
        // Field doesn't exist in database, skip filtering
      }

      // Pagination - simplified approach for REST wrapper
      const offset = (page - 1) * limit;
      
      // Build query URL parameters
      let queryParams = [];
      queryParams.push(`select=*`);
      queryParams.push(`order=inquiry_date.desc`);
      queryParams.push(`limit=${limit}`);
      queryParams.push(`offset=${offset}`);
      
      if (search) {
        queryParams.push(`or=(first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,property_address.ilike.%${search}%,unit.ilike.%${search}%)`);
      }
      if (status) {
        queryParams.push(`status=eq.${status}`);
      }
      if (source) {
        queryParams.push(`source=eq.${source}`);
      }
      
      // Use simpler REST approach
      const https = require('https');
      const { URL } = require('url');
      
      const baseUrl = new URL(process.env.SUPABASE_URL);
      const path = `/rest/v1/leads?${queryParams.join('&')}`;
      
      const result = await new Promise((resolve) => {
        const options = {
          hostname: baseUrl.hostname,
          path: path,
          method: 'GET',
          headers: {
            'apikey': process.env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          }
        };
        
        const req = require('https').request(options, (res) => {
          let responseData = '';
          res.on('data', (chunk) => responseData += chunk);
          res.on('end', () => {
            try {
              const parsed = JSON.parse(responseData);
              resolve({ data: parsed, error: null });
            } catch (e) {
              resolve({ data: null, error: e });
            }
          });
        });
        
        // Add 5-second timeout
        req.setTimeout(5000, () => {
          req.abort();
          resolve({ data: null, error: new Error('Request timeout after 5 seconds') });
        });
        
        req.on('error', (error) => {
          // Don't double-resolve on abort
          if (error.code !== 'ECONNRESET') {
            resolve({ data: null, error });
          }
        });
        req.end();
      });
      
      const { data, error } = result;
      const count = data ? data.length : 0;

      if (error) {
        timer(false);
        throw error;
      }

      timer(); // Log successful timing
      
      return {
        leads: data || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching leads:', error);
      throw error;
    }
  }

  // Find lead by ID
  static async findById(id) {
    const timer = PerformanceLogger.startTimer('LeadModel.findById');
    
    if (!this.checkDatabase()) {
      timer(false);
      return handleDatabaseUnavailable('findOne');
    }
    
    try {
      const { data, error } = await supabaseModule.supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') {
        timer(false);
        throw error;
      }
      
      timer(); // Log successful timing
      return data;
    } catch (error) {
      console.error('Error fetching lead by ID:', error);
      throw error;
    }
  }

  // Find lead by phone
  static async findByPhone(phone) {
    const timer = PerformanceLogger.startTimer('LeadModel.findByPhone');
    
    if (!this.checkDatabase()) {
      timer(false);
      return handleDatabaseUnavailable('findOne');
    }
    
    try {
      const { data, error } = await supabaseModule.supabase
        .from('leads')
        .select('*')
        .eq('phone', phone)
        .single();

      if (error && error.code !== 'PGRST116') {
        timer(false);
        throw error;
      }
      
      timer(); // Log successful timing
      return data;
    } catch (error) {
      console.error('Error fetching lead by phone:', error);
      throw error;
    }
  }

  // Create new lead
  static async create(leadData) {
    if (!this.checkDatabase()) {
      return handleDatabaseUnavailable('create');
    }
    
    try {
      const { data, error } = await supabaseModule.supabase
        .from('leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }

  // Update existing lead
  static async update(id, updates) {
    if (!this.checkDatabase()) {
      return handleDatabaseUnavailable('update');
    }
    
    try {
      const { data, error } = await supabaseModule.supabase
        .from('leads')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating lead:', error);
      throw error;
    }
  }

  // Upsert lead (for deduplication)
  static async upsert(leadData, deduplicationKey, deduplicationField = 'phone') {
    const timer = PerformanceLogger.startTimer('LeadModel.upsert');
    
    if (!this.checkDatabase()) {
      timer(false);
      return handleDatabaseUnavailable('create');
    }
    
    try {
      // First try to find existing lead by deduplication field
      let existingLead;
      if (deduplicationField === 'phone') {
        existingLead = await this.findByPhone(deduplicationKey);
      } else if (deduplicationField === 'email') {
        const { data } = await supabaseModule.supabase
          .from('leads')
          .select('*')
          .eq('email', deduplicationKey)
          .single();
        existingLead = data;
      }

      if (existingLead) {
        // Merge new data with existing, preserving non-null values
        const updates = {};
        Object.keys(leadData).forEach(key => {
          // Skip empty strings to avoid overwriting good data
          if (leadData[key] !== null && leadData[key] !== undefined && leadData[key] !== '') {
            updates[key] = leadData[key];
          }
        });

        const result = await this.update(existingLead.id, updates);
        timer(); // Log successful timing
        return result;
      } else {
        // Create new lead
        const result = await this.create(leadData);
        timer(); // Log successful timing
        return result;
      }
    } catch (error) {
      timer(false); // Log failed timing
      console.error('Error upserting lead:', error);
      throw error;
    }
  }

  // Soft delete lead
  static async delete(id) {
    if (!this.checkDatabase()) {
      return handleDatabaseUnavailable('delete');
    }
    
    try {
      // First get the lead to return it
      const { data: lead, error: fetchError } = await supabaseModule.supabase
        .from('leads')
        .select()
        .eq('id', id)
        .single();

      if (fetchError || !lead) {
        throw fetchError || new Error('Lead not found');
      }

      // Then perform hard delete
      const { error: deleteError } = await supabaseModule.supabase
        .from('leads')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      return lead; // Return the deleted lead data
    } catch (error) {
      console.error('Error deleting lead:', error);
      throw error;
    }
  }

  // Get lead statistics
  static async getStats() {
    if (!this.checkDatabase()) {
      return handleDatabaseUnavailable('stats');
    }
    
    try {
      // Get total count
      const { count: totalCount, error: totalError } = await supabaseModule.supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Get status counts
      const { data: statusCounts, error: statusError } = await supabaseModule.supabase
        .from('leads')
        .select('status')
        .order('status');

      if (statusError) throw statusError;

      // Calculate status distribution
      const statusDistribution = {};
      statusCounts.forEach(lead => {
        statusDistribution[lead.status] = (statusDistribution[lead.status] || 0) + 1;
      });

      return {
        total: totalCount || 0,
        statusDistribution
      };
    } catch (error) {
      console.error('Error getting lead stats:', error);
      throw error;
    }
  }
}

module.exports = LeadModel;