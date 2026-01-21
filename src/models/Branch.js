const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Branch = sequelize.define('Branch', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(30),
      allowNull: true
    },
    type: {
      type: DataTypes.ENUM('FACTORY', 'WAREHOUSE', 'SHOP'),
      defaultValue: 'WAREHOUSE'
    }
  }, {
    tableName: 'branches',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return Branch;
};