const { PurchaseOrder, PurchaseOrderItem, RawMaterial, Supplier } = require('../src/models');

async function testReceivePurchaseOrder() {
  try {
    // Find a purchase order with PLACED status
    const purchaseOrder = await PurchaseOrder.findOne({
      where: { status: 'PLACED' },
      include: [
        { model: Supplier },
        {
          model: PurchaseOrderItem,
          include: [{ model: RawMaterial }]
        }
      ]
    });

    if (!purchaseOrder) {
      console.log('No PLACED purchase orders found. Creating a test scenario...');
      
      // Find any purchase order to test with
      const testPO = await PurchaseOrder.findOne({
        include: [
          { model: Supplier },
          {
            model: PurchaseOrderItem,
            include: [{ model: RawMaterial }]
          }
        ]
      });
      
      if (!testPO) {
        console.log('No purchase orders found at all.');
        return;
      }
      
      // Update status to PLACED for testing
      await testPO.update({ status: 'PLACED' });
      console.log(`Updated PO ${testPO.po_number} status to PLACED for testing`);
      
      console.log('\nPurchase Order Details:');
      console.log(`PO Number: ${testPO.po_number}`);
      console.log(`Status: ${testPO.status}`);
      console.log(`Supplier: ${testPO.Supplier?.name}`);
      
      console.log('\nItems:');
      testPO.PurchaseOrderItems.forEach((item, index) => {
        console.log(`${index + 1}. ${item.RawMaterial?.name}`);
        console.log(`   Ordered: ${item.qty}`);
        console.log(`   Received: ${item.received_quantity || 0}`);
        console.log(`   Item ID: ${item.id}`);
      });
      
      return;
    }

    console.log('Found PLACED Purchase Order:');
    console.log(`PO Number: ${purchaseOrder.po_number}`);
    console.log(`Status: ${purchaseOrder.status}`);
    console.log(`Supplier: ${purchaseOrder.Supplier?.name}`);
    
    console.log('\nItems before receiving:');
    purchaseOrder.PurchaseOrderItems.forEach((item, index) => {
      console.log(`${index + 1}. ${item.RawMaterial?.name}`);
      console.log(`   Ordered: ${item.qty}`);
      console.log(`   Received: ${item.received_quantity || 0}`);
      console.log(`   Item ID: ${item.id}`);
    });

    // Simulate receiving the first item
    const firstItem = purchaseOrder.PurchaseOrderItems[0];
    if (firstItem) {
      const receiveQuantity = Math.min(parseFloat(firstItem.qty), 5); // Receive 5 or the full quantity, whichever is smaller
      
      console.log(`\nSimulating receiving ${receiveQuantity} of item: ${firstItem.RawMaterial?.name}`);
      
      // Update received quantity
      const newReceivedQuantity = (parseFloat(firstItem.received_quantity) || 0) + receiveQuantity;
      await firstItem.update({
        received_quantity: newReceivedQuantity
      });
      
      console.log(`Updated received quantity to: ${newReceivedQuantity}`);
      
      // Fetch updated purchase order
      const updatedPO = await PurchaseOrder.findByPk(purchaseOrder.id, {
        include: [
          { model: Supplier },
          {
            model: PurchaseOrderItem,
            include: [{ model: RawMaterial }]
          }
        ]
      });
      
      console.log('\nItems after receiving:');
      updatedPO.PurchaseOrderItems.forEach((item, index) => {
        console.log(`${index + 1}. ${item.RawMaterial?.name}`);
        console.log(`   Ordered: ${item.qty}`);
        console.log(`   Received: ${item.received_quantity || 0}`);
        console.log(`   Pending: ${parseFloat(item.qty) - (parseFloat(item.received_quantity) || 0)}`);
      });
    }

  } catch (error) {
    console.error('Error testing receive purchase order:', error);
  }
}

testReceivePurchaseOrder();