// Don't destructure to avoid immediate initialization
const supabaseModule = require('../utils/supabase');
const { isDatabaseAvailable, handleDatabaseUnavailable } = require('../utils/database');

class ConversationModel {
  // Get all messages for a lead
  static async findByLeadId(leadId) {
    if (!isDatabaseAvailable()) {
      return [];
    }
    
    try {
      const { data, error } = await supabaseModule.supabase
        .from('conversations')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  // Create new message/conversation entry
  static async create(conversationData) {
    if (!isDatabaseAvailable()) {
      return handleDatabaseUnavailable('create');
    }
    
    try {
      const { data, error } = await supabaseModule.supabase
        .from('conversations')
        .insert([conversationData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Update existing message
  static async update(id, updates) {
    if (!isDatabaseAvailable()) {
      return handleDatabaseUnavailable('update');
    }
    
    try {
      const { data, error } = await supabaseModule.supabase
        .from('conversations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating conversation:', error);
      throw error;
    }
  }

  // Get single conversation by ID
  static async findById(id) {
    if (!isDatabaseAvailable()) {
      return handleDatabaseUnavailable('findOne');
    }
    
    try {
      const { data, error } = await supabaseModule.supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error fetching conversation by ID:', error);
      throw error;
    }
  }

  // Get conversation stats for a lead
  static async getLeadStats(leadId) {
    if (!isDatabaseAvailable()) {
      return { total: 0, byType: {}, byDirection: {} };
    }
    
    try {
      const { data, error } = await supabaseModule.supabase
        .from('conversations')
        .select('type, direction')
        .eq('lead_id', leadId);

      if (error) throw error;

      const stats = {
        total: data.length,
        byType: {},
        byDirection: {}
      };

      data.forEach(msg => {
        stats.byType[msg.type] = (stats.byType[msg.type] || 0) + 1;
        stats.byDirection[msg.direction] = (stats.byDirection[msg.direction] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting conversation stats:', error);
      throw error;
    }
  }
}

module.exports = ConversationModel;