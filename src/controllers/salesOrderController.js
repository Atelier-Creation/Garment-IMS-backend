const { SalesOrder, SalesOrderItem, Customer, ProductVariant, Product, FinishedGoodsStock, FinishedGoodsStockMovement, PosTransaction, Branch, User } = require('../models');
const { Op } = require('sequelize');

const getSalesOrders = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, customer_id, branch_id } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { order_number: { [Op.like]: `%${search}%` } },
        { reference_number: { [Op.like]: `%${search}%` } }
      ];
    }
    if (status) {
      whereClause.status = status;
    }
    if (customer_id) {
      whereClause.customer_id = customer_id;
    }
    if (branch_id) {
      whereClause.branch_id = branch_id;
    }

    const { count, rows } = await SalesOrder.findAndCountAll({
      where: whereClause,
      include: [
        { model: Customer, attributes: ['id', 'name', 'contact_name'] },
        { model: Branch, attributes: ['id', 'name'] },
        { model: User, attributes: ['id', 'full_name'] },
        {
          model: SalesOrderItem,
          include: [{
            model: ProductVariant,
            include: [{ model: Product, attributes: ['id', 'product_name', 'product_code'] }]
          }]
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        sales_orders: rows,
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
      message: 'Failed to fetch sales orders',
      error: error.message
    });
  }
};

const getSalesOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const salesOrder = await SalesOrder.findByPk(id, {
      include: [
        { model: Customer },
        { model: Branch },
        { model: User, attributes: ['id', 'full_name'] },
        {
          model: SalesOrderItem,
          include: [{
            model: ProductVariant,
            include: [{ model: Product }]
          }]
        },
        { model: PosTransaction }
      ]
    });

    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    res.json({
      success: true,
      data: { sales_order: salesOrder }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sales order',
      error: error.message
    });
  }
};

const createSalesOrder = async (req, res) => {
  try {
    const {
      customer_id,
      branch_id,
      order_type,
      reference_number,
      order_date,
      delivery_date,
      shipping_address,
      billing_address,
      payment_terms,
      notes,
      items
    } = req.body;

    // Generate order number
    const orderCount = await SalesOrder.count();
    const order_number = `SO${String(orderCount + 1).padStart(6, '0')}`;

    // Calculate totals and validate stock
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const variant = await ProductVariant.findByPk(item.variant_id, {
        include: [{ model: Product }]
      });
      
      if (!variant) {
        return res.status(400).json({
          success: false,
          message: `Product variant with ID ${item.variant_id} not found`
        });
      }

      // Check stock availability
      const stock = await FinishedGoodsStock.findOne({
        where: {
          variant_id: item.variant_id,
          branch_id
        }
      });

      const availableQuantity = stock ? (stock.qty - stock.reserved_qty) : 0;
      if (item.quantity > availableQuantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${variant.Product?.product_name || 'Product'} (${variant.size} - ${variant.color}). Available: ${availableQuantity}, Requested: ${item.quantity}`
        });
      }

      const itemTotal = item.quantity * item.unit_price;
      subtotal += itemTotal;

      validatedItems.push({
        variant_id: item.variant_id,
        qty: item.quantity,
        unit_price: item.unit_price,
        total: itemTotal,
        notes: item.notes || null
      });
    }

    const discount_amount = req.body.discount_amount || 0;
    const tax_amount = (subtotal - discount_amount) * 0.18; // 18% GST
    const total_amount = subtotal - discount_amount + tax_amount;

    // Create sales order
    const salesOrder = await SalesOrder.create({
      order_number,
      customer_id,
      branch_id,
      order_type: order_type || 'standard',
      reference_number,
      order_date: order_date || new Date(),
      delivery_date,
      status: 'DRAFT',
      subtotal_amount: subtotal,
      discount_amount,
      tax_amount,
      total_amount,
      shipping_address,
      billing_address,
      payment_terms,
      notes,
      created_by: req.user.id
    });

    // Create sales order items and reserve stock
    for (const item of validatedItems) {
      await SalesOrderItem.create({
        sales_order_id: salesOrder.id,
        ...item
      });

      // Reserve stock
      const stock = await FinishedGoodsStock.findOne({
        where: {
          variant_id: item.variant_id,
          branch_id
        }
      });

      if (stock) {
        await stock.update({
          reserved_qty: stock.reserved_qty + item.qty
        });
      }
    }

    // Fetch complete sales order with relations
    const completeSalesOrder = await SalesOrder.findByPk(salesOrder.id, {
      include: [
        { model: Customer },
        { model: Branch },
        { model: User, attributes: ['id', 'full_name'] },
        {
          model: SalesOrderItem,
          include: [{
            model: ProductVariant,
            include: [{ model: Product }]
          }]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Sales order created successfully',
      data: { sales_order: completeSalesOrder }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create sales order',
      error: error.message
    });
  }
};

const confirmSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmed_delivery_date, notes } = req.body;

    const salesOrder = await SalesOrder.findByPk(id);
    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    if (salesOrder.status !== 'DRAFT') {
      return res.status(400).json({
        success: false,
        message: 'Only draft sales orders can be confirmed'
      });
    }

    await salesOrder.update({
      status: 'CONFIRMED',
      confirmed_delivery_date,
      confirmed_by: req.user.id,
      confirmed_at: new Date(),
      notes: notes || salesOrder.notes
    });

    res.json({
      success: true,
      message: 'Sales order confirmed successfully',
      data: { sales_order: salesOrder }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to confirm sales order',
      error: error.message
    });
  }
};

const processSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { shipped_items, shipping_date, tracking_number, notes } = req.body;

    const salesOrder = await SalesOrder.findByPk(id, {
      include: [{ model: SalesOrderItem }]
    });

    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    if (salesOrder.status !== 'CONFIRMED') {
      return res.status(400).json({
        success: false,
        message: 'Only confirmed sales orders can be processed. This order may have already been processed or is in draft status.'
      });
    }

    // Process shipped items
    for (const shippedItem of shipped_items) {
      const orderItem = salesOrder.SalesOrderItems.find(
        item => item.id === shippedItem.item_id
      );

      if (!orderItem) {
        return res.status(400).json({
          success: false,
          message: `Order item with ID ${shippedItem.item_id} not found`
        });
      }

      // Update stock - move from reserved to shipped
      const stock = await FinishedGoodsStock.findOne({
        where: {
          variant_id: orderItem.variant_id,
          branch_id: salesOrder.branch_id
        }
      });

      if (stock) {
        await stock.update({
          qty: stock.qty - shippedItem.shipped_quantity,
          reserved_qty: stock.reserved_qty - shippedItem.shipped_quantity
        });

        // Create stock movement record
        await FinishedGoodsStockMovement.create({
          variant_id: orderItem.variant_id,
          branch_id: salesOrder.branch_id,
          movement_type: 'SALE',
          qty: shippedItem.shipped_quantity,
          reference_table: 'sales_orders',
          reference_id: salesOrder.id,
          created_by: req.user.id
        });
      }
    }

    // Update sales order status to PAID (processed/shipped)
    await salesOrder.update({
      status: 'PAID',
      shipping_date: shipping_date || new Date(),
      tracking_number,
      notes: notes || salesOrder.notes
    });

    res.json({
      success: true,
      message: 'Sales order processed successfully',
      data: { sales_order: salesOrder }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process sales order',
      error: error.message
    });
  }
};

const completeSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { delivery_date, customer_signature, notes } = req.body;

    const salesOrder = await SalesOrder.findByPk(id);
    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    if (salesOrder.status !== 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Only paid sales orders can be completed'
      });
    }

    await salesOrder.update({
      status: 'PAID',
      delivery_date: delivery_date || new Date(),
      customer_signature,
      delivered_by: req.user.id,
      notes: notes || salesOrder.notes
    });

    res.json({
      success: true,
      message: 'Sales order completed successfully',
      data: { sales_order: salesOrder }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to complete sales order',
      error: error.message
    });
  }
};

const cancelSalesOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const salesOrder = await SalesOrder.findByPk(id, {
      include: [{ model: SalesOrderItem }]
    });

    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        message: 'Sales order not found'
      });
    }

    if (salesOrder.status === 'PAID' || salesOrder.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel paid or already cancelled sales order'
      });
    }

    // Release reserved stock
    for (const item of salesOrder.SalesOrderItems) {
      const stock = await FinishedGoodsStock.findOne({
        where: {
          variant_id: item.variant_id,
          branch_id: salesOrder.branch_id
        }
      });

      if (stock) {
        await stock.update({
          reserved_qty: Math.max(0, stock.reserved_qty - item.qty)
        });
      }
    }

    await salesOrder.update({
      status: 'CANCELLED',
      cancelled_by: req.user.id,
      cancelled_at: new Date(),
      cancellation_reason: reason
    });

    res.json({
      success: true,
      message: 'Sales order cancelled successfully',
      data: { sales_order: salesOrder }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to cancel sales order',
      error: error.message
    });
  }
};

module.exports = {
  getAllSalesOrders: getSalesOrders,
  getSalesOrders,
  getSalesOrderById,
  createSalesOrder,
  updateSalesOrder: processSalesOrder,
  deleteSalesOrder: cancelSalesOrder,
  confirmSalesOrder,
  fulfillSalesOrder: completeSalesOrder,
  getSalesOrdersByCustomer: getSalesOrders, // Can use same function with customer filter
  processSalesOrder,
  completeSalesOrder,
  cancelSalesOrder
};