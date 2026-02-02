const { PurchaseOrder, PurchaseOrderItem, RawMaterial, Supplier } = require('../src/models');

async function debugReceivedQuantity() {
  try {
    // Find the purchase order we've been testing with
    const purchaseOrder = await PurchaseOrder.findOne({
      where: { po_number: 'PO000009' },
      include: [
        { model: Supplier },
        {
          model: PurchaseOrderItem,
          include: [{ model: RawMaterial }]
        }
      ]
    });

    if (!purchaseOrder) {
      console.log('Purchase order PO000009 not found');
      return;
    }

    console.log('Purchase Order Details:');
    console.log(`PO Number: ${purchaseOrder.po_number}`);
    console.log(`Status: ${purchaseOrder.status}`);
    
    console.log('\nItems with received quantities:');
    purchaseOrder.PurchaseOrderItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.RawMaterial?.name}`);
      console.log(`   Item ID: ${item.id}`);
      console.log(`   Ordered: ${item.qty} (type: ${typeof item.qty})`);
      console.log(`   Received: ${item.received_quantity} (type: ${typeof item.received_quantity})`);
      console.log(`   Raw received value: ${JSON.stringify(item.received_quantity)}`);
      console.log(`   Parsed received: ${parseFloat(item.received_quantity || 0)}`);
      console.log('   ---');
    });

    // Test different number formats
    console.log('\nTesting number parsing:');
    const testValues = [5, '5', 5.0, '5.0', 0.01, '0.01'];
    testValues.forEach(val => {
      console.log(`Value: ${val} (type: ${typeof val}) -> Parsed: ${parseFloat(val)}`);
    });

  } catch (error) {
    console.error('Error debugging received quantity:', error);
  }
}

debugReceivedQuantity();