'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('purchase_order_items', 'received_quantity', {
      type: Sequelize.DECIMAL(12, 2),
      defaultValue: 0.00,
      allowNull: false
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('purchase_order_items', 'received_quantity');
  }
};
