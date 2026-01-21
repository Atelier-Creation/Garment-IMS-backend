const { sequelize } = require('../src/models');

async function checkAdminPermissions() {
  try {
    const [results] = await sequelize.query(`
      SELECT p.code 
      FROM permissions p 
      JOIN role_permissions rp ON p.id = rp.permission_id 
      JOIN roles r ON r.id = rp.role_id 
      WHERE r.name = 'admin'
      ORDER BY p.code
    `);
    
    console.log('Admin role permissions:');
    results.forEach(r => console.log('  -', r.code));
    console.log('\nTotal permissions:', results.length);
    
    // Check specifically for audit permissions
    const auditPerms = results.filter(r => r.code.startsWith('audit.'));
    console.log('\nAudit permissions:');
    auditPerms.forEach(r => console.log('  -', r.code));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkAdminPermissions();