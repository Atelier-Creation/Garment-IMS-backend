const { 
  PurchaseOrder, 
  PurchaseOrderItem, 
  RawMaterial, 
  RawMaterialBatch, 
  RawMaterialStockMovement,
  Supplier, 
  Branch, 
  User,
  sequelize 
} = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const { auditCreate, auditUpdate } = require('../middleware/auditMiddleware');

const purchaseOrderInwardController = {
  // Get all purchase orders ready for inward
  getInwardReadyOrders: async (req, res) => {
    try {
      const { page = 1, limit = 10, search, supplier_id, branch_id } = req.query;
      const offset = (page - 1) * limit;

      let whereClause = {
        status: { [Op.in]: ['PLACED', 'PARTIAL'] }
      };

      if (search) {
        whereClause[Op.or] = [
          { po_number: { [Op.like]: `%${search}%` } },
          { reference_number: { [Op.like]: `%${search}%` } }
        ];
      }
      if (supplier_id) whereClause.supplier_id = supplier_id;
      if (branch_id) whereClause.branch_id = branch_id;

      const { count, rows } = await PurchaseOrder.findAndCountAll({
        where: whereClause,
        include: [
          { 
            model: Supplier, 
            attributes: ['id', 'name', 'contact_name', 'phone', 'email'] 
          },
          { 
            model: Branch, 
            attributes: ['id', 'name', 'address'] 
          },
          { 
            model: User, 
            attributes: ['id', 'full_name', 'email'] 
          },
          {
            model: PurchaseOrderItem,
            include: [{ 
              model: RawMaterial, 
              attributes: ['id', 'name', 'material_code', 'uom', 'description'] 
            }]
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['expected_date', 'ASC'], ['created_at', 'DESC']]
      });

      // Calculate pending quantities for each order
      const ordersWithPending = rows.map(order => {
        const orderData = order.toJSON();
        orderData.PurchaseOrderItems = orderData.PurchaseOrderItems.map(item => {
          const pendingQuantity = item.qty - (item.received_quantity || 0);
          return {
            ...item,
            pending_quantity: pendingQuantity,
            is_fully_received: pendingQuantity <= 0
          };
        });
        
        const totalPending = orderData.PurchaseOrderItems.reduce(
          (sum, item) => sum + item.pending_quantity, 0
        );
        orderData.total_pending_items = totalPending;
        orderData.is_fully_received = totalPending <= 0;
        
        return orderData;
      });

      res.json({
        success: true,
        data: {
          purchase_orders: ordersWithPending,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Get inward ready orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch purchase orders for inward',
        error: error.message
      });
    }
  },

  // Get specific purchase order for inward with detailed information
  getOrderForInward: async (req, res) => {
    try {
      const { id } = req.params;
      
      const purchaseOrder = await PurchaseOrder.findByPk(id, {
        include: [
          { 
            model: Supplier, 
            attributes: ['id', 'name', 'contact_name', 'phone', 'email', 'address'] 
          },
          { 
            model: Branch, 
            attributes: ['id', 'name', 'address'] 
          },
          { 
            model: User, 
            attributes: ['id', 'full_name', 'email'] 
          },
          {
            model: PurchaseOrderItem,
            include: [{ 
              model: RawMaterial, 
              attributes: ['id', 'name', 'material_code', 'uom', 'description'] 
            }]
          }
        ]
      });

      if (!purchaseOrder) {
        return res.status(404).json({
          success: false,
          message: 'Purchase order not found'
        });
      }

      if (!['PLACED', 'PARTIAL'].includes(purchaseOrder.status)) {
        return res.status(400).json({
          success: false,
          message: 'Purchase order is not ready for inward. Status must be placed or partial.'
        });
      }

      // Get existing batches for this purchase order
      const existingBatches = await RawMaterialBatch.findAll({
        where: { purchase_order_id: id },
        include: [{ 
          model: RawMaterial, 
          attributes: ['id', 'name', 'material_code'] 
        }]
      });

      // Calculate pending quantities and prepare inward data
      const orderData = purchaseOrder.toJSON();
      orderData.PurchaseOrderItems = orderData.PurchaseOrderItems.map(item => {
        const pendingQuantity = item.qty - (item.received_quantity || 0);
        const itemBatches = existingBatches.filter(
          batch => batch.raw_material_id === item.raw_material_id
        );
        
        return {
          ...item,
          pending_quantity: pendingQuantity,
          is_fully_received: pendingQuantity <= 0,
          existing_batches: itemBatches,
          suggested_batch_code: `BATCH-${Date.now()}-${item.raw_material_id.substring(0, 4).toUpperCase()}`
        };
      });

      orderData.existing_batches = existingBatches;

      res.json({
        success: true,
        data: { purchase_order: orderData }
      });
    } catch (error) {
      console.error('Get order for inward error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch purchase order for inward',
        error: error.message
      });
    }
  },

  // Process inward for purchase order
  processInward: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { id } = req.params;
      const { 
        received_items, 
        received_date, 
        invoice_number,
        invoice_date,
        transport_details,
        quality_check_notes,
        notes 
      } = req.body;

      // Validate input
      if (!received_items || !Array.isArray(received_items) || received_items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Received items are required'
        });
      }

      // Get purchase order with items
      const purchaseOrder = await PurchaseOrder.findByPk(id, {
        include: [{ model: PurchaseOrderItem }],
        transaction
      });

      if (!purchaseOrder) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Purchase order not found'
        });
      }

      if (!['approved', 'partial'].includes(purchaseOrder.status)) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Purchase order is not ready for inward'
        });
      }

      const processedBatches = [];
      const updatedItems = [];

      // Process each received item
      for (const receivedItem of received_items) {
        const {
          item_id,
          received_quantity,
          batch_code,
          unit_cost,
          item_notes
        } = receivedItem;

        // Validate received quantity
        if (!received_quantity || received_quantity <= 0) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Invalid received quantity for item ${item_id}`
          });
        }

        // Find the order item
        const orderItem = purchaseOrder.PurchaseOrderItems.find(
          item => item.id === item_id
        );

        if (!orderItem) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Order item with ID ${item_id} not found`
          });
        }

        // Check if received quantity doesn't exceed pending quantity
        const currentReceived = orderItem.received_quantity || 0;
        const pendingQuantity = orderItem.qty - currentReceived;
        
        if (received_quantity > pendingQuantity) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Received quantity (${received_quantity}) exceeds pending quantity (${pendingQuantity}) for item ${orderItem.RawMaterial?.name || item_id}`
          });
        }

        // Generate batch code if not provided
        const finalBatchCode = batch_code || 
          `BATCH-${Date.now()}-${orderItem.raw_material_id.substring(0, 4).toUpperCase()}`;

        // Calculate cost per unit
        const finalCostPerUnit = unit_cost || orderItem.unit_price;

        // Create raw material batch (using actual database fields)
        const batch = await RawMaterialBatch.create({
          batch_code: finalBatchCode,
          raw_material_id: orderItem.raw_material_id,
          supplier_id: purchaseOrder.supplier_id,
          branch_id: purchaseOrder.branch_id,
          purchase_order_id: purchaseOrder.id,
          qty: received_quantity,
          cost_per_unit: finalCostPerUnit,
          received_at: received_date || new Date(),
          note: item_notes || null
        }, { transaction });

        // Create stock movement record
        await RawMaterialStockMovement.create({
          raw_material_id: orderItem.raw_material_id,
          raw_material_batch_id: batch.id,
          branch_id: purchaseOrder.branch_id,
          movement_type: 'IN',
          quantity: received_quantity,
          unit_cost: finalCostPerUnit,
          total_cost: received_quantity * finalCostPerUnit,
          reference_type: 'purchase_order',
          reference_id: purchaseOrder.id,
          reason: 'Purchase Order Inward',
          notes: `Inward from PO: ${purchaseOrder.po_number}`,
          user_id: req.user.id
        }, { transaction });

        // Update order item received quantity
        const newReceivedQuantity = currentReceived + received_quantity;
        await orderItem.update({
          received_quantity: newReceivedQuantity
        }, { transaction });

        processedBatches.push(batch);
        updatedItems.push({
          ...orderItem.toJSON(),
          received_quantity: newReceivedQuantity,
          pending_quantity: orderItem.qty - newReceivedQuantity
        });
      }

      // Check if all items are fully received
      const allItemsReceived = purchaseOrder.PurchaseOrderItems.every(item => {
        const updatedItem = updatedItems.find(ui => ui.id === item.id);
        const receivedQty = updatedItem ? updatedItem.received_quantity : (item.received_quantity || 0);
        return receivedQty >= item.qty;
      });

      // Update purchase order status and details
      const updateData = {
        status: allItemsReceived ? 'RECEIVED' : 'PARTIAL'
      };

      if (allItemsReceived) {
        updateData.completed_at = new Date();
      }

      await purchaseOrder.update(updateData, { transaction });

      // Commit transaction
      await transaction.commit();

      // Log audit trail
      await auditCreate(req, res, 'purchase_order_inward', purchaseOrder.id, {
        po_number: purchaseOrder.po_number,
        received_items: received_items.length,
        total_batches_created: processedBatches.length,
        status: updateData.status,
        received_by: req.user.id
      });

      // Fetch updated purchase order with all relations
      const updatedPurchaseOrder = await PurchaseOrder.findByPk(id, {
        include: [
          { model: Supplier, attributes: ['id', 'name', 'contact_name'] },
          { model: Branch, attributes: ['id', 'name'] },
          { model: User, attributes: ['id', 'full_name'] },
          {
            model: PurchaseOrderItem,
            include: [{ model: RawMaterial, attributes: ['id', 'name', 'material_code'] }]
          }
        ]
      });

      res.json({
        success: true,
        message: `Purchase order inward processed successfully. ${allItemsReceived ? 'Order completed.' : 'Partial inward completed.'}`,
        data: {
          purchase_order: updatedPurchaseOrder,
          processed_batches: processedBatches,
          batches_created: processedBatches.length,
          items_updated: updatedItems.length,
          is_completed: allItemsReceived
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Process inward error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process purchase order inward',
        error: error.message
      });
    }
  },

  // Get inward history for a purchase order
  getInwardHistory: async (req, res) => {
    try {
      const { id } = req.params;

      const batches = await RawMaterialBatch.findAll({
        where: { purchase_order_id: id },
        include: [
          { 
            model: RawMaterial, 
            attributes: ['id', 'name', 'material_code', 'uom'] 
          },
          { 
            model: User, 
            as: 'ReceivedBy',
            attributes: ['id', 'full_name', 'email'] 
          }
        ],
        order: [['received_at', 'DESC']]
      });

      const stockMovements = await RawMaterialStockMovement.findAll({
        where: { 
          reference_type: 'purchase_order',
          reference_id: id,
          movement_type: 'IN'
        },
        include: [
          { 
            model: RawMaterial, 
            attributes: ['id', 'name', 'material_code'] 
          },
          { 
            model: User, 
            attributes: ['id', 'full_name'] 
          }
        ],
        order: [['created_at', 'DESC']]
      });

      res.json({
        success: true,
        data: {
          purchase_order_id: id,
          batches_created: batches,
          stock_movements: stockMovements,
          total_batches: batches.length,
          total_movements: stockMovements.length
        }
      });
    } catch (error) {
      console.error('Get inward history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inward history',
        error: error.message
      });
    }
  },

  // Get inward summary/dashboard
  getInwardSummary: async (req, res) => {
    try {
      const { branch_id, date_from, date_to } = req.query;

      let whereClause = {};
      if (branch_id) whereClause.branch_id = branch_id;
      
      let dateFilter = {};
      if (date_from && date_to) {
        dateFilter.received_at = {
          [Op.between]: [new Date(date_from), new Date(date_to)]
        };
      } else if (date_from) {
        dateFilter.received_at = {
          [Op.gte]: new Date(date_from)
        };
      } else if (date_to) {
        dateFilter.received_at = {
          [Op.lte]: new Date(date_to)
        };
      }

      // Get pending orders
      const pendingOrders = await PurchaseOrder.count({
        where: {
          ...whereClause,
          status: { [Op.in]: ['PLACED', 'PARTIAL'] }
        }
      });

      // Get completed orders
      const completedOrders = await PurchaseOrder.count({
        where: {
          ...whereClause,
          status: 'RECEIVED',
          ...dateFilter
        }
      });

      // Get recent inward batches
      const recentBatches = await RawMaterialBatch.findAll({
        where: {
          ...whereClause,
          ...dateFilter
        },
        include: [
          { model: RawMaterial, attributes: ['id', 'name', 'material_code'] },
          { model: Supplier, attributes: ['id', 'name'] },
          { model: PurchaseOrder, attributes: ['id', 'po_number'] }
        ],
        limit: 10,
        order: [['received_at', 'DESC']]
      });

      // Get total value received - calculate from qty * cost_per_unit
      const totalValueResult = await RawMaterialBatch.findAll({
        where: {
          ...whereClause,
          ...dateFilter
        },
        attributes: [
          [sequelize.fn('SUM', sequelize.literal('qty * cost_per_unit')), 'total_value'],
          [sequelize.fn('SUM', sequelize.col('qty')), 'total_quantity']
        ],
        raw: true
      });

      const totalValue = totalValueResult[0]?.total_value || 0;
      const totalQuantity = totalValueResult[0]?.total_quantity || 0;

      res.json({
        success: true,
        data: {
          summary: {
            pending_orders: pendingOrders,
            completed_orders: completedOrders,
            total_value_received: parseFloat(totalValue),
            total_quantity_received: parseFloat(totalQuantity)
          },
          recent_batches: recentBatches
        }
      });
    } catch (error) {
      console.error('Get inward summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inward summary',
        error: error.message
      });
    }
  }
};

module.exports = purchaseOrderInwardController;