const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const ProductionConsumption = sequelize.define('ProductionConsumption', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    production_order_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    raw_material_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    batch_id: {
      type: DataTypes.CHAR(36),
      allowNull: true
    },
    qty: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false
    },
    unit_cost: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    }
  }, {
    tableName: 'production_consumptions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return ProductionConsumption;
};