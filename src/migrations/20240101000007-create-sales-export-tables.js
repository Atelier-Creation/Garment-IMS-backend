'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create sales_orders table
    await queryInterface.createTable('sales_orders', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      order_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      customer_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
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
      status: {
        type: Sequelize.ENUM('DRAFT', 'CONFIRMED', 'PAID', 'CANCELLED', 'RETURNED'),
        defaultValue: 'DRAFT'
      },
      total_amount: {
        type: Sequelize.DECIMAL(14, 2),
        defaultValue: 0.00
      },
      tax_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00
      },
      discount_amount: {
        type: Sequelize.DECIMAL(12, 2),
        defaultValue: 0.00
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

    // Create sales_order_items table
    await queryInterface.createTable('sales_order_items', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      sales_order_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'sales_orders',
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
      unit_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: false
      },
      total: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false
      }
    });

    // Create pos_transactions table
    await queryInterface.createTable('pos_transactions', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      sales_order_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'sales_orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      paid_amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false
      },
      payment_method: {
        type: Sequelize.ENUM('CASH', 'CARD', 'UPI', 'NETBANKING', 'CREDIT'),
        defaultValue: 'CASH'
      },
      transaction_reference: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create export_orders table
    await queryInterface.createTable('export_orders', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      export_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
        unique: true
      },
      customer_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'customers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      port_of_loading: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      port_of_destination: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      incoterms: {
        type: Sequelize.STRING(50),
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'BOOKED', 'SHIPPED', 'DELIVERED', 'CANCELLED'),
        defaultValue: 'PENDING'
      },
      total_value: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create export_order_items table
    await queryInterface.createTable('export_order_items', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      export_order_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: {
          model: 'export_orders',
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
      unit_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true
      },
      total: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true
      }
    });

    // Create shipments table
    await queryInterface.createTable('shipments', {
      id: {
        type: Sequelize.CHAR(36),
        primaryKey: true,
        allowNull: false
      },
      shipment_number: {
        type: Sequelize.STRING(150),
        allowNull: true,
        unique: true
      },
      export_order_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: {
          model: 'export_orders',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      carrier: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      tracking_number: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      shipped_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      delivered_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('READY', 'IN_TRANSIT', 'DELIVERED', 'DELAYED'),
        defaultValue: 'READY'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('sales_orders', ['order_number']);
    await queryInterface.addIndex('sales_orders', ['customer_id']);
    await queryInterface.addIndex('sales_orders', ['branch_id']);
    await queryInterface.addIndex('sales_orders', ['status']);
    await queryInterface.addIndex('sales_order_items', ['sales_order_id']);
    await queryInterface.addIndex('sales_order_items', ['variant_id']);
    await queryInterface.addIndex('pos_transactions', ['sales_order_id']);
    await queryInterface.addIndex('export_orders', ['export_number']);
    await queryInterface.addIndex('export_orders', ['customer_id']);
    await queryInterface.addIndex('export_orders', ['status']);
    await queryInterface.addIndex('export_order_items', ['export_order_id']);
    await queryInterface.addIndex('export_order_items', ['variant_id']);
    await queryInterface.addIndex('shipments', ['shipment_number']);
    await queryInterface.addIndex('shipments', ['export_order_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('shipments');
    await queryInterface.dropTable('export_order_items');
    await queryInterface.dropTable('export_orders');
    await queryInterface.dropTable('pos_transactions');
    await queryInterface.dropTable('sales_order_items');
    await queryInterface.dropTable('sales_orders');
  }
};