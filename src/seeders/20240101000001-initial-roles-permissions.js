'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insert roles
    const roles = [
      {
        id: uuidv4(),
        name: 'admin',
        description: 'System Administrator with full access',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'manager',
        description: 'Manager with operational access',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'operator',
        description: 'Operator with limited access',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'viewer',
        description: 'Read-only access',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('roles', roles);

    // Insert permissions
    const permissions = [
      // User management
      { id: uuidv4(), code: 'user.create', description: 'Create users', created_at: new Date() },
      { id: uuidv4(), code: 'user.read', description: 'View users', created_at: new Date() },
      { id: uuidv4(), code: 'user.update', description: 'Update users', created_at: new Date() },
      { id: uuidv4(), code: 'user.delete', description: 'Delete users', created_at: new Date() },
      
      // Category management
      { id: uuidv4(), code: 'category.create', description: 'Create categories', created_at: new Date() },
      { id: uuidv4(), code: 'category.read', description: 'View categories', created_at: new Date() },
      { id: uuidv4(), code: 'category.update', description: 'Update categories', created_at: new Date() },
      { id: uuidv4(), code: 'category.delete', description: 'Delete categories', created_at: new Date() },
      
      // Supplier management
      { id: uuidv4(), code: 'supplier.create', description: 'Create suppliers', created_at: new Date() },
      { id: uuidv4(), code: 'supplier.read', description: 'View suppliers', created_at: new Date() },
      { id: uuidv4(), code: 'supplier.update', description: 'Update suppliers', created_at: new Date() },
      { id: uuidv4(), code: 'supplier.delete', description: 'Delete suppliers', created_at: new Date() },
      
      // Customer management
      { id: uuidv4(), code: 'customer.create', description: 'Create customers', created_at: new Date() },
      { id: uuidv4(), code: 'customer.read', description: 'View customers', created_at: new Date() },
      { id: uuidv4(), code: 'customer.update', description: 'Update customers', created_at: new Date() },
      { id: uuidv4(), code: 'customer.delete', description: 'Delete customers', created_at: new Date() },
      
      // Product management
      { id: uuidv4(), code: 'product.create', description: 'Create products', created_at: new Date() },
      { id: uuidv4(), code: 'product.read', description: 'View products', created_at: new Date() },
      { id: uuidv4(), code: 'product.update', description: 'Update products', created_at: new Date() },
      { id: uuidv4(), code: 'product.delete', description: 'Delete products', created_at: new Date() },
      
      // Purchase management
      { id: uuidv4(), code: 'purchase.create', description: 'Create purchase orders', created_at: new Date() },
      { id: uuidv4(), code: 'purchase.read', description: 'View purchase orders', created_at: new Date() },
      { id: uuidv4(), code: 'purchase.update', description: 'Update purchase orders', created_at: new Date() },
      { id: uuidv4(), code: 'purchase.delete', description: 'Delete purchase orders', created_at: new Date() },
      { id: uuidv4(), code: 'purchase.receive', description: 'Receive purchase orders', created_at: new Date() },
      
      // Production management
      { id: uuidv4(), code: 'production.create', description: 'Create production orders', created_at: new Date() },
      { id: uuidv4(), code: 'production.read', description: 'View production orders', created_at: new Date() },
      { id: uuidv4(), code: 'production.update', description: 'Update production orders', created_at: new Date() },
      { id: uuidv4(), code: 'production.execute', description: 'Execute production orders', created_at: new Date() },
      
      // Sales management
      { id: uuidv4(), code: 'sales.create', description: 'Create sales orders', created_at: new Date() },
      { id: uuidv4(), code: 'sales.read', description: 'View sales orders', created_at: new Date() },
      { id: uuidv4(), code: 'sales.update', description: 'Update sales orders', created_at: new Date() },
      { id: uuidv4(), code: 'sales.process', description: 'Process sales orders', created_at: new Date() },
      
      // Stock management
      { id: uuidv4(), code: 'stock.read', description: 'View stock levels', created_at: new Date() },
      { id: uuidv4(), code: 'stock.adjust', description: 'Adjust stock levels', created_at: new Date() },
      { id: uuidv4(), code: 'stock.transfer', description: 'Transfer stock between branches', created_at: new Date() },
      
      // Reports
      { id: uuidv4(), code: 'reports.view', description: 'View reports', created_at: new Date() },
      { id: uuidv4(), code: 'reports.export', description: 'Export reports', created_at: new Date() }
    ];

    await queryInterface.bulkInsert('permissions', permissions);

    // Get role and permission IDs for associations
    const adminRole = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE name = 'admin'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const managerRole = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE name = 'manager'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const operatorRole = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE name = 'operator'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const viewerRole = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE name = 'viewer'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const allPermissions = await queryInterface.sequelize.query(
      "SELECT id, code FROM permissions",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Admin gets all permissions
    const adminRolePermissions = allPermissions.map(permission => ({
      id: uuidv4(),
      role_id: adminRole[0].id,
      permission_id: permission.id,
      created_at: new Date()
    }));

    // Manager gets most permissions except user management
    const managerPermissions = allPermissions.filter(p => 
      !p.code.startsWith('user.') || p.code === 'user.read'
    ).map(permission => ({
      id: uuidv4(),
      role_id: managerRole[0].id,
      permission_id: permission.id,
      created_at: new Date()
    }));

    // Operator gets operational permissions
    const operatorPermissions = allPermissions.filter(p => 
      p.code.includes('.read') || 
      p.code.includes('.create') || 
      p.code.includes('.update') ||
      p.code === 'purchase.receive' ||
      p.code === 'production.execute' ||
      p.code === 'sales.process'
    ).map(permission => ({
      id: uuidv4(),
      role_id: operatorRole[0].id,
      permission_id: permission.id,
      created_at: new Date()
    }));

    // Viewer gets only read permissions
    const viewerPermissions = allPermissions.filter(p => 
      p.code.includes('.read') || p.code === 'reports.view'
    ).map(permission => ({
      id: uuidv4(),
      role_id: viewerRole[0].id,
      permission_id: permission.id,
      created_at: new Date()
    }));

    await queryInterface.bulkInsert('role_permissions', [
      ...adminRolePermissions,
      ...managerPermissions,
      ...operatorPermissions,
      ...viewerPermissions
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('role_permissions', null, {});
    await queryInterface.bulkDelete('permissions', null, {});
    await queryInterface.bulkDelete('roles', null, {});
  }
};