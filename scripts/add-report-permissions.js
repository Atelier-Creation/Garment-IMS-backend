const { sequelize, Role, Permission, RolePermission } = require('../src/models');

async function addReportPermissions() {
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

    // Report permissions to add
    const reportPermissions = [
      {
        code: 'report.view',
        description: 'View reports and analytics',
        category: 'Reports',
        subcategory: 'Reports'
      },
      {
        code: 'report.read',
        description: 'Read report data',
        category: 'Reports', 
        subcategory: 'Reports'
      }
    ];

    let addedCount = 0;
    let skippedCount = 0;

    for (const permData of reportPermissions) {
      // Check if permission exists
      let permission = await Permission.findOne({ where: { code: permData.code } });
      
      if (!permission) {
        // Create permission if it doesn't exist
        permission = await Permission.create(permData);
        console.log(`+ Created permission: ${permData.code}`);
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
        console.log(`+ Added permission to admin: ${permData.code}`);
        addedCount++;
      } else {
        console.log(`- Permission already exists: ${permData.code}`);
        skippedCount++;
      }
    }

    console.log('\n=== Summary ===');
    console.log(`Permissions added: ${addedCount}`);
    console.log(`Permissions skipped: ${skippedCount}`);
    console.log('\nReport permissions have been added to admin role successfully!');
    console.log('Please log out and log back in to refresh your session.');

  } catch (error) {
    console.error('Error adding report permissions:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

addReportPermissions();