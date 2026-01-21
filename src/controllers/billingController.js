const { sequelize, SalesOrder, SalesOrderItem, Customer, ProductVariant, Product, Branch, User, FinishedGoodsStock } = require('../models');
const { Op } = require('sequelize');

const billingController = {
  // Get all billings (sales orders)
  async getAllBillings(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        sortField = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      if (search) {
        whereClause[Op.or] = [
          { order_number: { [Op.like]: `%${search}%` } },
          { '$Customer.name$': { [Op.like]: `%${search}%` } }
        ];
      }

      if (status && status !== 'all') {
        whereClause.status = status.toUpperCase();
      }

      const { count, rows } = await SalesOrder.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Customer,
            attributes: ['id', 'name', 'contact_name', 'phone', 'email']
          },
          {
            model: Branch,
            attributes: ['id', 'name']
          },
          {
            model: SalesOrderItem,
            include: [
              {
                model: ProductVariant,
                attributes: ['id', 'sku', 'size', 'color'],
                include: [
                  {
                    model: Product,
                    attributes: ['id', 'product_name', 'product_code']
                  }
                ]
              }
            ]
          }
        ],
        limit: parseInt(limit),
        offset: offset,
        order: [[sortField, sortOrder.toUpperCase()]],
        distinct: true
      });

      res.json({
        success: true,
        data: rows,
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      });
    } catch (error) {
      console.error('Get billings error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch billings',
        error: error.message
      });
    }
  },

  // Get billing by ID
  async getBillingById(req, res) {
    try {
      const { id } = req.params;

      const billing = await SalesOrder.findByPk(id, {
        include: [
          {
            model: Customer,
            attributes: ['id', 'name', 'contact_name', 'phone', 'email', 'address']
          },
          {
            model: Branch,
            attributes: ['id', 'name']
          },
          {
            model: SalesOrderItem,
            include: [
              {
                model: ProductVariant,
                attributes: ['id', 'sku', 'size', 'color', 'mrp'],
                include: [
                  {
                    model: Product,
                    attributes: ['id', 'product_name', 'product_code']
                  }
                ]
              }
            ]
          }
        ]
      });

      if (!billing) {
        return res.status(404).json({
          success: false,
          message: 'Billing not found'
        });
      }

      res.json({
        success: true,
        data: billing
      });
    } catch (error) {
      console.error('Get billing error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch billing',
        error: error.message
      });
    }
  },

  // Create new billing (sales order)
  async createBilling(req, res) {
    const transaction = await sequelize.transaction();
    
    try {
      const {
        customer_id,
        branch_id,
        order_date,
        delivery_date,
        items = [],
        payment_method = 'cash',
        notes
      } = req.body;

      if (!customer_id || !items.length) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'Customer and items are required'
        });
      }

      // Generate order number
      const orderCount = await SalesOrder.count();
      const order_number = `SO${String(orderCount + 1).padStart(6, '0')}`;

      // Calculate totals
      let subtotal_amount = 0;
      let total_amount = 0;

      const orderItems = [];
      for (const item of items) {
        const variant = await ProductVariant.findByPk(item.variant_id);
        if (!variant) {
          await transaction.rollback();
          return res.status(400).json({
            success: false,
            message: `Variant ${item.variant_id} not found`
          });
        }

        const unit_price = item.unit_price || variant.mrp;
        const qty = item.qty;
        const total = qty * unit_price;

        subtotal_amount += total;
        total_amount += total;

        orderItems.push({
          variant_id: item.variant_id,
          qty,
          unit_price,
          total
        });
      }

      // Create sales order
      const salesOrder = await SalesOrder.create({
        order_number,
        customer_id,
        branch_id: branch_id || req.user.branch_id,
        order_type: 'pos',
        order_date: order_date || new Date(),
        delivery_date,
        status: 'PAID',
        subtotal_amount,
        total_amount,
        tax_amount: 0,
        discount_amount: 0,
        payment_terms: payment_method,
        notes,
        created_by: req.user.id
      }, { transaction });

      // Create order items
      for (const item of orderItems) {
        await SalesOrderItem.create({
          sales_order_id: salesOrder.id,
          ...item
        }, { transaction });
      }

      await transaction.commit();

      // Fetch created order with associations
      const createdOrder = await SalesOrder.findByPk(salesOrder.id, {
        include: [
          {
            model: Customer,
            attributes: ['id', 'name', 'contact_name', 'phone']
          },
          {
            model: SalesOrderItem,
            include: [
              {
                model: ProductVariant,
                include: [{ model: Product }]
              }
            ]
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Billing created successfully',
        data: createdOrder
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Create billing error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create billing',
        error: error.message
      });
    }
  },

  // Get billing summary/stats
  async getBillingSummary(req, res) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [todayStats, totalStats] = await Promise.all([
        SalesOrder.findAll({
          where: {
            created_at: { [Op.gte]: today },
            status: 'PAID'
          },
          attributes: [
            [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            [sequelize.fn('SUM', sequelize.col('total_amount')), 'total']
          ],
          raw: true
        }),
        SalesOrder.findAll({
          where: { status: 'PAID' },
          attributes: [
            [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
            [sequelize.fn('SUM', sequelize.col('total_amount')), 'total']
          ],
          raw: true
        })
      ]);

      res.json({
        success: true,
        data: {
          today: {
            count: todayStats[0]?.count || 0,
            total: parseFloat(todayStats[0]?.total || 0)
          },
          overall: {
            count: totalStats[0]?.count || 0,
            total: parseFloat(totalStats[0]?.total || 0)
          }
        }
      });
    } catch (error) {
      console.error('Get billing summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch billing summary',
        error: error.message
      });
    }
  }
};

module.exports = billingController;
