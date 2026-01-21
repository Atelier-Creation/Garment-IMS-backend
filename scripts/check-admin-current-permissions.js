const { User, Role, Permission } = require('../src/models');

async function checkAdminPermissions() {
  try {
    console.log('Checking admin user permissions...\n');

    // Find admin user
    const adminUser = await User.findOne({
      where: { email: 'admin@garmentims.com' },
      include: [{
        model: Role,
        include: [{
          model: Permission,
          through: { attributes: [] }
        }],
        through: { attributes: [] }
      }]
    });

    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }

    console.log(`✅ Admin user found: ${adminUser.full_name} (${adminUser.email})`);
    console.log(`   User ID: ${adminUser.id}`);
    console.log(`   Active: ${adminUser.is_active}`);
    console.log(`   Roles: ${adminUser.Roles?.length || 0}`);

    if (adminUser.Roles && adminUser.Roles.length > 0) {
      adminUser.Roles.forEach(role => {
        console.log(`\n📋 Role: ${role.name}`);
        console.log(`   Description: ${role.description}`);
        console.log(`   Permissions: ${role.Permissions?.length || 0}`);
        
        if (role.Permissions && role.Permissions.length > 0) {
          console.log('   Permission codes:');
          role.Permissions.forEach(permission => {
            console.log(`     - ${permission.code}: ${permission.description}`);
          });
        }
      });
    }

    // Check for specific permissions we need
    const requiredPermissions = [
      'role.view', 'role.create', 'role.update', 'role.delete',
      'permission.view', 'permission.create', 'permission.update', 'permission.delete',
      'user.read', 'user.create', 'user.update', 'user.delete'
    ];

    console.log('\n🔍 Checking required permissions:');
    const userPermissions = [];
    adminUser.Roles?.forEach(role => {
      role.Permissions?.forEach(permission => {
        userPermissions.push(permission.code);
      });
    });

    requiredPermissions.forEach(perm => {
      const hasPermission = userPermissions.includes(perm);
      console.log(`   ${hasPermission ? '✅' : '❌'} ${perm}`);
    });

    console.log(`\n📊 Total permissions: ${userPermissions.length}`);

  } catch (error) {
    console.error('❌ Error checking permissions:', error);
  }
}

// Run if called directly
if (require.main === module) {
  checkAdminPermissions().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = checkAdminPermissions;