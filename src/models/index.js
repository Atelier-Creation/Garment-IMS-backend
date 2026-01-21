const { Sequelize } = require('sequelize');
const config = require('../config/database')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

// Import all models
const User = require('./User')(sequelize, Sequelize.DataTypes);
const Role = require('./Role')(sequelize, Sequelize.DataTypes);
const Permission = require('./Permission')(sequelize, Sequelize.DataTypes);
const Session = require('./Session')(sequelize, Sequelize.DataTypes);
const UserRole = require('./UserRole')(sequelize, Sequelize.DataTypes);
const RolePermission = require('./RolePermission')(sequelize, Sequelize.DataTypes);
const Branch = require('./Branch')(sequelize, Sequelize.DataTypes);
const Supplier = require('./Supplier')(sequelize, Sequelize.DataTypes);
const Customer = require('./Customer')(sequelize, Sequelize.DataTypes);
const Category = require('./Category')(sequelize, Sequelize.DataTypes);
const Subcategory = require('./Subcategory')(sequelize, Sequelize.DataTypes);
const RawMaterial = require('./RawMaterial')(sequelize, Sequelize.DataTypes);
const Product = require('./Product')(sequelize, Sequelize.DataTypes);
const ProductVariant = require('./ProductVariant')(sequelize, Sequelize.DataTypes);
const PurchaseOrder = require('./PurchaseOrder')(sequelize, Sequelize.DataTypes);
const PurchaseOrderItem = require('./PurchaseOrderItem')(sequelize, Sequelize.DataTypes);
const RawMaterialBatch = require('./RawMaterialBatch')(sequelize, Sequelize.DataTypes);
const RawMaterialStockMovement = require('./RawMaterialStockMovement')(sequelize, Sequelize.DataTypes);
const FinishedGoodsStock = require('./FinishedGoodsStock')(sequelize, Sequelize.DataTypes);
const FinishedGoodsStockMovement = require('./FinishedGoodsStockMovement')(sequelize, Sequelize.DataTypes);
const BOM = require('./BOM')(sequelize, Sequelize.DataTypes);
const BOMItem = require('./BOMItem')(sequelize, Sequelize.DataTypes);
const ProductionOrder = require('./ProductionOrder')(sequelize, Sequelize.DataTypes);
const ProductionConsumption = require('./ProductionConsumption')(sequelize, Sequelize.DataTypes);
const ProductionOutput = require('./ProductionOutput')(sequelize, Sequelize.DataTypes);
const SalesOrder = require('./SalesOrder')(sequelize, Sequelize.DataTypes);
const SalesOrderItem = require('./SalesOrderItem')(sequelize, Sequelize.DataTypes);
const PosTransaction = require('./PosTransaction')(sequelize, Sequelize.DataTypes);
const ExportOrder = require('./ExportOrder')(sequelize, Sequelize.DataTypes);
const ExportOrderItem = require('./ExportOrderItem')(sequelize, Sequelize.DataTypes);
const Shipment = require('./Shipment')(sequelize, Sequelize.DataTypes);
const StockAdjustment = require('./StockAdjustment')(sequelize, Sequelize.DataTypes);
const AuditLog = require('./AuditLog')(sequelize, Sequelize.DataTypes);

// Define associations
const models = {
  User, Role, Permission, Session, UserRole, RolePermission, Branch, Supplier, Customer, Category, Subcategory,
  RawMaterial, Product, ProductVariant, PurchaseOrder, PurchaseOrderItem,
  RawMaterialBatch, RawMaterialStockMovement, FinishedGoodsStock, FinishedGoodsStockMovement,
  BOM, BOMItem, ProductionOrder, ProductionConsumption, ProductionOutput,
  SalesOrder, SalesOrderItem, PosTransaction, ExportOrder, ExportOrderItem,
  Shipment, StockAdjustment, AuditLog
};

// User associations
User.belongsToMany(Role, { 
  through: UserRole, 
  foreignKey: 'user_id',
  otherKey: 'role_id'
});
Role.belongsToMany(User, { 
  through: UserRole, 
  foreignKey: 'role_id',
  otherKey: 'user_id'
});
Role.belongsToMany(Permission, { 
  through: RolePermission, 
  foreignKey: 'role_id',
  otherKey: 'permission_id'
});
Permission.belongsToMany(Role, { 
  through: RolePermission, 
  foreignKey: 'permission_id',
  otherKey: 'role_id'
});
User.hasMany(Session, { foreignKey: 'user_id' });
Session.belongsTo(User, { foreignKey: 'user_id' });

// Branch associations
// Note: created_by field doesn't exist in branches table

// Category associations
Category.hasMany(Subcategory, { foreignKey: 'category_id' });
Subcategory.belongsTo(Category, { foreignKey: 'category_id' });

// Product associations
Product.belongsTo(Category, { foreignKey: 'category_id' });
Product.belongsTo(Subcategory, { foreignKey: 'sub_category_id' });
Product.hasMany(ProductVariant, { as: 'variants', foreignKey: 'product_id' });
ProductVariant.belongsTo(Product, { foreignKey: 'product_id' });

// Stock associations
ProductVariant.hasMany(FinishedGoodsStock, { foreignKey: 'variant_id' });
FinishedGoodsStock.belongsTo(ProductVariant, { foreignKey: 'variant_id' });
FinishedGoodsStock.belongsTo(Branch, { foreignKey: 'branch_id' });

// Raw Material associations
RawMaterial.hasMany(RawMaterialBatch, { foreignKey: 'raw_material_id' });
RawMaterialBatch.belongsTo(RawMaterial, { foreignKey: 'raw_material_id' });
RawMaterialBatch.belongsTo(Branch, { foreignKey: 'branch_id' });
RawMaterialBatch.belongsTo(Supplier, { foreignKey: 'supplier_id' });
Supplier.hasMany(RawMaterialBatch, { foreignKey: 'supplier_id' });
RawMaterialBatch.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id' });

// Purchase Order associations
PurchaseOrder.belongsTo(Supplier, { foreignKey: 'supplier_id' });
Supplier.hasMany(PurchaseOrder, { foreignKey: 'supplier_id' });
PurchaseOrder.belongsTo(Branch, { foreignKey: 'branch_id' });
PurchaseOrder.belongsTo(User, { foreignKey: 'created_by' });
User.hasMany(PurchaseOrder, { foreignKey: 'created_by' });
PurchaseOrder.hasMany(PurchaseOrderItem, { foreignKey: 'purchase_order_id' });
PurchaseOrderItem.belongsTo(PurchaseOrder, { foreignKey: 'purchase_order_id' });
PurchaseOrderItem.belongsTo(RawMaterial, { foreignKey: 'raw_material_id' });

// BOM associations
BOM.belongsTo(Product, { foreignKey: 'product_id' });
BOM.hasMany(BOMItem, { foreignKey: 'bom_id' });
BOMItem.belongsTo(BOM, { foreignKey: 'bom_id' });
BOMItem.belongsTo(RawMaterial, { foreignKey: 'raw_material_id' });

// Production associations
ProductionOrder.belongsTo(BOM, { foreignKey: 'bom_id' });
ProductionOrder.belongsTo(Product, { foreignKey: 'product_id' });
ProductionOrder.belongsTo(ProductVariant, { foreignKey: 'variant_id' });
ProductionOrder.belongsTo(Branch, { foreignKey: 'branch_id' });
ProductionOrder.hasMany(ProductionConsumption, { foreignKey: 'production_order_id' });
ProductionOrder.hasMany(ProductionOutput, { foreignKey: 'production_order_id' });

ProductionConsumption.belongsTo(ProductionOrder, { foreignKey: 'production_order_id' });
ProductionConsumption.belongsTo(RawMaterial, { foreignKey: 'raw_material_id' });
ProductionConsumption.belongsTo(RawMaterialBatch, { foreignKey: 'batch_id' });

ProductionOutput.belongsTo(ProductionOrder, { foreignKey: 'production_order_id' });
ProductionOutput.belongsTo(ProductVariant, { foreignKey: 'variant_id' });

// Sales associations
SalesOrder.belongsTo(Customer, { foreignKey: 'customer_id' });
Customer.hasMany(SalesOrder, { foreignKey: 'customer_id' });
SalesOrder.belongsTo(Branch, { foreignKey: 'branch_id' });
SalesOrder.belongsTo(User, { foreignKey: 'created_by' });
User.hasMany(SalesOrder, { foreignKey: 'created_by' });
SalesOrder.hasMany(SalesOrderItem, { foreignKey: 'sales_order_id' });
SalesOrder.hasOne(PosTransaction, { foreignKey: 'sales_order_id' });

SalesOrderItem.belongsTo(SalesOrder, { foreignKey: 'sales_order_id' });
SalesOrderItem.belongsTo(ProductVariant, { foreignKey: 'variant_id' });

PosTransaction.belongsTo(SalesOrder, { foreignKey: 'sales_order_id' });

// Export associations
ExportOrder.belongsTo(Customer, { foreignKey: 'customer_id' });
ExportOrder.hasMany(ExportOrderItem, { foreignKey: 'export_order_id' });
ExportOrder.hasMany(Shipment, { foreignKey: 'export_order_id' });

ExportOrderItem.belongsTo(ExportOrder, { foreignKey: 'export_order_id' });
ExportOrderItem.belongsTo(ProductVariant, { foreignKey: 'variant_id' });

Shipment.belongsTo(ExportOrder, { foreignKey: 'export_order_id' });

// Stock Movement associations
RawMaterialStockMovement.belongsTo(RawMaterialBatch, { foreignKey: 'raw_material_batch_id' });
RawMaterialStockMovement.belongsTo(RawMaterial, { foreignKey: 'raw_material_id' });
RawMaterialStockMovement.belongsTo(Branch, { foreignKey: 'branch_id' });

FinishedGoodsStockMovement.belongsTo(ProductVariant, { foreignKey: 'variant_id' });
FinishedGoodsStockMovement.belongsTo(Branch, { foreignKey: 'branch_id' });

// Audit associations
AuditLog.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(AuditLog, { foreignKey: 'user_id' });

Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

module.exports = {
  sequelize,
  Sequelize,
  ...models
};