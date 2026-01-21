const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllPosTransactions,
  getPosTransactionById,
  createPosTransaction,
  updatePosTransaction,
  deletePosTransaction,
  getPaymentSummary,
  getPaymentMethodStats
} = require('../controllers/posTransactionController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules
const posTransactionValidation = [
  body('salesOrderId').isUUID().withMessage('Valid sales order ID is required'),
  body('paidAmount').isFloat({ min: 0.01 }).withMessage('Paid amount must be greater than 0'),
  body('paymentMethod').isIn(['CASH', 'CARD', 'UPI', 'NETBANKING', 'CREDIT']).withMessage('Invalid payment method'),
  body('transactionReference').optional().trim()
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid POS transaction ID')
];

const salesOrderIdValidation = [
  param('salesOrderId').isUUID().withMessage('Invalid sales order ID')
];

// Routes
router.get('/', authenticate, getAllPosTransactions);
router.get('/stats/payment-methods', authenticate, authorize(['report.view']), getPaymentMethodStats);
router.get('/payment-summary/:salesOrderId', authenticate, salesOrderIdValidation, handleValidationErrors, getPaymentSummary);
router.get('/:id', authenticate, idValidation, handleValidationErrors, getPosTransactionById);
router.post('/', authenticate, authorize(['pos.create']), posTransactionValidation, handleValidationErrors, createPosTransaction);
router.put('/:id', authenticate, authorize(['pos.update']), idValidation, handleValidationErrors, updatePosTransaction);
router.delete('/:id', authenticate, authorize(['pos.delete']), idValidation, handleValidationErrors, deletePosTransaction);

module.exports = router;