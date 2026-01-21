const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerSalesOrders
} = require('../controllers/customerController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules
const customerValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Customer name must be at least 2 characters'),
  body('contactName').optional().trim().isLength({ min: 2 }),
  body('phone').optional().isMobilePhone(),
  body('email').optional().isEmail().normalizeEmail(),
  body('address').optional().trim(),
  body('paymentTerms').optional().trim()
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid customer ID')
];

// Routes
router.get('/', authenticate, getAllCustomers);
router.get('/:id', authenticate, idValidation, handleValidationErrors, getCustomerById);
router.get('/:id/sales-orders', authenticate, idValidation, handleValidationErrors, getCustomerSalesOrders);
router.post('/', authenticate, authorize(['customer.create']), customerValidation, handleValidationErrors, createCustomer);
router.put('/:id', authenticate, authorize(['customer.update']), [...idValidation, ...customerValidation], handleValidationErrors, updateCustomer);
router.delete('/:id', authenticate, authorize(['customer.delete']), idValidation, handleValidationErrors, deleteCustomer);

module.exports = router;