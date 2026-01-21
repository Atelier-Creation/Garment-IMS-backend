const { User, Role } = require('../models');
const { Op } = require('sequelize');
const { auditCreate, auditUpdate, auditDelete } = require('../middleware/auditMiddleware');

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = search ? {
      [Op.or]: [
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ]
    } : {};

    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      include: [{
        model: Role,
        required: false,
        through: { attributes: [] } // Exclude junction table attributes
      }],
      attributes: { exclude: ['password_hash'] }, // Don't return password
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        data: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findByPk(id, {
      include: [{
        model: Role,
        required: false,
        through: { attributes: [] }
      }],
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
};

const createUser = async (req, res) => {
  try {
    const { email, password, full_name, phone, roles = [] } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and full name are required'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    const user = await User.create({
      email,
      password_hash: password, // This will be hashed by the model
      full_name,
      phone
    });

    // Assign roles if provided
    if (roles.length > 0) {
      const roleInstances = await Role.findAll({
        where: { id: roles }
      });
      await user.setRoles(roleInstances);
    }

    // Return user without password
    const userWithoutPassword = await User.findByPk(user.id, {
      attributes: { exclude: ['password_hash'] },
      include: [{
        model: Role,
        required: false,
        through: { attributes: [] }
      }]
    });

    // Log user creation
    await auditCreate(req, res, 'user', user.id, {
      email: user.email,
      full_name: user.full_name,
      roles: roles
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create user',
      error: error.message
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, roles = [] } = req.body;

    const user = await User.findByPk(id, {
      include: [{
        model: Role,
        required: false,
        through: { attributes: [] }
      }]
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Store original data for audit
    const originalData = {
      full_name: user.full_name,
      phone: user.phone,
      roles: user.Roles ? user.Roles.map(role => ({ id: role.id, name: role.name })) : []
    };

    // Update user basic info
    await user.update({
      full_name: full_name || user.full_name,
      phone: phone !== undefined ? phone : user.phone
    });

    // Update roles
    const roleInstances = await Role.findAll({
      where: { id: roles }
    });
    await user.setRoles(roleInstances);

    // Fetch updated user with roles
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
      include: [{
        model: Role,
        required: false,
        through: { attributes: [] }
      }]
    });

    // Prepare new data for audit
    const newData = {
      full_name: updatedUser.full_name,
      phone: updatedUser.phone,
      roles: updatedUser.Roles ? updatedUser.Roles.map(role => ({ id: role.id, name: role.name })) : []
    };

    // Log user update
    await auditUpdate(req, res, 'user', id, originalData, newData);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: error.message
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow deleting the current user
    if (req.user.id === id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    // Get user data before deletion for audit
    const user = await User.findByPk(id, {
      attributes: { exclude: ['password_hash'] },
      include: [{
        model: Role,
        required: false,
        through: { attributes: [] }
      }]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const deletedUserData = {
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      roles: user.Roles ? user.Roles.map(role => ({ id: role.id, name: role.name })) : []
    };

    const deletedRows = await User.destroy({
      where: { id }
    });

    if (deletedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Log user deletion
    await auditDelete(req, res, 'user', id, deletedUserData);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// Get all users without pagination (for dropdowns)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'full_name', 'email'],
      order: [['full_name', 'ASC']]
    });

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Change user password
const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update password (will be hashed by the model)
    await user.update({
      password_hash: newPassword
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllUsers,
  changePassword
};