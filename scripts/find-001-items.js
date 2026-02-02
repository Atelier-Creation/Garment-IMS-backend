const { PurchaseOrder, PurchaseOrderItem, RawMaterial, Supplier } = require('../src/models');

async function findItemsWith001() {
  try {
    // Find all items with received_quantity = 0.01
    const itemsWith001 = await PurchaseOrderItem.findAll({
      where: { received_quantity: 0.01 },
      include: [
        { 
          model: PurchaseOrder,
          include: [{ model: Supplier }]
        },
        { model: RawMaterial }
      ]
    });

    console.log('Items with received_quantity = 0.01:');
    itemsWith001.forEach((item, index) => {
      console.log(`\n${index + 1}. Item ID: ${item.id}`);
      console.log(`   PO Number: ${item.PurchaseOrder?.po_number}`);
      console.log(`   PO Status: ${item.PurchaseOrder?.status}`);
      console.log(`   Supplier: ${item.PurchaseOrder?.Supplier?.name}`);
      console.log(`   Material: ${item.RawMaterial?.name}`);
      console.log(`   Ordered: ${item.qty}`);
      console.log(`   Received: ${item.received_quantity}`);
    });

    // Also find the item with 5.00
    const itemWith5 = await PurchaseOrderItem.findOne({
      where: { received_quantity: 5.00 },
      include: [
        { 
          model: PurchaseOrder,
          include: [{ model: Supplier }]
        },
        { model: RawMaterial }
      ]
    });

    if (itemWith5) {
      console.log('\n\nItem with received_quantity = 5.00:');
      console.log(`   Item ID: ${itemWith5.id}`);
      console.log(`   PO Number: ${itemWith5.PurchaseOrder?.po_number}`);
      console.log(`   PO Status: ${itemWith5.PurchaseOrder?.status}`);
      console.log(`   Supplier: ${itemWith5.PurchaseOrder?.Supplier?.name}`);
      console.log(`   Material: ${itemWith5.RawMaterial?.name}`);
      console.log(`   Ordered: ${itemWith5.qty}`);
      console.log(`   Received: ${itemWith5.received_quantity}`);
    }

  } catch (error) {
    console.error('Error finding items with 0.01:', error);
  }
}

findItemsWith001();