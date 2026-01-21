const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const PurchaseOrderItem = sequelize.define('PurchaseOrderItem', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    purchase_order_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    raw_material_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    qty: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    received_quantity: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00,
      allowNull: false
    },
    unit_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    tax: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    total: {
      type: DataTypes.DECIMAL(14, 2),
      defaultValue: 0.00
    }
  }, {
    tableName: 'purchase_order_items',
    timestamps: false,
    hooks: {
      beforeSave: (item) => {
        item.total = (item.qty * item.unit_price) + item.tax;
      }
    }
  });

  return PurchaseOrderItem;
};