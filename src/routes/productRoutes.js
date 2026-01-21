const express = require('express');
const { body, param } = require('express-validator');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules
const productValidation = [
  body('product_code').trim().isLength({ min: 1 }).withMessage('Product code is required'),
  body('name').trim().isLength({ min: 2 }).withMessage('Product name must be at least 2 characters'),
  body('category_id').isUUID().withMessage('Valid category ID is required'),
  body('price').isNumeric().withMessage('Price must be a number')
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid product ID')
];

// Routes
router.get('/', authenticate, getProducts);
router.get('/:id', authenticate, idValidation, handleValidationErrors, getProductById);
router.post('/', authenticate, authorize(['product.create']), productValidation, handleValidationErrors, createProduct);
router.put('/:id', authenticate, authorize(['product.update']), [...idValidation, ...productValidation], handleValidationErrors, updateProduct);
router.delete('/:id', authenticate, authorize(['product.delete']), idValidation, handleValidationErrors, deleteProduct);

module.exports = router;