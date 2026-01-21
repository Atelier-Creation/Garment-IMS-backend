'use strict';
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create admin user
    const adminUserId = uuidv4();
    const hashedPassword = await bcrypt.hash('admin123', 12);

    await queryInterface.bulkInsert('users', [{
      id: adminUserId,
      email: 'admin@garmentims.com',
      password_hash: hashedPassword,
      full_name: 'System Administrator',
      phone: '+91-9876543200',
      is_active: 1,
      created_at: new Date(),
      updated_at: new Date()
    }]);

    // Get admin role ID
    const adminRole = await queryInterface.sequelize.query(
      "SELECT id FROM roles WHERE name = 'admin'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (adminRole.length > 0) {
      // Assign admin role to user
      await queryInterface.bulkInsert('user_roles', [{
        id: uuidv4(),
        user_id: adminUserId,
        role_id: adminRole[0].id,
        created_at: new Date()
      }]);
    }

    console.log('\n🎉 Admin user created successfully!');
    console.log('📧 Email: admin@garmentims.com');
    console.log('🔑 Password: admin123');
    console.log('⚠️  Please change the password after first login\n');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('user_roles', {
      user_id: {
        [Sequelize.Op.in]: queryInterface.sequelize.literal(
          "(SELECT id FROM users WHERE email = 'admin@garmentims.com')"
        )
      }
    });
    
    await queryInterface.bulkDelete('users', {
      email: 'admin@garmentims.com'
    });
  }
};