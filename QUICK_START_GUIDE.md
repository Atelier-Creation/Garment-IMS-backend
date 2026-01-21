# 🚀 Quick Start Guide - Garment IMS Complete Workflow

## 📋 Prerequisites
- Backend server running on http://localhost:3000
- Frontend running on http://localhost:3001
- Admin credentials: admin@garmentims.com / admin123

---

## ⚡ 5-Minute Workflow Test

### Step 1: Login (30 seconds)
1. Open http://localhost:3001
2. Login with admin credentials
3. You'll see the Dashboard

### Step 2: Add Raw Material (1 minute)
1. Click **"Raw Materials"** in sidebar
2. Click **"Add Raw Material"** button
3. Fill in:
   - Material Code: `FAB001`
   - Name: `Cotton Fabric`
   - UOM: Select `METER`
   - Average Cost: `50`
4. Click **"Create"**

### Step 3: Create Purchase Order (1 minute)
1. Click **"Orders"** → **"Purchase Orders"**
2. Click **"New Purchase Order"**
3. Select any Supplier
4. Select Order Date (today)
5. Click **"Add Item"**:
   - Select `Cotton Fabric`
   - Quantity: `100`
   - Unit Price: `50`
6. Click **"Add Item"** button
7. Click **"Create Purchase Order"**

### Step 4: Approve & Receive (1 minute)
1. Find your PO in the list (status: DRAFT)
2. Click **"Approve"** button
3. Go to **"Orders"** → **"Purchase Inward"**
4. Find your PO (status: PLACED)
5. Click **"Process Inward"**
6. Enter Received Quantity: `100`
7. Click **"Process Inward"**

**✅ Raw materials are now in stock!**

### Step 5: Check Stock (30 seconds)
1. Click **"Stock Management"**
2. You should see your Cotton Fabric with quantity 100

### Step 6: Create Production Order (1 minute)
1. First, create a BOM:
   - Go to **"Products"** → **"Bill of Materials"**
   - Click **"Create BOM"**
   - Select a Product
   - Add raw materials
   - Save

2. Create Production Order:
   - Go to **"Orders"** → **"Production Orders"**
   - Click **"New Production Order"**
   - Select Product and BOM
   - Enter Quantity: `10`
   - Click **"Create"**

3. Start Production:
   - Click **"Start"** button

4. Complete Production:
   - Click **"Complete"** button
   - Enter Actual Quantity: `10`
   - Click **"Complete Production"**

**✅ Finished goods are now in stock!**

### Step 7: Create Sales Order (1 minute)
1. Go to **"Orders"** → **"Sales Orders"**
2. Click **"New Sales Order"**
3. Select Customer
4. Select Branch
5. Add items:
   - Select Product Variant
   - Quantity: `5`
   - Unit Price: `500`
   - Click **"Add Item"**
6. Click **"Create Order"**

7. Process the order:
   - Click **"Confirm"**
   - Click **"Process"**
   - Click **"Complete"**

**✅ Sale completed! Stock reduced!**

---

## 🎯 Complete Workflow Summary

```
Raw Material → Purchase → Receive → Stock
                                      ↓
                                    BOM → Production → Finished Goods
                                                            ↓
                                                    Sales/Export → Delivery
```

---

## 📱 Navigation Quick Reference

### Main Sections:
- **Dashboard** - Overview and metrics
- **Products** - Product management
  - Product List
  - Product Variants
  - Categories
  - Bill of Materials
- **Raw Materials** - Raw material master
- **Stock Management** - Inventory tracking
- **Orders** - All order types
  - Purchase Orders
  - Purchase Inward
  - Sales Orders
  - Production Orders
  - Export Orders
- **Shipments** - Shipping management
- **Contacts** - Suppliers & Customers
- **Administration** - Users, Roles, Permissions
- **Branches** - Branch management
- **Reports** - Analytics and reports
- **Audit Logs** - System activity tracking

---

## 🔄 Status Workflows

### Purchase Order:
`DRAFT` → `PLACED` → `RECEIVED`

### Production Order:
`PENDING` → `IN_PROGRESS` → `COMPLETED`

### Sales Order:
`PENDING` → `CONFIRMED` → `SHIPPED` → `DELIVERED`

### Export Order:
`PENDING` → `BOOKED` → `SHIPPED` → `DELIVERED`

---

## 💡 Pro Tips

1. **Always create BOMs** before production orders
2. **Approve purchase orders** before receiving
3. **Check stock** before creating sales orders
4. **Use filters** to find orders quickly
5. **Check audit logs** for troubleshooting
6. **Review reports** for business insights

---

## 🆘 Common Issues

**Issue:** Cannot create production order
- **Fix:** Create BOM first for the product

**Issue:** Cannot process sales order
- **Fix:** Ensure stock is available and order is confirmed

**Issue:** Stock not showing
- **Fix:** Complete production order or process purchase inward

**Issue:** Button not visible
- **Fix:** Check order status - buttons appear based on status

---

## 📊 Key Features

✅ Real-time stock tracking
✅ Multi-branch support
✅ BOM-based production
✅ Stock reservations
✅ Audit trail
✅ Role-based access
✅ Export management
✅ Comprehensive reports

---

## 🎓 Learning Path

### Beginner (Day 1):
1. Add raw materials
2. Create purchase orders
3. Process inward
4. View stock

### Intermediate (Day 2):
1. Create products
2. Create BOMs
3. Create production orders
4. Complete production

### Advanced (Day 3):
1. Create sales orders
2. Create export orders
3. Manage shipments
4. Generate reports

---

## 📞 Need Help?

1. Check **COMPLETE_WORKFLOW_GUIDE.md** for detailed steps
2. Check **WORKFLOW_DIAGRAM.md** for visual guides
3. Check **WORKFLOW_IMPLEMENTATION_SUMMARY.md** for technical details
4. Contact system administrator

---

## ✨ What's Next?

After mastering the basic workflow:
1. Explore **Reports** for analytics
2. Set up **Users and Roles** for your team
3. Configure **Branches** for multi-location
4. Use **Audit Logs** for compliance
5. Customize **Permissions** for security

---

**🎉 You're ready to use the complete Garment IMS workflow!**

**Happy Manufacturing! 🏭**
