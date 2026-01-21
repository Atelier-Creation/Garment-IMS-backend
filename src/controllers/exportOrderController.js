const { ExportOrder, ExportOrderItem, Customer, Product, ProductVariant, Shipment, User } = require('../models');
const { Op } = require('sequelize');

const exportOrderController = {
  // Get all export orders with pagination and filtering
  async getAllExportOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        customerId,
        sortBy = 'created_at',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Add search filter
      if (search) {
        whereClause[Op.or] = [
          { export_number: { [Op.like]: `%${search}%` } },
          { port_of_loading: { [Op.like]: `%${search}%` } },
          { port_of_destination: { [Op.like]: `%${search}%` } }
        ];
      }

      // Add filters
      if (status) whereClause.status = status;
      if (customerId) whereClause.customer_id = customerId;

      const { count, rows } = await ExportOrder.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: Customer,
            attributes: ['id', 'name', 'contact_name', 'email']
          },
          {
            model: ExportOrderItem,
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
          },
          {
            model: Shipment,
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
          exportOrders: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get export orders error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch export orders',
        error: error.message
      });
    }
  },

  // Get export order by ID
  async getExportOrderById(req, res) {
    try {
      const { id } = req.params;

      const exportOrder = await ExportOrder.findByPk(id, {
        include: [
          {
            model: Customer,
            attributes: ['id', 'name', 'contact_name', 'email', 'address']
          },
          {
            model: ExportOrderItem,
            include: [
              {
                model: ProductVariant,
                attributes: ['id', 'sku', 'size', 'color', 'mrp', 'cost_price'],
                include: [
                  {
                    model: Product,
                    attributes: ['id', 'product_name', 'product_code', 'brand']
                  }
                ]
              }
            ]
          },
          {
            model: Shipment,
            required: false
          }
        ]
      });

      if (!exportOrder) {
        return res.status(404).json({
          success: false,
          message: 'Export order not found'
        });
      }

      res.json({
        success: true,
        data: exportOrder
      });
    } catch (error) {
      console.error('Get export order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch export order',
        error: error.message
      });
    }
  },

  // Create new export order
  async createExportOrder(req, res) {
    try {
      const {
        customer_id,
        port_of_loading,
        port_of_destination,
        incoterms,
        items = []
      } = req.body;

      // Validate required fields
      if (!customer_id || !items.length) {
        return res.status(400).json({
          success: false,
          message: 'Customer ID and items are required'
        });
      }

      // Generate export number
      const export_number = `EXP-${Date.now()}`;

      // Calculate total value
      const totalValue = items.reduce((sum, item) => {
        return sum + (item.qty * item.unit_price);
      }, 0);

      // Create export order
      const exportOrder = await ExportOrder.create({
        export_number,
        customer_id,
        port_of_loading,
        port_of_destination,
        incoterms,
        total_value: totalValue,
        status: 'PENDING'
      });

      // Create export order items
      const exportOrderItems = items.map(item => ({
        export_order_id: exportOrder.id,
        variant_id: item.variant_id,
        qty: item.qty,
        unit_price: item.unit_price,
        total: item.qty * item.unit_price
      }));

      await ExportOrderItem.bulkCreate(exportOrderItems);

      // Fetch created export order with associations
      const createdExportOrder = await ExportOrder.findByPk(exportOrder.id, {
        include: [
          {
            model: Customer,
            attributes: ['id', 'name', 'contact_name']
          },
          {
            model: ExportOrderItem,
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
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Export order created successfully',
        data: createdExportOrder
      });
    } catch (error) {
      console.error('Create export order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create export order',
        error: error.message
      });
    }
  },

  // Update export order
  async updateExportOrder(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const exportOrder = await ExportOrder.findByPk(id);
      if (!exportOrder) {
        return res.status(404).json({
          success: false,
          message: 'Export order not found'
        });
      }

      // Check if export order can be modified
      if (exportOrder.status === 'SHIPPED' || exportOrder.status === 'DELIVERED') {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify shipped or delivered export order'
        });
      }

      await exportOrder.update(updateData);

      const updatedExportOrder = await ExportOrder.findByPk(id, {
        include: [
          {
            model: Customer,
            attributes: ['id', 'name', 'contact_name']
          },
          {
            model: ExportOrderItem,
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
        ]
      });

      res.json({
        success: true,
        message: 'Export order updated successfully',
        data: updatedExportOrder
      });
    } catch (error) {
      console.error('Update export order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update export order',
        error: error.message
      });
    }
  },

  // Delete export order
  async deleteExportOrder(req, res) {
    try {
      const { id } = req.params;

      const exportOrder = await ExportOrder.findByPk(id);
      if (!exportOrder) {
        return res.status(404).json({
          success: false,
          message: 'Export order not found'
        });
      }

      // Check if export order can be deleted
      if (exportOrder.status !== 'PENDING') {
        return res.status(400).json({
          success: false,
          message: 'Can only delete pending export orders'
        });
      }

      // Delete export order items first
      await ExportOrderItem.destroy({ where: { export_order_id: id } });

      // Delete export order
      await exportOrder.destroy();

      res.json({
        success: true,
        message: 'Export order deleted successfully'
      });
    } catch (error) {
      console.error('Delete export order error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete export order',
        error: error.message
      });
    }
  },

  // Update export order status
  async updateExportOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['PENDING', 'BOOKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const exportOrder = await ExportOrder.findByPk(id);
      if (!exportOrder) {
        return res.status(404).json({
          success: false,
          message: 'Export order not found'
        });
      }

      await exportOrder.update({ status });

      res.json({
        success: true,
        message: 'Export order status updated successfully',
        data: exportOrder
      });
    } catch (error) {
      console.error('Update export order status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update export order status',
        error: error.message
      });
    }
  }
};

module.exports = exportOrderController;