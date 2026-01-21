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

  // Get admin role ID
  const [adminRole] = await conn.query(`SELECT id FROM roles WHERE name = 'admin' LIMIT 1`);
  if (adminRole.length === 0) {
    console.error('Admin role not found!');
    await conn.end();
    return;
  }
  const adminRoleId = adminRole[0].id;
  console.log('Admin Role ID:', adminRoleId);

  // Get all production order permissions
  const [permissions] = await conn.query(`
    SELECT id, code FROM permissions 
    WHERE code LIKE 'production_order.%'
  `);
  console.log(`\nFound ${permissions.length} production order permissions`);

  // Add each permission to admin role
  for (const perm of permissions) {
    try {
      // Check if already exists
      const [existing] = await conn.query(`
        SELECT id FROM role_permissions 
        WHERE role_id = ? AND permission_id = ?
      `, [adminRoleId, perm.id]);

      if (existing.length === 0) {
        await conn.query(`
          INSERT INTO role_permissions (id, role_id, permission_id, created_at, updated_at)
          VALUES (?, ?, ?, NOW(), NOW())
        `, [uuidv4(), adminRoleId, perm.id]);
        console.log(`✅ Added: ${perm.code}`);
      } else {
        console.log(`⏭️  Already exists: ${perm.code}`);
      }
    } catch (error) {
      console.log(`⚠️  ${perm.code}: ${error.message}`);
    }
  }

  // Verify
  console.log('\n=== Verification: Admin Role Permissions ===');
  const [result] = await conn.query(`
    SELECT p.code, p.description
    FROM role_permissions rp
    JOIN permissions p ON rp.permission_id = p.id
    WHERE rp.role_id = ? AND p.code LIKE 'production_order.%'
    ORDER BY p.code
  `, [adminRoleId]);
  console.table(result);

  await conn.end();
  console.log('\n✅ Done! Please log out and log back in to refresh permissions.');
})().catch(console.error);
