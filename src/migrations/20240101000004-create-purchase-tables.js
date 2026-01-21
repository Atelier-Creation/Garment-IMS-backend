'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create purchase_orders table
    await queryInterface.createTable('purchase_orders', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      po_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      supplier_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'suppliers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
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
      status: {
        type: Sequelize.ENUM('DRAFT', 'PLACED', 'RECEIVED', 'PARTIAL', 'CANCELLED'),
        defaultValue: 'DRAFT'
      },
      total_amount: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0.00
      },
      ordered_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      expected_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      created_by: {
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

    // Create purchase_order_items table
    await queryInterface.createTable('purchase_order_items', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      purchase_order_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'purchase_orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      raw_material_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'raw_materials',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      qty: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      unit_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      tax: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00
      },
      total: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0.00
      }
    });

    // Create raw_material_batches table
    await queryInterface.createTable('raw_material_batches', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      raw_material_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'raw_materials',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      batch_code: {
        type: Sequelize.STRING(150),
        allowNull: true
      },
      qty: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      cost_per_unit: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      branch_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'branches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      received_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      supplier_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'suppliers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      purchase_order_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'purchase_orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true
      }
    });

    // Add indexes
    await queryInterface.addIndex('purchase_orders', ['po_number']);
    await queryInterface.addIndex('purchase_orders', ['supplier_id']);
    await queryInterface.addIndex('purchase_orders', ['status']);
    await queryInterface.addIndex('purchase_order_items', ['purchase_order_id']);
    await queryInterface.addIndex('purchase_order_items', ['raw_material_id']);
    await queryInterface.addIndex('raw_material_batches', ['raw_material_id']);
    await queryInterface.addIndex('raw_material_batches', ['branch_id']);
    await queryInterface.addIndex('raw_material_batches', ['batch_code']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('raw_material_batches');
    await queryInterface.dropTable('purchase_order_items');
    await queryInterface.dropTable('purchase_orders');
  }
};