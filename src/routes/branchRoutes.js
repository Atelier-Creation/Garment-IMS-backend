const express = require('express');
const { body, param } = require('express-validator');
const {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchStock,
  getBranchUsers
} = require('../controllers/branchController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules
const branchValidation = [
  body('name').trim().isLength({ min: 2 }).withMessage('Branch name must be at least 2 characters'),
  body('code').trim().isLength({ min: 2 }).withMessage('Branch code must be at least 2 characters'),
  body('address').optional().trim(),
  body('phone').optional().isMobilePhone(),
  body('email').optional().isEmail().normalizeEmail(),
  body('managerName').optional().trim()
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid branch ID')
];

// Routes
router.get('/', authenticate, getAllBranches);
router.get('/:id', authenticate, idValidation, handleValidationErrors, getBranchById);
router.get('/:id/stock', authenticate, idValidation, handleValidationErrors, getBranchStock);
router.get('/:id/users', authenticate, idValidation, handleValidationErrors, getBranchUsers);
router.post('/', authenticate, authorize(['branch.create']), branchValidation, handleValidationErrors, createBranch);
router.put('/:id', authenticate, authorize(['branch.update']), [...idValidation, ...branchValidation], handleValidationErrors, updateBranch);
router.delete('/:id', authenticate, authorize(['branch.delete']), idValidation, handleValidationErrors, deleteBranch);

module.exports = router;