require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const rawMaterialId = 'b24cde09-b55a-4f24-a608-d86e37e87d63'; // Denim Fabric
  const productionBranchId = '773fd270-ecc6-4180-be85-1010831f8e50';

  console.log('\n=== Denim Fabric Stock by Branch ===');
  const [stock] = await conn.query(`
    SELECT 
      rmb.id,
      rmb.batch_code,
      rmb.qty,
      rmb.branch_id,
      b.name as branch_name,
      rmb.received_at
    FROM raw_material_batches rmb
    LEFT JOIN branches b ON rmb.branch_id = b.id
    WHERE rmb.raw_material_id = ?
    ORDER BY rmb.branch_id, rmb.received_at
  `, [rawMaterialId]);

  console.table(stock);
  console.log(`\nTotal stock across all branches: ${stock.reduce((sum, s) => sum + parseFloat(s.qty), 0)}`);

  console.log('\n=== Production Order Branch ===');
  const [branch] = await conn.query(`
    SELECT id, name FROM branches WHERE id = ?
  `, [productionBranchId]);
  console.table(branch);

  const stockInProductionBranch = stock.filter(s => s.branch_id === productionBranchId);
  console.log(`\n=== Stock in Production Branch ===`);
  if (stockInProductionBranch.length === 0) {
    console.log('⚠️  NO STOCK in the production order branch!');
    console.log('\n📍 SOLUTION: When creating a production order, select the branch where stock exists:');
    const branchesWithStock = [...new Set(stock.map(s => s.branch_name))];
    branchesWithStock.forEach(b => console.log(`   - ${b}`));
  } else {
    console.table(stockInProductionBranch);
  }

  await conn.end();
})().catch(console.error);
