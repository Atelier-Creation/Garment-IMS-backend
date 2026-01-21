const { Permission, Role, sequelize } = require('../src/models');
const { v4: uuidv4 } = require('uuid');

async function fixRawMaterialPermissions() {
    try {
        console.log('Fixing raw material permissions...\n');

        const permissions = [
            { code: 'raw_material.create', description: 'Create raw materials', category: 'Inventory', subcategory: 'Raw Materials' },
            { code: 'raw_material.update', description: 'Update raw materials', category: 'Inventory', subcategory: 'Raw Materials' },
            { code: 'raw_material.delete', description: 'Delete raw materials', category: 'Inventory', subcategory: 'Raw Materials' },
            { code: 'raw_material.view', description: 'View raw materials', category: 'Inventory', subcategory: 'Raw Materials' }
        ];

        // 1. Create permissions if they don't exist
        for (const p of permissions) {
            const existing = await Permission.findOne({ where: { code: p.code } });
            if (!existing) {
                await Permission.create(p);
                console.log(`✅ Created permission: ${p.code}`);
            } else {
                console.log(`- Permission already exists: ${p.code}`);
            }
        }

        // 2. Assign to admin role
        const adminRole = await Role.findOne({ where: { name: 'admin' } });
        if (!adminRole) {
            console.error('❌ Admin role not found!');
            return;
        }

        console.log('\nAssigning permissions to admin role...');
        const allPerms = await Permission.findAll({
            where: { code: permissions.map(p => p.code) }
        });

        for (const permission of allPerms) {
            const hasPermission = await adminRole.hasPermission(permission);
            if (!hasPermission) {
                await adminRole.addPermission(permission);
                console.log(`✅ Assigned ${permission.code} to admin`);
            } else {
                console.log(`- Admin already has ${permission.code}`);
            }
        }

        console.log('\nDone!');

    } catch (error) {
        console.error('Error:', error);
    }
}

// Run if called directly
if (require.main === module) {
    fixRawMaterialPermissions().then(() => {
        process.exit(0);
    });
}
