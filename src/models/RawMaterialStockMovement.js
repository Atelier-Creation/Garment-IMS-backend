const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const RawMaterialStockMovement = sequelize.define('RawMaterialStockMovement', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    raw_material_batch_id: {
      type: DataTypes.CHAR(36),
      allowNull: true
    },
    raw_material_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    branch_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    movement_type: {
      type: DataTypes.ENUM('IN', 'OUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT'),
      allowNull: false
    },
    qty: {
      type: DataTypes.DECIMAL(12, 2),
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
    tableName: 'raw_material_stock_movements',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return RawMaterialStockMovement;
};