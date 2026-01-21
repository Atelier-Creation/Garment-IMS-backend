const express = require('express');
const { body, param } = require('express-validator');
const {
  auditLogController: {
    getAllAuditLogs,
    getAuditLogById,
    createAuditLog,
    getAuditLogsByEntity,
    getAuditLogsByUser,
    getAuditLogStats,
    deleteOldAuditLogs
  }
} = require('../controllers/auditLogController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules
const auditLogValidation = [
  body('action').trim().isLength({ min: 1 }).withMessage('Action is required'),
  body('entity_type').trim().isLength({ min: 1 }).withMessage('Entity type is required'),
  body('entity_id').optional().isUUID(),
  body('old_values').optional(),
  body('new_values').optional(),
  body('additional_info').optional()
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid audit log ID')
];

const entityValidation = [
  param('entityType').trim().isLength({ min: 1 }).withMessage('Valid entity type is required'),
  param('entityId').isUUID().withMessage('Valid entity ID is required')
];

const userIdValidation = [
  param('userId').isUUID().withMessage('Valid user ID is required')
];

const cleanupValidation = [
  body('daysOld').optional().isInt({ min: 1 }).withMessage('Days old must be a positive integer')
];

// Routes
router.get('/', authenticate, authorize(['audit.view']), getAllAuditLogs);
router.get('/stats', authenticate, authorize(['audit.view']), getAuditLogStats);
router.get('/entity/:entityType/:entityId', authenticate, authorize(['audit.view']), entityValidation, handleValidationErrors, getAuditLogsByEntity);
router.get('/user/:userId', authenticate, authorize(['audit.view']), userIdValidation, handleValidationErrors, getAuditLogsByUser);
router.get('/:id', authenticate, authorize(['audit.view']), idValidation, handleValidationErrors, getAuditLogById);
router.post('/', authenticate, authorize(['audit.create']), auditLogValidation, handleValidationErrors, createAuditLog);
router.delete('/cleanup', authenticate, authorize(['audit.delete']), cleanupValidation, handleValidationErrors, deleteOldAuditLogs);

module.exports = router;