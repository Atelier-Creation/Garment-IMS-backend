const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const ProductionOutput = sequelize.define('ProductionOutput', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    production_order_id: {
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
    unit_cost: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    }
  }, {
    tableName: 'production_outputs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return ProductionOutput;
};