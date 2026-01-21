const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Subcategory = sequelize.define('Subcategory', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    category_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false
    }
  }, {
    tableName: 'subcategories',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return Subcategory;
};