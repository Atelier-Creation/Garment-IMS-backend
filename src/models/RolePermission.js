const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const RolePermission = sequelize.define('RolePermission', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    role_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    permission_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    }
  }, {
    tableName: 'role_permissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return RolePermission;
};