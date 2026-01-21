require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('\n=== All Production Order Permissions in Database ===');
  const [allPerms] = await conn.query(`
    SELECT * FROM permissions 
    WHERE code LIKE 'production_order%' 
    ORDER BY code
  `);
  console.table(allPerms);

  console.log('\n=== Production Order Permissions Assigned to Admin ===');
  const [adminPerms] = await conn.query(`
    SELECT 
      r.name as role_name, 
      p.code as permission_code, 
      p.description
    FROM roles r
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE r.name = 'admin' AND p.code LIKE 'production_order%'
    ORDER BY p.code
  `);
  console.table(adminPerms);

  await conn.end();
})().catch(console.error);
