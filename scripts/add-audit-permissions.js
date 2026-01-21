const { sequelize } = require('../src/models');
const { v4: uuidv4 } = require('uuid');

async function addAuditPermissions() {
  try {
    console.log('🔧 Adding audit permissions...');
    
    // Check if audit permissions already exist
    const [existingAuditPerms] = await sequelize.query("SELECT code FROM permissions WHERE code LIKE 'audit.%'");
    
    if (existingAuditPerms.length === 0) {
      const auditPermissions = [
        { id: uuidv4(), code: 'audit.view', description: 'View audit logs', created_at: new Date() },
        { id: uuidv4(), code: 'audit.create', description: 'Create audit logs', created_at: new Date() },
        { id: uuidv4(), code: 'audit.delete', description: 'Delete audit logs', created_at: new Date() }
      ];

      await sequelize.getQueryInterface().bulkInsert('permissions', auditPermissions);
      console.log('✅ Added 3 audit permissions');
    } else {
      console.log('ℹ️  Audit permissions already exist:', existingAuditPerms.map(p => p.code));
    }

    // Get admin role and audit permissions
    const [adminRoles] = await sequelize.query("SELECT id FROM roles WHERE name = 'admin'");
    const [auditPermissions] = await sequelize.query("SELECT id FROM permissions WHERE code LIKE 'audit.%'");

    if (adminRoles.length > 0 && auditPermissions.length > 0) {
      console.log('🔗 Assigning audit permissions to admin role...');
      
      // Check existing assignments
      const [existingAssignments] = await sequelize.query(
        'SELECT permission_id FROM role_permissions WHERE role_id = ? AND permission_id IN (?)',
        { 
          replacements: [
            adminRoles[0].id, 
            auditPermissions.map(p => p.id)
          ] 
        }
      );

      const existingPermissionIds = existingAssignments.map(a => a.permission_id);
      const newAssignments = auditPermissions
        .filter(p => !existingPermissionIds.includes(p.id))
        .map(permission => ({
          id: uuidv4(),
          role_id: adminRoles[0].id,
          permission_id: permission.id,
          created_at: new Date(),
          updated_at: new Date()
        }));

      if (newAssignments.length > 0) {
        await sequelize.getQueryInterface().bulkInsert('role_permissions', newAssignments);
        console.log('✅ Assigned', newAssignments.length, 'audit permissions to admin role');
      } else {
        console.log('ℹ️  Admin role already has all audit permissions');
      }
    }

    console.log('🎉 Audit permissions setup complete!');
    console.log('🔄 Please restart the backend server to apply changes');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

addAuditPermissions();