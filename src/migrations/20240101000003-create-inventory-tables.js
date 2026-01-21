'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create raw_materials table
    await queryInterface.createTable('raw_materials', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      material_code: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      uom: {
        type: Sequelize.STRING(30),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      average_cost: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00
      },
      is_active: {
        type: Sequelize.TINYINT(1),
        defaultValue: 1
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create products table
    await queryInterface.createTable('products', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      product_code: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      product_name: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      category_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'categories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      sub_category_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'subcategories',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      brand: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      fabric: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      gender: {
        type: Sequelize.ENUM('MEN', 'WOMEN', 'KIDS', 'UNISEX'),
        allowNull: true
      },
      season: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      base_price: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00
      },
      is_active: {
        type: Sequelize.TINYINT(1),
        defaultValue: 1
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create product_variants table
    await queryInterface.createTable('product_variants', {
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
        onDelete: 'CASCADE'
      },
      sku: {
        type: Sequelize.STRING(150),
        allowNull: true,
        unique: true
      },
      size: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      color: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      barcode: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      mrp: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      cost_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('raw_materials', ['material_code']);
    await queryInterface.addIndex('raw_materials', ['is_active']);
    await queryInterface.addIndex('products', ['product_code']);
    await queryInterface.addIndex('products', ['category_id']);
    await queryInterface.addIndex('products', ['sub_category_id']);
    await queryInterface.addIndex('products', ['is_active']);
    await queryInterface.addIndex('product_variants', ['product_id']);
    await queryInterface.addIndex('product_variants', ['sku']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('product_variants');
    await queryInterface.dropTable('products');
    await queryInterface.dropTable('raw_materials');
  }
};