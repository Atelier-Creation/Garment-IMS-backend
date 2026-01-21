'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add missing columns to sales_orders table
    await queryInterface.addColumn('sales_orders', 'order_type', {
      type: Sequelize.STRING(50),
      defaultValue: 'standard',
      after: 'branch_id'
    });

    await queryInterface.addColumn('sales_orders', 'reference_number', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'order_type'
    });

    await queryInterface.addColumn('sales_orders', 'order_date', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'reference_number'
    });

    await queryInterface.addColumn('sales_orders', 'delivery_date', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'order_date'
    });

    await queryInterface.addColumn('sales_orders', 'subtotal_amount', {
      type: Sequelize.DECIMAL(14, 2),
      defaultValue: 0.00,
      after: 'status'
    });

    await queryInterface.addColumn('sales_orders', 'shipping_address', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'discount_amount'
    });

    await queryInterface.addColumn('sales_orders', 'billing_address', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'shipping_address'
    });

    await queryInterface.addColumn('sales_orders', 'payment_terms', {
      type: Sequelize.STRING(255),
      allowNull: true,
      after: 'billing_address'
    });

    await queryInterface.addColumn('sales_orders', 'notes', {
      type: Sequelize.TEXT,
      allowNull: true,
      after: 'payment_terms'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('sales_orders', 'order_type');
    await queryInterface.removeColumn('sales_orders', 'reference_number');
    await queryInterface.removeColumn('sales_orders', 'order_date');
    await queryInterface.removeColumn('sales_orders', 'delivery_date');
    await queryInterface.removeColumn('sales_orders', 'subtotal_amount');
    await queryInterface.removeColumn('sales_orders', 'shipping_address');
    await queryInterface.removeColumn('sales_orders', 'billing_address');
    await queryInterface.removeColumn('sales_orders', 'payment_terms');
    await queryInterface.removeColumn('sales_orders', 'notes');
  }
};
