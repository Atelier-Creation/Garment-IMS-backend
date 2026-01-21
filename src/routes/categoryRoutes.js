const express = require('express');
const { body, param } = require('express-validator');
const {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getSubcategories,
  createSubcategory
} = require('../controllers/categoryController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules
const categoryValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Category name must be at least 2 characters')
];

const subcategoryValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Subcategory name must be at least 2 characters')
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid category ID')
];

const categoryIdValidation = [
  param('categoryId').isUUID().withMessage('Invalid category ID')
];

// Routes
router.get('/', authenticate, getCategories);
router.get('/:id', authenticate, idValidation, handleValidationErrors, getCategoryById);
router.post('/', authenticate, authorize(['category.create']), categoryValidation, handleValidationErrors, createCategory);
router.put('/:id', authenticate, authorize(['category.update']), [...idValidation, ...categoryValidation], handleValidationErrors, updateCategory);
router.delete('/:id', authenticate, authorize(['category.delete']), idValidation, handleValidationErrors, deleteCategory);

// Subcategory routes
router.get('/:categoryId/subcategories', authenticate, categoryIdValidation, handleValidationErrors, getSubcategories);
router.post('/:categoryId/subcategories', authenticate, authorize(['category.create']), [...categoryIdValidation, ...subcategoryValidation], handleValidationErrors, createSubcategory);

module.exports = router;