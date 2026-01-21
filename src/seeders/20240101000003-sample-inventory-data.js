'use strict';
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Insert raw materials
    const rawMaterials = [
      {
        id: uuidv4(),
        material_code: 'FAB001',
        name: 'Cotton Fabric - White',
        uom: 'METER',
        description: 'Premium cotton fabric, 100% cotton, white color',
        average_cost: 150.00,
        is_active: 1,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        material_code: 'FAB002',
        name: 'Cotton Fabric - Blue',
        uom: 'METER',
        description: 'Premium cotton fabric, 100% cotton, blue color',
        average_cost: 155.00,
        is_active: 1,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        material_code: 'FAB003',
        name: 'Silk Fabric - Red',
        uom: 'METER',
        description: 'Pure silk fabric, premium quality, red color',
        average_cost: 450.00,
        is_active: 1,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        material_code: 'FAB004',
        name: 'Denim Fabric',
        uom: 'METER',
        description: 'Heavy duty denim fabric for jeans',
        average_cost: 280.00,
        is_active: 1,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        material_code: 'BTN001',
        name: 'Plastic Buttons - White',
        uom: 'PIECE',
        description: 'Standard plastic buttons, 15mm, white',
        average_cost: 2.50,
        is_active: 1,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        material_code: 'BTN002',
        name: 'Metal Buttons - Silver',
        uom: 'PIECE',
        description: 'Metal buttons, 20mm, silver finish',
        average_cost: 8.00,
        is_active: 1,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        material_code: 'THR001',
        name: 'Cotton Thread - White',
        uom: 'METER',
        description: 'Cotton sewing thread, white color',
        average_cost: 0.50,
        is_active: 1,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        material_code: 'THR002',
        name: 'Polyester Thread - Black',
        uom: 'METER',
        description: 'Polyester sewing thread, black color',
        average_cost: 0.45,
        is_active: 1,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        material_code: 'ZIP001',
        name: 'Metal Zipper - 6 inch',
        uom: 'PIECE',
        description: 'Metal zipper, 6 inch length, silver',
        average_cost: 25.00,
        is_active: 1,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        material_code: 'LIN001',
        name: 'Cotton Lining - White',
        uom: 'METER',
        description: 'Cotton lining fabric, white color',
        average_cost: 85.00,
        is_active: 1,
        created_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('raw_materials', rawMaterials);

    // Get category and subcategory IDs for products
    const menShirts = await queryInterface.sequelize.query(
      "SELECT s.id as sub_id, c.id as cat_id FROM subcategories s JOIN categories c ON s.category_id = c.id WHERE s.name = 'Shirts' AND c.name = 'Men\\'s Clothing'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const womenDresses = await queryInterface.sequelize.query(
      "SELECT s.id as sub_id, c.id as cat_id FROM subcategories s JOIN categories c ON s.category_id = c.id WHERE s.name = 'Dresses' AND c.name = 'Women\\'s Clothing'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Insert sample products
    const products = [
      {
        id: uuidv4(),
        product_code: 'MSH001',
        product_name: 'Classic Cotton Shirt',
        category_id: menShirts[0]?.cat_id,
        sub_category_id: menShirts[0]?.sub_id,
        brand: 'Premium Line',
        fabric: 'Cotton',
        gender: 'MEN',
        season: 'All Season',
        base_price: 899.00,
        is_active: 1,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        product_code: 'MSH002',
        product_name: 'Formal Business Shirt',
        category_id: menShirts[0]?.cat_id,
        sub_category_id: menShirts[0]?.sub_id,
        brand: 'Executive',
        fabric: 'Cotton Blend',
        gender: 'MEN',
        season: 'All Season',
        base_price: 1299.00,
        is_active: 1,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        product_code: 'WDR001',
        product_name: 'Elegant Evening Dress',
        category_id: womenDresses[0]?.cat_id,
        sub_category_id: womenDresses[0]?.sub_id,
        brand: 'Fashion Elite',
        fabric: 'Silk',
        gender: 'WOMEN',
        season: 'Evening',
        base_price: 2499.00,
        is_active: 1,
        created_at: new Date()
      },
      {
        id: uuidv4(),
        product_code: 'WDR002',
        product_name: 'Casual Summer Dress',
        category_id: womenDresses[0]?.cat_id,
        sub_category_id: womenDresses[0]?.sub_id,
        brand: 'Comfort Wear',
        fabric: 'Cotton',
        gender: 'WOMEN',
        season: 'Summer',
        base_price: 1599.00,
        is_active: 1,
        created_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('products', products);

    // Get product IDs for variants
    const classicShirt = await queryInterface.sequelize.query(
      "SELECT id FROM products WHERE product_code = 'MSH001'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const formalShirt = await queryInterface.sequelize.query(
      "SELECT id FROM products WHERE product_code = 'MSH002'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const eveningDress = await queryInterface.sequelize.query(
      "SELECT id FROM products WHERE product_code = 'WDR001'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const summerDress = await queryInterface.sequelize.query(
      "SELECT id FROM products WHERE product_code = 'WDR002'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Insert product variants
    const variants = [
      // Classic Cotton Shirt variants
      { id: uuidv4(), product_id: classicShirt[0]?.id, sku: 'MSH001-S-WHI', size: 'S', color: 'White', mrp: 999.00, cost_price: 450.00, created_at: new Date() },
      { id: uuidv4(), product_id: classicShirt[0]?.id, sku: 'MSH001-M-WHI', size: 'M', color: 'White', mrp: 999.00, cost_price: 450.00, created_at: new Date() },
      { id: uuidv4(), product_id: classicShirt[0]?.id, sku: 'MSH001-L-WHI', size: 'L', color: 'White', mrp: 999.00, cost_price: 450.00, created_at: new Date() },
      { id: uuidv4(), product_id: classicShirt[0]?.id, sku: 'MSH001-S-BLU', size: 'S', color: 'Blue', mrp: 999.00, cost_price: 455.00, created_at: new Date() },
      { id: uuidv4(), product_id: classicShirt[0]?.id, sku: 'MSH001-M-BLU', size: 'M', color: 'Blue', mrp: 999.00, cost_price: 455.00, created_at: new Date() },
      { id: uuidv4(), product_id: classicShirt[0]?.id, sku: 'MSH001-L-BLU', size: 'L', color: 'Blue', mrp: 999.00, cost_price: 455.00, created_at: new Date() },
      
      // Formal Business Shirt variants
      { id: uuidv4(), product_id: formalShirt[0]?.id, sku: 'MSH002-S-WHI', size: 'S', color: 'White', mrp: 1399.00, cost_price: 650.00, created_at: new Date() },
      { id: uuidv4(), product_id: formalShirt[0]?.id, sku: 'MSH002-M-WHI', size: 'M', color: 'White', mrp: 1399.00, cost_price: 650.00, created_at: new Date() },
      { id: uuidv4(), product_id: formalShirt[0]?.id, sku: 'MSH002-L-WHI', size: 'L', color: 'White', mrp: 1399.00, cost_price: 650.00, created_at: new Date() },
      { id: uuidv4(), product_id: formalShirt[0]?.id, sku: 'MSH002-XL-WHI', size: 'XL', color: 'White', mrp: 1399.00, cost_price: 650.00, created_at: new Date() },
      
      // Evening Dress variants
      { id: uuidv4(), product_id: eveningDress[0]?.id, sku: 'WDR001-S-RED', size: 'S', color: 'Red', mrp: 2799.00, cost_price: 1250.00, created_at: new Date() },
      { id: uuidv4(), product_id: eveningDress[0]?.id, sku: 'WDR001-M-RED', size: 'M', color: 'Red', mrp: 2799.00, cost_price: 1250.00, created_at: new Date() },
      { id: uuidv4(), product_id: eveningDress[0]?.id, sku: 'WDR001-L-RED', size: 'L', color: 'Red', mrp: 2799.00, cost_price: 1250.00, created_at: new Date() },
      
      // Summer Dress variants
      { id: uuidv4(), product_id: summerDress[0]?.id, sku: 'WDR002-S-WHI', size: 'S', color: 'White', mrp: 1799.00, cost_price: 750.00, created_at: new Date() },
      { id: uuidv4(), product_id: summerDress[0]?.id, sku: 'WDR002-M-WHI', size: 'M', color: 'White', mrp: 1799.00, cost_price: 750.00, created_at: new Date() },
      { id: uuidv4(), product_id: summerDress[0]?.id, sku: 'WDR002-L-WHI', size: 'L', color: 'White', mrp: 1799.00, cost_price: 750.00, created_at: new Date() }
    ];

    await queryInterface.bulkInsert('product_variants', variants.filter(v => v.product_id));
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('product_variants', null, {});
    await queryInterface.bulkDelete('products', null, {});
    await queryInterface.bulkDelete('raw_materials', null, {});
  }
};