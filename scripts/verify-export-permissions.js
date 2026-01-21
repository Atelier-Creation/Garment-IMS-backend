const { sequelize, Role, Permission, RolePermission } = require('../src/models');

async function verifyExportPermissions() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully\n');

    // Find admin role
    const adminRole = await Role.findOne({ 
      where: { name: 'admin' },
      include: [{
        model: Permission,
        through: { attributes: [] }
      }]
    });

    if (!adminRole) {
      console.error('Admin role not found');
      process.exit(1);
    }

    console.log('Admin role found:', adminRole.name);
    console.log('\nPermissions assigned to admin role:');
    console.log('=====================================');

    const exportPermissions = adminRole.Permissions.filter(p => p.code.startsWith('export_orders'));
    
    if (exportPermissions.length === 0) {
      console.log('❌ NO export order permissions found!');
    } else {
      exportPermissions.forEach(p => {
        console.log(`✓ ${p.code} - ${p.description}`);
      });
    }

    console.log('\nTotal export order permissions:', exportPermissions.length);
    console.log('\n⚠️  IMPORTANT: You must log out and log back in for permissions to take effect!');

    process.exit(0);
  } catch (error) {
    console.error('Error verifying permissions:', error);
    process.exit(1);
  }
}

verifyExportPermissions();
