'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create stock_adjustments table
    await queryInterface.createTable('stock_adjustments', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      reference_table: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      reference_id: {
        type: Sequelize.CHAR(36),
        allowNull: true
      },
      item_type: {
        type: Sequelize.ENUM('RAW', 'FINISHED'),
        allowNull: true
      },
      item_id: {
        type: Sequelize.CHAR(36),
        allowNull: true
      },
      branch_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'branches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      qty: {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: true
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      adjusted_by: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create audit_logs table
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      action: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      target_table: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      target_id: {
        type: Sequelize.CHAR(36),
        allowNull: true
      },
      payload: {
        type: Sequelize.JSON,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('stock_adjustments', ['reference_table', 'reference_id']);
    await queryInterface.addIndex('stock_adjustments', ['item_type', 'item_id']);
    await queryInterface.addIndex('stock_adjustments', ['branch_id']);
    await queryInterface.addIndex('audit_logs', ['user_id']);
    await queryInterface.addIndex('audit_logs', ['target_table', 'target_id']);
    await queryInterface.addIndex('audit_logs', ['action']);
    await queryInterface.addIndex('audit_logs', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('stock_adjustments');
  }
};