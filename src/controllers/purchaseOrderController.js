const { PurchaseOrder, PurchaseOrderItem, Supplier, RawMaterial, RawMaterialBatch, Branch, User } = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

const getPurchaseOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, supplier_id, branch_id } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { po_number: { [Op.like]: `%${search}%` } }
      ];
    }
    if (status) {
      whereClause.status = status;
    }
    if (supplier_id) {
      whereClause.supplier_id = supplier_id;
    }
    if (branch_id) {
      whereClause.branch_id = branch_id;
    }

    const { count, rows } = await PurchaseOrder.findAndCountAll({
      where: whereClause,
      include: [
        { model: Supplier, attributes: ['id', 'name', 'contact_name'] },
        { model: Branch, attributes: ['id', 'name'] },
        { model: User, attributes: ['id', 'full_name'] },
        {
          model: PurchaseOrderItem,
          include: [{ model: RawMaterial, attributes: ['id', 'name', 'uom', 'material_code'] }]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        purchase_orders: rows,
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
      message: 'Failed to fetch purchase orders',
      error: error.message
    });
  }
};

const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const purchaseOrder = await PurchaseOrder.findByPk(id, {
      include: [
        { model: Supplier },
        { model: Branch },
        { model: User, attributes: ['id', 'full_name'] },
        {
          model: PurchaseOrderItem,
          include: [{ model: RawMaterial }]
        }
      ]
    });

    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    res.json({
      success: true,
      data: { purchase_order: purchaseOrder }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch purchase order',
      error: error.message
    });
  }
};

const createPurchaseOrder = async (req, res) => {
  try {
    const {
      supplier_id,
      branch_id,
      expected_delivery_date,
      notes,
      items
    } = req.body;

    // Generate PO number
    const orderCount = await PurchaseOrder.count();
    const po_number = `PO${String(orderCount + 1).padStart(6, '0')}`;

    // Calculate totals
    let total_amount = 0;
    const validatedItems = [];

    for (const item of items) {
      const rawMaterial = await RawMaterial.findByPk(item.raw_material_id);
      if (!rawMaterial) {
        return res.status(400).json({
          success: false,
          message: `Raw material with ID ${item.raw_material_id} not found`
        });
      }

      const itemTotal = item.qty * item.unit_price;
      const itemTax = item.tax || 0;
      total_amount += itemTotal + itemTax;

      validatedItems.push({
        raw_material_id: item.raw_material_id,
        qty: item.qty,
        unit_price: item.unit_price,
        tax: itemTax,
        total: itemTotal + itemTax
      });
    }

    // Create purchase order
    const purchaseOrder = await PurchaseOrder.create({
      po_number,
      supplier_id,
      branch_id,
      expected_date: expected_delivery_date,
      ordered_at: new Date(),
      status: 'draft',
      total_amount,
      created_by: req.user.id
    });

    // Create purchase order items
    for (const item of validatedItems) {
      await PurchaseOrderItem.create({
        purchase_order_id: purchaseOrder.id,
        ...item
      });
    }

    // Fetch complete purchase order with relations
    const completePurchaseOrder = await PurchaseOrder.findByPk(purchaseOrder.id, {
      include: [
        { model: Supplier },
        { model: Branch },
        { model: User, attributes: ['id', 'full_name'] },
        {
          model: PurchaseOrderItem,
          include: [{ model: RawMaterial }]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Purchase order created successfully',
      data: { purchase_order: completePurchaseOrder }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create purchase order',
      error: error.message
    });
  }
};

const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const purchaseOrder = await PurchaseOrder.findByPk(id);
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    // Check if order can be updated
    if (['RECEIVED', 'CANCELLED'].includes(purchaseOrder.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed or cancelled purchase order'
      });
    }

    await purchaseOrder.update(updateData);

    const updatedPurchaseOrder = await PurchaseOrder.findByPk(id, {
      include: [
        { model: Supplier },
        { model: Branch },
        { model: User, attributes: ['id', 'full_name'] },
        {
          model: PurchaseOrderItem,
          include: [{ model: RawMaterial }]
        }
      ]
    });

    res.json({
      success: true,
      message: 'Purchase order updated successfully',
      data: { purchase_order: updatedPurchaseOrder }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update purchase order',
      error: error.message
    });
  }
};

const approvePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const purchaseOrder = await PurchaseOrder.findByPk(id);
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    console.log('Current PO status:', purchaseOrder.status);
    console.log('Checking if status is in [DRAFT, PLACED]:', ['DRAFT', 'PLACED'].includes(purchaseOrder.status));

    // Allow approval for DRAFT or PLACED status
    if (!['DRAFT', 'PLACED'].includes(purchaseOrder.status)) {
      return res.status(400).json({
        success: false,
        message: `Only draft or placed purchase orders can be approved. Current status: ${purchaseOrder.status}`
      });
    }

    // Change status to PLACED (approved and ready for receiving)
    await purchaseOrder.update({
      status: 'PLACED',
      notes: notes || purchaseOrder.notes
    });

    res.json({
      success: true,
      message: 'Purchase order approved successfully',
      data: { purchase_order: purchaseOrder }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve purchase order',
      error: error.message
    });
  }
};

const receivePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { received_items, received_date, notes } = req.body;

    const purchaseOrder = await PurchaseOrder.findByPk(id, {
      include: [{ model: PurchaseOrderItem }]
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
        message: 'Only placed or partial purchase orders can be received'
      });
    }

    // Get branch_id - use PO branch or get first available branch
    let branchId = purchaseOrder.branch_id;
    if (!branchId) {
      const { Branch } = require('../models');
      const firstBranch = await Branch.findOne();
      if (!firstBranch) {
        return res.status(400).json({
          success: false,
          message: 'No branch available. Please create a branch first.'
        });
      }
      branchId = firstBranch.id;
    }

    // Process received items and create batches
    for (const receivedItem of received_items) {
      const orderItem = purchaseOrder.PurchaseOrderItems.find(
        item => item.id === receivedItem.item_id
      );

      if (!orderItem) {
        return res.status(400).json({
          success: false,
          message: `Order item with ID ${receivedItem.item_id} not found`
        });
      }

      // Create raw material batch (using actual database fields)
      await RawMaterialBatch.create({
        batch_code: `BATCH-${uuidv4().substring(0, 8).toUpperCase()}`,
        raw_material_id: orderItem.raw_material_id,
        supplier_id: purchaseOrder.supplier_id,
        branch_id: branchId,
        purchase_order_id: purchaseOrder.id,
        qty: receivedItem.received_quantity,
        cost_per_unit: orderItem.unit_price,
        received_at: received_date || new Date(),
        note: receivedItem.notes || null
      });

      // Update order item received quantity
      const newReceivedQuantity = (orderItem.received_quantity || 0) + receivedItem.received_quantity;
      await orderItem.update({
        received_quantity: newReceivedQuantity
      });
      
      // Update the in-memory object for status calculation
      orderItem.received_quantity = newReceivedQuantity;
    }

    // Update purchase order status
    const allItemsReceived = purchaseOrder.PurchaseOrderItems.every(
      item => (item.received_quantity || 0) >= item.qty
    );

    await purchaseOrder.update({
      status: allItemsReceived ? 'RECEIVED' : 'PARTIAL'
    });

    // Fetch updated purchase order with all relations
    const updatedPurchaseOrder = await PurchaseOrder.findByPk(purchaseOrder.id, {
      include: [
        { model: Supplier },
        { model: Branch },
        { model: User, attributes: ['id', 'full_name'] },
        {
          model: PurchaseOrderItem,
          include: [{ model: RawMaterial }]
        }
      ]
    });

    res.json({
      success: true,
      message: 'Purchase order received successfully',
      data: { purchase_order: updatedPurchaseOrder }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to receive purchase order',
      error: error.message
    });
  }
};

const cancelPurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const purchaseOrder = await PurchaseOrder.findByPk(id);
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        message: 'Purchase order not found'
      });
    }

    if (['RECEIVED', 'CANCELLED'].includes(purchaseOrder.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed or already cancelled purchase order'
      });
    }

    await purchaseOrder.update({
      status: 'CANCELLED'
    });

    res.json({
      success: true,
      message: 'Purchase order cancelled successfully',
      data: { purchase_order: purchaseOrder }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel purchase order',
      error: error.message
    });
  }
};

module.exports = {
  getAllPurchaseOrders: getPurchaseOrders,
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  deletePurchaseOrder: cancelPurchaseOrder,
  approvePurchaseOrder,
  receivePurchaseOrder,
  getPurchaseOrdersBySupplier: getPurchaseOrders, // Can use same function with supplier filter
  cancelPurchaseOrder
};