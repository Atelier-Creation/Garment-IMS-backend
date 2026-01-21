const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllBillings,
  getBillingById,
  createBilling,
  getBillingSummary
} = require('../controllers/billingController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules
const billingValidation = [
  body('customer_id').isUUID().withMessage('Valid customer ID is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.variant_id').isUUID().withMessage('Valid variant ID is required'),
  body('items.*.qty').isFloat({ min: 0.01 }).withMessage('Quantity must be greater than 0')
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid billing ID')
];

// Routes
router.get('/', authenticate, authorize(['billing:read']), getAllBillings);
router.get('/summary', authenticate, authorize(['billing:read']), getBillingSummary);
router.get('/:id', authenticate, authorize(['billing:read']), idValidation, handleValidationErrors, getBillingById);
router.post('/', authenticate, authorize(['billing:create']), billingValidation, handleValidationErrors, createBilling);

module.exports = router;
