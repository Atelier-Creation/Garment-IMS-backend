const express = require('express');
const { body, param } = require('express-validator');
const purchaseOrderInwardController = require('../controllers/purchaseOrderInwardController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules
const inwardValidation = [
  body('received_items').isArray({ min: 1 }).withMessage('At least one received item is required'),
  body('received_items.*.item_id').isUUID().withMessage('Valid item ID is required'),
  body('received_items.*.received_quantity').isFloat({ min: 0.01 }).withMessage('Received quantity must be greater than 0'),
  body('received_items.*.batch_number').optional().trim().isLength({ min: 1 }),
  body('received_items.*.manufacturing_date').optional().isISO8601(),
  body('received_items.*.expiry_date').optional().isISO8601(),
  body('received_items.*.quality_status').optional().isIn(['approved', 'rejected', 'pending']),
  body('received_items.*.unit_cost').optional().isFloat({ min: 0 }),
  body('received_date').optional().isISO8601(),
  body('invoice_number').optional().trim(),
  body('invoice_date').optional().isISO8601(),
  body('transport_details').optional().trim(),
  body('quality_check_notes').optional().trim(),
  body('notes').optional().trim()
];

const idValidation = [
  param('id').isUUID().withMessage('Valid purchase order ID is required')
];

// Routes
router.get(
  '/ready', 
  authenticate, 
  authorize(['purchase.read', 'purchase.receive']), 
  purchaseOrderInwardController.getInwardReadyOrders
);

router.get(
  '/summary', 
  authenticate, 
  authorize(['purchase.read']), 
  purchaseOrderInwardController.getInwardSummary
);

router.get(
  '/:id', 
  authenticate, 
  authorize(['purchase.read']), 
  idValidation, 
  handleValidationErrors, 
  purchaseOrderInwardController.getOrderForInward
);

router.post(
  '/:id/process', 
  authenticate, 
  authorize(['purchase.receive']), 
  idValidation, 
  inwardValidation, 
  handleValidationErrors, 
  purchaseOrderInwardController.processInward
);

router.get(
  '/:id/history', 
  authenticate, 
  authorize(['purchase.read']), 
  idValidation, 
  handleValidationErrors, 
  purchaseOrderInwardController.getInwardHistory
);

module.exports = router;