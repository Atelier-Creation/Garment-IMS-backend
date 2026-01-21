const { FinishedGoodsStock, FinishedGoodsStockMovement, RawMaterialBatch, RawMaterialStockMovement, ProductVariant, Product, RawMaterial, Branch, User, StockAdjustment, sequelize } = require('../models');
const { Op } = require('sequelize');

const getFinishedGoodsStock = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, branch_id, low_stock } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (branch_id) {
      whereClause.branch_id = branch_id;
    }
    if (low_stock === 'true') {
      whereClause.qty = { [Op.lte]: 10 }; // Configurable threshold
    }

    let includeClause = [
      {
        model: ProductVariant,
        include: [{ model: Product }]
      },
      { model: Branch, attributes: ['id', 'name'] }
    ];

    if (search) {
      includeClause[0].include[0].where = {
        [Op.or]: [
          { product_name: { [Op.like]: `%${search}%` } },
          { product_code: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const { count, rows } = await FinishedGoodsStock.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['updated_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        finished_goods_stock: rows,
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
      message: 'Failed to fetch finished goods stock',
      error: error.message
    });
  }
};

const getRawMaterialStock = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, branch_id, low_stock, expired } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (branch_id) {
      whereClause.branch_id = branch_id;
    }
    if (low_stock === 'true') {
      whereClause.qty = { [Op.lte]: 50 }; // Configurable threshold
    }
    // Note: expiry_date field doesn't exist in current schema
    // if (expired === 'true') {
    //   whereClause.expiry_date = { [Op.lt]: new Date() };
    // }

    let includeClause = [
      { model: RawMaterial },
      { model: Branch, attributes: ['id', 'name'] }
    ];

    if (search) {
      includeClause[0].where = {
        [Op.or]: [
          { name: { [Op.like]: `%${search}%` } },
          { material_code: { [Op.like]: `%${search}%` } }
        ]
      };
    }

    const { count, rows } = await RawMaterialBatch.findAndCountAll({
      where: whereClause,
      include: includeClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['received_at', 'DESC']] // Changed from expiry_date to received_at
    });

    res.json({
      success: true,
      data: {
        raw_material_stock: rows,
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
      message: 'Failed to fetch raw material stock',
      error: error.message
    });
  }
};

const getStockSummary = async (req, res) => {
  try {
    const { branch_id } = req.query;

    let finishedGoodsWhere = {};
    let rawMaterialWhere = {};
    
    if (branch_id) {
      finishedGoodsWhere.branch_id = branch_id;
      rawMaterialWhere.branch_id = branch_id;
    }

    // Finished goods summary
    const totalFinishedGoodsItems = await FinishedGoodsStock.count({
      where: finishedGoodsWhere
    });

    const lowStockFinishedGoods = await FinishedGoodsStock.count({
      where: {
        ...finishedGoodsWhere,
        qty: { [Op.lte]: 10 }
      }
    });

    const totalFinishedGoodsValue = await FinishedGoodsStock.sum('qty', {
      where: finishedGoodsWhere
    }) || 0;

    // Raw material summary
    const totalRawMaterialBatches = await RawMaterialBatch.count({
      where: rawMaterialWhere
    });

    const lowStockRawMaterials = await RawMaterialBatch.count({
      where: {
        ...rawMaterialWhere,
        qty: { [Op.lte]: 50 }
      }
    });

    // Note: expiry_date field doesn't exist in current schema
    const expiredRawMaterials = 0;
    // const expiredRawMaterials = await RawMaterialBatch.count({
    //   where: {
    //     ...rawMaterialWhere,
    //     expiry_date: { [Op.lt]: new Date() }
    //   }
    // });

    const totalRawMaterialValue = await RawMaterialBatch.findAll({
      where: rawMaterialWhere,
      attributes: [
        [sequelize.fn('SUM', sequelize.literal('qty * cost_per_unit')), 'total_value']
      ],
      raw: true
    });

    const rawMaterialValue = totalRawMaterialValue[0]?.total_value || 0;

    res.json({
      success: true,
      data: {
        finished_goods: {
          total_items: totalFinishedGoodsItems,
          low_stock_items: lowStockFinishedGoods,
          total_quantity: totalFinishedGoodsValue
        },
        raw_materials: {
          total_batches: totalRawMaterialBatches,
          low_stock_batches: lowStockRawMaterials,
          expired_batches: expiredRawMaterials,
          total_value: parseFloat(rawMaterialValue) || 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stock summary',
      error: error.message
    });
  }
};

const adjustFinishedGoodsStock = async (req, res) => {
  try {
    const { variant_id, raw_material_id, branch_id, adjustment_type, quantity, reason, notes } = req.body;

    // Handle finished goods adjustment
    if (variant_id) {
      const stock = await FinishedGoodsStock.findOne({
        where: { variant_id, branch_id }
      });

      if (!stock) {
        return res.status(404).json({
          success: false,
          message: 'Stock record not found'
        });
      }

      const oldQuantity = parseFloat(stock.qty);
      let newQuantity = oldQuantity;

      if (adjustment_type === 'increase') {
        newQuantity += parseFloat(quantity);
      } else if (adjustment_type === 'decrease') {
        if (parseFloat(quantity) > oldQuantity) {
          return res.status(400).json({
            success: false,
            message: 'Cannot decrease stock below zero'
          });
        }
        newQuantity -= parseFloat(quantity);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid adjustment type'
        });
      }

      // Update stock
      await stock.update({ qty: newQuantity });

      // Create stock movement record
      await FinishedGoodsStockMovement.create({
        variant_id,
        branch_id,
        movement_type: adjustment_type === 'increase' ? 'IN' : 'OUT',
        qty: parseFloat(quantity),
        reference_table: 'manual_adjustment',
        reference_id: null,
        created_by: req.user.id
      });

      // Create stock adjustment record if StockAdjustment model exists
      try {
        await StockAdjustment.create({
          adjustment_type: 'finished_goods',
          item_id: variant_id,
          branch_id,
          old_quantity: oldQuantity,
          new_quantity: newQuantity,
          adjustment_quantity: adjustment_type === 'increase' ? parseFloat(quantity) : -parseFloat(quantity),
          reason,
          notes,
          adjusted_by: req.user.id
        });
      } catch (err) {
        // StockAdjustment model might not exist, continue without it
        console.log('StockAdjustment model not available:', err.message);
      }

      return res.json({
        success: true,
        message: 'Stock adjusted successfully',
        data: {
          variant_id,
          branch_id,
          old_quantity: oldQuantity,
          new_quantity: newQuantity,
          adjustment: adjustment_type === 'increase' ? parseFloat(quantity) : -parseFloat(quantity)
        }
      });
    }

    // Handle raw material adjustment
    if (raw_material_id) {
      const batch = await RawMaterialBatch.findOne({
        where: { raw_material_id, branch_id },
        order: [['received_at', 'DESC']]
      });

      if (!batch) {
        return res.status(404).json({
          success: false,
          message: 'Raw material batch not found'
        });
      }

      const oldQuantity = parseFloat(batch.qty);
      let newQuantity = oldQuantity;

      if (adjustment_type === 'increase') {
        newQuantity += parseFloat(quantity);
      } else if (adjustment_type === 'decrease') {
        if (parseFloat(quantity) > oldQuantity) {
          return res.status(400).json({
            success: false,
            message: 'Cannot decrease stock below zero'
          });
        }
        newQuantity -= parseFloat(quantity);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid adjustment type'
        });
      }

      // Update batch quantity
      await batch.update({ qty: newQuantity });

      // Create stock movement record
      await RawMaterialStockMovement.create({
        raw_material_id,
        raw_material_batch_id: batch.id,
        branch_id,
        movement_type: adjustment_type === 'increase' ? 'IN' : 'OUT',
        qty: parseFloat(quantity),
        reference_table: 'manual_adjustment',
        reference_id: null,
        created_by: req.user.id
      });

      return res.json({
        success: true,
        message: 'Raw material stock adjusted successfully',
        data: {
          raw_material_id,
          batch_id: batch.id,
          branch_id,
          old_quantity: oldQuantity,
          new_quantity: newQuantity,
          adjustment: adjustment_type === 'increase' ? parseFloat(quantity) : -parseFloat(quantity)
        }
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Either variant_id or raw_material_id is required'
    });
  } catch (error) {
    console.error('Stock adjustment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to adjust stock',
      error: error.message
    });
  }
};

const transferStock = async (req, res) => {
  try {
    const { variant_id, from_branch_id, to_branch_id, quantity, notes } = req.body;

    if (from_branch_id === to_branch_id) {
      return res.status(400).json({
        success: false,
        message: 'Source and destination branches cannot be the same'
      });
    }

    // Check source stock
    const sourceStock = await FinishedGoodsStock.findOne({
      where: { variant_id, branch_id: from_branch_id }
    });

    if (!sourceStock || sourceStock.qty < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock at source branch'
      });
    }

    // Update source stock
    await sourceStock.update({
      qty: sourceStock.qty - quantity
    });

    // Update or create destination stock
    const destinationStock = await FinishedGoodsStock.findOne({
      where: { variant_id, branch_id: to_branch_id }
    });

    if (destinationStock) {
      await destinationStock.update({
        qty: destinationStock.qty + quantity
      });
    } else {
      await FinishedGoodsStock.create({
        variant_id,
        branch_id: to_branch_id,
        qty: quantity,
        reserved_qty: 0
      });
    }

    // Create stock movement records
    await FinishedGoodsStockMovement.create({
      variant_id,
      branch_id: from_branch_id,
      movement_type: 'TRANSFER_OUT',
      qty: quantity,
      reference_table: 'stock_transfer',
      reference_id: null,
      created_by: req.user.id
    });

    await FinishedGoodsStockMovement.create({
      variant_id,
      branch_id: to_branch_id,
      movement_type: 'TRANSFER_IN',
      qty: quantity,
      reference_table: 'stock_transfer',
      reference_id: null,
      created_by: req.user.id
    });

    res.json({
      success: true,
      message: 'Stock transferred successfully',
      data: {
        variant_id,
        from_branch_id,
        to_branch_id,
        quantity,
        transfer_date: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to transfer stock',
      error: error.message
    });
  }
};

const getStockMovements = async (req, res) => {
  try {
    const { page = 1, limit = 10, variant_id, branch_id, movement_type, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (variant_id) {
      whereClause.variant_id = variant_id;
    }
    if (branch_id) {
      whereClause.branch_id = branch_id;
    }
    if (movement_type) {
      whereClause.movement_type = movement_type;
    }
    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const { count, rows } = await FinishedGoodsStockMovement.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: ProductVariant,
          include: [{ model: Product }]
        },
        { model: Branch, attributes: ['id', 'name'] },
        { model: User, attributes: ['id', 'full_name'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        stock_movements: rows,
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
      message: 'Failed to fetch stock movements',
      error: error.message
    });
  }
};

const getStockAdjustments = async (req, res) => {
  try {
    const { page = 1, limit = 10, branch_id, adjustment_type, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (branch_id) {
      whereClause.branch_id = branch_id;
    }
    if (adjustment_type) {
      whereClause.adjustment_type = adjustment_type;
    }
    if (start_date && end_date) {
      whereClause.created_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    const { count, rows } = await StockAdjustment.findAndCountAll({
      where: whereClause,
      include: [
        { model: Branch, attributes: ['id', 'name'] },
        { model: User, attributes: ['id', 'full_name'] }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        stock_adjustments: rows,
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
      message: 'Failed to fetch stock adjustments',
      error: error.message
    });
  }
};

module.exports = {
  getAllStock: getStockSummary,
  getStockById: getFinishedGoodsStock,
  getStockByProduct: getFinishedGoodsStock,
  getStockByRawMaterial: getRawMaterialStock,
  getStockMovements,
  createStockMovement: adjustFinishedGoodsStock,
  adjustStock: adjustFinishedGoodsStock,
  transferStock,
  getLowStockItems: getStockSummary,
  getFinishedGoodsStock,
  getRawMaterialStock,
  getStockSummary,
  adjustFinishedGoodsStock,
  getStockAdjustments
};