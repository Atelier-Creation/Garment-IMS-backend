const { sequelize, SalesOrder, PurchaseOrder, ProductionOrder, FinishedGoodsStock, RawMaterialBatch, Customer, Supplier, Product, ProductVariant, RawMaterial, Branch } = require('../models');
const { Op, QueryTypes } = require('sequelize');

const getSalesReport = async (req, res) => {
  try {
    const { start_date, end_date, branch_id, customer_id, group_by = 'day' } = req.query;

    let whereClause = {
      status: { [Op.in]: ['delivered', 'shipped'] }
    };

    if (start_date && end_date) {
      whereClause.order_date = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }
    if (branch_id) {
      whereClause.branch_id = branch_id;
    }
    if (customer_id) {
      whereClause.customer_id = customer_id;
    }

    // Get sales summary
    const salesSummary = await SalesOrder.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_revenue'],
        [sequelize.fn('AVG', sequelize.col('total_amount')), 'average_order_value']
      ],
      raw: true
    });

    // Get sales by period
    let dateFormat;
    switch (group_by) {
      case 'month':
        dateFormat = '%Y-%m';
        break;
      case 'week':
        dateFormat = '%Y-%u';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const salesByPeriod = await SalesOrder.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('order_date'), dateFormat), 'period'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orders'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue']
      ],
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('order_date'), dateFormat)],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('order_date'), dateFormat), 'ASC']],
      raw: true
    });

    // Top customers
    const topCustomers = await SalesOrder.findAll({
      where: whereClause,
      include: [{ model: Customer, attributes: ['id', 'name'] }],
      attributes: [
        'customer_id',
        [sequelize.fn('COUNT', sequelize.col('SalesOrder.id')), 'total_orders'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_revenue']
      ],
      group: ['customer_id', 'Customer.id'],
      order: [[sequelize.fn('SUM', sequelize.col('total_amount')), 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        summary: salesSummary[0],
        sales_by_period: salesByPeriod,
        top_customers: topCustomers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate sales report',
      error: error.message
    });
  }
};

const getPurchaseReport = async (req, res) => {
  try {
    const { start_date, end_date, branch_id, supplier_id, group_by = 'day' } = req.query;

    let whereClause = {
      status: { [Op.in]: ['received', 'partial'] }
    };

    if (start_date && end_date) {
      whereClause.ordered_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }
    if (branch_id) {
      whereClause.branch_id = branch_id;
    }
    if (supplier_id) {
      whereClause.supplier_id = supplier_id;
    }

    // Get purchase summary
    const purchaseSummary = await PurchaseOrder.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_spent'],
        [sequelize.fn('AVG', sequelize.col('total_amount')), 'average_order_value']
      ],
      raw: true
    });

    // Get purchases by period
    let dateFormat;
    switch (group_by) {
      case 'month':
        dateFormat = '%Y-%m';
        break;
      case 'week':
        dateFormat = '%Y-%u';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const purchasesByPeriod = await PurchaseOrder.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('ordered_at'), dateFormat), 'period'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orders'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'amount']
      ],
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('ordered_at'), dateFormat)],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('ordered_at'), dateFormat), 'ASC']],
      raw: true
    });

    // Top suppliers
    const topSuppliers = await PurchaseOrder.findAll({
      where: whereClause,
      include: [{ model: Supplier, attributes: ['id', 'name'] }],
      attributes: [
        'supplier_id',
        [sequelize.fn('COUNT', sequelize.col('PurchaseOrder.id')), 'total_orders'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_amount']
      ],
      group: ['supplier_id', 'Supplier.id'],
      order: [[sequelize.fn('SUM', sequelize.col('total_amount')), 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        summary: purchaseSummary[0],
        purchases_by_period: purchasesByPeriod,
        top_suppliers: topSuppliers
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate purchase report',
      error: error.message
    });
  }
};

const getProductionReport = async (req, res) => {
  try {
    const { start_date, end_date, branch_id, product_id, group_by = 'day' } = req.query;

    let whereClause = {
      status: 'completed'
    };

    if (start_date && end_date) {
      whereClause.end_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }
    if (branch_id) {
      whereClause.branch_id = branch_id;
    }
    if (product_id) {
      whereClause.product_id = product_id;
    }

    // Get production summary
    const productionSummary = await ProductionOrder.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_orders'],
        [sequelize.fn('SUM', sequelize.col('planned_qty')), 'total_planned'],
        [sequelize.fn('SUM', sequelize.col('produced_qty')), 'total_produced'],
        [sequelize.fn('AVG', sequelize.literal('produced_qty / planned_qty * 100')), 'efficiency_percentage']
      ],
      raw: true
    });

    // Get production by period
    let dateFormat;
    switch (group_by) {
      case 'month':
        dateFormat = '%Y-%m';
        break;
      case 'week':
        dateFormat = '%Y-%u';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const productionByPeriod = await ProductionOrder.findAll({
      where: whereClause,
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('end_at'), dateFormat), 'period'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orders'],
        [sequelize.fn('SUM', sequelize.col('produced_qty')), 'quantity_produced']
      ],
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('end_at'), dateFormat)],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('end_at'), dateFormat), 'ASC']],
      raw: true
    });

    // Top products by production volume
    const topProducts = await ProductionOrder.findAll({
      where: whereClause,
      include: [{ model: Product, attributes: ['id', 'product_name'] }],
      attributes: [
        'product_id',
        [sequelize.fn('COUNT', sequelize.col('ProductionOrder.id')), 'total_orders'],
        [sequelize.fn('SUM', sequelize.col('produced_qty')), 'total_quantity']
      ],
      group: ['product_id', 'Product.id'],
      order: [[sequelize.fn('SUM', sequelize.col('produced_qty')), 'DESC']],
      limit: 10
    });

    res.json({
      success: true,
      data: {
        summary: productionSummary[0],
        production_by_period: productionByPeriod,
        top_products: topProducts
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate production report',
      error: error.message
    });
  }
};

const getInventoryReport = async (req, res) => {
  try {
    const { branch_id, low_stock_threshold = 10 } = req.query;

    let finishedGoodsWhere = {};
    let rawMaterialWhere = {};
    
    if (branch_id) {
      finishedGoodsWhere.branch_id = branch_id;
      rawMaterialWhere.branch_id = branch_id;
    }

    // Finished goods inventory
    const finishedGoodsInventory = await FinishedGoodsStock.findAll({
      where: finishedGoodsWhere,
      include: [
        {
          model: ProductVariant,
          include: [{ model: Product }]
        },
        { model: Branch, attributes: ['id', 'name'] }
      ],
      order: [['qty', 'ASC']]
    });

    // Raw material inventory
    const rawMaterialInventory = await RawMaterialBatch.findAll({
      where: rawMaterialWhere,
      include: [
        { model: RawMaterial },
        { model: Branch, attributes: ['id', 'name'] }
      ],
      order: [['qty', 'ASC']]
    });

    // Low stock items
    const lowStockFinishedGoods = finishedGoodsInventory.filter(
      item => item.qty <= low_stock_threshold
    );

    const lowStockRawMaterials = rawMaterialInventory.filter(
      item => item.qty <= low_stock_threshold
    );

    // Expired raw materials (skip if no expiry_date field)
    const expiredRawMaterials = []; // RawMaterialBatch model doesn't have expiry_date field

    // Inventory value
    const finishedGoodsValue = finishedGoodsInventory.reduce((sum, item) => {
      return sum + (item.qty * (item.ProductVariant?.mrp || 0));
    }, 0);

    const rawMaterialValue = rawMaterialInventory.reduce((sum, item) => {
      return sum + (item.qty * item.cost_per_unit);
    }, 0);

    res.json({
      success: true,
      data: {
        summary: {
          finished_goods_items: finishedGoodsInventory.length,
          raw_material_batches: rawMaterialInventory.length,
          low_stock_finished_goods: lowStockFinishedGoods.length,
          low_stock_raw_materials: lowStockRawMaterials.length,
          expired_raw_materials: expiredRawMaterials.length,
          total_inventory_value: finishedGoodsValue + rawMaterialValue
        },
        finished_goods_inventory: finishedGoodsInventory,
        raw_material_inventory: rawMaterialInventory,
        low_stock_items: {
          finished_goods: lowStockFinishedGoods,
          raw_materials: lowStockRawMaterials
        },
        expired_items: expiredRawMaterials
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate inventory report',
      error: error.message
    });
  }
};

const getFinancialReport = async (req, res) => {
  try {
    const { start_date, end_date, branch_id } = req.query;

    let salesWhere = { status: { [Op.in]: ['delivered', 'shipped'] } };
    let purchaseWhere = { status: { [Op.in]: ['received', 'partial'] } };

    if (start_date && end_date) {
      salesWhere.order_date = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
      purchaseWhere.ordered_at = {
        [Op.between]: [new Date(start_date), new Date(end_date)]
      };
    }

    if (branch_id) {
      salesWhere.branch_id = branch_id;
      purchaseWhere.branch_id = branch_id;
    }

    // Revenue
    const revenue = await SalesOrder.findAll({
      where: salesWhere,
      attributes: [
        [sequelize.fn('SUM', sequelize.col('subtotal_amount')), 'gross_revenue'],
        [sequelize.fn('SUM', sequelize.col('discount_amount')), 'total_discounts'],
        [sequelize.fn('SUM', sequelize.col('tax_amount')), 'total_tax'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'net_revenue']
      ],
      raw: true
    });

    // Expenses (purchases)
    const expenses = await PurchaseOrder.findAll({
      where: purchaseWhere,
      attributes: [
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total_expenses']
      ],
      raw: true
    });

    // Calculate profit
    const grossRevenue = parseFloat(revenue[0].gross_revenue) || 0;
    const totalExpenses = parseFloat(expenses[0].total_expenses) || 0;
    const grossProfit = grossRevenue - totalExpenses;
    const profitMargin = grossRevenue > 0 ? (grossProfit / grossRevenue) * 100 : 0;

    res.json({
      success: true,
      data: {
        revenue: revenue[0],
        expenses: {
          total_expenses: expenses[0].total_expenses,
          raw_material_cost: expenses[0].total_expenses, // Same as total since PO doesn't have breakdown
          purchase_tax: 0 // PO model doesn't have separate tax field
        },
        profit_analysis: {
          gross_profit: grossProfit,
          profit_margin_percentage: profitMargin
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate financial report',
      error: error.message
    });
  }
};

const getDashboardMetrics = async (req, res) => {
  try {
    const { branch_id } = req.query;
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

    let salesWhere = { status: { [Op.in]: ['PAID', 'delivered', 'shipped', 'CONFIRMED'] } };
    let purchaseWhere = { status: { [Op.in]: ['received', 'partial'] } };
    let productionWhere = { status: 'completed' };

    if (branch_id) {
      salesWhere.branch_id = branch_id;
      purchaseWhere.branch_id = branch_id;
      productionWhere.branch_id = branch_id;
    }

    // This month metrics
    const thisMonthSales = await SalesOrder.findAll({
      where: {
        ...salesWhere,
        order_date: { [Op.gte]: startOfMonth }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total']
      ],
      raw: true
    });

    // Last month metrics
    const lastMonthSales = await SalesOrder.findAll({
      where: {
        ...salesWhere,
        order_date: { [Op.between]: [startOfLastMonth, endOfLastMonth] }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total']
      ],
      raw: true
    });

    // Production metrics
    const productionMetrics = await ProductionOrder.findAll({
      where: {
        ...productionWhere,
        end_at: { [Op.gte]: startOfMonth }
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'completed_orders'],
        [sequelize.fn('SUM', sequelize.col('produced_qty')), 'total_produced']
      ],
      raw: true
    });

    // Low stock alerts
    const lowStockCount = await FinishedGoodsStock.count({
      where: {
        ...(branch_id && { branch_id }),
        qty: { [Op.lte]: 10 }
      }
    });

    // Pending orders
    const pendingOrders = {
      sales: await SalesOrder.count({
        where: {
          status: { [Op.in]: ['DRAFT', 'CONFIRMED'] }
        }
      }),
      purchase: await PurchaseOrder.count({
        where: {
          status: { [Op.in]: ['DRAFT', 'PLACED'] }
        }
      }),
      production: await ProductionOrder.count({
        where: {
          status: 'planned'
        }
      })
    };

    // Sales by status for pie chart
    const salesByStatus = await SalesOrder.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'total']
      ],
      group: ['status'],
      raw: true
    });

    // Production by status for pie chart
    const productionByStatus = await ProductionOrder.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        [sequelize.fn('SUM', sequelize.col('produced_qty')), 'total_qty']
      ],
      group: ['status'],
      raw: true
    });

    // Top products by sales
    const topProducts = await sequelize.query(`
      SELECT 
        p.product_name,
        pv.size,
        pv.color,
        SUM(soi.qty) as total_sold,
        SUM(soi.total) as total_revenue
      FROM sales_order_items soi
      JOIN product_variants pv ON soi.variant_id = pv.id
      JOIN products p ON pv.product_id = p.id
      JOIN sales_orders so ON soi.sales_order_id = so.id
      WHERE so.order_date >= :startOfMonth
      GROUP BY p.id, pv.id
      ORDER BY total_sold DESC
      LIMIT 5
    `, {
      replacements: { startOfMonth },
      type: QueryTypes.SELECT
    });

    // Monthly sales trend (last 6 months)
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
    const monthlySales = await SalesOrder.findAll({
      where: {
        status: { [Op.in]: ['PAID', 'delivered', 'shipped', 'CONFIRMED'] },
        order_date: { [Op.gte]: sixMonthsAgo }
      },
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('order_date'), '%Y-%m'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'orders'],
        [sequelize.fn('SUM', sequelize.col('total_amount')), 'revenue']
      ],
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('order_date'), '%Y-%m')],
      order: [[sequelize.fn('DATE_FORMAT', sequelize.col('order_date'), '%Y-%m'), 'ASC']],
      raw: true
    });

    // Stock levels by category
    const stockByCategory = await sequelize.query(`
      SELECT 
        CASE 
          WHEN fgs.qty <= 5 THEN 'Critical'
          WHEN fgs.qty <= 10 THEN 'Low'
          WHEN fgs.qty <= 50 THEN 'Medium'
          ELSE 'High'
        END as stock_level,
        COUNT(*) as count,
        SUM(fgs.qty) as total_qty
      FROM finished_goods_stock fgs
      GROUP BY stock_level
    `, {
      type: QueryTypes.SELECT
    });

    // Recent activities - simplified to avoid column issues
    const recentActivities = await sequelize.query(`
      SELECT * FROM (
        SELECT 'sales' as type, order_number as reference, created_at, 'New sales order created' as activity
        FROM sales_orders 
        WHERE order_number IS NOT NULL
        ORDER BY created_at DESC LIMIT 3
      ) AS sales_activities
      UNION ALL
      SELECT * FROM (
        SELECT 'purchase' as type, po_number as reference, created_at, 'Purchase order received' as activity
        FROM purchase_orders 
        WHERE status = 'received' AND po_number IS NOT NULL
        ORDER BY created_at DESC LIMIT 3
      ) AS purchase_activities
      ORDER BY created_at DESC
      LIMIT 10
    `, {
      type: QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        sales: {
          this_month: thisMonthSales[0],
          last_month: lastMonthSales[0]
        },
        production: productionMetrics[0],
        alerts: {
          low_stock_items: lowStockCount
        },
        pending_orders: pendingOrders,
        charts: {
          sales_by_status: salesByStatus,
          production_by_status: productionByStatus,
          top_products: topProducts,
          monthly_sales_trend: monthlySales,
          stock_levels: stockByCategory
        },
        recent_activities: recentActivities
      }
    });
  } catch (error) {
    console.error('Get dashboard metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate dashboard metrics',
      error: error.message
    });
  }
};

module.exports = {
  getDashboardStats: getDashboardMetrics,
  getSalesReport,
  getPurchaseReport,
  getProductionReport,
  getStockReport: getInventoryReport,
  getFinancialReport,
  getCustomReport: getSalesReport, // Can reuse for custom reports
  getInventoryReport,
  getDashboardMetrics
};