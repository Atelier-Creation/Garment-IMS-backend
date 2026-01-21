const { FinishedGoodsStock, ProductionOrder, ProductVariant } = require('../src/models');

async function fixCompletedProductionStock() {
  try {
    // Get the completed production order
    const productionOrder = await ProductionOrder.findOne({
      where: { production_code: 'PRO000002' }
    });

    if (!productionOrder) {
      console.log('Production order PRO000002 not found');
      return;
    }

    console.log('Found production order:', {
      code: productionOrder.production_code,
      product_id: productionOrder.product_id,
      produced_qty: productionOrder.produced_qty,
      branch_id: productionOrder.branch_id
    });

    // Get a variant for this product (let's use size M)
    const variant = await ProductVariant.findOne({
      where: {
        product_id: productionOrder.product_id,
        size: 'M'
      }
    });

    if (!variant) {
      console.log('No variant found for this product');
      return;
    }

    console.log('Using variant:', {
      sku: variant.sku,
      size: variant.size,
      color: variant.color
    });

    // Check if stock already exists
    let stock = await FinishedGoodsStock.findOne({
      where: {
        variant_id: variant.id,
        branch_id: productionOrder.branch_id
      }
    });

    if (stock) {
      // Update existing stock
      stock.qty += productionOrder.produced_qty;
      await stock.save();
      console.log(`Updated existing stock. New quantity: ${stock.qty}`);
    } else {
      // Create new stock record
      stock = await FinishedGoodsStock.create({
        variant_id: variant.id,
        branch_id: productionOrder.branch_id,
        qty: productionOrder.produced_qty,
        reserved_qty: 0
      });
      console.log(`Created new stock record with quantity: ${stock.qty}`);
    }

    console.log('\n✅ Successfully added finished goods stock!');
    console.log('Stock details:', {
      variant_sku: variant.sku,
      branch_id: productionOrder.branch_id,
      quantity: stock.qty
    });

  } catch (error) {
    console.error('Error fixing production stock:', error);
  }
}

fixCompletedProductionStock();
