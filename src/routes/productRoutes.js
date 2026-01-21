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
  body('name').trim().isLength({ min: 2 }).withMessage('Product name is required'),
  // Allow sku or product_code
  body().custom((value, { req }) => {
    if (!req.body.sku && !req.body.product_code) {
      throw new Error('Product SKU/Code is required');
    }
    return true;
  }),
  // Allow categoryId or category_id
  body().custom((value, { req }) => {
    const catId = req.body.categoryId || req.body.category_id;
    if (!catId) {
      throw new Error('Category is required');
    }
    // Simple regex check for UUID if you want, or just presence
    return true;
  }),
  // Check price (sellingPrice or price)
  body().custom((value, { req }) => {
    const price = req.body.sellingPrice || req.body.price || req.body.base_price;
    if (price === undefined || price === null || isNaN(price)) {
      throw new Error('Price must be a number');
    }
    return true;
  })
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