const LeadService = require('../services/leadService');
const { asyncHandler } = require('../middleware/errorHandler');
const { isDatabaseAvailable } = require('../utils/database');
const PerformanceLogger = require('../utils/performanceLogger');

class LeadController {
  // Create or update lead
  static createLead = asyncHandler(async (req, res) => {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Database not configured - cannot create leads in Gmail-only mode'
      });
    }
    
    const leadData = req.body;
    
    const result = await LeadService.createOrUpdateLead(leadData);
    
    res.status(result.isNew ? 201 : 200).json({
      success: true,
      message: result.isNew ? 'Lead created successfully' : 'Lead updated successfully',
      lead: result.lead
    });
  });

  // Get all leads
  static getAllLeads = asyncHandler(async (req, res) => {
    const apiTimer = PerformanceLogger.startTimer('API: GET /api/leads');
    // Check if database is available
    if (!isDatabaseAvailable()) {
      return res.json({
        success: true,
        leads: [],
        total: 0,
        page: 1,
        totalPages: 0,
        message: 'Running in Gmail-only mode - database not configured'
      });
    }

    const filters = {
      page: req.query.page || 1,
      limit: req.query.limit === 'all' ? 1000 : (parseInt(req.query.limit) || 50),
      search: req.query.search,
      status: req.query.status,
      source: req.query.source,
      missingInfo: req.query.missingInfo
    };

    const result = await LeadService.getAllLeads(filters);
    
    const duration = apiTimer();
    PerformanceLogger.logAPIRequest('GET', '/api/leads', 200, duration);
    
    res.json({
      success: true,
      ...result
    });
  });

  // Get single lead
  static getLeadById = asyncHandler(async (req, res) => {
    const apiTimer = PerformanceLogger.startTimer(`API: GET /api/leads/${req.params.id}`);
    if (!isDatabaseAvailable()) {
      return res.json({
        success: false,
        lead: null,
        message: 'Database not configured - running in Gmail-only mode'
      });
    }
    
    const { id } = req.params;
    
    const lead = await LeadService.getLeadById(id);
    
    const duration = apiTimer();
    PerformanceLogger.logAPIRequest('GET', `/api/leads/${req.params.id}`, 200, duration);
    
    res.json({
      success: true,
      lead
    });
  });

  // Update lead
  static updateLead = asyncHandler(async (req, res) => {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Database not configured - cannot update leads in Gmail-only mode'
      });
    }
    
    const { id } = req.params;
    const updates = req.body;
    
    const lead = await LeadService.updateLead(id, updates);
    
    res.json({
      success: true,
      message: 'Lead updated successfully',
      lead
    });
  });

  // Delete lead
  static deleteLead = asyncHandler(async (req, res) => {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Database not configured - cannot delete leads in Gmail-only mode'
      });
    }
    
    const { id } = req.params;
    
    const lead = await LeadService.deleteLead(id);
    
    res.json({
      success: true,
      message: 'Lead deleted successfully',
      lead
    });
  });

  // Bulk delete leads
  static bulkDeleteLeads = asyncHandler(async (req, res) => {
    if (!isDatabaseAvailable()) {
      return res.status(503).json({
        success: false,
        message: 'Database not configured - cannot delete leads in Gmail-only mode'
      });
    }
    
    const { ids } = req.body;
    
    // Call service method for bulk deletion
    const result = await LeadService.bulkDeleteLeads(ids);
    
    // Return detailed response
    res.json({
      success: result.deleted > 0,
      message: `Deleted ${result.deleted} of ${result.total} leads`,
      deleted: result.deleted,
      failed: result.failed,
      errors: result.errors
    });
  });

  // Get lead statistics
  static getLeadStats = asyncHandler(async (req, res) => {
    if (!isDatabaseAvailable()) {
      return res.json({
        success: true,
        stats: { total: 0, statusDistribution: {} },
        message: 'Running in Gmail-only mode - database not configured'
      });
    }
    
    const stats = await LeadService.getLeadStats();
    
    res.json({
      success: true,
      stats
    });
  });
}

module.exports = LeadController;