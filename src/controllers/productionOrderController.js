const { ProductionOrder, Product, ProductVariant, BOM, BOMItem, RawMaterial, RawMaterialBatch, RawMaterialStockMovement, ProductionConsumption, ProductionOutput, FinishedGoodsStock, FinishedGoodsStockMovement, Branch, User } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { fixCompletedProductionOrders } = require('../utils/fixCompletedProductionOrders');

const getProductionOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, product_id, branch_id } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { production_code: { [Op.like]: `%${search}%` } }
      ];
    }
    if (status) {
      whereClause.status = status;
    }
    if (product_id) {
      whereClause.product_id = product_id;
    }
    if (branch_id) {
      whereClause.branch_id = branch_id;
    }

    const { count, rows } = await ProductionOrder.findAndCountAll({
      where: whereClause,
      include: [
        { model: Product, attributes: ['id', 'product_name', 'product_code'], required: false },
        { model: ProductVariant, attributes: ['id', 'sku', 'size', 'color'], required: false },
        { model: BOM, attributes: ['id', 'name', 'version'], required: false },
        { model: Branch, attributes: ['id', 'name'], required: false }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        production_orders: rows,
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
      message: 'Failed to fetch production orders',
      error: error.message
    });
  }
};

const getProductionOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const productionOrder = await ProductionOrder.findByPk(id, {
      include: [
        { model: Product, attributes: ['id', 'product_name', 'product_code'] },
        { model: ProductVariant, required: false },
        { 
          model: BOM,
          include: [{
            model: BOMItem,
            include: [{ model: RawMaterial }]
          }],
          required: false
        },
        { model: Branch, attributes: ['id', 'name'], required: false },
        {
          model: ProductionConsumption,
          include: [
            { model: RawMaterial },
            { model: RawMaterialBatch }
          ],
          required: false
        },
        {
          model: ProductionOutput,
          include: [{ model: ProductVariant }],
          required: false
        }
      ]
    });

    if (!productionOrder) {
      return res.status(404).json({
        success: false,
        message: 'Production order not found'
      });
    }

    res.json({
      success: true,
      data: { production_order: productionOrder }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch production order',
      error: error.message
    });
  }
};

const createProductionOrder = async (req, res) => {
  try {
    const {
      product_id,
      variant_id,
      bom_id,
      branch_id,
      planned_qty,
      start_at,
      end_at,
      notes
    } = req.body;

    console.log('Creating production order with:', { product_id, bom_id, branch_id, planned_qty });

    // Validate BOM exists and belongs to product
    const bom = await BOM.findOne({
      where: { id: bom_id, product_id },
      include: [{
        model: BOMItem,
        include: [{ model: RawMaterial }]
      }]
    });

    console.log('BOM found:', bom ? 'Yes' : 'No');
    if (bom) {
      console.log('BOM details:', { id: bom.id, product_id: bom.product_id, name: bom.name });
    }

    if (!bom) {
      return res.status(400).json({
        success: false,
        message: 'BOM not found or does not belong to the specified product'
      });
    }

    // Generate production code
    const orderCount = await ProductionOrder.count();
    const production_code = `PRO${String(orderCount + 1).padStart(6, '0')}`;

    // Check raw material availability across all branches
    const materialRequirements = [];
    for (const bomItem of bom.BOMItems) {
      const requiredQuantity = bomItem.qty_per_unit * planned_qty;
      
      // Get available stock from ALL branches
      const availableStock = await RawMaterialBatch.sum('qty', {
        where: {
          raw_material_id: bomItem.raw_material_id,
          qty: { [Op.gt]: 0 }
        }
      }) || 0;

      materialRequirements.push({
        raw_material_id: bomItem.raw_material_id,
        raw_material_name: bomItem.RawMaterial.name,
        required_quantity: requiredQuantity,
        available_quantity: availableStock,
        shortage: Math.max(0, requiredQuantity - availableStock)
      });
    }

    // Create production order
    const productionOrder = await ProductionOrder.create({
      production_code,
      product_id,
      variant_id,
      bom_id,
      branch_id,
      planned_qty,
      produced_qty: 0,
      start_at,
      end_at,
      status: 'PLANNED',
      created_by: req.user.id
    });

    // Fetch complete production order with relations
    const completeProductionOrder = await ProductionOrder.findByPk(productionOrder.id, {
      include: [
        { model: Product, attributes: ['id', 'product_name', 'product_code'], required: false },
        { model: ProductVariant, required: false },
        { model: BOM, required: false },
        { model: Branch, attributes: ['id', 'name'], required: false }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Production order created successfully',
      data: { 
        production_order: completeProductionOrder,
        material_requirements: materialRequirements
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create production order',
      error: error.message
    });
  }
};

const startProductionOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const productionOrder = await ProductionOrder.findByPk(id, {
      include: [{
        model: BOM,
        include: [{
          model: BOMItem,
          include: [{ model: RawMaterial }]
        }]
      }]
    });

    if (!productionOrder) {
      return res.status(404).json({
        success: false,
        message: 'Production order not found'
      });
    }

    if (productionOrder.status !== 'PLANNED') {
      return res.status(400).json({
        success: false,
        message: 'Only planned production orders can be started'
      });
    }

    // Reserve raw materials
    for (const bomItem of productionOrder.BOM.BOMItems) {
      const requiredQuantity = bomItem.qty_per_unit * productionOrder.planned_qty;
      let remainingQuantity = requiredQuantity;

      console.log(`Checking stock for ${bomItem.RawMaterial.name}:`);
      console.log(`  Required: ${requiredQuantity}`);

      // Get available batches from ALL branches (FIFO - oldest first)
      const availableBatches = await RawMaterialBatch.findAll({
        where: {
          raw_material_id: bomItem.raw_material_id,
          qty: { [Op.gt]: 0 }
        },
        order: [['received_at', 'ASC']]
      });

      console.log(`  Found ${availableBatches.length} batches across all branches`);
      const totalAvailable = availableBatches.reduce((sum, b) => sum + parseFloat(b.qty), 0);
      console.log(`  Total available: ${totalAvailable}`);

      for (const batch of availableBatches) {
        if (remainingQuantity <= 0) break;

        const consumeQuantity = Math.min(remainingQuantity, batch.qty);
        
        console.log(`  Consuming ${consumeQuantity} from batch ${batch.batch_code} (Branch: ${batch.branch_id})`);
        
        // Create consumption record
        await ProductionConsumption.create({
          production_order_id: productionOrder.id,
          raw_material_id: bomItem.raw_material_id,
          batch_id: batch.id,
          qty: consumeQuantity,
          unit_cost: batch.cost_per_unit
        });

        remainingQuantity -= consumeQuantity;
      }

      console.log(`  Remaining shortage: ${remainingQuantity}`);

      if (remainingQuantity > 0) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${bomItem.RawMaterial.name}. Short by ${remainingQuantity} units.`
        });
      }
    }

    // Update production order status
    await productionOrder.update({
      status: 'IN_PROGRESS'
    });

    res.json({
      success: true,
      message: 'Production order started successfully',
      data: { production_order: productionOrder }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to start production order',
      error: error.message
    });
  }
};

const completeProductionOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { produced_qty, consumption_data } = req.body;

    const productionOrder = await ProductionOrder.findByPk(id, {
      include: [
        { model: Product },
        { model: ProductVariant },
        { model: ProductionConsumption }
      ]
    });

    if (!productionOrder) {
      return res.status(404).json({
        success: false,
        message: 'Production order not found'
      });
    }

    if (productionOrder.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: 'Only in-progress production orders can be completed'
      });
    }

    // Update consumption records - deduct from raw material batches
    for (const consumptionRecord of productionOrder.ProductionConsumptions) {
      const batch = await RawMaterialBatch.findByPk(consumptionRecord.batch_id);
      if (batch) {
        const newQuantity = batch.qty - consumptionRecord.qty;
        await batch.update({ qty: Math.max(0, newQuantity) });
        
        // Create raw material stock movement record for production consumption
        await RawMaterialStockMovement.create({
          raw_material_id: consumptionRecord.raw_material_id,
          raw_material_batch_id: consumptionRecord.batch_id,
          branch_id: productionOrder.branch_id,
          movement_type: 'OUT',
          qty: consumptionRecord.qty,
          reference_table: 'production_orders',
          reference_id: productionOrder.id,
          created_by: req.user?.id
        });
      }
    }

    // Handle finished goods stock update
    let stockUpdated = false;
    
    if (productionOrder.variant_id) {
      // Case 1: Production order has a specific variant
      console.log(`Updating stock for variant: ${productionOrder.variant_id}`);
      
      // Create production output
      await ProductionOutput.create({
        production_order_id: productionOrder.id,
        variant_id: productionOrder.variant_id,
        qty: produced_qty,
        unit_cost: 0 // Can be calculated later if needed
      });

      // Update finished goods stock
      const existingStock = await FinishedGoodsStock.findOne({
        where: {
          variant_id: productionOrder.variant_id,
          branch_id: productionOrder.branch_id
        }
      });

      if (existingStock) {
        await existingStock.update({
          qty: existingStock.qty + produced_qty
        });
      } else {
        await FinishedGoodsStock.create({
          variant_id: productionOrder.variant_id,
          branch_id: productionOrder.branch_id,
          qty: produced_qty,
          reserved_qty: 0
        });
      }
      
      stockUpdated = true;
    } else if (productionOrder.product_id) {
      // Case 2: No specific variant, but we have a product - find or create a default variant
      console.log(`No variant specified, looking for default variant for product: ${productionOrder.product_id}`);
      
      // Try to find an existing variant for this product
      let defaultVariant = await ProductVariant.findOne({
        where: { product_id: productionOrder.product_id },
        order: [['created_at', 'ASC']] // Get the first/oldest variant as default
      });
      
      if (!defaultVariant) {
        // Create a default variant if none exists
        console.log('Creating default variant for product');
        defaultVariant = await ProductVariant.create({
          product_id: productionOrder.product_id,
          sku: `${productionOrder.Product.product_code}-DEFAULT`,
          size: 'Standard',
          color: 'Default',
          price: productionOrder.Product.price || 0,
          cost: productionOrder.Product.cost || 0
        });
      }
      
      console.log(`Using variant: ${defaultVariant.id} for stock update`);
      
      // Create production output with the default variant
      await ProductionOutput.create({
        production_order_id: productionOrder.id,
        variant_id: defaultVariant.id,
        qty: produced_qty,
        unit_cost: 0
      });

      // Update finished goods stock
      const existingStock = await FinishedGoodsStock.findOne({
        where: {
          variant_id: defaultVariant.id,
          branch_id: productionOrder.branch_id
        }
      });

      if (existingStock) {
        await existingStock.update({
          qty: existingStock.qty + produced_qty
        });
      } else {
        await FinishedGoodsStock.create({
          variant_id: defaultVariant.id,
          branch_id: productionOrder.branch_id,
          qty: produced_qty,
          reserved_qty: 0
        });
      }
      
      // Update the production order with the variant_id for future reference
      await productionOrder.update({
        variant_id: defaultVariant.id
      });
      
      stockUpdated = true;
    }

    // Create stock movement record for tracking
    if (stockUpdated) {
      const variantId = productionOrder.variant_id || (await ProductVariant.findOne({
        where: { product_id: productionOrder.product_id },
        order: [['created_at', 'ASC']]
      }))?.id;
      
      if (variantId) {
        await FinishedGoodsStockMovement.create({
          variant_id: variantId,
          branch_id: productionOrder.branch_id,
          movement_type: 'PRODUCTION_OUTPUT',
          qty: produced_qty,
          reference_table: 'production_orders',
          reference_id: productionOrder.id,
          created_by: req.user?.id
        });
      }
    }

    // Update production order status
    await productionOrder.update({
      status: 'COMPLETED',
      produced_qty
    });

    const message = stockUpdated 
      ? 'Production order completed successfully and finished goods added to stock'
      : 'Production order completed (no product specified, finished goods not tracked)';

    res.json({
      success: true,
      message,
      data: { production_order: productionOrder }
    });
  } catch (error) {
    console.error('Production completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete production order',
      error: error.message
    });
  }
};

const cancelProductionOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const productionOrder = await ProductionOrder.findByPk(id);
    if (!productionOrder) {
      return res.status(404).json({
        success: false,
        message: 'Production order not found'
      });
    }

    if (productionOrder.status === 'COMPLETED' || productionOrder.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed or already cancelled production order'
      });
    }

    // If order was in progress, release reserved materials
    if (productionOrder.status === 'IN_PROGRESS') {
      await ProductionConsumption.destroy({
        where: { production_order_id: productionOrder.id }
      });
    }

    await productionOrder.update({
      status: 'CANCELLED'
    });

    res.json({
      success: true,
      message: 'Production order cancelled successfully',
      data: { production_order: productionOrder }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel production order',
      error: error.message
    });
  }
};

const fixHistoricalProductionOrders = async (req, res) => {
  try {
    const result = await fixCompletedProductionOrders();
    
    if (result.success) {
      res.json({
        success: true,
        message: `Successfully fixed ${result.fixedCount} production orders`,
        data: { fixedCount: result.fixedCount }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to fix production orders',
        error: result.error
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fix production orders',
      error: error.message
    });
  }
};

module.exports = {
  getAllProductionOrders: getProductionOrders,
  getProductionOrders,
  getProductionOrderById,
  createProductionOrder,
  updateProductionOrder: createProductionOrder, // Can reuse create for update logic
  deleteProductionOrder: cancelProductionOrder,
  startProductionOrder,
  completeProductionOrder,
  getProductionOrdersByProduct: getProductionOrders, // Can use same function with product filter
  cancelProductionOrder,
  fixHistoricalProductionOrders
};
