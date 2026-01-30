const { FinishedGoodsStock, FinishedGoodsStockMovement, ProductVariant, Product, ProductionOrder, ProductionOutput, Branch, sequelize } = require('../src/models');
const { Op } = require('sequelize');

/**
 * Script to check for stock discrepancies and identify issues
 */
const checkStockDiscrepancies = async () => {
  try {
    console.log('🔍 Checking for stock discrepancies...\n');
    
    // 1. Check for duplicate stock entries (same variant + branch)
    console.log('1. Checking for duplicate stock entries...');
    const duplicateStocks = await FinishedGoodsStock.findAll({
      attributes: ['variant_id', 'branch_id'],
      group: ['variant_id', 'branch_id'],
      having: sequelize.literal('COUNT(*) > 1'),
      raw: true
    });
    
    if (duplicateStocks.length > 0) {
      console.log(`❌ Found ${duplicateStocks.length} duplicate stock entries:`);
      for (const dup of duplicateStocks) {
        const stocks = await FinishedGoodsStock.findAll({
          where: { variant_id: dup.variant_id, branch_id: dup.branch_id },
          include: [
            { model: ProductVariant, include: [{ model: Product }] },
            { model: Branch }
          ]
        });
        console.log(`   - ${stocks[0].ProductVariant.Product.product_name} (${stocks[0].ProductVariant.sku}) at ${stocks[0].Branch.name}: ${stocks.length} entries`);
        stocks.forEach((stock, idx) => {
          console.log(`     Entry ${idx + 1}: ID=${stock.id}, Qty=${stock.qty}, Created=${stock.created_at}`);
        });
      }
    } else {
      console.log('✅ No duplicate stock entries found');
    }
    
    // 2. Check for production orders with multiple outputs for same variant
    console.log('\n2. Checking for production orders with multiple outputs...');
    const multipleOutputs = await ProductionOutput.findAll({
      attributes: ['production_order_id', 'variant_id'],
      group: ['production_order_id', 'variant_id'],
      having: sequelize.literal('COUNT(*) > 1'),
      raw: true
    });
    
    if (multipleOutputs.length > 0) {
      console.log(`❌ Found ${multipleOutputs.length} production orders with multiple outputs:`);
      for (const output of multipleOutputs) {
        const outputs = await ProductionOutput.findAll({
          where: { production_order_id: output.production_order_id, variant_id: output.variant_id },
          include: [
            { model: ProductionOrder },
            { model: ProductVariant, include: [{ model: Product }] }
          ]
        });
        const totalQty = outputs.reduce((sum, o) => sum + o.qty, 0);
        console.log(`   - Production Order ${outputs[0].ProductionOrder.production_code}: ${outputs.length} outputs, Total Qty: ${totalQty}`);
      }
    } else {
      console.log('✅ No production orders with multiple outputs found');
    }
    
    // 3. Check stock vs movement calculations
    console.log('\n3. Checking stock vs movement calculations...');
    const stocks = await FinishedGoodsStock.findAll({
      include: [
        { model: ProductVariant, include: [{ model: Product }] },
        { model: Branch }
      ]
    });
    
    let discrepancies = 0;
    for (const stock of stocks) {
      // Calculate stock from movements
      const movements = await FinishedGoodsStockMovement.findAll({
        where: { variant_id: stock.variant_id, branch_id: stock.branch_id }
      });
      
      const calculatedStock = movements.reduce((total, movement) => {
        if (['IN', 'PRODUCTION_OUTPUT', 'TRANSFER_IN'].includes(movement.movement_type)) {
          return total + movement.qty;
        } else if (['OUT', 'SALE', 'TRANSFER_OUT'].includes(movement.movement_type)) {
          return total - movement.qty;
        }
        return total;
      }, 0);
      
      if (calculatedStock !== stock.qty) {
        discrepancies++;
        console.log(`❌ Discrepancy found:`);
        console.log(`   Product: ${stock.ProductVariant.Product.product_name} (${stock.ProductVariant.sku})`);
        console.log(`   Branch: ${stock.Branch.name}`);
        console.log(`   Stock Table: ${stock.qty}`);
        console.log(`   Calculated from Movements: ${calculatedStock}`);
        console.log(`   Difference: ${stock.qty - calculatedStock}`);
        console.log(`   Movements: ${movements.length} records`);
        
        // Show movement breakdown
        const movementSummary = movements.reduce((acc, mov) => {
          acc[mov.movement_type] = (acc[mov.movement_type] || 0) + mov.qty;
          return acc;
        }, {});
        console.log(`   Movement Summary:`, movementSummary);
        console.log('');
      }
    }
    
    if (discrepancies === 0) {
      console.log('✅ All stock calculations match movement records');
    } else {
      console.log(`❌ Found ${discrepancies} stock discrepancies`);
    }
    
    // 4. Check for completed production orders without stock entries
    console.log('\n4. Checking for completed production orders without stock entries...');
    const completedOrders = await ProductionOrder.findAll({
      where: { status: 'COMPLETED', produced_qty: { [Op.gt]: 0 } },
      include: [
        { model: Product },
        { model: ProductVariant },
        { model: ProductionOutput }
      ]
    });
    
    let missingStock = 0;
    for (const order of completedOrders) {
      if (!order.ProductionOutputs || order.ProductionOutputs.length === 0) {
        missingStock++;
        console.log(`❌ Missing ProductionOutput: ${order.production_code} - ${order.Product.product_name} (Produced: ${order.produced_qty})`);
      }
    }
    
    if (missingStock === 0) {
      console.log('✅ All completed production orders have stock entries');
    } else {
      console.log(`❌ Found ${missingStock} completed orders without stock entries`);
    }
    
    // 5. Summary
    console.log('\n📊 SUMMARY:');
    console.log(`Total Stock Records: ${stocks.length}`);
    console.log(`Total Completed Production Orders: ${completedOrders.length}`);
    console.log(`Stock Discrepancies: ${discrepancies}`);
    console.log(`Missing Stock Entries: ${missingStock}`);
    console.log(`Duplicate Stock Records: ${duplicateStocks.length}`);
    
    if (discrepancies > 0 || missingStock > 0 || duplicateStocks.length > 0) {
      console.log('\n⚠️  Issues found! Consider running fix scripts or manual corrections.');
    } else {
      console.log('\n✅ No major issues found!');
    }
    
  } catch (error) {
    console.error('Error checking stock discrepancies:', error);
  }
};

// Run the check
if (require.main === module) {
  checkStockDiscrepancies().then(() => {
    process.exit(0);
  }).catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = { checkStockDiscrepancies };