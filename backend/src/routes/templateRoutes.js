const express = require('express');
const router = express.Router();
const templateService = require('../services/templateService');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/templates
router.get('/', asyncHandler(async (req, res) => {
  console.log('[TemplateRoutes] GET /api/templates - Request received');
  console.log('[TemplateRoutes] Request origin:', req.get('origin'));
  
  const templates = await templateService.getAllTemplates();
  
  console.log(`[TemplateRoutes] Returning ${templates.length} templates`);
  res.json({ 
    success: true, 
    data: templates 
  });
}));

// GET /api/templates/default/:type
router.get('/default/:type', asyncHandler(async (req, res) => {
  const template = await templateService.getDefaultTemplate(req.params.type);
  if (!template) {
    return res.status(404).json({ 
      success: false, 
      error: 'No default template found for this type' 
    });
  }
  res.json({ 
    success: true, 
    data: template 
  });
}));

// GET /api/templates/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const template = await templateService.getTemplate(req.params.id);
  if (!template) {
    return res.status(404).json({ 
      success: false, 
      error: 'Template not found' 
    });
  }
  res.json({ 
    success: true, 
    data: template 
  });
}));

// POST /api/templates
router.post('/', asyncHandler(async (req, res) => {
  const { name, type, template, is_default } = req.body;
  
  if (!name || !type || !template) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing required fields: name, type, and template are required' 
    });
  }

  // Validate type
  const validTypes = ['initial_contact', 'follow_up', 'tour_confirmation', 'custom'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ 
      success: false, 
      error: `Invalid type. Must be one of: ${validTypes.join(', ')}` 
    });
  }

  const newTemplate = await templateService.createTemplate({
    name,
    type,
    template,
    is_default: is_default || false
  });

  res.status(201).json({ 
    success: true, 
    data: newTemplate 
  });
}));

// PUT /api/templates/:id
router.put('/:id', asyncHandler(async (req, res) => {
  const updated = await templateService.updateTemplate(
    req.params.id,
    req.body
  );
  res.json({ 
    success: true, 
    data: updated 
  });
}));

// DELETE /api/templates/:id
router.delete('/:id', asyncHandler(async (req, res) => {
  await templateService.deleteTemplate(req.params.id);
  res.json({ 
    success: true,
    message: 'Template deleted successfully'
  });
}));

// POST /api/templates/preview
router.post('/preview', asyncHandler(async (req, res) => {
  const { template, leadData, leadId } = req.body;
  
  if (!template) {
    return res.status(400).json({ 
      success: false, 
      error: 'Template content is required' 
    });
  }

  let lead = leadData;
  
  // If leadId is provided, fetch actual lead data
  if (leadId) {
    try {
      lead = await templateService.getLead(leadId);
    } catch (error) {
      console.warn(`Could not fetch lead ${leadId}, using sample data`);
    }
  }

  const result = templateService.previewTemplate(template, lead);

  res.json({
    success: true,
    data: result
  });
}));

// POST /api/templates/:id/apply/:leadId
router.post('/:id/apply/:leadId', asyncHandler(async (req, res) => {
  const result = await templateService.processTemplate(
    req.params.id,
    req.params.leadId
  );
  res.json({ 
    success: true, 
    data: result 
  });
}));

// POST /api/templates/apply
router.post('/apply', asyncHandler(async (req, res) => {
  const { templateId, leadId, type } = req.body;
  
  if (!leadId) {
    return res.status(400).json({ 
      success: false, 
      error: 'Lead ID is required' 
    });
  }

  // Get template - either by ID or by type (for default)
  let template;
  if (templateId) {
    template = await templateService.getTemplate(templateId);
  } else if (type) {
    template = await templateService.getDefaultTemplate(type);
  } else {
    return res.status(400).json({ 
      success: false, 
      error: 'Either templateId or type must be provided' 
    });
  }

  if (!template) {
    return res.status(404).json({ 
      success: false, 
      error: 'Template not found' 
    });
  }

  // Get lead data
  const lead = await templateService.getLead(leadId);
  if (!lead) {
    return res.status(404).json({ 
      success: false, 
      error: 'Lead not found' 
    });
  }

  // Process the template
  const processed = templateService.substituteVariables(template.template, lead);
  const finalContent = templateService.processSmartSections(processed.content, lead);

  res.json({ 
    success: true, 
    data: {
      processed_content: finalContent,
      missing_variables: processed.missing,
      substitutions: processed.substitutions,
      template_used: {
        id: template.id,
        name: template.name,
        type: template.type
      }
    }
  });
}));

module.exports = router;