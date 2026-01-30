const { FinishedGoodsStock, FinishedGoodsStockMovement, ProductVariant, Product, ProductionOrder, ProductionOutput, Branch } = require('../src/models');

/**
 * Check stock for a specific product to identify discrepancies
 */
const checkSpecificProductStock = async (productName = 'Blue Jen') => {
  try {
    console.log(`🔍 Checking stock for product containing: "${productName}"\n`);
    
    // Find products matching the name
    const products = await Product.findAll({
      where: {
        product_name: {
          [require('sequelize').Op.like]: `%${productName}%`
        }
      },
      include: [{
        model: ProductVariant,
        include: [{
          model: FinishedGoodsStock,
          include: [{ model: Branch }]
        }]
      }]
    });
    
    if (products.length === 0) {
      console.log(`❌ No products found matching "${productName}"`);
      return;
    }
    
    for (const product of products) {
      console.log(`📦 Product: ${product.product_name} (${product.product_code})`);
      
      for (const variant of product.ProductVariants) {
        console.log(`  🏷️  Variant: ${variant.sku} - ${variant.size} ${variant.color}`);
        
        for (const stock of variant.FinishedGoodsStocks) {
          console.log(`    📍 Branch: ${stock.Branch.name}`);
          console.log(`    📊 Current Stock: ${stock.qty}`);
          console.log(`    🔒 Reserved: ${stock.reserved_qty}`);
          
          // Get all stock movements for this variant/branch
          const movements = await FinishedGoodsStockMovement.findAll({
            where: {
              variant_id: variant.id,
              branch_id: stock.branch_id
            },
            order: [['created_at', 'ASC']]
          });
          
          console.log(`    📋 Stock Movements (${movements.length} total):`);
          let calculatedStock = 0;
          
          for (const movement of movements) {
            const sign = ['IN', 'PRODUCTION_OUTPUT', 'TRANSFER_IN'].includes(movement.movement_type) ? '+' : '-';
            calculatedStock += ['IN', 'PRODUCTION_OUTPUT', 'TRANSFER_IN'].includes(movement.movement_type) 
              ? movement.qty 
              : -movement.qty;
              
            console.log(`      ${sign}${movement.qty} ${movement.movement_type} (${movement.reference_table || 'manual'}) - ${movement.created_at}`);
          }
          
          console.log(`    🧮 Calculated Stock: ${calculatedStock}`);
          console.log(`    ⚖️  Difference: ${stock.qty - calculatedStock}`);
          
          if (stock.qty !== calculatedStock) {
            console.log(`    ❌ DISCREPANCY FOUND!`);
          } else {
            console.log(`    ✅ Stock matches movements`);
          }
          
          // Check production orders for this variant
          const productionOrders = await ProductionOrder.findAll({
            where: {
              variant_id: variant.id,
              status: 'COMPLETED'
            },
            include: [{ model: ProductionOutput }]
          });
          
          if (productionOrders.length > 0) {
            console.log(`    🏭 Production Orders (${productionOrders.length} completed):`);
            for (const order of productionOrders) {
              const totalOutput = order.ProductionOutputs.reduce((sum, output) => sum + output.qty, 0);
              console.log(`      ${order.production_code}: Produced ${order.produced_qty}, Output Records: ${totalOutput}`);
            }
          }
          
          console.log('');
        }
      }
    }
    
  } catch (error) {
    console.error('Error checking product stock:', error);
  }
};

// Run the check
if (require.main === module) {
  const productName = process.argv[2] || 'Blue Jen';
  checkSpecificProductStock(productName).then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = { checkSpecificProductStock };