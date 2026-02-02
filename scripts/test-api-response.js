const { PurchaseOrder, PurchaseOrderItem, RawMaterial, Supplier, User, Branch } = require('../src/models');

async function testApiResponse() {
  try {
    // Find the purchase order we've been testing with
    const purchaseOrder = await PurchaseOrder.findOne({
      where: { po_number: 'PO000009' },
      include: [
        { model: Supplier },
        { model: Branch },
        { model: User, attributes: ['id', 'full_name'] },
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

    // This simulates what the API returns
    const apiResponse = {
      success: true,
      data: { purchase_order: purchaseOrder }
    };

    console.log('API Response Structure:');
    console.log('Purchase Order ID:', apiResponse.data.purchase_order.id);
    console.log('PO Number:', apiResponse.data.purchase_order.po_number);
    console.log('Status:', apiResponse.data.purchase_order.status);
    
    console.log('\nPurchase Order Items:');
    apiResponse.data.purchase_order.PurchaseOrderItems.forEach((item, index) => {
      console.log(`Item ${index + 1}:`);
      console.log(`  ID: ${item.id}`);
      console.log(`  Material: ${item.RawMaterial?.name}`);
      console.log(`  Ordered Qty: ${item.qty} (${typeof item.qty})`);
      console.log(`  Received Qty: ${item.received_quantity} (${typeof item.received_quantity})`);
      console.log(`  Received Qty as Number: ${parseFloat(item.received_quantity || 0)}`);
      console.log(`  Unit Price: ${item.unit_price}`);
      console.log('  ---');
    });

    // Test JSON serialization (what actually gets sent to frontend)
    const jsonString = JSON.stringify(apiResponse);
    const parsedBack = JSON.parse(jsonString);
    
    console.log('\nAfter JSON serialization/deserialization:');
    parsedBack.data.purchase_order.PurchaseOrderItems.forEach((item, index) => {
      console.log(`Item ${index + 1}:`);
      console.log(`  Received Qty: ${item.received_quantity} (${typeof item.received_quantity})`);
      console.log(`  Received Qty as Number: ${parseFloat(item.received_quantity || 0)}`);
    });

  } catch (error) {
    console.error('Error testing API response:', error);
  }
}

testApiResponse();