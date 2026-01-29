const { ProductionOrder, Product, ProductVariant, ProductionOutput, FinishedGoodsStock, FinishedGoodsStockMovement } = require('../models');

/**
 * Utility function to fix completed production orders that didn't get added to stock
 * This should be run once to fix historical data
 */
const fixCompletedProductionOrders = async () => {
  try {
    console.log('Starting to fix completed production orders...');
    
    // Find all completed production orders that don't have corresponding stock entries
    const completedOrders = await ProductionOrder.findAll({
      where: { status: 'COMPLETED' },
      include: [
        { model: Product },
        { model: ProductVariant },
        { model: ProductionOutput }
      ]
    });
    
    console.log(`Found ${completedOrders.length} completed production orders`);
    
    let fixedCount = 0;
    
    for (const order of completedOrders) {
      try {
        // Check if this order already has stock entries
        const hasStockEntry = await FinishedGoodsStock.findOne({
          where: {
            variant_id: order.variant_id,
            branch_id: order.branch_id
          }
        });
        
        // Check if this order has production output
        const hasProductionOutput = order.ProductionOutputs && order.ProductionOutputs.length > 0;
        
        if (!hasProductionOutput && order.produced_qty > 0) {
          console.log(`Fixing production order: ${order.production_code}`);
          
          let variantId = order.variant_id;
          
          // If no variant_id, find or create default variant
          if (!variantId && order.product_id) {
            let defaultVariant = await ProductVariant.findOne({
              where: { product_id: order.product_id },
              order: [['created_at', 'ASC']]
            });
            
            if (!defaultVariant) {
              // Create default variant
              defaultVariant = await ProductVariant.create({
                product_id: order.product_id,
                sku: `${order.Product.product_code}-DEFAULT`,
                size: 'Standard',
                color: 'Default',
                price: order.Product.price || 0,
                cost: order.Product.cost || 0
              });
              console.log(`Created default variant for ${order.Product.product_name}`);
            }
            
            variantId = defaultVariant.id;
            
            // Update the production order with variant_id
            await order.update({ variant_id: variantId });
          }
          
          if (variantId) {
            // Create production output
            await ProductionOutput.create({
              production_order_id: order.id,
              variant_id: variantId,
              qty: order.produced_qty,
              unit_cost: 0
            });
            
            // Update or create finished goods stock
            const existingStock = await FinishedGoodsStock.findOne({
              where: {
                variant_id: variantId,
                branch_id: order.branch_id
              }
            });
            
            if (existingStock) {
              await existingStock.update({
                qty: existingStock.qty + order.produced_qty
              });
            } else {
              await FinishedGoodsStock.create({
                variant_id: variantId,
                branch_id: order.branch_id,
                qty: order.produced_qty,
                reserved_qty: 0
              });
            }
            
            // Create stock movement record
            await FinishedGoodsStockMovement.create({
              variant_id: variantId,
              branch_id: order.branch_id,
              movement_type: 'PRODUCTION_IN',
              qty: order.produced_qty,
              reference_table: 'production_orders',
              reference_id: order.id,
              created_by: null // System fix
            });
            
            fixedCount++;
            console.log(`Fixed order ${order.production_code} - Added ${order.produced_qty} units to stock`);
          }
        }
      } catch (orderError) {
        console.error(`Error fixing order ${order.production_code}:`, orderError.message);
      }
    }
    
    console.log(`Successfully fixed ${fixedCount} production orders`);
    return { success: true, fixedCount };
    
  } catch (error) {
    console.error('Error fixing completed production orders:', error);
    return { success: false, error: error.message };
  }
};

module.exports = { fixCompletedProductionOrders };
