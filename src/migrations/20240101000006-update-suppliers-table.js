'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if table exists
    const tableExists = await queryInterface.showAllTables().then(tables => 
      tables.includes('suppliers')
    );

    if (tableExists) {
      // Get current table description
      const tableDescription = await queryInterface.describeTable('suppliers');
      
      // Add status column if it doesn't exist
      if (!tableDescription.status) {
        await queryInterface.addColumn('suppliers', 'status', {
          type: Sequelize.ENUM('active', 'inactive'),
          defaultValue: 'active',
          allowNull: false
        });
      }

      // Add updated_at column if it doesn't exist
      if (!tableDescription.updated_at) {
        await queryInterface.addColumn('suppliers', 'updated_at', {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        });
      }

      // Update existing records to have active status
      await queryInterface.sequelize.query(`
        UPDATE suppliers 
        SET status = 'active' 
        WHERE status IS NULL
      `);

    } else {
      // Create the table with the complete structure
      await queryInterface.createTable('suppliers', {
        id: {
          type: Sequelize.CHAR(36),
          primaryKey: true,
          allowNull: false
        },
        name: {
          type: Sequelize.STRING(255),
          allowNull: false
        },
        contact_name: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        phone: {
          type: Sequelize.STRING(30),
          allowNull: true
        },
        email: {
          type: Sequelize.STRING(255),
          allowNull: true
        },
        address: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        payment_terms: {
          type: Sequelize.STRING(100),
          allowNull: true
        },
        status: {
          type: Sequelize.ENUM('active', 'inactive'),
          defaultValue: 'active',
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the added columns
    const tableExists = await queryInterface.showAllTables().then(tables => 
      tables.includes('suppliers')
    );

    if (tableExists) {
      const tableDescription = await queryInterface.describeTable('suppliers');
      
      if (tableDescription.status) {
        await queryInterface.removeColumn('suppliers', 'status');
      }
      
      if (tableDescription.updated_at) {
        await queryInterface.removeColumn('suppliers', 'updated_at');
      }
    }
  }
};