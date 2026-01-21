const { StockAdjustment, User, Product, RawMaterial, Branch, FinishedGoodsStock, RawMaterialBatch } = require('../models');
const { Op } = require('sequelize');

const stockAdjustmentController = {
  // Get all stock adjustments with pagination and filtering
  async getAllStockAdjustments(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        itemType,
        branchId,
        adjustedBy,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Add search filter
      if (search) {
        whereClause[Op.or] = [
          { reason: { [Op.like]: `%${search}%` } },
          { referenceTable: { [Op.like]: `%${search}%` } }
        ];
      }

      // Add filters
      if (itemType) whereClause.itemType = itemType;
      if (branchId) whereClause.branchId = branchId;
      if (adjustedBy) whereClause.adjustedBy = adjustedBy;

      // Add date range filter
      if (startDate && endDate) {
        whereClause.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      } else if (startDate) {
        whereClause.createdAt = {
          [Op.gte]: new Date(startDate)
        };
      } else if (endDate) {
        whereClause.createdAt = {
          [Op.lte]: new Date(endDate)
        };
      }

      const { count, rows } = await StockAdjustment.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: User,
            as: 'AdjustedBy',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Branch,
            attributes: ['id', 'name']
          }
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [[sortBy, sortOrder.toUpperCase()]],
        distinct: true
      });

      // Add item details for each adjustment
      const adjustmentsWithItems = await Promise.all(rows.map(async (adjustment) => {
        const adjustmentData = adjustment.toJSON();
        
        if (adjustment.itemType === 'FINISHED' && adjustment.itemId) {
          const product = await Product.findByPk(adjustment.itemId, {
            attributes: ['id', 'name', 'sku']
          });
          adjustmentData.item = product;
        } else if (adjustment.itemType === 'RAW' && adjustment.itemId) {
          const rawMaterial = await RawMaterial.findByPk(adjustment.itemId, {
            attributes: ['id', 'name', 'sku']
          });
          adjustmentData.item = rawMaterial;
        }

        return adjustmentData;
      }));

      res.json({
        success: true,
        data: {
          stockAdjustments: adjustmentsWithItems,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get stock adjustments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stock adjustments',
        error: error.message
      });
    }
  },

  // Get stock adjustment by ID
  async getStockAdjustmentById(req, res) {
    try {
      const { id } = req.params;

      const stockAdjustment = await StockAdjustment.findByPk(id, {
        include: [
          {
            model: User,
            as: 'AdjustedBy',
            attributes: ['id', 'firstName', 'lastName', 'email']
          },
          {
            model: Branch,
            attributes: ['id', 'name']
          }
        ]
      });

      if (!stockAdjustment) {
        return res.status(404).json({
          success: false,
          message: 'Stock adjustment not found'
        });
      }

      // Add item details
      const adjustmentData = stockAdjustment.toJSON();
      
      if (stockAdjustment.itemType === 'FINISHED' && stockAdjustment.itemId) {
        const product = await Product.findByPk(stockAdjustment.itemId, {
          attributes: ['id', 'name', 'sku', 'description']
        });
        adjustmentData.item = product;
      } else if (stockAdjustment.itemType === 'RAW' && stockAdjustment.itemId) {
        const rawMaterial = await RawMaterial.findByPk(stockAdjustment.itemId, {
          attributes: ['id', 'name', 'sku', 'description']
        });
        adjustmentData.item = rawMaterial;
      }

      res.json({
        success: true,
        data: adjustmentData
      });
    } catch (error) {
      console.error('Get stock adjustment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stock adjustment',
        error: error.message
      });
    }
  },

  // Create new stock adjustment
  async createStockAdjustment(req, res) {
    try {
      const {
        itemType,
        itemId,
        branchId,
        qty,
        reason,
        referenceTable,
        referenceId
      } = req.body;

      // Validate required fields
      if (!itemType || !itemId || !branchId || !qty || !reason) {
        return res.status(400).json({
          success: false,
          message: 'Item type, item ID, branch ID, quantity, and reason are required'
        });
      }

      // Validate item type
      if (!['RAW', 'FINISHED'].includes(itemType)) {
        return res.status(400).json({
          success: false,
          message: 'Item type must be RAW or FINISHED'
        });
      }

      // Validate quantity
      if (parseFloat(qty) === 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity cannot be zero'
        });
      }

      // Check if item exists
      let item;
      if (itemType === 'FINISHED') {
        item = await Product.findByPk(itemId);
        if (!item) {
          return res.status(404).json({
            success: false,
            message: 'Product not found'
          });
        }
      } else if (itemType === 'RAW') {
        item = await RawMaterial.findByPk(itemId);
        if (!item) {
          return res.status(404).json({
            success: false,
            message: 'Raw material not found'
          });
        }
      }

      // Check if branch exists
      const branch = await Branch.findByPk(branchId);
      if (!branch) {
        return res.status(404).json({
          success: false,
          message: 'Branch not found'
        });
      }

      // Create stock adjustment
      const stockAdjustment = await StockAdjustment.create({
        referenceTable,
        referenceId,
        itemType,
        itemId,
        branchId,
        qty: parseFloat(qty),
        reason,
        adjustedBy: req.user.id
      });

      // Apply the adjustment to actual stock
      if (itemType === 'FINISHED') {
        // Find or create finished goods stock record
        const [finishedStock, created] = await FinishedGoodsStock.findOrCreate({
          where: { variantId: itemId, branchId },
          defaults: { qty: 0, reservedQty: 0 }
        });

        const newQty = Math.max(0, finishedStock.qty + parseFloat(qty));
        await finishedStock.update({ qty: newQty });
      } else if (itemType === 'RAW') {
        // For raw materials, we need to handle batch-based stock
        // This is a simplified approach - in practice, you might need to specify which batch
        const batches = await RawMaterialBatch.findAll({
          where: { rawMaterialId: itemId, branchId },
          order: [['expiryDate', 'ASC']]
        });

        if (parseFloat(qty) > 0) {
          // Positive adjustment - add to the most recent batch or create new one
          const latestBatch = batches[batches.length - 1];
          if (latestBatch) {
            await latestBatch.update({
              currentQuantity: latestBatch.currentQuantity + parseFloat(qty)
            });
          }
        } else {
          // Negative adjustment - remove from batches (FIFO)
          let remainingQty = Math.abs(parseFloat(qty));
          for (const batch of batches) {
            if (remainingQty <= 0) break;
            
            const deductQty = Math.min(batch.currentQuantity, remainingQty);
            await batch.update({
              currentQuantity: batch.currentQuantity - deductQty
            });
            remainingQty -= deductQty;
          }
        }
      }

      // Fetch created adjustment with associations
      const createdAdjustment = await StockAdjustment.findByPk(stockAdjustment.id, {
        include: [
          {
            model: User,
            as: 'AdjustedBy',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: Branch,
            attributes: ['id', 'name']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Stock adjustment created successfully',
        data: createdAdjustment
      });
    } catch (error) {
      console.error('Create stock adjustment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create stock adjustment',
        error: error.message
      });
    }
  },

  // Update stock adjustment
  async updateStockAdjustment(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const stockAdjustment = await StockAdjustment.findByPk(id);
      if (!stockAdjustment) {
        return res.status(404).json({
          success: false,
          message: 'Stock adjustment not found'
        });
      }

      // Only allow updating the reason (other fields should not be changed after creation)
      await stockAdjustment.update({ reason });

      const updatedAdjustment = await StockAdjustment.findByPk(id, {
        include: [
          {
            model: User,
            as: 'AdjustedBy',
            attributes: ['id', 'firstName', 'lastName']
          },
          {
            model: Branch,
            attributes: ['id', 'name']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Stock adjustment updated successfully',
        data: updatedAdjustment
      });
    } catch (error) {
      console.error('Update stock adjustment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update stock adjustment',
        error: error.message
      });
    }
  },

  // Delete stock adjustment (reverse the adjustment)
  async deleteStockAdjustment(req, res) {
    try {
      const { id } = req.params;

      const stockAdjustment = await StockAdjustment.findByPk(id);
      if (!stockAdjustment) {
        return res.status(404).json({
          success: false,
          message: 'Stock adjustment not found'
        });
      }

      // Reverse the stock adjustment
      const reverseQty = -parseFloat(stockAdjustment.qty);

      if (stockAdjustment.itemType === 'FINISHED') {
        const finishedStock = await FinishedGoodsStock.findOne({
          where: { variantId: stockAdjustment.itemId, branchId: stockAdjustment.branchId }
        });

        if (finishedStock) {
          const newQty = Math.max(0, finishedStock.qty + reverseQty);
          await finishedStock.update({ qty: newQty });
        }
      } else if (stockAdjustment.itemType === 'RAW') {
        // Handle raw material batch reversal
        const batches = await RawMaterialBatch.findAll({
          where: { 
            rawMaterialId: stockAdjustment.itemId, 
            branchId: stockAdjustment.branchId 
          },
          order: [['expiryDate', 'ASC']]
        });

        if (reverseQty > 0) {
          // Add back to the most recent batch
          const latestBatch = batches[batches.length - 1];
          if (latestBatch) {
            await latestBatch.update({
              currentQuantity: latestBatch.currentQuantity + reverseQty
            });
          }
        } else {
          // Remove from batches (FIFO)
          let remainingQty = Math.abs(reverseQty);
          for (const batch of batches) {
            if (remainingQty <= 0) break;
            
            const deductQty = Math.min(batch.currentQuantity, remainingQty);
            await batch.update({
              currentQuantity: batch.currentQuantity - deductQty
            });
            remainingQty -= deductQty;
          }
        }
      }

      await stockAdjustment.destroy();

      res.json({
        success: true,
        message: 'Stock adjustment deleted and reversed successfully'
      });
    } catch (error) {
      console.error('Delete stock adjustment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete stock adjustment',
        error: error.message
      });
    }
  },

  // Get stock adjustment summary
  async getStockAdjustmentSummary(req, res) {
    try {
      const { startDate, endDate, branchId, itemType } = req.query;
      const whereClause = {};

      // Add filters
      if (branchId) whereClause.branchId = branchId;
      if (itemType) whereClause.itemType = itemType;

      // Add date range filter
      if (startDate && endDate) {
        whereClause.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const adjustments = await StockAdjustment.findAll({
        where: whereClause,
        attributes: [
          'itemType',
          [sequelize.fn('COUNT', sequelize.col('id')), 'adjustmentCount'],
          [sequelize.fn('SUM', sequelize.col('qty')), 'totalQtyAdjusted']
        ],
        group: ['itemType'],
        raw: true
      });

      const totalAdjustments = await StockAdjustment.count({ where: whereClause });

      const summary = {
        totalAdjustments,
        adjustmentsByType: adjustments.map(adj => ({
          itemType: adj.itemType,
          count: parseInt(adj.adjustmentCount),
          totalQtyAdjusted: parseFloat(adj.totalQtyAdjusted || 0).toFixed(4)
        }))
      };

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Get stock adjustment summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch stock adjustment summary',
        error: error.message
      });
    }
  }
};

module.exports = stockAdjustmentController;