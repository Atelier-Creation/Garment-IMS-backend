const { sequelize, Role, Permission, RolePermission } = require('../src/models');

async function addExportPermissions() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Find admin role
    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    if (!adminRole) {
      console.error('Admin role not found');
      process.exit(1);
    }

    console.log('Admin role found:', adminRole.name);

    // Export order permissions to add
    const exportPermissions = [
      'export_orders:create',
      'export_orders:read',
      'export_orders:update',
      'export_orders:delete',
      'export_orders:update_status'
    ];

    let addedCount = 0;
    let skippedCount = 0;

    for (const permissionName of exportPermissions) {
      // Find or create permission
      let permission = await Permission.findOne({ where: { code: permissionName } });
      
      if (!permission) {
        permission = await Permission.create({
          code: permissionName,
          description: `Permission to ${permissionName.split(':')[1]} export orders`
        });
        console.log(`Created permission: ${permissionName}`);
      }

      // Check if role already has this permission
      const existingRolePermission = await RolePermission.findOne({
        where: {
          role_id: adminRole.id,
          permission_id: permission.id
        }
      });

      if (!existingRolePermission) {
        await RolePermission.create({
          role_id: adminRole.id,
          permission_id: permission.id
        });
        console.log(`✓ Added permission: ${permissionName}`);
        addedCount++;
      } else {
        console.log(`- Permission already exists: ${permissionName}`);
        skippedCount++;
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Permissions added: ${addedCount}`);
    console.log(`Permissions skipped: ${skippedCount}`);
    console.log('\nExport order permissions have been added to admin role successfully!');
    console.log('Please log out and log back in to refresh your session.');

    process.exit(0);
  } catch (error) {
    console.error('Error adding export permissions:', error);
    process.exit(1);
  }
}

addExportPermissions();
