const express = require('express');
const { query } = require('express-validator');
const {
  getDashboardStats,
  getSalesReport,
  getPurchaseReport,
  getProductionReport,
  getStockReport,
  getFinancialReport,
  getCustomReport
} = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules for date ranges
const dateRangeValidation = [
  query('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  query('endDate').optional().isISO8601().withMessage('Valid end date is required')
];

// Routes
router.get('/dashboard', authenticate, getDashboardStats);
router.get('/sales', authenticate, authorize(['report.view']), dateRangeValidation, handleValidationErrors, getSalesReport);
router.get('/purchase', authenticate, authorize(['report.view']), dateRangeValidation, handleValidationErrors, getPurchaseReport);
router.get('/production', authenticate, authorize(['report.view']), dateRangeValidation, handleValidationErrors, getProductionReport);
router.get('/stock', authenticate, authorize(['report.view']), getStockReport);
router.get('/financial', authenticate, authorize(['report.view']), dateRangeValidation, handleValidationErrors, getFinancialReport);
router.post('/custom', authenticate, authorize(['report.view']), getCustomReport);

module.exports = router;