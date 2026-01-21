const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize, DataTypes) => {
  const Session = sequelize.define('Session', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: () => uuidv4()
    },
    user_id: {
      type: DataTypes.CHAR(36),
      allowNull: false
    },
    token: {
      type: DataTypes.STRING(512),
      allowNull: false
    },
    user_agent: {
      type: DataTypes.STRING(512),
      allowNull: true
    },
    ip: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'sessions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  return Session;
};