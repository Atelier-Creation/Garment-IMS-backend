'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insert branches
    const branches = [
      {
        id: uuidv4(),
        name: 'Main Factory',
        address: '123 Industrial Area, Manufacturing District',
        phone: '+91-9876543210',
        type: 'FACTORY',
        created_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Central Warehouse',
        address: '456 Storage Complex, Logistics Hub',
        phone: '+91-9876543211',
        type: 'WAREHOUSE',
        created_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Downtown Retail Store',
        address: '789 Shopping Mall, City Center',
        phone: '+91-9876543212',
        type: 'SHOP',
        created_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Mall Outlet',
        address: '321 Premium Mall, Business District',
        phone: '+91-9876543213',
        type: 'SHOP',
        created_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('branches', branches);

    // Insert categories
    const categories = [
      {
        id: uuidv4(),
        name: 'Men\'s Clothing',
        created_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Women\'s Clothing',
        created_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Kids Clothing',
        created_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Accessories',
        created_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('categories', categories);

    // Get category IDs for subcategories
    const menCategory = await queryInterface.sequelize.query(
      "SELECT id FROM categories WHERE name = 'Men\\'s Clothing'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const womenCategory = await queryInterface.sequelize.query(
      "SELECT id FROM categories WHERE name = 'Women\\'s Clothing'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const kidsCategory = await queryInterface.sequelize.query(
      "SELECT id FROM categories WHERE name = 'Kids Clothing'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Insert subcategories
    const subcategories = [
      // Men's subcategories
      { id: uuidv4(), category_id: menCategory[0].id, name: 'Shirts', created_at: new Date() },
      { id: uuidv4(), category_id: menCategory[0].id, name: 'T-Shirts', created_at: new Date() },
      { id: uuidv4(), category_id: menCategory[0].id, name: 'Trousers', created_at: new Date() },
      { id: uuidv4(), category_id: menCategory[0].id, name: 'Jeans', created_at: new Date() },
      { id: uuidv4(), category_id: menCategory[0].id, name: 'Suits', created_at: new Date() },
      
      // Women's subcategories
      { id: uuidv4(), category_id: womenCategory[0].id, name: 'Dresses', created_at: new Date() },
      { id: uuidv4(), category_id: womenCategory[0].id, name: 'Tops', created_at: new Date() },
      { id: uuidv4(), category_id: womenCategory[0].id, name: 'Skirts', created_at: new Date() },
      { id: uuidv4(), category_id: womenCategory[0].id, name: 'Blouses', created_at: new Date() },
      { id: uuidv4(), category_id: womenCategory[0].id, name: 'Sarees', created_at: new Date() },
      
      // Kids subcategories
      { id: uuidv4(), category_id: kidsCategory[0].id, name: 'Boys Wear', created_at: new Date() },
      { id: uuidv4(), category_id: kidsCategory[0].id, name: 'Girls Wear', created_at: new Date() },
      { id: uuidv4(), category_id: kidsCategory[0].id, name: 'Baby Wear', created_at: new Date() }
    ];

    await queryInterface.bulkInsert('subcategories', subcategories);

    // Insert suppliers
    const suppliers = [
      {
        id: uuidv4(),
        name: 'Premium Fabrics Ltd',
        contact_name: 'Rajesh Kumar',
        phone: '+91-9876543220',
        email: 'rajesh@premiumfabrics.com',
        address: '123 Textile Hub, Gujarat',
        payment_terms: 'Net 30 days',
        created_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Cotton Mills Co',
        contact_name: 'Priya Sharma',
        phone: '+91-9876543221',
        email: 'priya@cottonmills.com',
        address: '456 Cotton District, Tamil Nadu',
        payment_terms: 'Net 45 days',
        created_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Silk Weavers Pvt Ltd',
        contact_name: 'Amit Patel',
        phone: '+91-9876543222',
        email: 'amit@silkweavers.com',
        address: '789 Silk Road, Karnataka',
        payment_terms: 'Advance payment',
        created_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Button & Accessories Inc',
        contact_name: 'Sunita Gupta',
        phone: '+91-9876543223',
        email: 'sunita@buttonaccessories.com',
        address: '321 Hardware Market, Delhi',
        payment_terms: 'Net 15 days',
        created_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('suppliers', suppliers);

    // Insert customers
    const customers = [
      {
        id: uuidv4(),
        name: 'Fashion Forward Retail',
        contact_name: 'Vikram Singh',
        phone: '+91-9876543230',
        email: 'vikram@fashionforward.com',
        address: '123 Retail Plaza, Mumbai',
        created_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Style Hub Chain',
        contact_name: 'Neha Agarwal',
        phone: '+91-9876543231',
        email: 'neha@stylehub.com',
        address: '456 Shopping Complex, Delhi',
        created_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Global Exports LLC',
        contact_name: 'John Smith',
        phone: '+1-555-123-4567',
        email: 'john@globalexports.com',
        address: '789 Trade Center, New York, USA',
        created_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'European Fashion Co',
        contact_name: 'Maria Garcia',
        phone: '+34-123-456-789',
        email: 'maria@europeanfashion.com',
        address: '321 Fashion District, Barcelona, Spain',
        created_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('customers', customers);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('customers', null, {});
    await queryInterface.bulkDelete('suppliers', null, {});
    await queryInterface.bulkDelete('subcategories', null, {});
    await queryInterface.bulkDelete('categories', null, {});
    await queryInterface.bulkDelete('branches', null, {});
  }
};