const { 
  ProductionOrder, 
  ProductionConsumption, 
  ProductionOutput,
  FinishedGoodsStock, 
  FinishedGoodsStockMovement, 
  RawMaterialStockMovement,
  ProductVariant,
  Product,
  Branch,
  sequelize 
} = require('../src/models');

/**
 * Comprehensive fix for production stock issues
 */
const fixProductionStockIssues = async () => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🔧 Starting comprehensive production stock fix...\n');
    
    let fixedIssues = {
      duplicateStockRecords: 0,
      missingRawMaterialMovements: 0,
      missingFinishedGoodsMovements: 0,
      correctedStockQuantities: 0
    };
    
    // 1. Fix duplicate stock records
    console.log('1. Fixing duplicate stock records...');
    const duplicateGroups = await sequelize.query(`
      SELECT variant_id, branch_id, COUNT(*) as count
      FROM finished_goods_stock 
      GROUP BY variant_id, branch_id 
      HAVING COUNT(*) > 1
    `, { type: sequelize.QueryTypes.SELECT });
    
    for (const group of duplicateGroups) {
      const stocks = await FinishedGoodsStock.findAll({
        where: { variant_id: group.variant_id, branch_id: group.branch_id },
        order: [['created_at', 'ASC']],
        transaction
      });
      
      // Keep the first record, merge quantities, delete others
      const totalQty = stocks.reduce((sum, stock) => sum + stock.qty, 0);
      const totalReserved = stocks.reduce((sum, stock) => sum + stock.reserved_qty, 0);
      
      await stocks[0].update({ 
        qty: totalQty, 
        reserved_qty: totalReserved 
      }, { transaction });
      
      // Delete duplicate records
      for (let i = 1; i < stocks.length; i++) {
        await stocks[i].destroy({ transaction });
      }
      
      fixedIssues.duplicateStockRecords += stocks.length - 1;
      console.log(`   ✅ Merged ${stocks.length} duplicate records for variant ${group.variant_id}`);
    }
    
    // 2. Add missing raw material stock movements
    console.log('\n2. Adding missing raw material stock movements...');
    const completedOrders = await ProductionOrder.findAll({
      where: { status: 'COMPLETED' },
      include: [{ model: ProductionConsumption }],
      transaction
    });
    
    for (const order of completedOrders) {
      for (const consumption of order.ProductionConsumptions) {
        const existingMovement = await RawMaterialStockMovement.findOne({
          where: {
            reference_table: 'production_orders',
            reference_id: order.id,
            raw_material_id: consumption.raw_material_id,
            raw_material_batch_id: consumption.batch_id
          },
          transaction
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
            created_by: null
          }, { transaction });
          
          fixedIssues.missingRawMaterialMovements++;
        }
      }
    }
    
    // 3. Add missing finished goods stock movements
    console.log('\n3. Adding missing finished goods stock movements...');
    const productionOutputs = await ProductionOutput.findAll({
      include: [{ model: ProductionOrder }],
      transaction
    });
    
    for (const output of productionOutputs) {
      const existingMovement = await FinishedGoodsStockMovement.findOne({
        where: {
          reference_table: 'production_orders',
          reference_id: output.production_order_id,
          variant_id: output.variant_id
        },
        transaction
      });
      
      if (!existingMovement) {
        await FinishedGoodsStockMovement.create({
          variant_id: output.variant_id,
          branch_id: output.ProductionOrder.branch_id,
          movement_type: 'PRODUCTION_OUTPUT',
          qty: output.qty,
          reference_table: 'production_orders',
          reference_id: output.production_order_id,
          created_by: null
        }, { transaction });
        
        fixedIssues.missingFinishedGoodsMovements++;
      }
    }
    
    // 4. Recalculate and correct stock quantities based on movements
    console.log('\n4. Recalculating stock quantities from movements...');
    const allStocks = await FinishedGoodsStock.findAll({
      include: [
        { model: ProductVariant, include: [{ model: Product }] },
        { model: Branch }
      ],
      transaction
    });
    
    for (const stock of allStocks) {
      const movements = await FinishedGoodsStockMovement.findAll({
        where: { variant_id: stock.variant_id, branch_id: stock.branch_id },
        transaction
      });
      
      const calculatedQty = movements.reduce((total, movement) => {
        if (['IN', 'PRODUCTION_OUTPUT', 'TRANSFER_IN'].includes(movement.movement_type)) {
          return total + movement.qty;
        } else if (['OUT', 'SALE', 'TRANSFER_OUT'].includes(movement.movement_type)) {
          return total - movement.qty;
        }
        return total;
      }, 0);
      
      if (calculatedQty !== stock.qty) {
        console.log(`   🔄 Correcting ${stock.ProductVariant.Product.product_name} (${stock.ProductVariant.sku}) at ${stock.Branch.name}`);
        console.log(`      Old: ${stock.qty}, New: ${calculatedQty}`);
        
        await stock.update({ qty: Math.max(0, calculatedQty) }, { transaction });
        fixedIssues.correctedStockQuantities++;
      }
    }
    
    await transaction.commit();
    
    console.log('\n📊 FIX SUMMARY:');
    console.log(`✅ Duplicate stock records merged: ${fixedIssues.duplicateStockRecords}`);
    console.log(`✅ Missing raw material movements added: ${fixedIssues.missingRawMaterialMovements}`);
    console.log(`✅ Missing finished goods movements added: ${fixedIssues.missingFinishedGoodsMovements}`);
    console.log(`✅ Stock quantities corrected: ${fixedIssues.correctedStockQuantities}`);
    console.log('\n🎉 Production stock issues fixed successfully!');
    
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error fixing production stock issues:', error);
    throw error;
  }
};

// Run the fix
if (require.main === module) {
  fixProductionStockIssues().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = { fixProductionStockIssues };