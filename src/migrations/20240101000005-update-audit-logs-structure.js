'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table exists and get current structure
    const tableExists = await queryInterface.showAllTables().then(tables => 
      tables.includes('audit_logs')
    );

    if (tableExists) {
      // Get current table description
      const tableDescription = await queryInterface.describeTable('audit_logs');
      
      // Add new columns if they don't exist
      if (!tableDescription.entity_type) {
        await queryInterface.addColumn('audit_logs', 'entity_type', {
          type: Sequelize.STRING(100),
          allowNull: false,
          defaultValue: 'unknown',
          comment: 'Type of entity affected (users, roles, products, etc.)'
        });
      }

      if (!tableDescription.entity_id) {
        await queryInterface.addColumn('audit_logs', 'entity_id', {
          type: Sequelize.CHAR(36),
          allowNull: true,
          comment: 'ID of the specific entity affected'
        });
      }

      if (!tableDescription.old_values) {
        await queryInterface.addColumn('audit_logs', 'old_values', {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Previous values before the change (for UPDATE operations)'
        });
      }

      if (!tableDescription.new_values) {
        await queryInterface.addColumn('audit_logs', 'new_values', {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'New values after the change (for CREATE/UPDATE operations)'
        });
      }

      if (!tableDescription.ip_address) {
        await queryInterface.addColumn('audit_logs', 'ip_address', {
          type: Sequelize.STRING(45),
          allowNull: true,
          comment: 'IP address of the client'
        });
      }

      if (!tableDescription.user_agent) {
        await queryInterface.addColumn('audit_logs', 'user_agent', {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'User agent string of the client'
        });
      }

      if (!tableDescription.additional_info) {
        await queryInterface.addColumn('audit_logs', 'additional_info', {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Additional context information'
        });
      }

      // Update action column to be NOT NULL with proper size
      if (tableDescription.action) {
        await queryInterface.changeColumn('audit_logs', 'action', {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Type of action performed (CREATE, UPDATE, DELETE, etc.)'
        });
      }

      // Ensure user_id has proper comment
      if (tableDescription.user_id) {
        await queryInterface.changeColumn('audit_logs', 'user_id', {
          type: Sequelize.CHAR(36),
          allowNull: true,
          comment: 'ID of the user who performed the action'
        });
      }

      // Migrate data from old columns to new columns if they exist
      if (tableDescription.target_table && tableDescription.entity_type) {
        await queryInterface.sequelize.query(`
          UPDATE audit_logs 
          SET entity_type = COALESCE(target_table, 'unknown') 
          WHERE entity_type IS NULL OR entity_type = ''
        `);
      }

      if (tableDescription.target_id && tableDescription.entity_id) {
        await queryInterface.sequelize.query(`
          UPDATE audit_logs 
          SET entity_id = target_id 
          WHERE entity_id IS NULL AND target_id IS NOT NULL
        `);
      }

      if (tableDescription.payload && tableDescription.new_values) {
        await queryInterface.sequelize.query(`
          UPDATE audit_logs 
          SET new_values = payload 
          WHERE new_values IS NULL AND payload IS NOT NULL
        `);
      }

      // Remove old columns if they exist
      if (tableDescription.target_table) {
        await queryInterface.removeColumn('audit_logs', 'target_table');
      }

      if (tableDescription.target_id) {
        await queryInterface.removeColumn('audit_logs', 'target_id');
      }

      if (tableDescription.payload) {
        await queryInterface.removeColumn('audit_logs', 'payload');
      }

    } else {
      // Create the table with the new structure
      await queryInterface.createTable('audit_logs', {
        id: {
          type: Sequelize.CHAR(36),
          primaryKey: true,
          allowNull: false
        },
        user_id: {
          type: Sequelize.CHAR(36),
          allowNull: true,
          comment: 'ID of the user who performed the action'
        },
        action: {
          type: Sequelize.STRING(50),
          allowNull: false,
          comment: 'Type of action performed (CREATE, UPDATE, DELETE, etc.)'
        },
        entity_type: {
          type: Sequelize.STRING(100),
          allowNull: false,
          comment: 'Type of entity affected (users, roles, products, etc.)'
        },
        entity_id: {
          type: Sequelize.CHAR(36),
          allowNull: true,
          comment: 'ID of the specific entity affected'
        },
        old_values: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Previous values before the change (for UPDATE operations)'
        },
        new_values: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'New values after the change (for CREATE/UPDATE operations)'
        },
        ip_address: {
          type: Sequelize.STRING(45),
          allowNull: true,
          comment: 'IP address of the client'
        },
        user_agent: {
          type: Sequelize.TEXT,
          allowNull: true,
          comment: 'User agent string of the client'
        },
        additional_info: {
          type: Sequelize.JSON,
          allowNull: true,
          comment: 'Additional context information'
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      });
    }

    // Add indexes for better query performance
    await queryInterface.addIndex('audit_logs', ['user_id'], {
      name: 'idx_audit_logs_user_id'
    });
    
    await queryInterface.addIndex('audit_logs', ['entity_type'], {
      name: 'idx_audit_logs_entity_type'
    });
    
    await queryInterface.addIndex('audit_logs', ['entity_id'], {
      name: 'idx_audit_logs_entity_id'
    });
    
    await queryInterface.addIndex('audit_logs', ['action'], {
      name: 'idx_audit_logs_action'
    });
    
    await queryInterface.addIndex('audit_logs', ['created_at'], {
      name: 'idx_audit_logs_created_at'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove indexes
    await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_user_id');
    await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_entity_type');
    await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_entity_id');
    await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_action');
    await queryInterface.removeIndex('audit_logs', 'idx_audit_logs_created_at');

    // Revert to old structure (if needed)
    await queryInterface.dropTable('audit_logs');
  }
};