const { Permission, Role } = require('../src/models');

async function addRolePermissionPermissions() {
  try {
    console.log('Adding role and permission management permissions...');

    // Define the new permissions
    const newPermissions = [
      // Role permissions
      { code: 'role.view', description: 'View roles' },
      { code: 'role.create', description: 'Create new roles' },
      { code: 'role.update', description: 'Update existing roles' },
      { code: 'role.delete', description: 'Delete roles' },
      
      // Permission permissions
      { code: 'permission.view', description: 'View permissions' },
      { code: 'permission.create', description: 'Create new permissions' },
      { code: 'permission.update', description: 'Update existing permissions' },
      { code: 'permission.delete', description: 'Delete permissions' },
      
      // User management permissions (update existing)
      { code: 'user.read', description: 'View users' },
      { code: 'user.create', description: 'Create new users' },
      { code: 'user.update', description: 'Update existing users' },
      { code: 'user.delete', description: 'Delete users' }
    ];

    // Create permissions if they don't exist
    for (const permData of newPermissions) {
      const [permission, created] = await Permission.findOrCreate({
        where: { code: permData.code },
        defaults: permData
      });
      
      if (created) {
        console.log(`✓ Created permission: ${permData.code}`);
      } else {
        console.log(`- Permission already exists: ${permData.code}`);
      }
    }

    // Get admin role
    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    if (!adminRole) {
      console.log('❌ Admin role not found');
      return;
    }

    // Get all permissions
    const allPermissions = await Permission.findAll({
      where: {
        code: newPermissions.map(p => p.code)
      }
    });

    // Assign all permissions to admin role (one by one to avoid bulk insert issues)
    for (const permission of allPermissions) {
      try {
        await adminRole.addPermission(permission);
      } catch (error) {
        // Permission might already be assigned, skip
        if (!error.message.includes('Duplicate entry')) {
          console.log(`Warning: Could not assign permission ${permission.code}:`, error.message);
        }
      }
    }
    console.log(`✓ Processed ${allPermissions.length} permissions for admin role`);

    // Check total permissions for admin
    const adminPermissions = await adminRole.getPermissions();
    console.log(`✓ Admin role now has ${adminPermissions.length} total permissions`);

    console.log('\n✅ Role and permission management permissions added successfully!');

  } catch (error) {
    console.error('❌ Error adding permissions:', error);
  }
}

// Run if called directly
if (require.main === module) {
  addRolePermissionPermissions().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = addRolePermissionPermissions;