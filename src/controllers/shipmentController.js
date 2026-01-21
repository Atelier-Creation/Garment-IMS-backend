const { Shipment, ExportOrder, Customer } = require('../models');
const { Op } = require('sequelize');

const shipmentController = {
  // Get all shipments with pagination and filtering
  async getAllShipments(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        status,
        exportOrderId,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Add search filter
      if (search) {
        whereClause[Op.or] = [
          { shipmentNumber: { [Op.like]: `%${search}%` } },
          { carrier: { [Op.like]: `%${search}%` } },
          { trackingNumber: { [Op.like]: `%${search}%` } }
        ];
      }

      // Add filters
      if (status) whereClause.status = status;
      if (exportOrderId) whereClause.exportOrderId = exportOrderId;

      const { count, rows } = await Shipment.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: ExportOrder,
            attributes: ['id', 'exportNumber', 'portOfLoading', 'portOfDestination'],
            include: [
              {
                model: Customer,
                attributes: ['id', 'name', 'contactName']
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
          shipments: rows,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get shipments error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch shipments',
        error: error.message
      });
    }
  },

  // Get shipment by ID
  async getShipmentById(req, res) {
    try {
      const { id } = req.params;

      const shipment = await Shipment.findByPk(id, {
        include: [
          {
            model: ExportOrder,
            attributes: ['id', 'exportNumber', 'portOfLoading', 'portOfDestination', 'totalValue'],
            include: [
              {
                model: Customer,
                attributes: ['id', 'name', 'contactName', 'email', 'address']
              }
            ]
          }
        ]
      });

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found'
        });
      }

      res.json({
        success: true,
        data: shipment
      });
    } catch (error) {
      console.error('Get shipment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch shipment',
        error: error.message
      });
    }
  },

  // Create new shipment
  async createShipment(req, res) {
    try {
      const {
        exportOrderId,
        carrier,
        trackingNumber,
        shippedAt
      } = req.body;

      // Validate required fields
      if (!exportOrderId || !carrier) {
        return res.status(400).json({
          success: false,
          message: 'Export order ID and carrier are required'
        });
      }

      // Check if export order exists
      const exportOrder = await ExportOrder.findByPk(exportOrderId);
      if (!exportOrder) {
        return res.status(404).json({
          success: false,
          message: 'Export order not found'
        });
      }

      // Check if export order is ready for shipment
      if (exportOrder.status !== 'BOOKED') {
        return res.status(400).json({
          success: false,
          message: 'Export order must be booked before creating shipment'
        });
      }

      // Generate shipment number
      const shipmentNumber = `SHP-${Date.now()}`;

      // Create shipment
      const shipment = await Shipment.create({
        shipmentNumber,
        exportOrderId,
        carrier,
        trackingNumber,
        shippedAt: shippedAt || new Date(),
        status: 'IN_TRANSIT'
      });

      // Update export order status
      await exportOrder.update({ status: 'SHIPPED' });

      // Fetch created shipment with associations
      const createdShipment = await Shipment.findByPk(shipment.id, {
        include: [
          {
            model: ExportOrder,
            attributes: ['id', 'exportNumber'],
            include: [
              {
                model: Customer,
                attributes: ['id', 'name', 'contactName']
              }
            ]
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Shipment created successfully',
        data: createdShipment
      });
    } catch (error) {
      console.error('Create shipment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create shipment',
        error: error.message
      });
    }
  },

  // Update shipment
  async updateShipment(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const shipment = await Shipment.findByPk(id);
      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found'
        });
      }

      await shipment.update(updateData);

      const updatedShipment = await Shipment.findByPk(id, {
        include: [
          {
            model: ExportOrder,
            attributes: ['id', 'exportNumber'],
            include: [
              {
                model: Customer,
                attributes: ['id', 'name', 'contactName']
              }
            ]
          }
        ]
      });

      res.json({
        success: true,
        message: 'Shipment updated successfully',
        data: updatedShipment
      });
    } catch (error) {
      console.error('Update shipment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update shipment',
        error: error.message
      });
    }
  },

  // Delete shipment
  async deleteShipment(req, res) {
    try {
      const { id } = req.params;

      const shipment = await Shipment.findByPk(id);
      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found'
        });
      }

      // Check if shipment can be deleted
      if (shipment.status === 'DELIVERED') {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete delivered shipment'
        });
      }

      await shipment.destroy();

      res.json({
        success: true,
        message: 'Shipment deleted successfully'
      });
    } catch (error) {
      console.error('Delete shipment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete shipment',
        error: error.message
      });
    }
  },

  // Update shipment status
  async updateShipmentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const validStatuses = ['READY', 'IN_TRANSIT', 'DELIVERED', 'DELAYED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status'
        });
      }

      const shipment = await Shipment.findByPk(id, {
        include: [{ model: ExportOrder }]
      });

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found'
        });
      }

      const updateData = { status };

      // Set delivered date if status is delivered
      if (status === 'DELIVERED') {
        updateData.deliveredAt = new Date();
        // Update export order status
        if (shipment.ExportOrder) {
          await shipment.ExportOrder.update({ status: 'DELIVERED' });
        }
      }

      await shipment.update(updateData);

      res.json({
        success: true,
        message: 'Shipment status updated successfully',
        data: shipment
      });
    } catch (error) {
      console.error('Update shipment status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update shipment status',
        error: error.message
      });
    }
  },

  // Track shipment
  async trackShipment(req, res) {
    try {
      const { trackingNumber } = req.params;

      const shipment = await Shipment.findOne({
        where: { trackingNumber },
        include: [
          {
            model: ExportOrder,
            attributes: ['id', 'exportNumber', 'portOfLoading', 'portOfDestination'],
            include: [
              {
                model: Customer,
                attributes: ['id', 'name', 'contactName']
              }
            ]
          }
        ]
      });

      if (!shipment) {
        return res.status(404).json({
          success: false,
          message: 'Shipment not found with this tracking number'
        });
      }

      const trackingInfo = {
        shipmentNumber: shipment.shipmentNumber,
        trackingNumber: shipment.trackingNumber,
        carrier: shipment.carrier,
        status: shipment.status,
        shippedAt: shipment.shippedAt,
        deliveredAt: shipment.deliveredAt,
        exportOrder: shipment.ExportOrder
      };

      res.json({
        success: true,
        data: trackingInfo
      });
    } catch (error) {
      console.error('Track shipment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to track shipment',
        error: error.message
      });
    }
  }
};

module.exports = shipmentController;