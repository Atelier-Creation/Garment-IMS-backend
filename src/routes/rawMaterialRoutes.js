const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllRawMaterials,
  getRawMaterialById,
  createRawMaterial,
  updateRawMaterial,
  deleteRawMaterial,
  getRawMaterialStock,
  getRawMaterialBatches
} = require('../controllers/rawMaterialController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules
const rawMaterialValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Raw material name must be at least 2 characters'),
  body('sku').trim().isLength({ min: 2 }).withMessage('SKU must be at least 2 characters'),
  body('categoryId').isUUID().withMessage('Valid category ID is required'),
  body('unit').trim().isLength({ min: 1 }).withMessage('Unit is required'),
  body('unitPrice').isFloat({ min: 0 }).withMessage('Unit price must be non-negative'),
  body('reorderLevel').optional().isFloat({ min: 0 }),
  body('maxStockLevel').optional().isFloat({ min: 0 })
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid raw material ID')
];

// Routes
router.get('/', authenticate, getAllRawMaterials);
router.get('/:id', authenticate, idValidation, handleValidationErrors, getRawMaterialById);
router.get('/:id/stock', authenticate, idValidation, handleValidationErrors, getRawMaterialStock);
router.get('/:id/batches', authenticate, idValidation, handleValidationErrors, getRawMaterialBatches);
router.post('/', authenticate, authorize(['raw_material.create']), rawMaterialValidation, handleValidationErrors, createRawMaterial);
router.put('/:id', authenticate, authorize(['raw_material.update']), [...idValidation, ...rawMaterialValidation], handleValidationErrors, updateRawMaterial);
router.delete('/:id', authenticate, authorize(['raw_material.delete']), idValidation, handleValidationErrors, deleteRawMaterial);

module.exports = router;