// Don't destructure to avoid immediate initialization
const supabaseModule = require('../utils/supabase');

// Load agent defaults once at module level
let agentDefaults = {
  agent_name: 'Tom',
  agent_company: 'Plus Realtors',
  agent_phone: '(216) 555-8888',
  agent_email: 'toma@plusrealtors.com'
};

// Try to load custom agent defaults if they exist
try {
  agentDefaults = require('../config/agentDefaults');
} catch (error) {
  console.log('Using default agent information (config/agentDefaults.js not found)');
}

class TemplateService {
  /**
   * Process template with lead data
   */
  async processTemplate(templateId, leadId) {
    // Get template and lead
    const [template, lead] = await Promise.all([
      this.getTemplate(templateId),
      this.getLead(leadId)
    ]);

    if (!template || !lead) {
      throw new Error('Template or lead not found');
    }

    // Process variables
    const processed = this.substituteVariables(template.template, lead);
    
    return {
      processed_content: processed.content,
      missing_variables: processed.missing,
      substitutions: processed.substitutions
    };
  }

  substituteVariables(template, lead) {
    let content = template;
    const substitutions = {};
    const missing = [];

    // Simple variables
    const simpleVars = {
      first_name: lead.first_name || lead.full_name?.split(' ')[0],
      last_name: lead.last_name,
      full_name: lead.full_name || `${lead.first_name} ${lead.last_name}`.trim(),
      email: lead.email,
      phone: this.formatPhone(lead.phone),
      property_address: lead.property_address,
      move_in_date: this.formatDate(lead.move_in_date),
      income: lead.income ? `$${lead.income.toLocaleString()}` : null,
      credit_score: lead.credit_score,
      occupants: lead.occupants,
      pets: lead.pets,
      lease_length: lead.lease_length ? `${lead.lease_length} months` : null,
      unit: lead.unit
    };

    // Process simple variables
    for (const [key, value] of Object.entries(simpleVars)) {
      const regex = new RegExp(`\\{${key}\\}`, 'gi');
      if (template.includes(`{${key}}`)) {
        if (value && value !== 'null null' && value !== 'undefined undefined') {
          content = content.replace(regex, value);
          substitutions[key] = value;
        } else {
          missing.push(key);
        }
      }
    }

    // Process smart sections
    content = this.processSmartSections(content, lead);

    return { content, substitutions, missing };
  }

  processSmartSections(template, lead) {
    let content = template;

    // Acknowledgment text
    const ackText = this.generateAcknowledgmentText(lead);
    content = content.replace(/{acknowledgment_text}/gi, ackText);

    // Tour availability acknowledgment and question
    const tourInfo = this.processTourAvailability(lead.tour_availability);
    content = content.replace(/{tour_availability_ack}/gi, tourInfo.acknowledgment);
    content = content.replace(/{tour_question}/gi, tourInfo.question);

    // Missing info
    const missingInfo = this.generateMissingInfoText(lead);
    content = content.replace(/{missing_info}/gi, missingInfo);

    // Qualification criteria
    const qualificationCriteria = `To qualify for this property, applicants must have:
• Income of 3x the monthly rent
• Credit score of 650+
• Valid references from previous landlords`;
    content = content.replace(/{qualification_criteria}/gi, qualificationCriteria);

    // Agent information from config (loaded at module level)
    content = content.replace(/{agent_name}/gi, agentDefaults.agent_name);
    content = content.replace(/{agent_company}/gi, agentDefaults.agent_company);
    content = content.replace(/{agent_phone}/gi, agentDefaults.agent_phone);
    content = content.replace(/{agent_email}/gi, agentDefaults.agent_email);

    return content;
  }

  generateAcknowledgmentText(lead) {
    const parts = [];

    if (lead.income) {
      parts.push(`annual income of $${lead.income.toLocaleString()}`);
    }
    if (lead.credit_score) {
      // Handle both ranges and single values
      const scoreText = typeof lead.credit_score === 'string' && lead.credit_score.includes('-') 
        ? `credit score range of ${lead.credit_score}`
        : `credit score of ${lead.credit_score}`;
      parts.push(scoreText);
    }
    if (lead.occupants) {
      const occupantText = lead.occupants === 1 ? '1 occupant' : `${lead.occupants} occupants`;
      parts.push(occupantText);
    }
    if (lead.pets) {
      if (lead.pets.toLowerCase() === 'none' || lead.pets.toLowerCase() === 'no' || lead.pets.toLowerCase() === 'no pets') {
        parts.push('no pets');
      } else if (lead.pets.toLowerCase() !== 'not provided' && lead.pets !== null) {
        parts.push(`pets (${lead.pets})`);
      }
    }
    if (lead.move_in_date) {
      parts.push(`move-in date of ${this.formatDate(lead.move_in_date)}`);
    }
    if (lead.lease_length) {
      parts.push(`${lead.lease_length} month lease preference`);
    }

    if (parts.length === 0) {
      return '';
    }

    // Format the acknowledgment nicely
    if (parts.length === 1) {
      return `I see that you have ${parts[0]}.`;
    } else if (parts.length === 2) {
      return `I see that you have ${parts[0]} and ${parts[1]}.`;
    } else {
      const lastPart = parts.pop();
      return `I see that you have ${parts.join(', ')}, and ${lastPart}.`;
    }
  }

  processTourAvailability(tourAvailability) {
    if (!tourAvailability || !tourAvailability.parsed) {
      return {
        acknowledgment: '',
        question: 'When would be a good time for you to tour the property?'
      };
    }

    const { slots, preferences, raw_text } = tourAvailability;
    
    if (slots && slots.length > 0) {
      const hasDates = slots.some(slot => slot.date);
      const hasTimes = slots.some(slot => slot.time && !['morning', 'afternoon', 'evening'].includes(slot.time));
      const hasTimeWords = slots.some(slot => ['morning', 'afternoon', 'evening'].includes(slot.time));

      if (hasDates && hasTimes) {
        // Has specific date and time
        const availability = slots.map(slot => {
          const dateStr = this.formatDate(slot.date);
          const timeStr = this.formatTime(slot.time);
          return `${dateStr} at ${timeStr}`;
        }).join(' or ');
        
        return {
          acknowledgment: `I see you're available ${availability}.`,
          question: 'Would any of these times work for a tour, or would you prefer a different time?'
        };
      }
      
      if (hasDates && hasTimeWords) {
        // Has date with general time (morning, afternoon, evening)
        const availability = slots.map(slot => {
          const dateStr = this.formatDate(slot.date);
          const timeStr = slot.time || '';
          return timeStr ? `${dateStr} in the ${timeStr}` : dateStr;
        }).join(' or ');
        
        return {
          acknowledgment: `I see you're available ${availability}.`,
          question: 'What specific time would work best for you?'
        };
      }
      
      if (hasDates && !hasTimes) {
        // Just dates, no times
        const dates = slots.filter(s => s.date).map(slot => this.formatDate(slot.date)).join(' or ');
        return {
          acknowledgment: `I see you're available ${dates}.`,
          question: 'What time works best for you on these days?'
        };
      }
      
      if (!hasDates && (hasTimes || hasTimeWords)) {
        // Just times, no dates
        const times = slots.map(slot => this.formatTime(slot.time)).join(' or ');
        return {
          acknowledgment: `I see you're available ${times}.`,
          question: 'What days would work best for you?'
        };
      }
    }
    
    if (preferences) {
      const prefParts = [];
      
      if (preferences.preferred_days && preferences.preferred_days.length > 0) {
        const days = preferences.preferred_days.join(', ');
        prefParts.push(`on ${days}`);
      }
      
      if (preferences.preferred_times && preferences.preferred_times.length > 0) {
        const times = preferences.preferred_times.join(' or ');
        prefParts.push(`in the ${times}`);
      }
      
      if (prefParts.length > 0) {
        return {
          acknowledgment: `I see you prefer tours ${prefParts.join(' ')}.`,
          question: 'Could you provide some specific dates and times that work for you?'
        };
      }
    }
    
    if (raw_text) {
      return {
        acknowledgment: `I see you mentioned "${raw_text}" for touring.`,
        question: 'Could you clarify your specific availability with dates and times?'
      };
    }

    return {
      acknowledgment: '',
      question: 'When would be a good time for you to tour the property?'
    };
  }

  generateMissingInfoText(lead) {
    const missing = [];

    // Check critical fields that are often missing
    if (!lead.income) {
      missing.push('approximate annual income');
    }
    if (!lead.credit_score) {
      missing.push('credit score or range');
    }
    if (!lead.move_in_date) {
      missing.push('desired move-in date');
    }
    if (!lead.pets || lead.pets === null || lead.pets.toLowerCase() === 'not provided') {
      missing.push('whether you have any pets');
    }
    if (!lead.occupants || lead.occupants === null) {
      missing.push('total number of occupants');
    }
    if (!lead.phone || lead.phone.startsWith('999')) {
      missing.push('phone number for contact');
    }

    if (missing.length === 0) {
      return '';
    }

    if (missing.length === 1) {
      return `Could you please provide your ${missing[0]}?`;
    } else if (missing.length === 2) {
      return `Could you please provide your ${missing[0]} and ${missing[1]}?`;
    } else {
      const lastItem = missing.pop();
      return `To help qualify you for this property, could you please provide your ${missing.join(', ')}, and ${lastItem}?`;
    }
  }

  formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return date; // Return as-is if not a valid date
    
    return d.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric'
    });
  }

  formatTime(time) {
    if (!time) return '';
    
    // Check if it's already a word like "morning", "afternoon"
    if (['morning', 'afternoon', 'evening', 'noon', 'midnight'].includes(time)) {
      return time;
    }
    
    // Check for special formats
    if (time.includes('after') || time.includes('before')) {
      return time;
    }
    
    // Convert 24h to 12h format
    const match = time.match(/^(\d{1,2}):(\d{2})$/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = match[2];
      const ampm = hours >= 12 ? 'pm' : 'am';
      const h12 = hours > 12 ? hours - 12 : (hours === 0 ? 12 : hours);
      
      if (minutes === '00') {
        return `${h12}${ampm}`;
      }
      return `${h12}:${minutes}${ampm}`;
    }
    
    return time;
  }

  formatPhone(phone) {
    if (!phone || phone.startsWith('999')) return '';
    
    // Format 10-digit phone number
    if (phone.length === 10) {
      return `(${phone.substr(0, 3)}) ${phone.substr(3, 3)}-${phone.substr(6, 4)}`;
    }
    
    return phone;
  }

  // CRUD operations for templates
  async getAllTemplates() {
    console.log('[TemplateService] getAllTemplates called');
    try {
      if (!supabaseModule.supabase) {
        console.warn('[TemplateService] Supabase not initialized - returning empty templates');
        return [];
      }
      
      console.log('[TemplateService] Fetching templates from database...');
      const { data, error } = await supabaseModule.supabase
        .from('message_templates')
        .select('*')
        .order('type', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[TemplateService] Database error fetching templates:', {
          error: error.message,
          code: error.code,
          details: error.details
        });
        throw error;
      }
      
      console.log(`[TemplateService] Successfully fetched ${data?.length || 0} templates`);
      return data || [];
    } catch (error) {
      console.error('[TemplateService] getAllTemplates failed:', {
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  async getTemplate(id) {
    const { data, error } = await supabaseModule.supabase
      .from('message_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async getDefaultTemplate(type) {
    const { data, error } = await supabaseModule.supabase
      .from('message_templates')
      .select('*')
      .eq('type', type)
      .eq('is_default', true)
      .single();

    if (error) throw error;
    return data;
  }

  async createTemplate(templateData) {
    // Extract variables used in the template
    const variablePattern = /\{([^}]+)\}/g;
    const variables = [];
    let match;
    while ((match = variablePattern.exec(templateData.template)) !== null) {
      if (!variables.includes(match[1])) {
        variables.push(match[1]);
      }
    }
    templateData.variables_used = variables;

    const { data, error } = await supabaseModule.supabase
      .from('message_templates')
      .insert(templateData)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateTemplate(id, updates) {
    // Re-extract variables if template is being updated
    if (updates.template) {
      const variablePattern = /\{([^}]+)\}/g;
      const variables = [];
      let match;
      while ((match = variablePattern.exec(updates.template)) !== null) {
        if (!variables.includes(match[1])) {
          variables.push(match[1]);
        }
      }
      updates.variables_used = variables;
    }

    const { data, error } = await supabaseModule.supabase
      .from('message_templates')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteTemplate(id) {
    const { error } = await supabaseModule.supabase
      .from('message_templates')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return { success: true };
  }

  async getLead(leadId) {
    const { data, error } = await supabaseModule.supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Preview a template with sample or actual lead data
   */
  previewTemplate(template, leadData) {
    // Use provided lead data or create sample data
    const sampleLead = leadData || {
      first_name: 'John',
      last_name: 'Smith',
      email: 'john.smith@example.com',
      phone: '2165551234',
      property_address: '123 Main St, Cleveland, OH',
      unit: 'Apt 2B',
      income: 75000,
      credit_score: '720-780',
      move_in_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      occupants: 2,
      pets: 'One small dog',
      lease_length: 12,
      tour_availability: {
        parsed: true,
        slots: [{
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
          time: '14:00'
        }]
      }
    };

    const result = this.substituteVariables(template, sampleLead);
    const finalContent = this.processSmartSections(result.content, sampleLead);

    return {
      processed_content: finalContent,
      missing_variables: result.missing,
      substitutions: result.substitutions,
      sample_data_used: !leadData
    };
  }
}

module.exports = new TemplateService();
