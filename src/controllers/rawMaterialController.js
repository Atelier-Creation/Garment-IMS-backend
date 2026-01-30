const { RawMaterial, RawMaterialBatch, RawMaterialStockMovement, Supplier, Branch } = require('../models');
const { Op } = require('sequelize');

const getAllRawMaterials = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { material_code: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    if (status) {
      whereClause.is_active = status === 'active' ? 1 : 0;
    }

    const { count, rows } = await RawMaterial.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: RawMaterialBatch,
          required: false,
          include: [
            { model: Branch, attributes: ['id', 'name'] },
            { model: Supplier, attributes: ['id', 'name'] }
          ]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        rawMaterials: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all raw materials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch raw materials',
      error: error.message
    });
  }
};

const getRawMaterialById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const rawMaterial = await RawMaterial.findByPk(id, {
      include: [
        {
          model: RawMaterialBatch,
          required: false,
          include: [
            { model: Branch, attributes: ['id', 'name'] },
            { model: Supplier, attributes: ['id', 'name'] }
          ],
          order: [['created_at', 'DESC']]
        }
      ]
    });

    if (!rawMaterial) {
      return res.status(404).json({
        success: false,
        message: 'Raw material not found'
      });
    }

    res.json({
      success: true,
      data: rawMaterial
    });
  } catch (error) {
    console.error('Get raw material by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch raw material',
      error: error.message
    });
  }
};

const createRawMaterial = async (req, res) => {
  try {
    const {
      name,
      material_code,
      description,
      uom,
      unit_of_measure,
      unit_price,
      average_cost,
      notes
    } = req.body;

    // Validate required fields
    if (!name || !(uom || unit_of_measure)) {
      return res.status(400).json({
        success: false,
        message: 'Name and unit of measure are required'
      });
    }

    // Use uom or unit_of_measure (for compatibility)
    const finalUom = uom || unit_of_measure;

    // Generate material code if not provided
    const finalMaterialCode = material_code || `RM-${Date.now()}`;

    // Check if material code already exists
    const existingCode = await RawMaterial.findOne({ where: { material_code: finalMaterialCode } });
    if (existingCode) {
      return res.status(400).json({
        success: false,
        message: 'Material code already exists'
      });
    }

    const rawMaterial = await RawMaterial.create({
      name,
      material_code: finalMaterialCode,
      description: description || notes,
      uom: finalUom,
      average_cost: average_cost || unit_price || 0,
      is_active: 1
    });

    res.status(201).json({
      success: true,
      message: 'Raw material created successfully',
      data: rawMaterial
    });
  } catch (error) {
    console.error('Create raw material error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create raw material',
      error: error.message
    });
  }
};

const updateRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = {};

    // Map incoming fields to database fields
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.material_code) updateData.material_code = req.body.material_code;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.uom || req.body.unit_of_measure) updateData.uom = req.body.uom || req.body.unit_of_measure;
    if (req.body.average_cost !== undefined || req.body.unit_price !== undefined) {
      updateData.average_cost = req.body.average_cost || req.body.unit_price;
    }
    if (req.body.is_active !== undefined) updateData.is_active = req.body.is_active;

    const [updatedRows] = await RawMaterial.update(updateData, {
      where: { id }
    });

    if (updatedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Raw material not found'
      });
    }

    const rawMaterial = await RawMaterial.findByPk(id);

    res.json({
      success: true,
      message: 'Raw material updated successfully',
      data: rawMaterial
    });
  } catch (error) {
    console.error('Update raw material error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update raw material',
      error: error.message
    });
  }
};

const deleteRawMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if raw material has stock
    const stockCount = await RawMaterialBatch.count({
      where: { 
        raw_material_id: id,
        qty: { [Op.gt]: 0 }
      }
    });

    if (stockCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete raw material with existing stock'
      });
    }

    const deletedRows = await RawMaterial.destroy({
      where: { id }
    });

    if (deletedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Raw material not found'
      });
    }

    res.json({
      success: true,
      message: 'Raw material deleted successfully'
    });
  } catch (error) {
    console.error('Delete raw material error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete raw material',
      error: error.message
    });
  }
};

const getRawMaterialStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { branch_id } = req.query;

    let whereClause = { raw_material_id: id };
    if (branch_id) {
      whereClause.branch_id = branch_id;
    }

    const batches = await RawMaterialBatch.findAll({
      where: whereClause,
      include: [
        { model: Branch, attributes: ['id', 'name'] },
        { model: Supplier, attributes: ['id', 'name'] }
      ],
      order: [['received_at', 'DESC']]
    });

    const totalStock = batches.reduce((sum, batch) => sum + (batch.qty || 0), 0);

    res.json({
      success: true,
      data: {
        rawMaterialId: id,
        totalStock,
        batches
      }
    });
  } catch (error) {
    console.error('Get raw material stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch raw material stock',
      error: error.message
    });
  }
};

const getRawMaterialBatches = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, branch_id } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { raw_material_id: id };
    if (branch_id) {
      whereClause.branch_id = branch_id;
    }

    const { count, rows } = await RawMaterialBatch.findAndCountAll({
      where: whereClause,
      include: [
        { model: Branch, attributes: ['id', 'name'] },
        { model: Supplier, attributes: ['id', 'name'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['received_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        batches: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get raw material batches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch raw material batches',
      error: error.message
    });
  }
};

const adjustRawMaterialStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { batch_id, quantity, movement_type, reason, notes } = req.body;

    const batch = await RawMaterialBatch.findByPk(batch_id);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: 'Batch not found'
      });
    }

    if (batch.raw_material_id !== id) {
      return res.status(400).json({
        success: false,
        message: 'Batch does not belong to this raw material'
      });
    }

    // Calculate new quantity
    let newQuantity = batch.qty || 0;
    if (movement_type === 'in') {
      newQuantity += quantity;
    } else if (movement_type === 'out') {
      if (quantity > newQuantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock'
        });
      }
      newQuantity -= quantity;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid movement type'
      });
    }

    // Update batch quantity
    await batch.update({ qty: newQuantity });

    // Create stock movement record
    await RawMaterialStockMovement.create({
      raw_material_id: id,
      raw_material_batch_id: batch_id,
      branch_id: batch.branch_id,
      movement_type: movement_type === 'in' ? 'IN' : 'OUT',
      quantity,
      reason,
      notes,
      user_id: req.user.id
    });

    res.json({
      success: true,
      message: 'Stock adjusted successfully',
      data: {
        batchId: batch_id,
        oldQuantity: batch.qty,
        newQuantity: newQuantity,
        adjustment: movement_type === 'in' ? quantity : -quantity
      }
    });
  } catch (error) {
    console.error('Adjust raw material stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to adjust stock',
      error: error.message
    });
  }
};

module.exports = {
  getAllRawMaterials,
  getRawMaterialById,
  createRawMaterial,
  updateRawMaterial,
  deleteRawMaterial,
  getRawMaterialStock,
  getRawMaterialBatches,
  adjustRawMaterialStock,
  // Legacy exports for backward compatibility
  getRawMaterials: getAllRawMaterials
};