const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllBOMs,
  getBOMById,
  createBOM,
  updateBOM,
  deleteBOM,
  approveBOM,
  getBOMCostAnalysis
} = require('../controllers/bomController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules
const bomValidation = [
  body('productId').isUUID().withMessage('Valid product ID is required'),
  body('version').trim().isLength({ min: 1 }).withMessage('Version is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one BOM item is required'),
  body('items.*.rawMaterialId').isUUID().withMessage('Valid raw material ID is required'),
  body('items.*.quantity').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0'),
  body('items.*.unit').trim().isLength({ min: 1 }).withMessage('Unit is required')
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid BOM ID')
];

// Routes
router.get('/', authenticate, getAllBOMs);
router.get('/:id', authenticate, idValidation, handleValidationErrors, getBOMById);
router.get('/:id/cost-analysis', authenticate, idValidation, handleValidationErrors, getBOMCostAnalysis);
router.post('/', authenticate, authorize(['bom.create']), bomValidation, handleValidationErrors, createBOM);
router.put('/:id', authenticate, authorize(['bom.update']), idValidation, handleValidationErrors, updateBOM);
router.put('/:id/approve', authenticate, authorize(['bom.approve']), idValidation, handleValidationErrors, approveBOM);
router.delete('/:id', authenticate, authorize(['bom.delete']), idValidation, handleValidationErrors, deleteBOM);

module.exports = router;