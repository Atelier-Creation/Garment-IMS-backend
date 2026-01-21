const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    user_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      comment: 'ID of the user who performed the action'
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'Type of action performed (CREATE, UPDATE, DELETE, etc.)'
    },
    entity_type: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'Type of entity affected (users, roles, products, etc.)'
    },
    entity_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      comment: 'ID of the specific entity affected'
    },
    old_values: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Previous values before the change (for UPDATE operations)'
    },
    new_values: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'New values after the change (for CREATE/UPDATE operations)'
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
      comment: 'IP address of the client'
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'User agent string of the client'
    },
    additional_info: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Additional context information'
    }
  }, {
    tableName: 'audit_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return AuditLog;
};