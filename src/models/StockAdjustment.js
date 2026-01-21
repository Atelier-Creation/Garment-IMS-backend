const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const StockAdjustment = sequelize.define('StockAdjustment', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    reference_table: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    reference_id: {
      type: DataTypes.CHAR(36),
      allowNull: true
    },
    item_type: {
      type: DataTypes.ENUM('RAW', 'FINISHED'),
      allowNull: true
    },
    item_id: {
      type: DataTypes.CHAR(36),
      allowNull: true
    },
    branch_id: {
      type: DataTypes.CHAR(36),
      allowNull: true
    },
    qty: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: true
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    adjusted_by: {
      type: DataTypes.CHAR(36),
      allowNull: true
    }
  }, {
    tableName: 'stock_adjustments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return StockAdjustment;
};