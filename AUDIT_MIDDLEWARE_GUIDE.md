# Audit Middleware Guide

## Overview

The audit middleware automatically tracks all CRUD operations across the Garment IMS system, providing comprehensive logging for compliance, security, and debugging purposes.

## Features

- **Automatic Logging**: Captures all CREATE, UPDATE, DELETE operations automatically
- **Authentication Tracking**: Logs login/logout events with success/failure status
- **Data Changes**: Records both old and new values for update operations
- **User Context**: Tracks which user performed each action
- **IP & User Agent**: Records client information for security analysis
- **Flexible Configuration**: Customizable to exclude certain paths or methods
- **Sensitive Data Protection**: Automatically redacts passwords and other sensitive fields

## How It Works

### 1. Global Middleware

The audit middleware is applied globally to all API routes in `server.js`:

```javascript
app.use('/api', auditLogger({
  excludePaths: ['/health', '/api/auth/profile', '/api/audit-logs'],
  excludeMethods: ['GET'], // Don't audit read operations by default
  includeRequestBody: true,
  includeResponseBody: false
}));
```

### 2. Automatic Tracking

The middleware automatically captures:
- **Action Type**: CREATE, UPDATE, DELETE, LOGIN_SUCCESS, LOGIN_FAILED, LOGOUT
- **Entity Type**: Extracted from URL path (users, roles, products, etc.)
- **Entity ID**: The ID of the affected record
- **User Information**: Who performed the action
- **Timestamp**: When the action occurred
- **IP Address & User Agent**: Client information
- **Data Changes**: What was changed (old vs new values)

### 3. Manual Logging Functions

For specific operations that need custom audit logging:

```javascript
const { auditCreate, auditUpdate, auditDelete, auditLogin, auditLogout } = require('../middleware/auditMiddleware');

// Log a create operation
await auditCreate(req, res, 'user', userId, newUserData);

// Log an update operation
await auditUpdate(req, res, 'user', userId, oldUserData, newUserData);

// Log a delete operation
await auditDelete(req, res, 'user', userId, deletedUserData);

// Log login events
await auditLogin(req, res, userId, success, additionalInfo);

// Log logout events
await auditLogout(req, res, userId, additionalInfo);
```

## Configuration Options

### auditLogger(options)

- **excludePaths**: Array of paths to exclude from auditing
- **excludeMethods**: Array of HTTP methods to exclude (default: ['GET'])
- **includeRequestBody**: Whether to log request body data (default: true)
- **includeResponseBody**: Whether to log response body data (default: false)

### Example Configuration

```javascript
auditLogger({
  excludePaths: [
    '/health',
    '/api/auth/profile',
    '/api/audit-logs',
    '/api/reports' // Don't audit report generation
  ],
  excludeMethods: ['GET', 'OPTIONS'],
  includeRequestBody: true,
  includeResponseBody: false
})
```

## Database Schema

The audit logs are stored in the `audit_logs` table with the following structure:

```sql
CREATE TABLE audit_logs (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36), -- Who performed the action
  action VARCHAR(50), -- CREATE, UPDATE, DELETE, etc.
  entity_type VARCHAR(100), -- users, roles, products, etc.
  entity_id CHAR(36), -- ID of the affected record
  old_values JSON, -- Previous values (for updates)
  new_values JSON, -- New values (for creates/updates)
  ip_address VARCHAR(45), -- Client IP address
  user_agent TEXT, -- Client user agent
  additional_info JSON, -- Extra context information
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Security Features

### 1. Sensitive Data Redaction

The middleware automatically redacts sensitive fields:
- password
- password_hash
- token
- secret
- key

These fields are replaced with `[REDACTED]` in the audit logs.

### 2. IP Address Tracking

Client IP addresses are captured for security analysis, supporting:
- Direct connections
- Proxy headers (X-Forwarded-For)
- Load balancer configurations

### 3. User Agent Logging

Browser and application information is logged for:
- Security analysis
- Usage patterns
- Debugging client-specific issues

## Usage Examples

### 1. User Management Auditing

```javascript
// In userController.js
const { auditCreate, auditUpdate, auditDelete } = require('../middleware/auditMiddleware');

const createUser = async (req, res) => {
  // ... create user logic ...
  
  // Log the creation
  await auditCreate(req, res, 'user', user.id, {
    email: user.email,
    full_name: user.full_name,
    roles: assignedRoles
  });
};

const updateUser = async (req, res) => {
  // ... get original data ...
  const originalData = { /* ... */ };
  
  // ... update user logic ...
  
  // Log the update
  await auditUpdate(req, res, 'user', userId, originalData, newData);
};
```

### 2. Authentication Auditing

```javascript
// In authController.js
const { auditLogin, auditLogout } = require('../middleware/auditMiddleware');

const login = async (req, res) => {
  try {
    // ... login logic ...
    
    // Log successful login
    await auditLogin(req, res, user.id, true, {
      email: user.email,
      full_name: user.full_name
    });
  } catch (error) {
    // Log failed login
    await auditLogin(req, res, null, false, {
      email: req.body.email,
      error: error.message
    });
  }
};
```

### 3. Custom Entity Auditing

```javascript
// For any custom operations
const { logAuditEvent } = require('../middleware/auditMiddleware');

const customOperation = async (req, res) => {
  // ... custom logic ...
  
  await logAuditEvent(
    req, 
    res, 
    'CUSTOM_ACTION', 
    'custom_entity', 
    entityId, 
    oldData, 
    newData, 
    { customField: 'customValue' }
  );
};
```

## Viewing Audit Logs

Audit logs can be viewed through:

1. **Frontend Interface**: Navigate to `/audit-logs` in the application
2. **API Endpoint**: `GET /api/audit-logs` with pagination and filtering
3. **Database Query**: Direct SQL queries on the `audit_logs` table

### API Query Examples

```javascript
// Get all audit logs for a specific user
GET /api/audit-logs?user_id=user-uuid

// Get all logs for a specific entity
GET /api/audit-logs?entity_type=user&entity_id=user-uuid

// Get logs for a specific action type
GET /api/audit-logs?action=UPDATE

// Get logs within a date range
GET /api/audit-logs?start_date=2024-01-01&end_date=2024-01-31
```

## Best Practices

### 1. Performance Considerations

- Audit logging is asynchronous and won't block main operations
- Consider archiving old audit logs periodically
- Index frequently queried fields (user_id, entity_type, created_at)

### 2. Data Retention

- Implement a retention policy for audit logs
- Consider compliance requirements (GDPR, SOX, etc.)
- Archive rather than delete for long-term compliance

### 3. Monitoring

- Monitor audit log creation for system health
- Set up alerts for suspicious patterns
- Regular review of failed operations

### 4. Privacy Compliance

- Ensure audit logs comply with privacy regulations
- Consider data anonymization for non-essential fields
- Implement proper access controls for audit log viewing

## Troubleshooting

### Common Issues

1. **Audit logs not being created**
   - Check if the middleware is properly configured
   - Verify database connectivity
   - Check for errors in server logs

2. **Missing user information**
   - Ensure authentication middleware runs before audit middleware
   - Check if `req.user` is properly set

3. **Performance issues**
   - Consider reducing `includeResponseBody` to false
   - Implement audit log archiving
   - Add database indexes

### Debug Mode

Enable debug logging by setting environment variable:
```bash
DEBUG=audit:* npm start
```

This will provide detailed information about audit operations.

## Integration with Existing Controllers

The middleware is designed to work with minimal changes to existing code. For controllers that need detailed audit logging, simply import the audit functions and call them at appropriate points.

Most operations will be automatically logged by the global middleware, but manual logging provides more control over what data is captured and when.