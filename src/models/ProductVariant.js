const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const ProductVariant = sequelize.define('ProductVariant', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    product_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    sku: {
      type: DataTypes.STRING(150),
      allowNull: true,
      unique: true
    },
    size: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    barcode: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    mrp: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    cost_price: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    }
  }, {
    tableName: 'product_variants',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return ProductVariant;
};