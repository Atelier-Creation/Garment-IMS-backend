const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllExportOrders,
  getExportOrderById,
  createExportOrder,
  updateExportOrder,
  deleteExportOrder,
  updateExportOrderStatus
} = require('../controllers/exportOrderController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules
const exportOrderValidation = [
  body('customer_id').isUUID().withMessage('Valid customer ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.variant_id').isUUID().withMessage('Valid variant ID is required'),
  body('items.*.qty').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Unit price must be non-negative')
];

const statusValidation = [
  body('status').isIn(['PENDING', 'BOOKED', 'SHIPPED', 'DELIVERED', 'CANCELLED']).withMessage('Invalid status')
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid export order ID')
];

// Routes
router.get('/', authenticate, authorize(['export_orders:read']), getAllExportOrders);
router.get('/:id', authenticate, authorize(['export_orders:read']), idValidation, handleValidationErrors, getExportOrderById);
router.post('/', authenticate, authorize(['export_orders:create']), exportOrderValidation, handleValidationErrors, createExportOrder);
router.put('/:id', authenticate, authorize(['export_orders:update']), idValidation, handleValidationErrors, updateExportOrder);
router.put('/:id/status', authenticate, authorize(['export_orders:update_status']), [...idValidation, ...statusValidation], handleValidationErrors, updateExportOrderStatus);
router.delete('/:id', authenticate, authorize(['export_orders:delete']), idValidation, handleValidationErrors, deleteExportOrder);

module.exports = router;