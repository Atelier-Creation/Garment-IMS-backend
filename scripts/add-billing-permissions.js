const { sequelize, Role, Permission, RolePermission } = require('../src/models');

async function addBillingPermissions() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully');

    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    if (!adminRole) {
      console.error('Admin role not found');
      process.exit(1);
    }

    console.log('Admin role found:', adminRole.name);

    const billingPermissions = [
      'billing:create',
      'billing:read',
      'billing:update',
      'billing:delete'
    ];

    let addedCount = 0;
    let skippedCount = 0;

    for (const permissionCode of billingPermissions) {
      let permission = await Permission.findOne({ where: { code: permissionCode } });
      
      if (!permission) {
        permission = await Permission.create({
          code: permissionCode,
          description: `Permission to ${permissionCode.split(':')[1]} billing`
        });
        console.log(`Created permission: ${permissionCode}`);
      }

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
        console.log(`✓ Added permission: ${permissionCode}`);
        addedCount++;
      } else {
        console.log(`- Permission already exists: ${permissionCode}`);
        skippedCount++;
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Permissions added: ${addedCount}`);
    console.log(`Permissions skipped: ${skippedCount}`);
    console.log('\nBilling permissions have been added to admin role successfully!');
    console.log('Please log out and log back in to refresh your session.');

    process.exit(0);
  } catch (error) {
    console.error('Error adding billing permissions:', error);
    process.exit(1);
  }
}

addBillingPermissions();
