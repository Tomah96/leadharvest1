// Request validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    const validationErrors = [];
    
    // Validate body
    if (schema.body) {
      const bodyErrors = validateObject(req.body, schema.body, 'body');
      validationErrors.push(...bodyErrors);
    }
    
    // Validate params
    if (schema.params) {
      const paramErrors = validateObject(req.params, schema.params, 'params');
      validationErrors.push(...paramErrors);
    }
    
    // Validate query
    if (schema.query) {
      const queryErrors = validateObject(req.query, schema.query, 'query');
      validationErrors.push(...queryErrors);
    }
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        error: 'Validation Error',
        details: validationErrors
      });
    }
    
    next();
  };
};

// Validate object against schema
const validateObject = (obj, schema, location) => {
  const errors = [];
  
  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!obj[field]) {
        errors.push({
          field,
          location,
          message: `${field} is required`
        });
      }
    }
  }
  
  // Check field types
  if (schema.properties) {
    for (const [field, rules] of Object.entries(schema.properties)) {
      if (obj[field] !== undefined) {
        // Type validation
        if (rules.type && !validateType(obj[field], rules.type)) {
          errors.push({
            field,
            location,
            message: `${field} must be of type ${rules.type}`
          });
        }
        
        // Min/max length for strings
        if (rules.type === 'string') {
          if (rules.minLength && obj[field].length < rules.minLength) {
            errors.push({
              field,
              location,
              message: `${field} must be at least ${rules.minLength} characters long`
            });
          }
          if (rules.maxLength && obj[field].length > rules.maxLength) {
            errors.push({
              field,
              location,
              message: `${field} must be at most ${rules.maxLength} characters long`
            });
          }
        }
        
        // Min/max for numbers
        if (rules.type === 'number') {
          if (rules.min !== undefined && obj[field] < rules.min) {
            errors.push({
              field,
              location,
              message: `${field} must be at least ${rules.min}`
            });
          }
          if (rules.max !== undefined && obj[field] > rules.max) {
            errors.push({
              field,
              location,
              message: `${field} must be at most ${rules.max}`
            });
          }
        }
        
        // Pattern validation
        if (rules.pattern && !new RegExp(rules.pattern).test(obj[field])) {
          errors.push({
            field,
            location,
            message: `${field} has invalid format`
          });
        }
        
        // Enum validation
        if (rules.enum && !rules.enum.includes(obj[field])) {
          errors.push({
            field,
            location,
            message: `${field} must be one of: ${rules.enum.join(', ')}`
          });
        }
      }
    }
  }
  
  return errors;
};

// Type validation helper
const validateType = (value, type) => {
  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    default:
      return true;
  }
};

module.exports = {
  validateRequest
};