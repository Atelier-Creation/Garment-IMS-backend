const express = require('express');
const { body, param } = require('express-validator');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllUsers,
  changePassword
} = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const { handleValidationErrors } = require('../middleware/validationMiddleware');

const router = express.Router();

// Validation rules
const createUserValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('full_name').trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('phone').optional().isMobilePhone(),
  body('roles').optional().isArray().withMessage('Roles must be an array')
];

const updateUserValidation = [
  body('full_name').optional().trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
  body('phone').optional().isMobilePhone(),
  body('roles').optional().isArray().withMessage('Roles must be an array')
];

const changePasswordValidation = [
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
];

const idValidation = [
  param('id').isUUID().withMessage('Invalid user ID')
];

// Routes
router.get('/', authenticate, authorize(['user.read']), getUsers);

// Get all users without pagination (for dropdowns)
router.get('/all', authenticate, authorize(['user.read']), getAllUsers);

router.get('/:id', authenticate, authorize(['user.read']), idValidation, handleValidationErrors, getUserById);
router.post('/', authenticate, authorize(['user.create']), createUserValidation, handleValidationErrors, createUser);
router.put('/:id', authenticate, authorize(['user.update']), [...idValidation, ...updateUserValidation], handleValidationErrors, updateUser);

// Change user password
router.put('/:id/password', authenticate, authorize(['user.update']), [...idValidation, ...changePasswordValidation], handleValidationErrors, changePassword);

router.delete('/:id', authenticate, authorize(['user.delete']), idValidation, handleValidationErrors, deleteUser);

module.exports = router;