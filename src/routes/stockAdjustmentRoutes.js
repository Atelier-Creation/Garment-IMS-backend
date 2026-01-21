const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllStockAdjustments,
  getStockAdjustmentById,
  createStockAdjustment,
  updateStockAdjustment,
  deleteStockAdjustment,
  getStockAdjustmentSummary
} = require('../controllers/stockAdjustmentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules
const stockAdjustmentValidation = [
  body('itemType').isIn(['RAW', 'FINISHED']).withMessage('Item type must be RAW or FINISHED'),
  body('itemId').isUUID().withMessage('Valid item ID is required'),
  body('branchId').isUUID().withMessage('Valid branch ID is required'),
  body('qty').isFloat().withMessage('Quantity must be a valid number'),
  body('reason').trim().isLength({ min: 1 }).withMessage('Reason is required'),
  body('referenceTable').optional().trim(),
  body('referenceId').optional().isUUID()
];

const updateValidation = [
  body('reason').trim().isLength({ min: 1 }).withMessage('Reason is required')
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid stock adjustment ID')
];

// Routes
router.get('/', authenticate, getAllStockAdjustments);
router.get('/summary', authenticate, authorize(['report.view']), getStockAdjustmentSummary);
router.get('/:id', authenticate, idValidation, handleValidationErrors, getStockAdjustmentById);
router.post('/', authenticate, authorize(['stock.adjust']), stockAdjustmentValidation, handleValidationErrors, createStockAdjustment);
router.put('/:id', authenticate, authorize(['stock.adjust']), [...idValidation, ...updateValidation], handleValidationErrors, updateStockAdjustment);
router.delete('/:id', authenticate, authorize(['stock.adjust']), idValidation, handleValidationErrors, deleteStockAdjustment);

module.exports = router;