const { Customer, SalesOrder } = require('../models');
const { Op } = require('sequelize');

const getAllCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, type } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { contactName: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    if (status) {
      whereClause.status = status;
    }
    if (type) {
      whereClause.customerType = type;
    }

    const { count, rows } = await Customer.findAndCountAll({
      where: whereClause,
      include: [{
        model: SalesOrder,
        required: false,
        attributes: ['id', 'order_number', 'status', 'total_amount']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        customers: rows,
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
      message: 'Failed to fetch customers',
      error: error.message
    });
  }
};

const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const customer = await Customer.findByPk(id, {
      include: [{
        model: SalesOrder,
        required: false,
        limit: 10,
        order: [['created_at', 'DESC']]
      }]
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
      error: error.message
    });
  }
};

const createCustomer = async (req, res) => {
  try {
    const {
      name,
      customerType,
      contactName,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      taxNumber,
      paymentTerms,
      creditLimit,
      notes
    } = req.body;

    const customer = await Customer.create({
      name,
      customerType: customerType || 'retail',
      contactName,
      email,
      phone,
      address,
      city,
      state,
      country,
      postalCode,
      taxNumber,
      paymentTerms,
      creditLimit,
      notes,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
      error: error.message
    });
  }
};

const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const [updatedRows] = await Customer.update(updateData, {
      where: { id }
    });

    if (updatedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const customer = await Customer.findByPk(id);

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: customer
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
      error: error.message
    });
  }
};

const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if customer has active sales orders
    const activeSOs = await SalesOrder.count({
      where: {
        customerId: id,
        status: { [Op.in]: ['pending', 'confirmed', 'processing'] }
      }
    });

    if (activeSOs > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete customer with active sales orders'
      });
    }

    const deletedRows = await Customer.destroy({
      where: { id }
    });

    if (deletedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
      error: error.message
    });
  }
};

const getCustomerSalesOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = { customerId: id };
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await SalesOrder.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        salesOrders: rows,
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
      message: 'Failed to fetch customer sales orders',
      error: error.message
    });
  }
};

module.exports = {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerSalesOrders,
  // Legacy exports for backward compatibility
  getCustomers: getAllCustomers
};