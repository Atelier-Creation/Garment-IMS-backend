const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const BOM = sequelize.define('BOM', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    product_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    version: {
      type: DataTypes.STRING(50),
      defaultValue: '1.0'
    },
    unit_yield: {
      type: DataTypes.DECIMAL(12, 4),
      defaultValue: 1.0
    }
  }, {
    tableName: 'boms',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return BOM;
};