const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Shipment = sequelize.define('Shipment', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    shipment_number: {
      type: DataTypes.STRING(150),
      allowNull: true,
      unique: true
    },
    export_order_id: {
      type: DataTypes.CHAR(36),
      allowNull: true
    },
    carrier: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    tracking_number: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    shipped_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    delivered_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('READY', 'IN_TRANSIT', 'DELIVERED', 'DELAYED'),
      defaultValue: 'READY'
    }
  }, {
    tableName: 'shipments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return Shipment;
};