const { Permission, Role, sequelize } = require('../src/models');
const { v4: uuidv4 } = require('uuid');

async function fixAdminRolePermissions() {
  try {
    console.log('Fixing admin role permissions...\n');

    // Get admin role
    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    if (!adminRole) {
      console.log('❌ Admin role not found');
      return;
    }

    // Get the missing permissions
    const missingPermissionCodes = [
      'role.view', 'role.create', 'role.update', 'role.delete',
      'permission.view', 'permission.create', 'permission.update', 'permission.delete'
    ];

    const missingPermissions = await Permission.findAll({
      where: { code: missingPermissionCodes }
    });

    console.log(`Found ${missingPermissions.length} missing permissions to assign`);

    // Use raw SQL to insert the role-permission relationships
    for (const permission of missingPermissions) {
      try {
        // Check if relationship already exists
        const [existing] = await sequelize.query(
          'SELECT * FROM role_permissions WHERE role_id = ? AND permission_id = ?',
          { replacements: [adminRole.id, permission.id] }
        );

        if (existing.length === 0) {
          // Insert the relationship with a UUID for the id field
          await sequelize.query(
            'INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
            { replacements: [uuidv4(), adminRole.id, permission.id] }
          );
          console.log(`✅ Assigned permission: ${permission.code}`);
        } else {
          console.log(`- Permission already assigned: ${permission.code}`);
        }
      } catch (error) {
        console.log(`❌ Failed to assign ${permission.code}:`, error.message);
      }
    }

    // Verify the assignments
    const updatedRole = await Role.findByPk(adminRole.id, {
      include: [{
        model: Permission,
        through: { attributes: [] }
      }]
    });

    console.log(`\n✅ Admin role now has ${updatedRole.Permissions.length} total permissions`);

    // Check if all required permissions are now present
    const assignedCodes = updatedRole.Permissions.map(p => p.code);
    const stillMissing = missingPermissionCodes.filter(code => !assignedCodes.includes(code));

    if (stillMissing.length === 0) {
      console.log('🎉 All required permissions successfully assigned!');
    } else {
      console.log('❌ Still missing permissions:', stillMissing);
    }

  } catch (error) {
    console.error('❌ Error fixing permissions:', error);
  }
}

// Run if called directly
if (require.main === module) {
  fixAdminRolePermissions().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = fixAdminRolePermissions;