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
  // Allow sku or material_code
  body().custom((value, { req }) => {
    if (!req.body.sku && !req.body.material_code) {
      throw new Error('SKU/Material Code is required');
    }
    return true;
  }),
  body('categoryId').optional().isUUID().withMessage('Valid category ID is required'),
  // Allow unit or uom
  body().custom((value, { req }) => {
    if (!req.body.unit && !req.body.uom) {
      throw new Error('Unit (UOM) is required');
    }
    return true;
  }),
  // Allow unitPrice or average_cost
  body().custom((value, { req }) => {
    const price = req.body.unitPrice || req.body.average_cost;
    if (price === undefined || price === null || isNaN(price) || price < 0) {
      throw new Error('Price/Cost must be non-negative');
    }
    return true;
  }),
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