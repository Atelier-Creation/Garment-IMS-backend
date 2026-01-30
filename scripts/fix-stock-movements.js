const { ProductionOrder, ProductionConsumption, RawMaterialStockMovement, FinishedGoodsStockMovement, ProductionOutput } = require('../src/models');

/**
 * Fix missing stock movements for completed production orders
 */
const fixStockMovements = async () => {
  try {
    console.log('🔧 Fixing missing stock movements for completed production orders...\n');
    
    // Find completed production orders
    const completedOrders = await ProductionOrder.findAll({
      where: { status: 'COMPLETED' },
      include: [
        { model: ProductionConsumption },
        { model: ProductionOutput }
      ]
    });
    
    console.log(`Found ${completedOrders.length} completed production orders`);
    
    let fixedRawMaterialMovements = 0;
    let fixedFinishedGoodsMovements = 0;
    
    for (const order of completedOrders) {
      try {
        // Check and fix raw material movements
        for (const consumption of order.ProductionConsumptions) {
          const existingMovement = await RawMaterialStockMovement.findOne({
            where: {
              reference_table: 'production_orders',
              reference_id: order.id,
              raw_material_id: consumption.raw_material_id,
              raw_material_batch_id: consumption.batch_id
            }
          });
          
          if (!existingMovement) {
            await RawMaterialStockMovement.create({
              raw_material_id: consumption.raw_material_id,
              raw_material_batch_id: consumption.batch_id,
              branch_id: order.branch_id,
              movement_type: 'OUT',
              qty: consumption.qty,
              reference_table: 'production_orders',
              reference_id: order.id,
              created_by: null // System fix
            });
            fixedRawMaterialMovements++;
            console.log(`✅ Added raw material movement for order ${order.production_code}`);
          }
        }
        
        // Check and fix finished goods movements
        for (const output of order.ProductionOutputs) {
          const existingMovement = await FinishedGoodsStockMovement.findOne({
            where: {
              reference_table: 'production_orders',
              reference_id: order.id,
              variant_id: output.variant_id
            }
          });
          
          if (!existingMovement) {
            await FinishedGoodsStockMovement.create({
              variant_id: output.variant_id,
              branch_id: order.branch_id,
              movement_type: 'PRODUCTION_OUTPUT',
              qty: output.qty,
              reference_table: 'production_orders',
              reference_id: order.id,
              created_by: null // System fix
            });
            fixedFinishedGoodsMovements++;
            console.log(`✅ Added finished goods movement for order ${order.production_code}`);
          }
        }
        
      } catch (orderError) {
        console.error(`❌ Error fixing order ${order.production_code}:`, orderError.message);
      }
    }
    
    console.log('\n📊 SUMMARY:');
    console.log(`Fixed Raw Material Movements: ${fixedRawMaterialMovements}`);
    console.log(`Fixed Finished Goods Movements: ${fixedFinishedGoodsMovements}`);
    console.log('✅ Stock movement fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing stock movements:', error);
  }
};

// Run the fix
if (require.main === module) {
  fixStockMovements().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = { fixStockMovements };