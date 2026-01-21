const { Branch, User, FinishedGoodsStock, RawMaterialBatch } = require('../models');
const { Op } = require('sequelize');

const getAllBranches = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { code: { [Op.like]: `%${search}%` } },
        { city: { [Op.like]: `%${search}%` } }
      ];
    }
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Branch.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        branches: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch branches',
      error: error.message
    });
  }
};

const getBranchById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const branch = await Branch.findByPk(id, {
      include: [
        {
          model: FinishedGoodsStock,
          required: false,
          limit: 10
        },
        {
          model: RawMaterialBatch,
          required: false,
          limit: 10
        }
      ]
    });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    res.json({
      success: true,
      data: branch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch branch',
      error: error.message
    });
  }
};

const createBranch = async (req, res) => {
  try {
    const {
      name,
      code,
      address,
      city,
      state,
      country,
      postalCode,
      phone,
      email,
      managerId,
      managerName,
      isMainBranch,
      notes
    } = req.body;

    // If this is set as main branch, unset other main branches
    if (isMainBranch) {
      await Branch.update(
        { isMainBranch: false },
        { where: { isMainBranch: true } }
      );
    }

    const branch = await Branch.create({
      name,
      code,
      address,
      city,
      state,
      country,
      postalCode,
      phone,
      email,
      managerId,
      managerName,
      isMainBranch: isMainBranch || false,
      notes,
      status: 'active'
    });

    const branchWithManager = await Branch.findByPk(branch.id, {
      include: [{
        model: User,
        required: false,
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Branch created successfully',
      data: branchWithManager
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create branch',
      error: error.message
    });
  }
};

const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // If this is set as main branch, unset other main branches
    if (updateData.isMainBranch) {
      await Branch.update(
        { isMainBranch: false },
        { where: { isMainBranch: true, id: { [Op.ne]: id } } }
      );
    }

    const [updatedRows] = await Branch.update(updateData, {
      where: { id }
    });

    if (updatedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    const branch = await Branch.findByPk(id, {
      include: [{
        model: User,
        required: false,
        attributes: ['id', 'firstName', 'lastName', 'email']
      }]
    });

    res.json({
      success: true,
      message: 'Branch updated successfully',
      data: branch
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update branch',
      error: error.message
    });
  }
};

const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if branch is main branch
    const branch = await Branch.findByPk(id);
    if (branch && branch.isMainBranch) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete main branch'
      });
    }

    // Check if branch has stock
    const stockCount = await FinishedGoodsStock.count({
      where: { branchId: id }
    });

    const rawMaterialCount = await RawMaterialBatch.count({
      where: { branchId: id }
    });

    if (stockCount > 0 || rawMaterialCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete branch with existing stock'
      });
    }

    const deletedRows = await Branch.destroy({
      where: { id }
    });

    if (deletedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    res.json({
      success: true,
      message: 'Branch deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete branch',
      error: error.message
    });
  }
};

const getBranchStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const branch = await Branch.findByPk(id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    const { count, rows } = await FinishedGoodsStock.findAndCountAll({
      where: { branchId: id },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        stock: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch branch stock',
      error: error.message
    });
  }
};

const getBranchUsers = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const branch = await Branch.findByPk(id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    const { count, rows } = await User.findAndCountAll({
      where: { branchId: id },
      attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'status'],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        users: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch branch users',
      error: error.message
    });
  }
};

const getBranchStats = async (req, res) => {
  try {
    const { id } = req.params;

    const branch = await Branch.findByPk(id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Branch not found'
      });
    }

    // Get stock statistics
    const finishedGoodsCount = await FinishedGoodsStock.count({
      where: { branchId: id }
    });

    const rawMaterialCount = await RawMaterialBatch.count({
      where: { branchId: id }
    });

    const userCount = await User.count({
      where: { branchId: id }
    });

    res.json({
      success: true,
      data: {
        branchId: id,
        stats: {
          finishedGoodsItems: finishedGoodsCount,
          rawMaterialBatches: rawMaterialCount,
          users: userCount
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch branch statistics',
      error: error.message
    });
  }
};

module.exports = {
  getAllBranches,
  getBranchById,
  createBranch,
  updateBranch,
  deleteBranch,
  getBranchStock,
  getBranchUsers,
  getBranchStats,
  // Legacy exports for backward compatibility
  getBranches: getAllBranches
};