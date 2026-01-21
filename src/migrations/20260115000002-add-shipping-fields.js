'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('sales_orders', 'shipping_date', {
      type: Sequelize.DATE,
      allowNull: true,
      after: 'delivery_date'
    });

    await queryInterface.addColumn('sales_orders', 'tracking_number', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after: 'shipping_date'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('sales_orders', 'shipping_date');
    await queryInterface.removeColumn('sales_orders', 'tracking_number');
  }
};
