const express = require('express');
const { 
  getPermissions, 
  getPermissionById, 
  createPermission, 
  updatePermission, 
  deletePermission,
  getAllPermissions 
} = require('../controllers/permissionController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all permissions with pagination
router.get('/', authenticate, authorize(['permission.view']), getPermissions);

// Get all permissions without pagination (for dropdowns)
router.get('/all', authenticate, authorize(['permission.view']), getAllPermissions);

// Get permission by ID
router.get('/:id', authenticate, authorize(['permission.view']), getPermissionById);

// Create new permission
router.post('/', authenticate, authorize(['permission.create']), createPermission);

// Update permission
router.put('/:id', authenticate, authorize(['permission.update']), updatePermission);

// Delete permission
router.delete('/:id', authenticate, authorize(['permission.delete']), deletePermission);

module.exports = router;