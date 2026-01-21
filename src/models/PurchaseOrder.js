const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const PurchaseOrder = sequelize.define('PurchaseOrder', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    po_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    supplier_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    branch_id: {
      type: DataTypes.CHAR(36),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('DRAFT', 'PLACED', 'RECEIVED', 'PARTIAL', 'CANCELLED'),
      defaultValue: 'DRAFT'
    },
    total_amount: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0.00
    },
    ordered_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    expected_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    created_by: {
      type: DataTypes.CHAR(36),
      allowNull: true
    }
  }, {
    tableName: 'purchase_orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return PurchaseOrder;
};