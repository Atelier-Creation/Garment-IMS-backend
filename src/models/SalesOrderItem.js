const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const SalesOrderItem = sequelize.define('SalesOrderItem', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    sales_order_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    variant_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    qty: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    unit_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    total: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false
    }
  }, {
    tableName: 'sales_order_items',
    timestamps: false,
    hooks: {
      beforeSave: (item) => {
        item.total = item.qty * item.unit_price;
      }
    }
  });

  return SalesOrderItem;
};