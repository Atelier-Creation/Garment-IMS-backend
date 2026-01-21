const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const ProductionOrder = sequelize.define('ProductionOrder', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    production_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    bom_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    product_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    variant_id: {
      type: DataTypes.CHAR(36),
      allowNull: true
    },
    planned_qty: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    produced_qty: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'),
      defaultValue: 'PLANNED'
    },
    start_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    end_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    branch_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    created_by: {
      type: DataTypes.CHAR(36),
      allowNull: true
    }
  }, {
    tableName: 'production_orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return ProductionOrder;
};