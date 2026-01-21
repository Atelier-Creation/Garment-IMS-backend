const { AuditLog } = require('../models');

/**
 * Audit Log Middleware
 * Automatically logs all CRUD operations for auditing purposes
 */

// Helper function to get client IP
const getClientIP = (req) => {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         'unknown';
};

// Helper function to sanitize data (remove sensitive fields)
const sanitizeData = (data) => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveFields = ['password', 'password_hash', 'token', 'secret', 'key'];
  const sanitized = { ...data };
  
  Object.keys(sanitized).forEach(key => {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

// Helper function to extract entity info from request
const getEntityInfo = (req) => {
  const path = req.route?.path || req.path;
  const method = req.method;
  
  // Extract entity type from URL path
  let entityType = 'unknown';
  let entityId = null;
  
  // Common patterns: /api/users/:id, /api/products/:id, etc.
  const pathSegments = path.split('/').filter(segment => segment && segment !== 'api');
  
  if (pathSegments.length >= 1) {
    // Get the first segment after 'api' as entity type
    entityType = pathSegments[0];
    
    // Remove common suffixes to get clean entity type
    entityType = entityType.replace(/s$/, ''); // Remove plural 's'
    
    // Handle special cases
    const entityMappings = {
      'user': 'user',
      'role': 'role', 
      'permission': 'permission',
      'product': 'product',
      'category': 'category',
      'supplier': 'supplier',
      'customer': 'customer',
      'branch': 'branch',
      'order': 'purchase_order',
      'sale': 'sales_order',
      'production': 'production_order',
      'audit-log': 'audit_log'
    };
    
    entityType = entityMappings[entityType] || entityType;
  }
  
  // Extract ID from params
  if (req.params && req.params.id) {
    entityId = req.params.id;
  }
  
  return { entityType, entityId, path, method };
};

// Helper function to determine action type
const getActionType = (method, path) => {
  switch (method.toUpperCase()) {
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    case 'GET':
      return 'READ';
    default:
      return 'UNKNOWN';
  }
};

// Main audit logging function
const logAuditEvent = async (req, res, action, entityType, entityId, oldData = null, newData = null, additionalInfo = {}) => {
  try {
    // Get user ID with multiple fallback options
    let userId = null;
    let userInfo = {};
    
    if (req.user) {
      userId = req.user.id;
      userInfo = {
        email: req.user.email,
        full_name: req.user.full_name
      };
    } else if (req.body && req.body.email && action.includes('LOGIN')) {
      // For login attempts, capture email even if user is not authenticated yet
      userInfo.attempted_email = req.body.email;
    }
    
    const userAgent = req.get('User-Agent') || 'unknown';
    const ipAddress = getClientIP(req);
    
    // Prepare audit log data
    const auditData = {
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldData ? JSON.stringify(sanitizeData(oldData)) : null,
      new_values: newData ? JSON.stringify(sanitizeData(newData)) : null,
      ip_address: ipAddress,
      user_agent: userAgent,
      additional_info: Object.keys(additionalInfo).length > 0 || Object.keys(userInfo).length > 0 
        ? JSON.stringify({ ...additionalInfo, user_info: userInfo }) 
        : null
    };
    
    // Create audit log entry
    await AuditLog.create(auditData);
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw error to avoid breaking the main operation
  }
};

// Middleware for automatic audit logging
const auditLogger = (options = {}) => {
  const {
    excludePaths = ['/health', '/api/auth/profile'], // Paths to exclude from auditing
    excludeMethods = ['GET'], // Methods to exclude (GET operations are usually not audited)
    includeRequestBody = true,
    includeResponseBody = false
  } = options;
  
  return async (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Skip if path or method should be excluded
    if (excludePaths.some(path => req.path.includes(path)) || 
        excludeMethods.includes(req.method.toUpperCase())) {
      return next();
    }
    
    // Skip if user is not authenticated (for most operations)
    if (!req.user && !req.path.includes('/auth/')) {
      return next();
    }
    
    const { entityType, entityId, path, method } = getEntityInfo(req);
    const action = getActionType(method, path);
    
    let responseData = null;
    let statusCode = null;
    
    // Intercept response to capture data
    res.send = function(data) {
      statusCode = res.statusCode;
      if (includeResponseBody && data) {
        try {
          responseData = typeof data === 'string' ? JSON.parse(data) : data;
        } catch (e) {
          responseData = data;
        }
      }
      return originalSend.call(this, data);
    };
    
    res.json = function(data) {
      statusCode = res.statusCode;
      if (includeResponseBody) {
        responseData = data;
      }
      return originalJson.call(this, data);
    };
    
    // Store original data for UPDATE operations
    let originalData = null;
    if (action === 'UPDATE' && entityId) {
      // This would need to be customized based on your models
      // For now, we'll capture it in the controller if needed
      req.auditOriginalData = null;
    }
    
    // Continue with the request
    next();
    
    // Log after response is sent
    res.on('finish', async () => {
      // Only log successful operations (2xx status codes) or specific errors
      if (statusCode >= 200 && statusCode < 300) {
        const { entityType, entityId } = getEntityInfo(req);
        const action = getActionType(method, path);
        
        const additionalInfo = {
          path,
          method,
          statusCode,
          query: req.query,
          params: req.params
        };
        
        let newData = null;
        let oldData = req.auditOriginalData || null;
        
        if (includeRequestBody && req.body) {
          newData = req.body;
        }
        
        if (includeResponseBody && responseData?.data) {
          newData = responseData.data;
        }
        
        await logAuditEvent(
          req, 
          res, 
          action, 
          entityType, 
          entityId, 
          oldData, 
          newData, 
          additionalInfo
        );
      }
    });
  };
};

// Specific audit functions for manual logging
const auditCreate = async (req, res, entityType, entityId, newData, additionalInfo = {}) => {
  await logAuditEvent(req, res, 'CREATE', entityType, entityId, null, newData, additionalInfo);
};

const auditUpdate = async (req, res, entityType, entityId, oldData, newData, additionalInfo = {}) => {
  await logAuditEvent(req, res, 'UPDATE', entityType, entityId, oldData, newData, additionalInfo);
};

const auditDelete = async (req, res, entityType, entityId, oldData, additionalInfo = {}) => {
  await logAuditEvent(req, res, 'DELETE', entityType, entityId, oldData, null, additionalInfo);
};

const auditRead = async (req, res, entityType, entityId, data, additionalInfo = {}) => {
  await logAuditEvent(req, res, 'READ', entityType, entityId, null, data, additionalInfo);
};

const auditLogin = async (req, res, userId, success, additionalInfo = {}) => {
  const action = success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED';
  await logAuditEvent(req, res, action, 'user', userId, null, null, additionalInfo);
};

const auditLogout = async (req, res, userId, additionalInfo = {}) => {
  await logAuditEvent(req, res, 'LOGOUT', 'user', userId, null, null, additionalInfo);
};

// System audit function for operations performed by the system itself
const auditSystem = async (action, entityType, entityId, oldData = null, newData = null, additionalInfo = {}) => {
  try {
    const auditData = {
      user_id: null, // System operations have no user
      action,
      entity_type: entityType,
      entity_id: entityId,
      old_values: oldData ? JSON.stringify(sanitizeData(oldData)) : null,
      new_values: newData ? JSON.stringify(sanitizeData(newData)) : null,
      ip_address: 'system',
      user_agent: 'system',
      additional_info: JSON.stringify({ 
        ...additionalInfo, 
        performed_by: 'system',
        timestamp: new Date().toISOString()
      })
    };
    
    await AuditLog.create(auditData);
  } catch (error) {
    console.error('Failed to create system audit log:', error);
  }
};

// Helper function to get user context for audit logs
const getUserContext = (req) => {
  const context = {
    user_id: null,
    user_info: {}
  };
  
  if (req.user) {
    context.user_id = req.user.id;
    context.user_info = {
      email: req.user.email,
      full_name: req.user.full_name,
      roles: req.user.Roles ? req.user.Roles.map(role => role.name) : []
    };
  }
  
  return context;
};

// Helper middleware to capture original data before updates
const captureOriginalData = (modelName) => {
  return async (req, res, next) => {
    if (req.method === 'PUT' || req.method === 'PATCH') {
      try {
        const { [modelName]: Model } = require('../models');
        const entityId = req.params.id;
        
        if (entityId && Model) {
          const originalRecord = await Model.findByPk(entityId);
          if (originalRecord) {
            req.auditOriginalData = originalRecord.toJSON();
          }
        }
      } catch (error) {
        console.error('Failed to capture original data for audit:', error);
      }
    }
    next();
  };
};

module.exports = {
  auditLogger,
  auditCreate,
  auditUpdate,
  auditDelete,
  auditRead,
  auditLogin,
  auditLogout,
  auditSystem,
  captureOriginalData,
  logAuditEvent,
  getUserContext
};