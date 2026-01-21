const express = require('express');
const { getRoles, getRoleById, createRole, updateRole, deleteRole } = require('../controllers/roleController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Get all roles with pagination
router.get('/', authenticate, authorize(['role.view']), getRoles);

// Get role by ID
router.get('/:id', authenticate, authorize(['role.view']), getRoleById);

// Create new role
router.post('/', authenticate, authorize(['role.create']), createRole);

// Update role
router.put('/:id', authenticate, authorize(['role.update']), updateRole);

// Delete role
router.delete('/:id', authenticate, authorize(['role.delete']), deleteRole);

module.exports = router;