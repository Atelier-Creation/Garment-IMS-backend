const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const RawMaterial = sequelize.define('RawMaterial', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    material_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    uom: {
      type: DataTypes.STRING(30),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    average_cost: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    is_active: {
      type: DataTypes.TINYINT(1),
      defaultValue: 1
    }
  }, {
    tableName: 'raw_materials',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return RawMaterial;
};