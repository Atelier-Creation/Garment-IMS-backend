require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const [rows] = await conn.query(`
    SELECT 
      r.name as role_name, 
      p.code as permission_code, 
      p.description
    FROM roles r
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE r.name = 'admin' AND p.code LIKE 'production_order.%'
    ORDER BY p.code
  `);

  console.log('\nProduction Order Permissions for Admin Role:');
  console.table(rows);
  
  if (rows.length === 0) {
    console.log('\n⚠️  No production order permissions found for admin role!');
  } else {
    console.log(`\n✅ Found ${rows.length} production order permissions`);
  }

  await conn.end();
})().catch(console.error);
