require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  console.log('\n=== All BOMs in Database ===');
  const [boms] = await conn.query(`
    SELECT 
      b.id,
      b.product_id,
      b.name as bom_name,
      b.version,
      p.product_name,
      p.product_code
    FROM boms b
    LEFT JOIN products p ON b.product_id = p.id
    ORDER BY b.created_at DESC
    LIMIT 20
  `);
  
  if (boms.length === 0) {
    console.log('⚠️  No BOMs found in database!');
    console.log('You need to create a BOM first before creating a production order.');
  } else {
    console.table(boms);
    console.log(`\nTotal BOMs: ${boms.length}`);
  }

  console.log('\n=== All Products in Database ===');
  const [products] = await conn.query(`
    SELECT id, product_code, product_name
    FROM products
    ORDER BY created_at DESC
    LIMIT 10
  `);
  console.table(products);

  await conn.end();
})().catch(console.error);
