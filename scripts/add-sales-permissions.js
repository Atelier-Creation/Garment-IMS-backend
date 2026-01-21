require('dotenv').config();
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('\n=== Adding Sales Order Permissions ===');

  // Get admin role ID
  const [adminRole] = await conn.query(`SELECT id FROM roles WHERE name = 'admin' LIMIT 1`);
  if (adminRole.length === 0) {
    console.error('Admin role not found!');
    await conn.end();
    return;
  }
  const adminRoleId = adminRole[0].id;

  // Define sales order permissions
  const permissions = [
    { code: 'sales_order.create', description: 'Create sales orders' },
    { code: 'sales_order.read', description: 'View sales orders' },
    { code: 'sales_order.update', description: 'Update sales orders' },
    { code: 'sales_order.delete', description: 'Delete sales orders' },
    { code: 'sales_order.confirm', description: 'Confirm sales orders' },
    { code: 'sales_order.process', description: 'Process sales orders' },
    { code: 'sales_order.deliver', description: 'Deliver sales orders' }
  ];

  for (const perm of permissions) {
    // Check if permission exists
    const [existing] = await conn.query(`SELECT id FROM permissions WHERE code = ?`, [perm.code]);
    
    let permId;
    if (existing.length === 0) {
      // Create permission
      permId = uuidv4();
      await conn.query(`
        INSERT INTO permissions (id, code, description, created_at)
        VALUES (?, ?, ?, NOW())
      `, [permId, perm.code, perm.description]);
      console.log(`✅ Created permission: ${perm.code}`);
    } else {
      permId = existing[0].id;
      console.log(`⏭️  Permission exists: ${perm.code}`);
    }

    // Check if role-permission mapping exists
    const [rolePermExists] = await conn.query(`
      SELECT id FROM role_permissions 
      WHERE role_id = ? AND permission_id = ?
    `, [adminRoleId, permId]);

    if (rolePermExists.length === 0) {
      await conn.query(`
        INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
        VALUES (?, ?, ?, NOW(), NOW())
      `, [uuidv4(), adminRoleId, permId]);
      console.log(`✅ Added to admin role: ${perm.code}`);
    } else {
      console.log(`⏭️  Already in admin role: ${perm.code}`);
    }
  }

  // Verify
  console.log('\n=== Verification: Sales Order Permissions ===');
  const [result] = await conn.query(`
    SELECT p.code, p.description
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role_id = ? AND p.code LIKE 'sales_order.%'
    ORDER BY p.code
  `, [adminRoleId]);
  console.table(result);

  await conn.end();
  console.log('\n✅ Done! Please log out and log back in to refresh permissions.');
})().catch(console.error);
