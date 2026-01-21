const { Role, Permission, User } = require('../models');
const { Op } = require('sequelize');
const { auditCreate, auditUpdate, auditDelete } = require('../middleware/auditMiddleware');

const getRoles = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = search ? {
      [Op.or]: [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ]
    } : {};

    const { count, rows } = await Role.findAndCountAll({
      where: whereClause,
      include: [{
        model: Permission,
        required: false,
        through: { attributes: [] } // Exclude junction table attributes
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
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
      message: 'Failed to fetch roles',
      error: error.message
    });
  }
};

const getRoleById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const role = await Role.findByPk(id, {
      include: [{
        model: Permission,
        required: false,
        through: { attributes: [] }
      }]
    });

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    res.json({
      success: true,
      data: role
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch role',
      error: error.message
    });
  }
};

const createRole = async (req, res) => {
  try {
    const { name, description, permissions = [] } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Role name is required'
      });
    }

    // Check if role already exists
    const existingRole = await Role.findOne({ where: { name } });
    if (existingRole) {
      return res.status(400).json({
        success: false,
        message: 'Role already exists with this name'
      });
    }

    const role = await Role.create({
      name,
      description
    });

    // Assign permissions if provided
    if (permissions.length > 0) {
      const permissionInstances = await Permission.findAll({
        where: { id: permissions }
      });
      await role.setPermissions(permissionInstances);
    }

    // Fetch the created role with permissions
    const createdRole = await Role.findByPk(role.id, {
      include: [{
        model: Permission,
        required: false,
        through: { attributes: [] }
      }]
    });

    // Log role creation
    await auditCreate(req, res, 'role', role.id, {
      name: role.name,
      description: role.description,
      permissions: permissions
    });

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: createdRole
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create role',
      error: error.message
    });
  }
};

const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, permissions = [] } = req.body;

    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if another role exists with the same name
    if (name && name !== role.name) {
      const existingRole = await Role.findOne({ 
        where: { 
          name,
          id: { [Op.ne]: id }
        } 
      });
      if (existingRole) {
        return res.status(400).json({
          success: false,
          message: 'Another role already exists with this name'
        });
      }
    }

    // Update role
    await role.update({
      name: name || role.name,
      description: description !== undefined ? description : role.description
    });

    // Update permissions
    const permissionInstances = await Permission.findAll({
      where: { id: permissions }
    });
    await role.setPermissions(permissionInstances);

    // Fetch updated role with permissions
    const updatedRole = await Role.findByPk(id, {
      include: [{
        model: Permission,
        required: false,
        through: { attributes: [] }
      }]
    });

    res.json({
      success: true,
      message: 'Role updated successfully',
      data: updatedRole
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update role',
      error: error.message
    });
  }
};

const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if role exists
    const role = await Role.findByPk(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found'
      });
    }

    // Check if role is assigned to any users
    const usersWithRole = await User.findAll({
      include: [{
        model: Role,
        where: { id }
      }]
    });

    if (usersWithRole.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete role. It is assigned to ${usersWithRole.length} user(s)`
      });
    }

    // Delete role (permissions will be automatically removed due to cascade)
    await role.destroy();

    res.json({
      success: true,
      message: 'Role deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete role',
      error: error.message
    });
  }
};

module.exports = {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole
};