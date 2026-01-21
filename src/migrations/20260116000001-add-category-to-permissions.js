'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('permissions', 'category', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Permission category (e.g., Inventory, Sales, Users)'
    });

    await queryInterface.addColumn('permissions', 'subcategory', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Permission subcategory (e.g., Products, Orders, Roles)'
    });

    // Update existing permissions with categories
    const permissions = [
      // User Management
      { code: 'user.create', category: 'User Management', subcategory: 'Users' },
      { code: 'user.read', category: 'User Management', subcategory: 'Users' },
      { code: 'user.update', category: 'User Management', subcategory: 'Users' },
      { code: 'user.delete', category: 'User Management', subcategory: 'Users' },
      { code: 'role.create', category: 'User Management', subcategory: 'Roles' },
      { code: 'role.read', category: 'User Management', subcategory: 'Roles' },
      { code: 'role.update', category: 'User Management', subcategory: 'Roles' },
      { code: 'role.delete', category: 'User Management', subcategory: 'Roles' },
      { code: 'permission.read', category: 'User Management', subcategory: 'Permissions' },
      
      // Inventory Management
      { code: 'product.create', category: 'Inventory', subcategory: 'Products' },
      { code: 'product.read', category: 'Inventory', subcategory: 'Products' },
      { code: 'product.update', category: 'Inventory', subcategory: 'Products' },
      { code: 'product.delete', category: 'Inventory', subcategory: 'Products' },
      { code: 'product_variant.create', category: 'Inventory', subcategory: 'Product Variants' },
      { code: 'product_variant.read', category: 'Inventory', subcategory: 'Product Variants' },
      { code: 'product_variant.update', category: 'Inventory', subcategory: 'Product Variants' },
      { code: 'product_variant.delete', category: 'Inventory', subcategory: 'Product Variants' },
      { code: 'raw_material.create', category: 'Inventory', subcategory: 'Raw Materials' },
      { code: 'raw_material.read', category: 'Inventory', subcategory: 'Raw Materials' },
      { code: 'raw_material.update', category: 'Inventory', subcategory: 'Raw Materials' },
      { code: 'raw_material.delete', category: 'Inventory', subcategory: 'Raw Materials' },
      { code: 'finished_goods.read', category: 'Inventory', subcategory: 'Finished Goods' },
      { code: 'finished_goods.update', category: 'Inventory', subcategory: 'Finished Goods' },
      
      // Purchase Management
      { code: 'purchase_order.create', category: 'Purchase', subcategory: 'Purchase Orders' },
      { code: 'purchase_order.read', category: 'Purchase', subcategory: 'Purchase Orders' },
      { code: 'purchase_order.update', category: 'Purchase', subcategory: 'Purchase Orders' },
      { code: 'purchase_order.delete', category: 'Purchase', subcategory: 'Purchase Orders' },
      { code: 'purchase_order_inward.create', category: 'Purchase', subcategory: 'Inward' },
      { code: 'purchase_order_inward.read', category: 'Purchase', subcategory: 'Inward' },
      
      // Sales Management
      { code: 'sales_order.create', category: 'Sales', subcategory: 'Sales Orders' },
      { code: 'sales_order.read', category: 'Sales', subcategory: 'Sales Orders' },
      { code: 'sales_order.update', category: 'Sales', subcategory: 'Sales Orders' },
      { code: 'sales_order.delete', category: 'Sales', subcategory: 'Sales Orders' },
      { code: 'export_order.create', category: 'Sales', subcategory: 'Export Orders' },
      { code: 'export_order.read', category: 'Sales', subcategory: 'Export Orders' },
      { code: 'export_order.update', category: 'Sales', subcategory: 'Export Orders' },
      { code: 'export_order.delete', category: 'Sales', subcategory: 'Export Orders' },
      
      // Billing
      { code: 'billing.create', category: 'Billing', subcategory: 'POS' },
      { code: 'billing.read', category: 'Billing', subcategory: 'POS' },
      { code: 'billing.update', category: 'Billing', subcategory: 'POS' },
      { code: 'billing.delete', category: 'Billing', subcategory: 'POS' },
      
      // Production
      { code: 'production_order.create', category: 'Production', subcategory: 'Production Orders' },
      { code: 'production_order.read', category: 'Production', subcategory: 'Production Orders' },
      { code: 'production_order.update', category: 'Production', subcategory: 'Production Orders' },
      { code: 'production_order.delete', category: 'Production', subcategory: 'Production Orders' },
      
      // Master Data
      { code: 'supplier.create', category: 'Master Data', subcategory: 'Suppliers' },
      { code: 'supplier.read', category: 'Master Data', subcategory: 'Suppliers' },
      { code: 'supplier.update', category: 'Master Data', subcategory: 'Suppliers' },
      { code: 'supplier.delete', category: 'Master Data', subcategory: 'Suppliers' },
      { code: 'customer.create', category: 'Master Data', subcategory: 'Customers' },
      { code: 'customer.read', category: 'Master Data', subcategory: 'Customers' },
      { code: 'customer.update', category: 'Master Data', subcategory: 'Customers' },
      { code: 'customer.delete', category: 'Master Data', subcategory: 'Customers' },
      { code: 'branch.create', category: 'Master Data', subcategory: 'Branches' },
      { code: 'branch.read', category: 'Master Data', subcategory: 'Branches' },
      { code: 'branch.update', category: 'Master Data', subcategory: 'Branches' },
      { code: 'branch.delete', category: 'Master Data', subcategory: 'Branches' },
      { code: 'category.create', category: 'Master Data', subcategory: 'Categories' },
      { code: 'category.read', category: 'Master Data', subcategory: 'Categories' },
      { code: 'category.update', category: 'Master Data', subcategory: 'Categories' },
      { code: 'category.delete', category: 'Master Data', subcategory: 'Categories' },
      
      // Reports & Audit
      { code: 'audit_log.read', category: 'Reports', subcategory: 'Audit Logs' },
      { code: 'report.read', category: 'Reports', subcategory: 'Reports' }
    ];

    for (const perm of permissions) {
      await queryInterface.sequelize.query(
        `UPDATE permissions SET category = ?, subcategory = ? WHERE code = ?`,
        {
          replacements: [perm.category, perm.subcategory, perm.code]
        }
      );
    }
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('permissions', 'category');
    await queryInterface.removeColumn('permissions', 'subcategory');
  }
};
