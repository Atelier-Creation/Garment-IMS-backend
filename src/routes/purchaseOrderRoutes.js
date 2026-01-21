const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder,
  approvePurchaseOrder,
  receivePurchaseOrder,
  getPurchaseOrdersBySupplier
} = require('../controllers/purchaseOrderController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules
const purchaseOrderValidation = [
  body('supplier_id').isUUID().withMessage('Valid supplier ID is required'),
  body('expected_delivery_date').isISO8601().withMessage('Valid expected delivery date is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.raw_material_id').isUUID().withMessage('Valid raw material ID is required'),
  body('items.*.qty').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Unit price must be non-negative')
];

const receiveValidation = [
  body('received_items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('received_items.*.item_id').isUUID().withMessage('Valid item ID is required'),
  body('received_items.*.received_quantity').isFloat({ min: 0.01 }).withMessage('Received quantity must be greater than 0')
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid purchase order ID')
];

// Routes
router.get('/', authenticate, getAllPurchaseOrders);
router.get('/supplier/:supplierId', authenticate, getPurchaseOrdersBySupplier);
router.get('/:id', authenticate, idValidation, handleValidationErrors, getPurchaseOrderById);
router.post('/', authenticate, authorize(['purchase.create']), purchaseOrderValidation, handleValidationErrors, createPurchaseOrder);
router.put('/:id', authenticate, authorize(['purchase.update']), idValidation, handleValidationErrors, updatePurchaseOrder);
router.put('/:id/approve', authenticate, authorize(['purchase.update']), idValidation, handleValidationErrors, approvePurchaseOrder);
router.post('/:id/receive', authenticate, authorize(['purchase.receive']), [...idValidation, ...receiveValidation], handleValidationErrors, receivePurchaseOrder);
router.delete('/:id', authenticate, authorize(['purchase.delete']), idValidation, handleValidationErrors, deletePurchaseOrder);

module.exports = router;