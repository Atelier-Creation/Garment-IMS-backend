const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const FinishedGoodsStockMovement = sequelize.define('FinishedGoodsStockMovement', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    variant_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    branch_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    movement_type: {
      type: DataTypes.ENUM('IN', 'OUT', 'SALE', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT', 'PRODUCTION_OUTPUT'),
      allowNull: false
    },
    qty: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    unit_cost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    reference_table: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    reference_id: {
      type: DataTypes.CHAR(36),
      allowNull: true
    },
    created_by: {
      type: DataTypes.CHAR(36),
      allowNull: true
    }
  }, {
    tableName: 'finished_goods_stock_movements',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return FinishedGoodsStockMovement;
};