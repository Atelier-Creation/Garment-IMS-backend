const express = require('express');
const { body, param } = require('express-validator');
const {
  getSubcategories,
  getSubcategoryById,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory
} = require('../controllers/subcategoryController');
const { authenticate } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules
const subcategoryValidation = [
  body('name').notEmpty().withMessage('Subcategory name is required'),
  body('category_id').isUUID().withMessage('Valid category ID is required')
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid subcategory ID')
];

// Routes
router.get('/', authenticate, getSubcategories);
router.get('/:id', authenticate, idValidation, handleValidationErrors, getSubcategoryById);
router.post('/', authenticate, subcategoryValidation, handleValidationErrors, createSubcategory);
router.put('/:id', authenticate, [...idValidation, ...subcategoryValidation], handleValidationErrors, updateSubcategory);
router.delete('/:id', authenticate, idValidation, handleValidationErrors, deleteSubcategory);

module.exports = router;
