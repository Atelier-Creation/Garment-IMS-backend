const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const ExportOrder = sequelize.define('ExportOrder', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    export_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    customer_id: {
      type: DataTypes.CHAR(36),
      allowNull: true
    },
    port_of_loading: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    port_of_destination: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    incoterms: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('PENDING', 'BOOKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'),
      defaultValue: 'PENDING'
    },
    total_value: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true
    }
  }, {
    tableName: 'export_orders',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return ExportOrder;
};