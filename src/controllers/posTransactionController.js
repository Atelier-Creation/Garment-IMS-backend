const { PosTransaction, SalesOrder, Customer } = require('../models');
const { Op } = require('sequelize');

const posTransactionController = {
  // Get all POS transactions with pagination and filtering
  async getAllPosTransactions(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        paymentMethod,
        salesOrderId,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      // Add search filter
      if (search) {
        whereClause[Op.or] = [
          { transactionReference: { [Op.like]: `%${search}%` } },
          { '$SalesOrder.orderNumber$': { [Op.like]: `%${search}%` } }
        ];
      }

      // Add filters
      if (paymentMethod) whereClause.paymentMethod = paymentMethod;
      if (salesOrderId) whereClause.salesOrderId = salesOrderId;

      // Add date range filter
      if (startDate && endDate) {
        whereClause.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      } else if (startDate) {
        whereClause.createdAt = {
          [Op.gte]: new Date(startDate)
        };
      } else if (endDate) {
        whereClause.createdAt = {
          [Op.lte]: new Date(endDate)
        };
      }

      const { count, rows } = await PosTransaction.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: SalesOrder,
            attributes: ['id', 'orderNumber', 'totalAmount', 'status'],
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

      // Calculate summary statistics
      const totalAmount = rows.reduce((sum, transaction) => sum + parseFloat(transaction.paidAmount || 0), 0);

      res.json({
        success: true,
        data: {
          posTransactions: rows,
          summary: {
            totalTransactions: count,
            totalAmount: totalAmount.toFixed(2)
          },
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Get POS transactions error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch POS transactions',
        error: error.message
      });
    }
  },

  // Get POS transaction by ID
  async getPosTransactionById(req, res) {
    try {
      const { id } = req.params;

      const posTransaction = await PosTransaction.findByPk(id, {
        include: [
          {
            model: SalesOrder,
            attributes: ['id', 'orderNumber', 'totalAmount', 'status', 'orderDate'],
            include: [
              {
                model: Customer,
                attributes: ['id', 'name', 'contactName', 'email', 'phone']
              }
            ]
          }
        ]
      });

      if (!posTransaction) {
        return res.status(404).json({
          success: false,
          message: 'POS transaction not found'
        });
      }

      res.json({
        success: true,
        data: posTransaction
      });
    } catch (error) {
      console.error('Get POS transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch POS transaction',
        error: error.message
      });
    }
  },

  // Create new POS transaction
  async createPosTransaction(req, res) {
    try {
      const {
        salesOrderId,
        paidAmount,
        paymentMethod,
        transactionReference
      } = req.body;

      // Validate required fields
      if (!salesOrderId || !paidAmount || !paymentMethod) {
        return res.status(400).json({
          success: false,
          message: 'Sales order ID, paid amount, and payment method are required'
        });
      }

      // Check if sales order exists
      const salesOrder = await SalesOrder.findByPk(salesOrderId);
      if (!salesOrder) {
        return res.status(404).json({
          success: false,
          message: 'Sales order not found'
        });
      }

      // Validate payment amount
      if (parseFloat(paidAmount) <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Paid amount must be greater than zero'
        });
      }

      // Check if payment amount doesn't exceed order total
      if (parseFloat(paidAmount) > parseFloat(salesOrder.totalAmount)) {
        return res.status(400).json({
          success: false,
          message: 'Paid amount cannot exceed order total'
        });
      }

      // Create POS transaction
      const posTransaction = await PosTransaction.create({
        salesOrderId,
        paidAmount,
        paymentMethod,
        transactionReference
      });

      // Check if order is fully paid
      const totalPaid = await PosTransaction.sum('paidAmount', {
        where: { salesOrderId }
      });

      if (totalPaid >= parseFloat(salesOrder.totalAmount)) {
        await salesOrder.update({ status: 'paid' });
      } else {
        await salesOrder.update({ status: 'partially_paid' });
      }

      // Fetch created transaction with associations
      const createdTransaction = await PosTransaction.findByPk(posTransaction.id, {
        include: [
          {
            model: SalesOrder,
            attributes: ['id', 'orderNumber', 'totalAmount'],
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
        message: 'POS transaction created successfully',
        data: createdTransaction
      });
    } catch (error) {
      console.error('Create POS transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create POS transaction',
        error: error.message
      });
    }
  },

  // Update POS transaction
  async updatePosTransaction(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const posTransaction = await PosTransaction.findByPk(id);
      if (!posTransaction) {
        return res.status(404).json({
          success: false,
          message: 'POS transaction not found'
        });
      }

      await posTransaction.update(updateData);

      const updatedTransaction = await PosTransaction.findByPk(id, {
        include: [
          {
            model: SalesOrder,
            attributes: ['id', 'orderNumber', 'totalAmount'],
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
        message: 'POS transaction updated successfully',
        data: updatedTransaction
      });
    } catch (error) {
      console.error('Update POS transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update POS transaction',
        error: error.message
      });
    }
  },

  // Delete POS transaction
  async deletePosTransaction(req, res) {
    try {
      const { id } = req.params;

      const posTransaction = await PosTransaction.findByPk(id, {
        include: [{ model: SalesOrder }]
      });

      if (!posTransaction) {
        return res.status(404).json({
          success: false,
          message: 'POS transaction not found'
        });
      }

      const salesOrderId = posTransaction.salesOrderId;
      const paidAmount = posTransaction.paidAmount;

      await posTransaction.destroy();

      // Recalculate payment status for the sales order
      const remainingPaid = await PosTransaction.sum('paidAmount', {
        where: { salesOrderId }
      }) || 0;

      const salesOrder = posTransaction.SalesOrder;
      if (remainingPaid >= parseFloat(salesOrder.totalAmount)) {
        await salesOrder.update({ status: 'paid' });
      } else if (remainingPaid > 0) {
        await salesOrder.update({ status: 'partially_paid' });
      } else {
        await salesOrder.update({ status: 'confirmed' });
      }

      res.json({
        success: true,
        message: 'POS transaction deleted successfully'
      });
    } catch (error) {
      console.error('Delete POS transaction error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete POS transaction',
        error: error.message
      });
    }
  },

  // Get payment summary for a sales order
  async getPaymentSummary(req, res) {
    try {
      const { salesOrderId } = req.params;

      const salesOrder = await SalesOrder.findByPk(salesOrderId, {
        include: [
          {
            model: Customer,
            attributes: ['id', 'name', 'contactName']
          }
        ]
      });

      if (!salesOrder) {
        return res.status(404).json({
          success: false,
          message: 'Sales order not found'
        });
      }

      const transactions = await PosTransaction.findAll({
        where: { salesOrderId },
        order: [['createdAt', 'DESC']]
      });

      const totalPaid = transactions.reduce((sum, transaction) => {
        return sum + parseFloat(transaction.paidAmount || 0);
      }, 0);

      const orderTotal = parseFloat(salesOrder.totalAmount || 0);
      const remainingAmount = orderTotal - totalPaid;

      const paymentSummary = {
        salesOrder: {
          id: salesOrder.id,
          orderNumber: salesOrder.orderNumber,
          customer: salesOrder.Customer,
          totalAmount: orderTotal,
          status: salesOrder.status
        },
        paymentDetails: {
          totalPaid: totalPaid.toFixed(2),
          remainingAmount: remainingAmount.toFixed(2),
          paymentStatus: remainingAmount <= 0 ? 'Fully Paid' : remainingAmount < orderTotal ? 'Partially Paid' : 'Unpaid'
        },
        transactions
      };

      res.json({
        success: true,
        data: paymentSummary
      });
    } catch (error) {
      console.error('Get payment summary error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment summary',
        error: error.message
      });
    }
  },

  // Get payment method statistics
  async getPaymentMethodStats(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const whereClause = {};

      // Add date range filter
      if (startDate && endDate) {
        whereClause.createdAt = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      const stats = await PosTransaction.findAll({
        attributes: [
          'paymentMethod',
          [sequelize.fn('COUNT', sequelize.col('id')), 'transactionCount'],
          [sequelize.fn('SUM', sequelize.col('paidAmount')), 'totalAmount']
        ],
        where: whereClause,
        group: ['paymentMethod'],
        raw: true
      });

      const totalTransactions = stats.reduce((sum, stat) => sum + parseInt(stat.transactionCount), 0);
      const totalAmount = stats.reduce((sum, stat) => sum + parseFloat(stat.totalAmount || 0), 0);

      const formattedStats = stats.map(stat => ({
        paymentMethod: stat.paymentMethod,
        transactionCount: parseInt(stat.transactionCount),
        totalAmount: parseFloat(stat.totalAmount || 0).toFixed(2),
        percentage: totalTransactions > 0 ? ((parseInt(stat.transactionCount) / totalTransactions) * 100).toFixed(2) : '0.00'
      }));

      res.json({
        success: true,
        data: {
          paymentMethodStats: formattedStats,
          summary: {
            totalTransactions,
            totalAmount: totalAmount.toFixed(2)
          }
        }
      });
    } catch (error) {
      console.error('Get payment method stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment method statistics',
        error: error.message
      });
    }
  }
};

module.exports = posTransactionController;