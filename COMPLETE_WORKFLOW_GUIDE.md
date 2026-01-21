# Complete Garment IMS Workflow Guide

## Overview
This document describes the complete end-to-end workflow from raw material procurement to product sales and export.

---

## 📋 Workflow Steps

### 1. **Raw Material Management**
**Location:** Raw Materials page (`/raw-materials`)

#### Steps:
1. Navigate to **Raw Materials**
2. Click **"Add Raw Material"**
3. Fill in details:
   - Material Code (e.g., FAB001)
   - Material Name (e.g., Cotton Fabric)
   - Unit of Measure (METER, PIECE, KG, etc.)
   - Description
   - Average Cost
4. Click **"Create"**

**Result:** Raw material is now in the system and ready for purchase.

---

### 2. **Purchase Order Creation**
**Location:** Orders → Purchase Orders (`/order`)

#### Steps:
1. Navigate to **Orders → Purchase Orders**
2. Click **"New Purchase Order"**
3. Fill in order details:
   - Select Supplier
   - Select Branch (optional)
   - Order Date
   - Expected Delivery Date
4. Add items:
   - Select Raw Material
   - Enter Quantity
   - Enter Unit Price
   - Click **"Add Item"**
5. Review total amount
6. Click **"Create Purchase Order"**

**Status:** Order created with status **DRAFT**

---

### 3. **Purchase Order Approval**
**Location:** Orders → Purchase Orders (`/order`)

#### Steps:
1. Find the purchase order in the list
2. Click **"Approve"** button (only visible for DRAFT orders)
3. Confirm approval

**Status:** Order status changes to **PLACED**

---

### 4. **Purchase Order Inward (Receiving)**
**Location:** Orders → Purchase Inward (`/purchase-inward`)

#### Steps:
1. Navigate to **Orders → Purchase Inward**
2. Find the approved purchase order (status: PLACED)
3. Click **"Process Inward"**
4. For each item:
   - Enter Received Quantity
   - System auto-fills Unit Cost
5. Add notes if needed
6. Click **"Process Inward"**

**Result:** 
- Raw material batches created in `raw_material_batches` table
- Stock quantities updated
- Purchase order status changes to **RECEIVED** or **PARTIAL**
- Raw materials are now available in stock

---

### 5. **Bill of Materials (BOM) Creation**
**Location:** Products → Bill of Materials (`/bom`)

#### Steps:
1. Navigate to **Products → Bill of Materials**
2. Click **"Create BOM"**
3. Fill in BOM details:
   - BOM Name (e.g., "T-Shirt Standard BOM")
   - Select Product
   - Version number
   - Description
4. Add raw materials:
   - Select Raw Material
   - Enter Quantity needed per unit
   - Enter Unit of Measure
   - Click **"Add Item"**
5. Click **"Create BOM"**

**Result:** BOM defines what raw materials are needed to produce one unit of the product.

---

### 6. **Production Order Creation**
**Location:** Orders → Production Orders (`/production`)

#### Steps:
1. Navigate to **Orders → Production Orders**
2. Click **"New Production Order"**
3. Fill in details:
   - Select Product
   - Select BOM (Bill of Materials)
   - Select Branch
   - Enter Planned Quantity
   - Production Date
   - Target Completion Date
   - Notes
4. Click **"Create"**

**Status:** Production order created with status **PENDING**

**System Actions:**
- Validates raw material availability based on BOM
- Reserves raw materials for production

---

### 7. **Start Production**
**Location:** Orders → Production Orders (`/production`)

#### Steps:
1. Find the production order (status: PENDING)
2. Click **"Start"** button
3. Confirm start

**Status:** Order status changes to **IN_PROGRESS**

**System Actions:**
- Raw materials are consumed from stock
- Production consumption records created

---

### 8. **Complete Production**
**Location:** Orders → Production Orders (`/production`)

#### Steps:
1. Find the production order (status: IN_PROGRESS)
2. Click **"Complete"** button
3. Enter:
   - Actual Quantity Produced
   - Completion Date
   - Notes
4. Click **"Complete Production"**

**Status:** Order status changes to **COMPLETED**

**System Actions:**
- Finished goods added to `finished_goods_stock` table
- Stock quantities updated
- Production output records created
- Products are now available for sale

---

### 9. **Sales Order Creation**
**Location:** Orders → Sales Orders (`/sales`)

#### Steps:
1. Navigate to **Orders → Sales Orders**
2. Click **"New Sales Order"**
3. Fill in details:
   - Select Customer
   - Select Branch
   - Order Date
   - Delivery Date
   - Shipping Address
4. Add items:
   - Select Product Variant
   - Enter Quantity
   - Enter Unit Price
   - Click **"Add Item"**
5. Review total amount
6. Add notes if needed
7. Click **"Create Order"**

**Status:** Order created with status **PENDING**

**System Actions:**
- Validates stock availability
- Reserves stock for the order (reserved_qty updated)

---

### 10. **Sales Order Confirmation**
**Location:** Orders → Sales Orders (`/sales`)

#### Steps:
1. Find the sales order (status: PENDING)
2. Click **"Confirm"** button
3. Confirm the order

**Status:** Order status changes to **CONFIRMED**

---

### 11. **Sales Order Processing (Shipping)**
**Location:** Orders → Sales Orders (`/sales`)

#### Steps:
1. Find the sales order (status: CONFIRMED)
2. Click **"Process"** button
3. System automatically processes all items

**Status:** Order status changes to **SHIPPED**

**System Actions:**
- Stock quantities reduced
- Reserved quantities released
- Stock movement records created
- Finished goods removed from inventory

---

### 12. **Sales Order Completion (Delivery)**
**Location:** Orders → Sales Orders (`/sales`)

#### Steps:
1. Find the sales order (status: SHIPPED)
2. Click **"Complete"** button
3. Confirm delivery

**Status:** Order status changes to **DELIVERED**

---

### 13. **Export Order Creation** (For International Sales)
**Location:** Orders → Export Orders (`/export-orders`)

#### Steps:
1. Navigate to **Orders → Export Orders**
2. Click **"New Export Order"**
3. Fill in details:
   - Select Customer
   - Port of Loading
   - Port of Destination
   - Incoterms (FOB, CIF, EXW, DDP)
4. Add items:
   - Select Product
   - Enter Quantity
   - Enter Unit Price (in USD)
   - Click **"Add Item"**
5. Review total value
6. Click **"Create Order"**

**Status:** Order created with status **PENDING**

---

### 14. **Export Order Status Management**
**Location:** Orders → Export Orders (`/export-orders`)

#### Steps:
1. Find the export order
2. Use the status dropdown to update:
   - **PENDING** → Initial state
   - **BOOKED** → Shipping booked
   - **SHIPPED** → Goods shipped
   - **DELIVERED** → Goods delivered
   - **CANCELLED** → Order cancelled

**System Actions:**
- Status updates tracked
- Stock movements recorded when shipped

---

## 📊 Stock Management Throughout Workflow

### Stock Tracking Points:

1. **Raw Material Stock** (`raw_material_batches`)
   - Added: Purchase Order Inward
   - Consumed: Production Order Completion
   - Adjusted: Stock Management page

2. **Finished Goods Stock** (`finished_goods_stock`)
   - Added: Production Order Completion
   - Reserved: Sales Order Creation
   - Reduced: Sales Order Processing
   - Adjusted: Stock Management page

3. **Stock Movements** (Audit Trail)
   - `raw_material_stock_movements` - All raw material transactions
   - `finished_goods_stock_movements` - All finished goods transactions

---

## 🔄 Complete Workflow Summary

```
1. Add Raw Material → System
2. Create Purchase Order → DRAFT
3. Approve Purchase Order → PLACED
4. Process Inward → RECEIVED (Raw materials in stock)
5. Create BOM → Defines product recipe
6. Create Production Order → PENDING
7. Start Production → IN_PROGRESS (Raw materials consumed)
8. Complete Production → COMPLETED (Finished goods in stock)
9. Create Sales Order → PENDING (Stock reserved)
10. Confirm Sales Order → CONFIRMED
11. Process Sales Order → SHIPPED (Stock reduced)
12. Complete Sales Order → DELIVERED
```

**OR for Export:**
```
9. Create Export Order → PENDING
10. Update Status → BOOKED → SHIPPED → DELIVERED
```

---

## 📈 Key Features

### Stock Management Page (`/stock/list`)
- View all stock (raw materials + finished goods)
- Filter by type
- Adjust stock quantities
- View stock movements
- Low stock alerts

### Reports Page (`/report`)
- Inventory reports
- Sales reports
- Production reports
- Purchase reports
- Financial summaries

### Audit Logs (`/audit-logs`)
- Track all system changes
- User activity monitoring
- Data modification history

---

## 🎯 Business Flow Example

**Scenario:** Manufacturing 100 T-Shirts

1. **Purchase Raw Materials:**
   - Order 200m Cotton Fabric
   - Order 100 Zippers
   - Order 500m Thread
   - Receive and stock

2. **Create BOM for T-Shirt:**
   - 2m Cotton Fabric per shirt
   - 1 Zipper per shirt
   - 5m Thread per shirt

3. **Create Production Order:**
   - Product: T-Shirt
   - Quantity: 100 units
   - System calculates: 200m fabric, 100 zippers, 500m thread needed

4. **Start & Complete Production:**
   - Raw materials consumed
   - 100 T-Shirts added to finished goods stock

5. **Sell T-Shirts:**
   - Create sales order for 50 T-Shirts
   - Process and ship
   - Stock reduced to 50 T-Shirts

6. **Export Remaining:**
   - Create export order for 50 T-Shirts
   - Ship internationally
   - Stock reduced to 0

---

## 🔐 Permissions Required

- **purchase.read** - View purchase orders
- **purchase.create** - Create purchase orders
- **purchase.approve** - Approve purchase orders
- **purchase.receive** - Process inward
- **production.read** - View production orders
- **production.create** - Create production orders
- **production.start** - Start production
- **production.complete** - Complete production
- **sales.read** - View sales/export orders
- **sales.create** - Create sales/export orders
- **stock.read** - View stock
- **stock.adjust** - Adjust stock quantities

---

## 📱 Navigation Quick Reference

- **Dashboard:** `/dashboard`
- **Raw Materials:** `/raw-materials`
- **Purchase Orders:** `/order`
- **Purchase Inward:** `/purchase-inward`
- **Bill of Materials:** `/bom`
- **Production Orders:** `/production`
- **Sales Orders:** `/sales`
- **Export Orders:** `/export-orders`
- **Stock Management:** `/stock/list`
- **Reports:** `/report`

---

## ✅ System Status Flows

### Purchase Order Status:
`DRAFT` → `PLACED` → `PARTIAL`/`RECEIVED`

### Production Order Status:
`PENDING` → `IN_PROGRESS` → `COMPLETED`

### Sales Order Status:
`PENDING` → `CONFIRMED` → `PROCESSING` → `SHIPPED` → `DELIVERED`

### Export Order Status:
`PENDING` → `BOOKED` → `SHIPPED` → `DELIVERED`

---

## 🎓 Best Practices

1. **Always create BOMs** before production orders
2. **Approve purchase orders** before receiving
3. **Check stock availability** before creating sales orders
4. **Complete production orders** promptly to update stock
5. **Process sales orders** in sequence (confirm → process → complete)
6. **Use stock adjustments** for corrections only
7. **Review reports** regularly for insights
8. **Check audit logs** for troubleshooting

---

## 🆘 Troubleshooting

**Issue:** Cannot create production order
- **Solution:** Ensure BOM exists for the product and raw materials are in stock

**Issue:** Cannot process sales order
- **Solution:** Ensure finished goods are in stock and order is confirmed

**Issue:** Stock not updating
- **Solution:** Check if production order is completed or sales order is processed

**Issue:** Cannot approve purchase order
- **Solution:** Ensure order status is DRAFT and you have approval permissions

---

## 📞 Support

For technical issues or questions, contact your system administrator.

**Version:** 1.0  
**Last Updated:** January 2026
