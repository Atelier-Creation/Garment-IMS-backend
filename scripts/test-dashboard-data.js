#!/usr/bin/env node

const { sequelize, SalesOrder, SalesOrderItem, Customer, Product, ProductVariant, Branch, User } = require('../src/models');
const { v4: uuidv4 } = require('uuid');

async function createTestSalesOrder() {
  console.log('🧪 Creating test sales order for dashboard...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // Find or create a customer
    let customer = await Customer.findOne({ where: { email: 'test@example.com' } });
    if (!customer) {
      customer = await Customer.create({
        id: uuidv4(),
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '1234567890',
        address: 'Test Address',
        city: 'Test City',
        state: 'Test State',
        postal_code: '12345',
        country: 'India'
      });
      console.log('✅ Created test customer');
    }

    // Find a product variant
    const productVariant = await ProductVariant.findOne({
      include: [Product]
    });

    if (!productVariant) {
      console.log('❌ No product variants found. Please create products first.');
      return;
    }

    // Find admin user
    const adminUser = await User.findOne({ where: { email: 'admin@garmentims.com' } });
    if (!adminUser) {
      console.log('❌ Admin user not found');
      return;
    }

    // Find a branch
    const branch = await Branch.findOne();
    if (!branch) {
      console.log('❌ No branches found');
      return;
    }

    // Create a test sales order with PAID status
    const orderNumber = `SO-${Date.now()}`;
    const salesOrder = await SalesOrder.create({
      id: uuidv4(),
      order_number: orderNumber,
      customer_id: customer.id,
      branch_id: branch.id,
      created_by: adminUser.id,
      order_date: new Date(),
      status: 'PAID', // This should make it show up in dashboard
      subtotal_amount: 2799.00,
      discount_amount: 0,
      tax_amount: 503.82,
      total_amount: 3302.82,
      notes: 'Test order for dashboard verification'
    });

    // Create order item
    await SalesOrderItem.create({
      id: uuidv4(),
      sales_order_id: salesOrder.id,
      variant_id: productVariant.id,
      qty: 1,
      unit_price: 2799.00,
      total: 2799.00
    });

    console.log(`✅ Created test sales order: ${orderNumber}`);
    console.log(`💰 Total Amount: ₹${salesOrder.total_amount}`);
    console.log(`📅 Order Date: ${salesOrder.order_date}`);
    console.log(`📊 Status: ${salesOrder.status}`);
    console.log('\n🎉 Test data created successfully!');
    console.log('\nNow check the dashboard - "This Month Orders" and "This Month Revenue" should show:');
    console.log('- Orders: 1');
    console.log('- Revenue: ₹3,302.82');

  } catch (error) {
    console.error('❌ Failed to create test data:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

// Run if called directly
if (require.main === module) {
  createTestSalesOrder();
}

module.exports = createTestSalesOrder;