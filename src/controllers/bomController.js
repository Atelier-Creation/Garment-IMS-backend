const { BOM, BOMItem, Product, RawMaterial, User } = require('../models');
const { Op } = require('sequelize');

const bomController = {
  // Get all BOMs with pagination and filtering
  async getAllBOMs(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        productId,
        status,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Add search filter
      if (search) {
        whereClause[Op.or] = [
          { bomCode: { [Op.like]: `%${search}%` } },
          { version: { [Op.like]: `%${search}%` } },
          { '$Product.name$': { [Op.like]: `%${search}%` } },
          { '$Product.sku$': { [Op.like]: `%${search}%` } }
        ];
      }

      // Add filters
      if (productId) whereClause.productId = productId;
      if (status) whereClause.status = status;

      const { count, rows } = await BOM.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Product,
            attributes: ['id', 'product_name', 'product_code']
          },
          {
            model: BOMItem,
            include: [
              {
                model: RawMaterial,
                attributes: ['id', 'name', 'material_code', 'uom', 'average_cost']
              }
            ]
          }
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [[sortBy, sortOrder.toUpperCase()]],
        distinct: true
      });

      res.json({
        success: true,
        data: {
          boms: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get BOMs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch BOMs',
        error: error.message
      });
    }
  },

  // Get BOM by ID
  async getBOMById(req, res) {
    try {
      const { id } = req.params;

      const bom = await BOM.findByPk(id, {
        include: [
          {
            model: Product,
            attributes: ['id', 'product_name', 'product_code']
          },
          {
            model: BOMItem,
            include: [
              {
                model: RawMaterial,
                attributes: ['id', 'name', 'material_code', 'uom', 'average_cost']
              }
            ]
          }
        ]
      });

      if (!bom) {
        return res.status(404).json({
          success: false,
          message: 'BOM not found'
        });
      }

      // Calculate total cost
      const totalCost = bom.BOMItems.reduce((sum, item) => {
        return sum + (parseFloat(item.quantity) * parseFloat(item.RawMaterial.average_cost || 0));
      }, 0);

      res.json({
        success: true,
        data: {
          ...bom.toJSON(),
          totalCost
        }
      });
    } catch (error) {
      console.error('Get BOM error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch BOM',
        error: error.message
      });
    }
  },

  // Create new BOM
  async createBOM(req, res) {
    try {
      const {
        productId,
        version,
        description,
        status = 'draft',
        items = []
      } = req.body;

      // Validate required fields
      if (!productId || !version || !items.length) {
        return res.status(400).json({
          success: false,
          message: 'Product ID, version, and items are required'
        });
      }

      // Check if product exists
      const product = await Product.findByPk(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Validate raw materials
      const rawMaterialIds = items.map(item => item.rawMaterialId || item.raw_material_id);
      const rawMaterials = await RawMaterial.findAll({
        where: { id: { [Op.in]: rawMaterialIds } }
      });

      if (rawMaterials.length !== rawMaterialIds.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more raw materials not found'
        });
      }

      // Create BOM
      const bom = await BOM.create({
        product_id: productId,
        name: description,
        version
      });

      // Create BOM items
      const bomItems = items.map(item => ({
        bom_id: bom.id,
        raw_material_id: item.rawMaterialId || item.raw_material_id,
        qty_per_unit: item.quantity || item.qty_per_unit,
        wastage_percent: item.wastage_percent || 0
      }));

      await BOMItem.bulkCreate(bomItems);

      // Fetch created BOM with associations
      const createdBOM = await BOM.findByPk(bom.id, {
        include: [
          {
            model: Product,
            attributes: ['id', 'product_name', 'product_code']
          },
          {
            model: BOMItem,
            include: [
              {
                model: RawMaterial,
                attributes: ['id', 'name', 'material_code', 'uom', 'average_cost']
              }
            ]
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'BOM created successfully',
        data: createdBOM
      });
    } catch (error) {
      console.error('Create BOM error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create BOM',
        error: error.message
      });
    }
  },

  // Update BOM
  async updateBOM(req, res) {
    try {
      const { id } = req.params;
      const {
        version,
        description,
        status,
        items = []
      } = req.body;

      const bom = await BOM.findByPk(id);
      if (!bom) {
        return res.status(404).json({
          success: false,
          message: 'BOM not found'
        });
      }

      // Check if BOM is approved and prevent modification
      if (bom.status === 'approved' && status !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify approved BOM'
        });
      }

      // Update BOM
      await bom.update({
        version: version || bom.version,
        name: description || bom.name
      });

      // Update items if provided
      if (items && items.length > 0) {
        // Delete existing items
        await BOMItem.destroy({ where: { bom_id: id } });

        // Validate raw materials
        const rawMaterialIds = items.map(item => item.rawMaterialId || item.raw_material_id);
        const rawMaterials = await RawMaterial.findAll({
          where: { id: { [Op.in]: rawMaterialIds } }
        });

        if (rawMaterials.length !== rawMaterialIds.length) {
          return res.status(400).json({
            success: false,
            message: 'One or more raw materials not found'
          });
        }

        // Create new items
        const bomItems = items.map(item => ({
          bom_id: id,
          raw_material_id: item.rawMaterialId || item.raw_material_id,
          qty_per_unit: item.quantity || item.qty_per_unit,
          wastage_percent: item.wastage_percent || 0
        }));

        await BOMItem.bulkCreate(bomItems);
      }

      // Fetch updated BOM
      const updatedBOM = await BOM.findByPk(id, {
        include: [
          {
            model: Product,
            attributes: ['id', 'product_name', 'product_code']
          },
          {
            model: BOMItem,
            include: [
              {
                model: RawMaterial,
                attributes: ['id', 'name', 'material_code', 'uom', 'average_cost']
              }
            ]
          }
        ]
      });

      res.json({
        success: true,
        message: 'BOM updated successfully',
        data: updatedBOM
      });
    } catch (error) {
      console.error('Update BOM error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update BOM',
        error: error.message
      });
    }
  },

  // Delete BOM
  async deleteBOM(req, res) {
    try {
      const { id } = req.params;

      const bom = await BOM.findByPk(id);
      if (!bom) {
        return res.status(404).json({
          success: false,
          message: 'BOM not found'
        });
      }

      // Check if BOM is being used in production orders
      // This would require checking ProductionOrder model
      // For now, we'll allow deletion but in production you'd want to check dependencies

      // Delete BOM items first
      await BOMItem.destroy({ where: { bom_id: id } });

      // Delete BOM
      await bom.destroy();

      res.json({
        success: true,
        message: 'BOM deleted successfully'
      });
    } catch (error) {
      console.error('Delete BOM error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete BOM',
        error: error.message
      });
    }
  },

  // Approve BOM
  async approveBOM(req, res) {
    try {
      const { id } = req.params;

      const bom = await BOM.findByPk(id);
      if (!bom) {
        return res.status(404).json({
          success: false,
          message: 'BOM not found'
        });
      }

      if (bom.status === 'approved') {
        return res.status(400).json({
          success: false,
          message: 'BOM is already approved'
        });
      }

      await bom.update({
        status: 'approved',
        approvedBy: req.user.id,
        approvedAt: new Date()
      });

      res.json({
        success: true,
        message: 'BOM approved successfully',
        data: bom
      });
    } catch (error) {
      console.error('Approve BOM error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to approve BOM',
        error: error.message
      });
    }
  },

  // Get BOM cost analysis
  async getBOMCostAnalysis(req, res) {
    try {
      const { id } = req.params;

      const bom = await BOM.findByPk(id, {
        include: [
          {
            model: Product,
            attributes: ['id', 'name', 'sku', 'sellingPrice']
          },
          {
            model: BOMItem,
            include: [
              {
                model: RawMaterial,
                attributes: ['id', 'name', 'sku', 'unit', 'unitPrice']
              }
            ]
          }
        ]
      });

      if (!bom) {
        return res.status(404).json({
          success: false,
          message: 'BOM not found'
        });
      }

      // Calculate costs
      const itemCosts = bom.BOMItems.map(item => {
        const cost = item.quantity * item.RawMaterial.unitPrice;
        return {
          rawMaterialId: item.rawMaterialId,
          name: item.RawMaterial.name,
          sku: item.RawMaterial.sku,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.RawMaterial.unitPrice,
          totalCost: cost,
          costPercentage: 0 // Will be calculated after total
        };
      });

      const totalMaterialCost = itemCosts.reduce((sum, item) => sum + item.totalCost, 0);

      // Calculate percentages
      itemCosts.forEach(item => {
        item.costPercentage = totalMaterialCost > 0 ? (item.totalCost / totalMaterialCost) * 100 : 0;
      });

      const analysis = {
        bomId: bom.id,
        bomCode: bom.bomCode,
        product: bom.Product,
        totalMaterialCost,
        sellingPrice: bom.Product.sellingPrice || 0,
        grossMargin: bom.Product.sellingPrice ? bom.Product.sellingPrice - totalMaterialCost : 0,
        marginPercentage: bom.Product.sellingPrice ? ((bom.Product.sellingPrice - totalMaterialCost) / bom.Product.sellingPrice) * 100 : 0,
        itemCosts
      };

      res.json({
        success: true,
        data: analysis
      });
    } catch (error) {
      console.error('BOM cost analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get BOM cost analysis',
        error: error.message
      });
    }
  }
};

module.exports = bomController;