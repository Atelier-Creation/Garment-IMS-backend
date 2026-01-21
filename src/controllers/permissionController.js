const { Permission, Role } = require('../models');
const { Op } = require('sequelize');

const getPermissions = async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = search ? {
      [Op.or]: [
        { code: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ]
    } : {};

    const { count, rows } = await Permission.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['code', 'ASC']]
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
      message: 'Failed to fetch permissions',
      error: error.message
    });
  }
};

const getPermissionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const permission = await Permission.findByPk(id);

    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    res.json({
      success: true,
      data: permission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permission',
      error: error.message
    });
  }
};

const createPermission = async (req, res) => {
  try {
    const { code, description } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Permission code is required'
      });
    }

    // Check if permission already exists
    const existingPermission = await Permission.findOne({ where: { code } });
    if (existingPermission) {
      return res.status(400).json({
        success: false,
        message: 'Permission already exists with this code'
      });
    }

    const permission = await Permission.create({
      code,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Permission created successfully',
      data: permission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create permission',
      error: error.message
    });
  }
};

const updatePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, description } = req.body;

    const permission = await Permission.findByPk(id);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    // Check if another permission exists with the same code
    if (code && code !== permission.code) {
      const existingPermission = await Permission.findOne({ 
        where: { 
          code,
          id: { [Op.ne]: id }
        } 
      });
      if (existingPermission) {
        return res.status(400).json({
          success: false,
          message: 'Another permission already exists with this code'
        });
      }
    }

    // Update permission
    await permission.update({
      code: code || permission.code,
      description: description !== undefined ? description : permission.description
    });

    res.json({
      success: true,
      message: 'Permission updated successfully',
      data: permission
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update permission',
      error: error.message
    });
  }
};

const deletePermission = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if permission exists
    const permission = await Permission.findByPk(id);
    if (!permission) {
      return res.status(404).json({
        success: false,
        message: 'Permission not found'
      });
    }

    // Check if permission is assigned to any roles
    const rolesWithPermission = await Role.findAll({
      include: [{
        model: Permission,
        where: { id }
      }]
    });

    if (rolesWithPermission.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete permission. It is assigned to ${rolesWithPermission.length} role(s)`
      });
    }

    // Delete permission
    await permission.destroy();

    res.json({
      success: true,
      message: 'Permission deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete permission',
      error: error.message
    });
  }
};

// Get all permissions (without pagination) for dropdowns
const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.findAll({
      order: [['code', 'ASC']]
    });

    res.json({
      success: true,
      data: permissions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permissions',
      error: error.message
    });
  }
};

module.exports = {
  getPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  deletePermission,
  getAllPermissions
};