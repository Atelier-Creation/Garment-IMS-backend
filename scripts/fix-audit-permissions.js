const { sequelize } = require('../src/models');
const { v4: uuidv4 } = require('uuid');

async function fixAuditPermissions() {
  try {
    console.log('🔧 Fixing audit permissions...');

    // Check if permissions table has any data
    const [permissions] = await sequelize.query('SELECT * FROM permissions LIMIT 5');
    console.log('📋 Current permissions count:', permissions.length);

    // Check if roles table has any data
    const [roles] = await sequelize.query('SELECT * FROM roles LIMIT 5');
    console.log('👥 Current roles count:', roles.length);

    // If no permissions exist, create basic permissions
    if (permissions.length === 0) {
      console.log('📝 Creating basic permissions...');
      
      const basicPermissions = [
        { id: uuidv4(), code: 'audit.view', description: 'View audit logs', created_at: new Date() },
        { id: uuidv4(), code: 'audit.create', description: 'Create audit logs', created_at: new Date() },
        { id: uuidv4(), code: 'audit.delete', description: 'Delete audit logs', created_at: new Date() },
        { id: uuidv4(), code: 'user.view', description: 'View users', created_at: new Date() },
        { id: uuidv4(), code: 'user.create', description: 'Create users', created_at: new Date() },
        { id: uuidv4(), code: 'user.update', description: 'Update users', created_at: new Date() },
        { id: uuidv4(), code: 'user.delete', description: 'Delete users', created_at: new Date() },
        { id: uuidv4(), code: 'product.view', description: 'View products', created_at: new Date() },
        { id: uuidv4(), code: 'product.create', description: 'Create products', created_at: new Date() },
        { id: uuidv4(), code: 'product.update', description: 'Update products', created_at: new Date() },
        { id: uuidv4(), code: 'product.delete', description: 'Delete products', created_at: new Date() },
        { id: uuidv4(), code: 'order.view', description: 'View orders', created_at: new Date() },
        { id: uuidv4(), code: 'order.create', description: 'Create orders', created_at: new Date() },
        { id: uuidv4(), code: 'order.update', description: 'Update orders', created_at: new Date() },
        { id: uuidv4(), code: 'order.delete', description: 'Delete orders', created_at: new Date() },
        { id: uuidv4(), code: 'report.view', description: 'View reports', created_at: new Date() },
        { id: uuidv4(), code: 'admin.all', description: 'Full admin access', created_at: new Date() }
      ];

      await sequelize.getQueryInterface().bulkInsert('permissions', basicPermissions);
      console.log('✅ Created', basicPermissions.length, 'permissions');
    }

    // If no roles exist, create basic roles
    if (roles.length === 0) {
      console.log('👥 Creating basic roles...');
      
      const basicRoles = [
        { id: uuidv4(), name: 'admin', description: 'System Administrator', created_at: new Date() },
        { id: uuidv4(), name: 'manager', description: 'Manager', created_at: new Date() },
        { id: uuidv4(), name: 'user', description: 'Regular User', created_at: new Date() }
      ];

      await sequelize.getQueryInterface().bulkInsert('roles', basicRoles);
      console.log('✅ Created', basicRoles.length, 'roles');
    }

    // Get admin role and all permissions
    const [adminRoles] = await sequelize.query("SELECT id FROM roles WHERE name = 'admin'");
    const [allPermissions] = await sequelize.query('SELECT id FROM permissions');

    if (adminRoles.length > 0 && allPermissions.length > 0) {
      console.log('🔗 Assigning all permissions to admin role...');
      
      // Check existing role permissions
      const [existingRolePermissions] = await sequelize.query(
        'SELECT * FROM role_permissions WHERE role_id = ?',
        { replacements: [adminRoles[0].id] }
      );

      if (existingRolePermissions.length === 0) {
        // Assign all permissions to admin role
        const rolePermissions = allPermissions.map(permission => ({
          id: uuidv4(),
          role_id: adminRoles[0].id,
          permission_id: permission.id,
          created_at: new Date(),
          updated_at: new Date()
        }));

        await sequelize.getQueryInterface().bulkInsert('role_permissions', rolePermissions);
        console.log('✅ Assigned', rolePermissions.length, 'permissions to admin role');
      } else {
        console.log('ℹ️  Admin role already has', existingRolePermissions.length, 'permissions');
      }
    }

    // Verify admin user has admin role
    const [adminUsers] = await sequelize.query("SELECT id FROM users WHERE email = 'admin@garmentims.com'");
    if (adminUsers.length > 0 && adminRoles.length > 0) {
      const [userRoles] = await sequelize.query(
        'SELECT * FROM user_roles WHERE user_id = ? AND role_id = ?',
        { replacements: [adminUsers[0].id, adminRoles[0].id] }
      );

      if (userRoles.length === 0) {
        console.log('👤 Assigning admin role to admin user...');
        await sequelize.getQueryInterface().bulkInsert('user_roles', [{
          id: uuidv4(),
          user_id: adminUsers[0].id,
          role_id: adminRoles[0].id,
          created_at: new Date(),
          updated_at: new Date()
        }]);
        console.log('✅ Admin user now has admin role');
      } else {
        console.log('ℹ️  Admin user already has admin role');
      }
    }

    console.log('🎉 Audit permissions fixed successfully!');
    console.log('🔄 Please restart the backend server to apply changes');

  } catch (error) {
    console.error('❌ Error fixing audit permissions:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the fix
fixAuditPermissions();