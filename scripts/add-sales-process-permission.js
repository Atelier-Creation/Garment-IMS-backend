const { Role, Permission, RolePermission } = require('../src/models');

async function addSalesProcessPermission() {
  try {
    // Find admin role
    const adminRole = await Role.findOne({ where: { name: 'Admin' } });
    if (!adminRole) {
      console.log('Admin role not found');
      return;
    }

    // Find or create the process permission
    const [processPermission] = await Permission.findOrCreate({
      where: { code: 'sales_order.process' },
      defaults: {
        code: 'sales_order.process',
        description: 'Process sales orders'
      }
    });

    // Check if permission already assigned
    const existing = await RolePermission.findOne({
      where: {
        role_id: adminRole.id,
        permission_id: processPermission.id
      }
    });

    if (existing) {
      console.log('✓ Permission already exists');
    } else {
      await RolePermission.create({
        role_id: adminRole.id,
        permission_id: processPermission.id
      });
      console.log('✓ Added sales_order.process permission to Admin role');
    }

    console.log('\nDone! Please log out and log back in to refresh permissions.');
  } catch (error) {
    console.error('Error:', error);
  }
}

addSalesProcessPermission();
