const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  updateSalesOrder,
  deleteSalesOrder,
  confirmSalesOrder,
  processSalesOrder,
  completeSalesOrder,
  fulfillSalesOrder,
  getSalesOrdersByCustomer
} = require('../controllers/salesOrderController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules
const salesOrderValidation = [
  body('customer_id').isUUID().withMessage('Valid customer ID is required'),
  body('delivery_date').optional().isISO8601().withMessage('Valid delivery date required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.variant_id').isUUID().withMessage('Valid variant ID is required'),
  body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('items.*.unit_price').isFloat({ min: 0 }).withMessage('Unit price must be non-negative')
];

const fulfillValidation = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.salesOrderItemId').isUUID().withMessage('Valid sales order item ID is required'),
  body('items.*.fulfilledQuantity').isFloat({ min: 0.01 }).withMessage('Fulfilled quantity must be greater than 0')
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid sales order ID')
];

// Routes
router.get('/', authenticate, getAllSalesOrders);
router.get('/customer/:customerId', authenticate, getSalesOrdersByCustomer);
router.get('/:id', authenticate, idValidation, handleValidationErrors, getSalesOrderById);
router.post('/', authenticate, authorize(['sales_order.create']), salesOrderValidation, handleValidationErrors, createSalesOrder);
router.put('/:id', authenticate, authorize(['sales_order.update']), idValidation, handleValidationErrors, updateSalesOrder);
router.put('/:id/confirm', authenticate, authorize(['sales_order.confirm']), idValidation, handleValidationErrors, confirmSalesOrder);
router.put('/:id/process', authenticate, authorize(['sales_order.process']), idValidation, handleValidationErrors, processSalesOrder);
router.put('/:id/complete', authenticate, authorize(['sales_order.deliver']), idValidation, handleValidationErrors, completeSalesOrder);
router.post('/:id/fulfill', authenticate, authorize(['sales_order.fulfill']), [...idValidation, ...fulfillValidation], handleValidationErrors, fulfillSalesOrder);
router.delete('/:id', authenticate, authorize(['sales_order.delete']), idValidation, handleValidationErrors, deleteSalesOrder);

module.exports = router;