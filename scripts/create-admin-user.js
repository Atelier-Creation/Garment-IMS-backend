#!/usr/bin/env node

const { sequelize, User, Role } = require('../src/models');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  console.log('🚀 Creating first admin user...\n');

  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: { email: 'admin@garmentims.com' }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('📧 Email: admin@garmentims.com');
      console.log('🔑 Password: admin123');
      console.log('💡 You can login with these credentials\n');
      return;
    }

    // Create admin user
    // Note: Password will be hashed by the User model hook
    const adminUser = await User.create({
      email: 'admin@garmentims.com',
      password_hash: 'admin123',
      full_name: 'System Administrator',
      phone: '+91-9876543200',
      is_active: true,
      status: 'active'
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@garmentims.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login\n');

    // Try to assign admin role if it exists
    try {
      const adminRole = await Role.findOne({ where: { name: 'admin' } });
      if (adminRole) {
        await adminUser.addRole(adminRole);
        console.log('✅ Admin role assigned successfully\n');
      } else {
        console.log('⚠️  Admin role not found, user created without role\n');
      }
    } catch (roleError) {
      console.log('⚠️  Could not assign role (this is okay for now)\n');
    }

    console.log('🎉 Setup completed! You can now login to the frontend.');

  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
    console.log('\nTroubleshooting:');
    console.log('1. Make sure MySQL is running');
    console.log('2. Check your .env file configuration');
    console.log('3. Ensure the database exists: CREATE DATABASE garment_ims;');
    console.log('4. Run migrations first: npm run migrate');
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  createAdminUser();
}

module.exports = createAdminUser;