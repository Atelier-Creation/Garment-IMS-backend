const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Permission = sequelize.define('Permission', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Permission category (e.g., Inventory, Sales, Users)'
    },
    subcategory: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Permission subcategory (e.g., Products, Orders, Roles)'
    }
  }, {
    tableName: 'permissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return Permission;
};