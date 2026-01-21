const { ProductVariant, Product, FinishedGoodsStock, Branch } = require('../models');
const { Op } = require('sequelize');

const productVariantController = {
  // Get all product variants with pagination and filtering
  async getAllProductVariants(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        productId,
        size,
        color,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Add search filter
      if (search) {
        whereClause[Op.or] = [
          { sku: { [Op.like]: `%${search}%` } },
          { size: { [Op.like]: `%${search}%` } },
          { color: { [Op.like]: `%${search}%` } },
          { barcode: { [Op.like]: `%${search}%` } }
        ];
      }

      // Add filters
      if (productId) whereClause.product_id = productId;
      if (size) whereClause.size = size;
      if (color) whereClause.color = color;

      const { count, rows } = await ProductVariant.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Product,
            attributes: ['id', 'product_name', 'product_code']
          },
          {
            model: FinishedGoodsStock,
            include: [
              {
                model: Branch,
                attributes: ['id', 'name']
              }
            ],
            required: false
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
          productVariants: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get product variants error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product variants',
        error: error.message
      });
    }
  },

  // Get product variant by ID
  async getProductVariantById(req, res) {
    try {
      const { id } = req.params;

      const productVariant = await ProductVariant.findByPk(id, {
        include: [
          {
            model: Product,
            attributes: ['id', 'product_name', 'product_code', 'category_id']
          },
          {
            model: FinishedGoodsStock,
            include: [
              {
                model: Branch,
                attributes: ['id', 'name']
              }
            ]
          }
        ]
      });

      if (!productVariant) {
        return res.status(404).json({
          success: false,
          message: 'Product variant not found'
        });
      }

      // Calculate total stock across all branches
      const totalStock = productVariant.FinishedGoodsStocks?.reduce((sum, stock) => {
        return sum + (stock.qty || 0);
      }, 0) || 0;

      res.json({
        success: true,
        data: {
          ...productVariant.toJSON(),
          totalStock
        }
      });
    } catch (error) {
      console.error('Get product variant error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product variant',
        error: error.message
      });
    }
  },

  // Get variants by product ID
  async getVariantsByProduct(req, res) {
    try {
      const { productId } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows } = await ProductVariant.findAndCountAll({
        where: { product_id: productId },
        include: [
          {
            model: FinishedGoodsStock,
            include: [
              {
                model: Branch,
                attributes: ['id', 'name']
              }
            ],
            required: false
          }
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          productVariants: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get variants by product error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product variants',
        error: error.message
      });
    }
  },

  // Create new product variant
  async createProductVariant(req, res) {
    try {
      const {
        productId: pid,
        product_id,
        sku,
        size,
        color,
        barcode,
        mrp,
        costPrice,
        cost_price
      } = req.body;

      const productId = pid || product_id;
      const finalCostPrice = costPrice || cost_price;

      // Validate required fields
      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'Product ID is required'
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

      // Check if SKU already exists
      if (sku) {
        const existingVariant = await ProductVariant.findOne({ where: { sku } });
        if (existingVariant) {
          return res.status(400).json({
            success: false,
            message: 'SKU already exists'
          });
        }
      }

      // Create product variant
      const productVariant = await ProductVariant.create({
        product_id: productId,
        sku,
        size,
        color,
        barcode,
        mrp,
        cost_price: finalCostPrice
      });

      // Fetch created variant with associations
      const createdVariant = await ProductVariant.findByPk(productVariant.id, {
        include: [
          {
            model: Product,
            attributes: ['id', 'product_name', 'product_code']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Product variant created successfully',
        data: createdVariant
      });
    } catch (error) {
      console.error('Create product variant error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create product variant',
        error: error.message
      });
    }
  },

  // Update product variant
  async updateProductVariant(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const productVariant = await ProductVariant.findByPk(id);
      if (!productVariant) {
        return res.status(404).json({
          success: false,
          message: 'Product variant not found'
        });
      }

      // Check if SKU already exists (if being updated)
      if (updateData.sku && updateData.sku !== productVariant.sku) {
        const existingVariant = await ProductVariant.findOne({
          where: {
            sku: updateData.sku,
            id: { [Op.ne]: id }
          }
        });
        if (existingVariant) {
          return res.status(400).json({
            success: false,
            message: 'SKU already exists'
          });
        }
      }

      await productVariant.update(updateData);

      const updatedVariant = await ProductVariant.findByPk(id, {
        include: [
          {
            model: Product,
            attributes: ['id', 'product_name', 'product_code']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Product variant updated successfully',
        data: updatedVariant
      });
    } catch (error) {
      console.error('Update product variant error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update product variant',
        error: error.message
      });
    }
  },

  // Delete product variant
  async deleteProductVariant(req, res) {
    try {
      const { id } = req.params;

      const productVariant = await ProductVariant.findByPk(id);
      if (!productVariant) {
        return res.status(404).json({
          success: false,
          message: 'Product variant not found'
        });
      }

      // Check if variant has stock
      const stockCount = await FinishedGoodsStock.count({
        where: {
          variant_id: id,
          qty: { [Op.gt]: 0 }
        }
      });

      if (stockCount > 0) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete product variant with existing stock'
        });
      }

      await productVariant.destroy();

      res.json({
        success: true,
        message: 'Product variant deleted successfully'
      });
    } catch (error) {
      console.error('Delete product variant error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete product variant',
        error: error.message
      });
    }
  },

  // Get variant stock summary
  async getVariantStockSummary(req, res) {
    try {
      const { id } = req.params;

      const productVariant = await ProductVariant.findByPk(id, {
        include: [
          {
            model: Product,
            attributes: ['id', 'product_name', 'product_code']
          },
          {
            model: FinishedGoodsStock,
            include: [
              {
                model: Branch,
                attributes: ['id', 'name']
              }
            ]
          }
        ]
      });

      if (!productVariant) {
        return res.status(404).json({
          success: false,
          message: 'Product variant not found'
        });
      }

      const stockSummary = {
        variantId: id,
        variant: {
          sku: productVariant.sku,
          size: productVariant.size,
          color: productVariant.color,
          product: productVariant.Product
        },
        totalStock: 0,
        totalReserved: 0,
        availableStock: 0,
        branchStock: []
      };

      productVariant.FinishedGoodsStocks?.forEach(stock => {
        stockSummary.totalStock += stock.qty || 0;
        stockSummary.totalReserved += stock.reservedQty || 0;
        stockSummary.branchStock.push({
          branch: stock.Branch,
          quantity: stock.qty || 0,
          reserved: stock.reservedQty || 0,
          available: (stock.qty || 0) - (stock.reservedQty || 0)
        });
      });

      stockSummary.availableStock = stockSummary.totalStock - stockSummary.totalReserved;

      res.json({
        success: true,
        data: stockSummary
      });
    } catch (error) {
      console.error('Get variant stock summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch variant stock summary',
        error: error.message
      });
    }
  }
};

module.exports = productVariantController;