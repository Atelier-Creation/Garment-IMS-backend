const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique code with prefix
 * @param {string} prefix - Code prefix (e.g., 'PO', 'SO', 'PRD')
 * @param {number} length - Length of numeric part (default: 6)
 * @returns {string} Generated code
 */
const generateCode = (prefix, length = 6) => {
  const timestamp = Date.now().toString().slice(-length);
  const random = Math.floor(Math.random() * Math.pow(10, length - timestamp.length))
    .toString()
    .padStart(length - timestamp.length, '0');
  
  return `${prefix}${timestamp}${random}`;
};

/**
 * Calculate pagination metadata
 * @param {number} total - Total records
 * @param {number} page - Current page
 * @param {number} limit - Records per page
 * @returns {object} Pagination metadata
 */
const getPaginationMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    pages: totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: 'INR')
 * @returns {string} Formatted currency
 */
const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Calculate FIFO cost for stock consumption
 * @param {Array} batches - Available batches sorted by date
 * @param {number} requiredQty - Quantity to consume
 * @returns {Array} Consumption records with batch details
 */
const calculateFIFOConsumption = (batches, requiredQty) => {
  const consumptions = [];
  let remainingQty = requiredQty;
  
  for (const batch of batches) {
    if (remainingQty <= 0) break;
    
    const consumeQty = Math.min(batch.qty, remainingQty);
    
    consumptions.push({
      batch_id: batch.id,
      qty: consumeQty,
      unit_cost: batch.cost_per_unit,
      total_cost: consumeQty * batch.cost_per_unit
    });
    
    remainingQty -= consumeQty;
  }
  
  return {
    consumptions,
    totalCost: consumptions.reduce((sum, c) => sum + c.total_cost, 0),
    shortfall: remainingQty > 0 ? remainingQty : 0
  };
};

/**
 * Validate required fields in request body
 * @param {object} body - Request body
 * @param {Array} requiredFields - Array of required field names
 * @returns {Array} Array of missing fields
 */
const validateRequiredFields = (body, requiredFields) => {
  const missing = [];
  
  for (const field of requiredFields) {
    if (!body[field] || (typeof body[field] === 'string' && body[field].trim() === '')) {
      missing.push(field);
    }
  }
  
  return missing;
};

/**
 * Generate SKU for product variant
 * @param {string} productCode - Product code
 * @param {string} size - Size
 * @param {string} color - Color
 * @returns {string} Generated SKU
 */
const generateSKU = (productCode, size, color) => {
  const sizeCode = size ? size.substring(0, 2).toUpperCase() : 'OS';
  const colorCode = color ? color.substring(0, 3).toUpperCase() : 'STD';
  
  return `${productCode}-${sizeCode}-${colorCode}`;
};

/**
 * Calculate production cost per unit
 * @param {Array} consumptions - Raw material consumptions
 * @param {number} producedQty - Quantity produced
 * @param {number} laborCost - Labor cost (optional)
 * @param {number} overheadCost - Overhead cost (optional)
 * @returns {number} Cost per unit
 */
const calculateProductionCost = (consumptions, producedQty, laborCost = 0, overheadCost = 0) => {
  const materialCost = consumptions.reduce((sum, c) => sum + (c.qty * c.unit_cost), 0);
  const totalCost = materialCost + laborCost + overheadCost;
  
  return producedQty > 0 ? totalCost / producedQty : 0;
};

module.exports = {
  generateCode,
  getPaginationMeta,
  formatCurrency,
  calculateFIFOConsumption,
  validateRequiredFields,
  generateSKU,
  calculateProductionCost
};