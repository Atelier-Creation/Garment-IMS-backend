const { PurchaseOrderItem, sequelize } = require('../src/models');

async function checkReceivedQuantityField() {
  try {
    // Check if the field exists in the database
    const [results] = await sequelize.query(`
      DESCRIBE purchase_order_items;
    `);
    
    console.log('Purchase Order Items table structure:');
    console.table(results);
    
    // Check if there are any purchase order items with received quantities
    const itemsWithReceivedQty = await PurchaseOrderItem.findAll({
      where: {
        received_quantity: {
          [sequelize.Sequelize.Op.gt]: 0
        }
      },
      limit: 5
    });
    
    console.log('\nItems with received quantity > 0:');
    console.log(itemsWithReceivedQty.map(item => ({
      id: item.id,
      qty: item.qty,
      received_quantity: item.received_quantity
    })));
    
    // Check a sample of all items
    const sampleItems = await PurchaseOrderItem.findAll({
      limit: 5,
      attributes: ['id', 'qty', 'received_quantity']
    });
    
    console.log('\nSample of all items:');
    console.table(sampleItems.map(item => ({
      id: item.id,
      qty: parseFloat(item.qty),
      received_quantity: parseFloat(item.received_quantity || 0)
    })));
    
  } catch (error) {
    console.error('Error checking received_quantity field:', error);
  } finally {
    await sequelize.close();
  }
}

checkReceivedQuantityField();