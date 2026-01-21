const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllProductVariants,
  getProductVariantById,
  getVariantsByProduct,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  getVariantStockSummary
} = require('../controllers/productVariantController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules
const productVariantValidation = [
  body('productId').isUUID().withMessage('Valid product ID is required'),
  body('sku').optional().trim().isLength({ min: 1 }),
  body('size').optional().trim(),
  body('color').optional().trim(),
  body('mrp').optional().isFloat({ min: 0 }),
  body('costPrice').optional().isFloat({ min: 0 })
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid product variant ID')
];

const productIdValidation = [
  param('productId').isUUID().withMessage('Invalid product ID')
];

// Routes
router.get('/', authenticate, getAllProductVariants);
router.get('/product/:productId', authenticate, productIdValidation, handleValidationErrors, getVariantsByProduct);
router.get('/:id', authenticate, idValidation, handleValidationErrors, getProductVariantById);
router.get('/:id/stock', authenticate, idValidation, handleValidationErrors, getVariantStockSummary);
router.post('/', authenticate, authorize(['product.create']), productVariantValidation, handleValidationErrors, createProductVariant);
router.put('/:id', authenticate, authorize(['product.update']), idValidation, handleValidationErrors, updateProductVariant);
router.delete('/:id', authenticate, authorize(['product.delete']), idValidation, handleValidationErrors, deleteProductVariant);

module.exports = router;