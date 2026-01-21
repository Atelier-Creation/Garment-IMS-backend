'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create boms table
    await queryInterface.createTable('boms', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      product_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      version: {
        type: Sequelize.STRING(50),
        defaultValue: '1.0'
      },
      unit_yield: {
        type: Sequelize.DECIMAL(12, 4),
        defaultValue: 1.0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create bom_items table
    await queryInterface.createTable('bom_items', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      bom_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'boms',
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
      qty_per_unit: {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: false
      },
      wastage_percent: {
        type: Sequelize.DECIMAL(5, 2),
        defaultValue: 0.0
      }
    });

    // Create production_orders table
    await queryInterface.createTable('production_orders', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      production_code: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      bom_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'boms',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      product_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'products',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      variant_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'product_variants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      planned_qty: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      produced_qty: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      status: {
        type: Sequelize.ENUM('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'ON_HOLD'),
        defaultValue: 'PLANNED'
      },
      start_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      end_at: {
        type: Sequelize.DATE,
        allowNull: true
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

    // Create production_consumptions table
    await queryInterface.createTable('production_consumptions', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      production_order_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'production_orders',
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
      batch_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'raw_material_batches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      qty: {
        type: Sequelize.DECIMAL(12, 4),
        allowNull: false
      },
      unit_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create production_outputs table
    await queryInterface.createTable('production_outputs', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      production_order_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'production_orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      variant_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'product_variants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      qty: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      unit_cost: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('boms', ['product_id']);
    await queryInterface.addIndex('bom_items', ['bom_id']);
    await queryInterface.addIndex('bom_items', ['raw_material_id']);
    await queryInterface.addIndex('production_orders', ['production_code']);
    await queryInterface.addIndex('production_orders', ['bom_id']);
    await queryInterface.addIndex('production_orders', ['product_id']);
    await queryInterface.addIndex('production_orders', ['status']);
    await queryInterface.addIndex('production_consumptions', ['production_order_id']);
    await queryInterface.addIndex('production_consumptions', ['raw_material_id']);
    await queryInterface.addIndex('production_outputs', ['production_order_id']);
    await queryInterface.addIndex('production_outputs', ['variant_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('production_outputs');
    await queryInterface.dropTable('production_consumptions');
    await queryInterface.dropTable('production_orders');
    await queryInterface.dropTable('bom_items');
    await queryInterface.dropTable('boms');
  }
};