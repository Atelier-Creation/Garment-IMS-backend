const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllProductionOrders,
  getProductionOrderById,
  createProductionOrder,
  updateProductionOrder,
  deleteProductionOrder,
  startProductionOrder,
  completeProductionOrder,
  getProductionOrdersByProduct
} = require('../controllers/productionOrderController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules
const productionOrderValidation = [
  body('product_id').isUUID().withMessage('Valid product ID is required'),
  body('bom_id').isUUID().withMessage('Valid BOM ID is required'),
  body('branch_id').isUUID().withMessage('Valid branch ID is required'),
  body('planned_qty').isInt({ min: 1 }).withMessage('Planned quantity must be at least 1'),
  body('start_at').optional().isISO8601().withMessage('Valid start date required'),
  body('end_at').optional().isISO8601().withMessage('Valid end date required')
];

const completeValidation = [
  body('produced_qty').isInt({ min: 0 }).withMessage('Produced quantity must be 0 or greater')
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid production order ID')
];

// Routes
router.get('/', authenticate, getAllProductionOrders);
router.get('/product/:productId', authenticate, getProductionOrdersByProduct);
router.get('/:id', authenticate, idValidation, handleValidationErrors, getProductionOrderById);
router.post('/', authenticate, authorize(['production_order.create']), productionOrderValidation, handleValidationErrors, createProductionOrder);
router.put('/:id', authenticate, authorize(['production_order.update']), idValidation, handleValidationErrors, updateProductionOrder);
router.put('/:id/start', authenticate, authorize(['production_order.start']), idValidation, handleValidationErrors, startProductionOrder);
router.put('/:id/complete', authenticate, authorize(['production_order.complete']), [...idValidation, ...completeValidation], handleValidationErrors, completeProductionOrder);
router.delete('/:id', authenticate, authorize(['production_order.delete']), idValidation, handleValidationErrors, deleteProductionOrder);

module.exports = router;