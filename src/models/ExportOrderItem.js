const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const ExportOrderItem = sequelize.define('ExportOrderItem', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    export_order_id: {
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
      allowNull: true
    },
    total: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true
    }
  }, {
    tableName: 'export_order_items',
    timestamps: false,
    hooks: {
      beforeSave: (item) => {
        if (item.unit_price) {
          item.total = item.qty * item.unit_price;
        }
      }
    }
  });

  return ExportOrderItem;
};