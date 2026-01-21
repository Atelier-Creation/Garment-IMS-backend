const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const PosTransaction = sequelize.define('PosTransaction', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    sales_order_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    paid_amount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false
    },
    payment_method: {
      type: DataTypes.ENUM('CASH', 'CARD', 'UPI', 'NETBANKING', 'CREDIT'),
      defaultValue: 'CASH'
    },
    transaction_reference: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'pos_transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return PosTransaction;
};