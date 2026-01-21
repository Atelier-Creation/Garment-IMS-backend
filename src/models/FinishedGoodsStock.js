const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const FinishedGoodsStock = sequelize.define('FinishedGoodsStock', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    variant_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    branch_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    qty: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    reserved_qty: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'finished_goods_stock',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        unique: true,
        fields: ['variant_id', 'branch_id']
      }
    ]
  });

  return FinishedGoodsStock;
};