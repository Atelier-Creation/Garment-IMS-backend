const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    product_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    product_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    category_id: {
      type: DataTypes.CHAR(36),
      allowNull: true
    },
    sub_category_id: {
      type: DataTypes.CHAR(36),
      allowNull: true
    },
    brand: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    fabric: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    gender: {
      type: DataTypes.ENUM('MEN', 'WOMEN', 'KIDS', 'UNISEX'),
      allowNull: true
    },
    season: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    base_price: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    is_active: {
      type: DataTypes.TINYINT(1),
      defaultValue: 1
    }
  }, {
    tableName: 'products',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return Product;
};