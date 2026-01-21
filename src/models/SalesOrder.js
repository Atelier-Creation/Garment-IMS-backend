const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const SalesOrder = sequelize.define('SalesOrder', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    order_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    customer_id: {
      type: DataTypes.CHAR(36),
      allowNull: true
    },
    branch_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    order_type: {
      type: DataTypes.STRING(50),
      defaultValue: 'standard'
    },
    reference_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    order_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    delivery_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    shipping_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    tracking_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'CONFIRMED', 'PAID', 'CANCELLED', 'RETURNED'),
      defaultValue: 'DRAFT'
    },
    subtotal_amount: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0.00
    },
    total_amount: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0.00
    },
    tax_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    discount_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    shipping_address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    billing_address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    payment_terms: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    created_by: {
      type: DataTypes.CHAR(36),
      allowNull: true
    }
  }, {
    tableName: 'sales_orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return SalesOrder;
};