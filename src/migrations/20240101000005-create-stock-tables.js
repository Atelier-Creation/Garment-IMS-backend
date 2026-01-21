'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create raw_material_stock_movements table
    await queryInterface.createTable('raw_material_stock_movements', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      raw_material_batch_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'raw_material_batches',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
      movement_type: {
        type: Sequelize.ENUM('IN', 'OUT', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT'),
        allowNull: false
      },
      qty: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      unit_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      reference_table: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      reference_id: {
        type: Sequelize.CHAR(36),
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

    // Create finished_goods_stock table
    await queryInterface.createTable('finished_goods_stock', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      variant_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'product_variants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      qty: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      reserved_qty: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create finished_goods_stock_movements table
    await queryInterface.createTable('finished_goods_stock_movements', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false
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
      movement_type: {
        type: Sequelize.ENUM('IN', 'OUT', 'SALE', 'TRANSFER_IN', 'TRANSFER_OUT', 'ADJUSTMENT', 'PRODUCTION_OUTPUT'),
        allowNull: false
      },
      qty: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      unit_cost: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      reference_table: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      reference_id: {
        type: Sequelize.CHAR(36),
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

    // Add indexes
    await queryInterface.addIndex('raw_material_stock_movements', ['raw_material_id']);
    await queryInterface.addIndex('raw_material_stock_movements', ['branch_id']);
    await queryInterface.addIndex('raw_material_stock_movements', ['movement_type']);
    await queryInterface.addIndex('raw_material_stock_movements', ['reference_table', 'reference_id']);
    
    await queryInterface.addIndex('finished_goods_stock', ['variant_id']);
    await queryInterface.addIndex('finished_goods_stock', ['branch_id']);
    await queryInterface.addIndex('finished_goods_stock', ['variant_id', 'branch_id'], { unique: true });
    
    await queryInterface.addIndex('finished_goods_stock_movements', ['variant_id']);
    await queryInterface.addIndex('finished_goods_stock_movements', ['branch_id']);
    await queryInterface.addIndex('finished_goods_stock_movements', ['movement_type']);
    await queryInterface.addIndex('finished_goods_stock_movements', ['reference_table', 'reference_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('finished_goods_stock_movements');
    await queryInterface.dropTable('finished_goods_stock');
    await queryInterface.dropTable('raw_material_stock_movements');
  }
};