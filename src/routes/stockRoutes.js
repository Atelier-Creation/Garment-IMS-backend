const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllStock,
  getStockById,
  getStockByProduct,
  getStockByRawMaterial,
  getStockMovements,
  createStockMovement,
  adjustStock,
  transferStock,
  getLowStockItems,
  getFinishedGoodsStock,
  getRawMaterialStock
} = require('../controllers/stockController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules
const stockMovementValidation = [
  body('type').isIn(['in', 'out', 'transfer', 'adjustment']).withMessage('Valid movement type is required'),
  body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('reason').trim().isLength({ min: 1 }).withMessage('Reason is required')
];

const stockAdjustmentValidation = [
  body('adjustment_type').isIn(['increase', 'decrease']).withMessage('Valid adjustment type is required'),
  body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('reason').optional().trim(),
  body('branch_id').isUUID().withMessage('Valid branch ID is required'),
  body('variant_id').optional().isUUID().withMessage('Valid variant ID required'),
  body('raw_material_id').optional().isUUID().withMessage('Valid raw material ID required')
];

const stockTransferValidation = [
  body('fromBranchId').isUUID().withMessage('Valid from branch ID is required'),
  body('toBranchId').isUUID().withMessage('Valid to branch ID is required'),
  body('quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('reason').trim().isLength({ min: 1 }).withMessage('Reason is required')
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid stock ID')
];

// Routes
router.get('/', authenticate, getAllStock);
router.get('/finished-goods', authenticate, getFinishedGoodsStock);
router.get('/raw-materials', authenticate, getRawMaterialStock);
router.get('/low-stock', authenticate, getLowStockItems);
router.get('/movements', authenticate, getStockMovements);
router.get('/product/:productId', authenticate, getStockByProduct);
router.get('/raw-material/:rawMaterialId', authenticate, getStockByRawMaterial);
router.get('/:id', authenticate, idValidation, handleValidationErrors, getStockById);
router.post('/movement', authenticate, authorize(['stock.create']), stockMovementValidation, handleValidationErrors, createStockMovement);
router.post('/adjust', authenticate, authorize(['stock.adjust']), stockAdjustmentValidation, handleValidationErrors, adjustStock);
router.put('/:id/adjust', authenticate, authorize(['stock.adjust']), [...idValidation, ...stockAdjustmentValidation], handleValidationErrors, adjustStock);
router.post('/transfer', authenticate, authorize(['stock.transfer']), stockTransferValidation, handleValidationErrors, transferStock);

module.exports = router;