# Purchase Order Workflow Guide

## Overview
The Purchase Order system has a complete workflow from creation to receiving goods. Here's how it works:

## Workflow Steps

### 1. Create Purchase Order (DRAFT Status)
**Location**: Purchase Orders page → "Create Purchase Order" button

**Steps**:
1. Click "Create Purchase Order"
2. Select Supplier
3. Select Branch (optional)
4. Set Expected Delivery Date
5. Add Items:
   - Select Raw Material (or create new if not exists)
   - Enter Quantity
   - Unit Price (auto-filled from raw material's average cost)
6. Click "Create"

**Result**: Purchase Order created with status **DRAFT**

---

### 2. Approve Purchase Order (PLACED Status)
**Location**: Purchase Orders page → "Approve" button (visible for DRAFT orders)

**Steps**:
1. Review the purchase order details (click "View" to see full details)
2. Click "Approve" button
3. Confirm approval

**Result**: Purchase Order status changes to **PLACED** and becomes ready for receiving

**Note**: Only DRAFT orders can be approved. Once placed, the order cannot be edited or deleted.

---

### 3. Process Purchase Order Inward (PARTIAL/RECEIVED Status)
**Location**: Purchase Order Inward page (separate menu item)

**Steps**:
1. Go to "Purchase Inward" from the sidebar menu
2. Find the placed purchase order
3. Click "Process Inward"
4. For each item:
   - Enter received quantity
   - Batch code (auto-generated if not provided)
   - Unit cost (defaults to order unit price)
   - Notes (optional)
5. Enter received date (defaults to today)
6. Click "Process Inward"

**Result**: 
- Raw material batches created in inventory
- Stock movements recorded
- Purchase order status changes to:
  - **PARTIAL**: If some items are still pending
  - **RECEIVED**: If all items are fully received

---

## Status Flow Diagram

```
DRAFT → PLACED → PARTIAL → RECEIVED
  ↓         ↓
CANCELLED CANCELLED
```

**Status Meanings:**
- **DRAFT**: Purchase order created but not yet approved
- **PLACED**: Purchase order approved and ready for receiving (equivalent to "Approved")
- **PARTIAL**: Some items received, but not all
- **RECEIVED**: All items fully received
- **CANCELLED**: Purchase order cancelled

## Button Visibility by Status

| Status | View | Approve | Receive | Edit | Delete |
|--------|------|---------|---------|------|--------|
| DRAFT | ✅ | ✅ | ❌ | ✅ | ✅ |
| PLACED | ✅ | ❌ | ✅ | ❌ | ❌ |
| PARTIAL | ✅ | ❌ | ✅ | ❌ | ❌ |
| RECEIVED | ✅ | ❌ | ❌ | ❌ | ❌ |
| CANCELLED | ✅ | ❌ | ❌ | ❌ | ❌ |

## Key Features

### Purchase Orders Page
- **Create**: Create new purchase orders
- **View**: View detailed PO with export options (Print, PDF, Excel)
- **Edit**: Modify draft/pending orders
- **Approve**: Approve orders to make them ready for receiving
- **Delete**: Cancel draft/pending orders
- **Export**: Print or export PO to PDF/Excel

### Purchase Order Inward Page
- **View Ready Orders**: See all approved/partial orders
- **Process Inward**: Receive goods and create inventory batches
- **Track History**: View inward history for each order
- **Dashboard**: Summary of pending and completed inwards

## Important Notes

1. **Raw Material Creation**: You can create new raw materials directly from the Purchase Order form if they don't exist
2. **Auto-fill Prices**: Unit prices are auto-filled from raw material's average cost
3. **Batch Tracking**: Each inward creates a batch with unique batch code for inventory tracking
4. **Partial Receiving**: You can receive items in multiple batches (partial inward)
5. **Status Updates**: Status automatically updates based on received quantities
6. **Audit Trail**: All actions are logged for audit purposes

## Common Questions

**Q: How do I change a Purchase Order to Purchase Order Inward?**
A: You don't "change" it. The workflow is:
1. Create PO (DRAFT)
2. Approve PO (APPROVED) - this makes it ready for inward
3. Go to "Purchase Inward" page to process the receiving

**Q: Why can't I see the "Approve" button?**
A: The Approve button only shows for orders with DRAFT status.

**Q: Why can't I edit an approved order?**
A: Once approved (status PLACED), orders are locked to maintain data integrity. You can only receive goods against placed orders.

**Q: Can I receive items in multiple batches?**
A: Yes! If you receive partial quantities, the status becomes PARTIAL and you can process more inward later.

**Q: Where do I see the received inventory?**
A: Go to "Stock" page to see all raw material batches and inventory levels.
