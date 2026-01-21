const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const roleRoutes = require('./roleRoutes');
const permissionRoutes = require('./permissionRoutes');
const categoryRoutes = require('./categoryRoutes');
const subcategoryRoutes = require('./subcategoryRoutes');
const supplierRoutes = require('./supplierRoutes');
const customerRoutes = require('./customerRoutes');
const branchRoutes = require('./branchRoutes');
const rawMaterialRoutes = require('./rawMaterialRoutes');
const productRoutes = require('./productRoutes');
const productVariantRoutes = require('./productVariantRoutes');
const purchaseOrderRoutes = require('./purchaseOrderRoutes');
const purchaseOrderInwardRoutes = require('./purchaseOrderInwardRoutes');
const salesOrderRoutes = require('./salesOrderRoutes');
const productionOrderRoutes = require('./productionOrderRoutes');
const bomRoutes = require('./bomRoutes');
const stockRoutes = require('./stockRoutes');
const stockAdjustmentRoutes = require('./stockAdjustmentRoutes');
const reportRoutes = require('./reportRoutes');
const exportOrderRoutes = require('./exportOrderRoutes');
const shipmentRoutes = require('./shipmentRoutes');
const posTransactionRoutes = require('./posTransactionRoutes');
const auditLogRoutes = require('./auditLogRoutes');
const billingRoutes = require('./billingRoutes');

const router = express.Router();

// API version and health check
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Garment IMS API v1.0',
    timestamp: new Date().toISOString()
  });
});

// Route modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/roles', roleRoutes);
router.use('/permissions', permissionRoutes);
router.use('/categories', categoryRoutes);
router.use('/subcategories', subcategoryRoutes);
router.use('/suppliers', supplierRoutes);
router.use('/customers', customerRoutes);
router.use('/branches', branchRoutes);
router.use('/raw-materials', rawMaterialRoutes);
router.use('/products', productRoutes);
router.use('/product-variants', productVariantRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/purchase-order-inward', purchaseOrderInwardRoutes);
router.use('/sales-orders', salesOrderRoutes);
router.use('/production-orders', productionOrderRoutes);
router.use('/boms', bomRoutes);
router.use('/stock', stockRoutes);
router.use('/stock-adjustments', stockAdjustmentRoutes);
router.use('/reports', reportRoutes);
router.use('/export-orders', exportOrderRoutes);
router.use('/shipments', shipmentRoutes);
router.use('/pos-transactions', posTransactionRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/billing', billingRoutes);

module.exports = router;