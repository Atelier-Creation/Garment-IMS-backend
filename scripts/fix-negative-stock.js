const { FinishedGoodsStock } = require('../src/models');

async function fixNegativeStock() {
  try {
    // Find the stock record
    const stock = await FinishedGoodsStock.findOne({
      where: { variant_id: 'eed1bb71-c65d-43d0-9f19-53542d65f1eb' }
    });

    if (!stock) {
      console.log('Stock not found');
      return;
    }

    console.log('Current stock:', {
      qty: stock.qty,
      reserved_qty: stock.reserved_qty
    });

    // Reset to correct values
    // We started with 5, so let's set it back
    await stock.update({
      qty: 2,  // 5 original - 3 sold = 2 remaining
      reserved_qty: 0  // No reservations
    });

    console.log('\n✅ Stock fixed!');
    console.log('New stock:', {
      qty: 2,
      reserved_qty: 0
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

fixNegativeStock();
