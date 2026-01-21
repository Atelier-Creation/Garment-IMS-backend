const { Product, Category, Subcategory, ProductVariant } = require('../models');
const { Op } = require('sequelize');

const getProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, category_id } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = {};
    if (search) {
      whereClause.name = { [Op.like]: `%${search}%` };
    }
    if (category_id) {
      whereClause.category_id = category_id;
    }

    const { count, rows } = await Product.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Category,
          required: false
        },
        {
          model: Subcategory,
          required: false
        },
        {
          model: ProductVariant,
          as: 'variants',
          required: false
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        products: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error.message
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          required: false
        },
        {
          model: Subcategory,
          required: false
        },
        {
          model: ProductVariant,
          as: 'variants',
          required: false
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: { product }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error.message
    });
  }
};

const createProduct = async (req, res) => {
  try {
    const {
      product_code, sku,
      name, product_name,
      description,
      category_id, categoryId,
      sub_category_id, subCategoryId,
      price, sellingPrice, base_price,
      brand, fabric, gender, season // Add other potential fields
    } = req.body;

    // Map to model fields
    // Ensure product_name is populated from name
    const payload = {
      product_code: product_code || sku,
      product_name: product_name || name,
      description: description,
      category_id: category_id || categoryId,
      sub_category_id: sub_category_id || subCategoryId,
      base_price: price || sellingPrice || base_price || 0,
      brand,
      fabric,
      gender,
      season
    };

    const product = await Product.create(payload);

    const productWithRelations = await Product.findByPk(product.id, {
      include: [
        { model: Category, required: false },
        { model: Subcategory, required: false }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: { product: productWithRelations }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error.message
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { product_code, name, description, category_id, sub_category_id, price } = req.body;

    const [updatedRows] = await Product.update(
      { product_code, name, description, category_id, sub_category_id, price },
      { where: { id } }
    );

    if (updatedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const product = await Product.findByPk(id, {
      include: [
        { model: Category, required: false },
        { model: Subcategory, required: false }
      ]
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: { product }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error.message
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRows = await Product.destroy({
      where: { id }
    });

    if (deletedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error.message
    });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};