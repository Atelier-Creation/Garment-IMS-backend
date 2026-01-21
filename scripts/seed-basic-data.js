#!/usr/bin/env node

const { sequelize, Role, Permission, User } = require('../src/models');
const { v4: uuidv4 } = require('uuid');

async function seedBasicData() {
  console.log('🌱 Seeding basic data...\n');

  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Check if roles already exist
    const existingRoles = await Role.findAll();
    if (existingRoles.length > 0) {
      console.log('⚠️  Roles already exist, skipping role creation');
      console.log(`Found ${existingRoles.length} roles:`, existingRoles.map(r => r.name).join(', '));
    } else {
      // Create basic roles
      const roles = [
        { name: 'admin', description: 'System Administrator with full access' },
        { name: 'manager', description: 'Manager with operational access' },
        { name: 'operator', description: 'Operator with limited access' },
        { name: 'viewer', description: 'Read-only access' }
      ];

      for (const roleData of roles) {
        await Role.create(roleData);
        console.log(`✅ Created role: ${roleData.name}`);
      }
    }

    // Check if admin user has a role assigned
    const adminUser = await User.findOne({
      where: { email: 'admin@garmentims.com' },
      include: [Role]
    });

    if (adminUser) {
      if (adminUser.Roles && adminUser.Roles.length > 0) {
        console.log(`✅ Admin user already has roles: ${adminUser.Roles.map(r => r.name).join(', ')}`);
      } else {
        // Assign admin role to admin user
        const adminRole = await Role.findOne({ where: { name: 'admin' } });
        if (adminRole) {
          await adminUser.addRole(adminRole);
          console.log('✅ Assigned admin role to admin user');
        }
      }
    }

    console.log('\n🎉 Basic data seeding completed successfully!');
    console.log('\nYou can now login with:');
    console.log('📧 Email: admin@garmentims.com');
    console.log('🔑 Password: admin123');

  } catch (error) {
    console.error('❌ Failed to seed basic data:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure the database is running');
    console.log('2. Ensure migrations have been run');
    console.log('3. Check database connectivity');
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  seedBasicData();
}

module.exports = seedBasicData;