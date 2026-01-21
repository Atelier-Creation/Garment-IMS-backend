const { AuditLog, User } = require('../src/models');

async function createSampleAuditLogs() {
  try {
    console.log('Creating sample audit log entries...');

    // Get the admin user
    const adminUser = await User.findOne({ where: { email: 'admin@garmentims.com' } });
    
    if (!adminUser) {
      console.log('Admin user not found. Please run setup scripts first.');
      return;
    }

    // Create sample audit log entries
    const sampleLogs = [
      {
        user_id: adminUser.id,
        action: 'login',
        target_table: 'users',
        target_id: adminUser.id,
        payload: { ip_address: '127.0.0.1', user_agent: 'Mozilla/5.0' }
      },
      {
        user_id: adminUser.id,
        action: 'view',
        target_table: 'products',
        target_id: null,
        payload: { page: 1, limit: 20 }
      },
      {
        user_id: adminUser.id,
        action: 'create',
        target_table: 'categories',
        target_id: '1',
        payload: { name: 'Sample Category', description: 'Test category' }
      },
      {
        user_id: adminUser.id,
        action: 'update',
        target_table: 'suppliers',
        target_id: '1',
        payload: { 
          old_values: { name: 'Old Supplier Name' },
          new_values: { name: 'Updated Supplier Name' }
        }
      },
      {
        user_id: adminUser.id,
        action: 'delete',
        target_table: 'products',
        target_id: '5',
        payload: { reason: 'Discontinued product' }
      }
    ];

    for (const logData of sampleLogs) {
      await AuditLog.create(logData);
      console.log(`Created audit log: ${logData.action} on ${logData.target_table}`);
    }

    console.log('Sample audit logs created successfully!');
    
    // Check total count
    const count = await AuditLog.count();
    console.log(`Total audit logs in database: ${count}`);

  } catch (error) {
    console.error('Error creating sample audit logs:', error);
  }
}

// Run if called directly
if (require.main === module) {
  createSampleAuditLogs().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = createSampleAuditLogs;