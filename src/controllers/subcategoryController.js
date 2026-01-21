const { Subcategory, Category } = require('../models');

// Get all subcategories
const getSubcategories = async (req, res) => {
  try {
    const { category_id } = req.query;
    
    let whereClause = {};
    if (category_id) {
      whereClause.category_id = category_id;
    }

    const subcategories = await Subcategory.findAll({
      where: whereClause,
      include: [{ model: Category, attributes: ['id', 'name'] }],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: { subcategories }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subcategories',
      error: error.message
    });
  }
};

// Get subcategory by ID
const getSubcategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const subcategory = await Subcategory.findByPk(id, {
      include: [{ model: Category }]
    });

    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    res.json({
      success: true,
      data: { subcategory }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subcategory',
      error: error.message
    });
  }
};

// Create subcategory
const createSubcategory = async (req, res) => {
  try {
    const { name, category_id } = req.body;

    const subcategory = await Subcategory.create({
      name,
      category_id
    });

    res.status(201).json({
      success: true,
      message: 'Subcategory created successfully',
      data: { subcategory }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create subcategory',
      error: error.message
    });
  }
};

// Update subcategory
const updateSubcategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category_id } = req.body;

    const subcategory = await Subcategory.findByPk(id);
    
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    await subcategory.update({
      name,
      category_id
    });

    res.json({
      success: true,
      message: 'Subcategory updated successfully',
      data: { subcategory }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update subcategory',
      error: error.message
    });
  }
};

// Delete subcategory
const deleteSubcategory = async (req, res) => {
  try {
    const { id } = req.params;

    const subcategory = await Subcategory.findByPk(id);
    
    if (!subcategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found'
      });
    }

    await subcategory.destroy();

    res.json({
      success: true,
      message: 'Subcategory deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete subcategory',
      error: error.message
    });
  }
};

module.exports = {
  getSubcategories,
  getSubcategoryById,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory
};
