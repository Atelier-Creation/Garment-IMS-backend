const express = require('express');
const { body, param } = require('express-validator');
const {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier
} = require('../controllers/supplierController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules
const supplierValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Supplier name must be at least 2 characters'),
  body('contact_name').optional().trim().isLength({ min: 2 }),
  body('phone').optional().isMobilePhone(),
  body('email').optional().isEmail().normalizeEmail(),
  body('address').optional().trim(),
  body('payment_terms').optional().trim()
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid supplier ID')
];

// Routes
router.get('/', authenticate, getSuppliers);
router.get('/:id', authenticate, idValidation, handleValidationErrors, getSupplierById);
router.post('/', authenticate, authorize(['supplier.create']), supplierValidation, handleValidationErrors, createSupplier);
router.put('/:id', authenticate, authorize(['supplier.update']), [...idValidation, ...supplierValidation], handleValidationErrors, updateSupplier);
router.delete('/:id', authenticate, authorize(['supplier.delete']), idValidation, handleValidationErrors, deleteSupplier);

module.exports = router;