const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const RawMaterialBatch = sequelize.define('RawMaterialBatch', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    raw_material_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    batch_code: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    qty: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    cost_per_unit: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    branch_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    received_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    supplier_id: {
      type: DataTypes.CHAR(36),
      allowNull: true
    },
    purchase_order_id: {
      type: DataTypes.CHAR(36),
      allowNull: true
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'raw_material_batches',
    timestamps: false
  });

  return RawMaterialBatch;
};