const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const BOMItem = sequelize.define('BOMItem', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    bom_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    raw_material_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    qty_per_unit: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: false
    },
    wastage_percent: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.0
    }
  }, {
    tableName: 'bom_items',
    timestamps: false
  });

  return BOMItem;
};