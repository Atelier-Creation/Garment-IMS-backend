# Garment IMS - Visual Workflow Diagram

## 🔄 Complete Production & Sales Workflow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         GARMENT IMS WORKFLOW                             │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 1: RAW MATERIAL PROCUREMENT                                        │
└──────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐
    │  Add Raw        │
    │  Material       │
    │  to System      │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │  Create         │
    │  Purchase       │
    │  Order (DRAFT)  │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │  Approve PO     │
    │  (PLACED)       │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │  Process        │
    │  Inward         │
    │  (RECEIVED)     │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │  Raw Materials  │
    │  IN STOCK ✓     │
    └─────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 2: PRODUCTION PLANNING                                             │
└──────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐
    │  Create BOM     │
    │  (Bill of       │
    │  Materials)     │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │  Define Recipe: │
    │  - 2m Fabric    │
    │  - 1 Zipper     │
    │  - 5m Thread    │
    └─────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 3: PRODUCTION EXECUTION                                            │
└──────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐
    │  Create         │
    │  Production     │
    │  Order          │
    │  (PENDING)      │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │  Start          │
    │  Production     │
    │  (IN_PROGRESS)  │
    └────────┬────────┘
             │
             ▼  (Raw Materials Consumed)
    ┌─────────────────┐
    │  Complete       │
    │  Production     │
    │  (COMPLETED)    │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │  Finished Goods │
    │  IN STOCK ✓     │
    └─────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 4A: DOMESTIC SALES                                                 │
└──────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐
    │  Create Sales   │
    │  Order          │
    │  (PENDING)      │
    └────────┬────────┘
             │
             ▼  (Stock Reserved)
    ┌─────────────────┐
    │  Confirm Order  │
    │  (CONFIRMED)    │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │  Process Order  │
    │  (SHIPPED)      │
    └────────┬────────┘
             │
             ▼  (Stock Reduced)
    ┌─────────────────┐
    │  Complete       │
    │  Delivery       │
    │  (DELIVERED)    │
    └─────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│ PHASE 4B: INTERNATIONAL EXPORT                                           │
└──────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────┐
    │  Create Export  │
    │  Order          │
    │  (PENDING)      │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │  Book Shipping  │
    │  (BOOKED)       │
    └────────┬────────┘
             │
             ▼
    ┌─────────────────┐
    │  Ship Goods     │
    │  (SHIPPED)      │
    └────────┬────────┘
             │
             ▼  (Stock Reduced)
    ┌─────────────────┐
    │  Confirm        │
    │  Delivery       │
    │  (DELIVERED)    │
    └─────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│ STOCK TRACKING THROUGHOUT                                                │
└──────────────────────────────────────────────────────────────────────────┘

    RAW MATERIALS STOCK:
    ┌─────────────────────────────────────────────────────────────┐
    │ Purchase Inward → [+] Stock Increased                       │
    │ Production Start → [-] Stock Consumed                       │
    │ Stock Adjustment → [±] Manual Adjustment                    │
    └─────────────────────────────────────────────────────────────┘

    FINISHED GOODS STOCK:
    ┌─────────────────────────────────────────────────────────────┐
    │ Production Complete → [+] Stock Increased                   │
    │ Sales Order Create → [R] Stock Reserved                     │
    │ Sales Order Process → [-] Stock Reduced                     │
    │ Stock Adjustment → [±] Manual Adjustment                    │
    └─────────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│ DATA FLOW DIAGRAM                                                        │
└──────────────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │ Raw Material │
    │   Master     │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐      ┌──────────────┐
    │  Purchase    │──────▶│ Raw Material │
    │   Order      │      │   Batches    │
    └──────────────┘      └──────┬───────┘
                                 │
                                 ▼
    ┌──────────────┐      ┌──────────────┐
    │     BOM      │──────▶│  Production  │
    │  (Recipe)    │      │    Order     │
    └──────────────┘      └──────┬───────┘
                                 │
                                 ▼
    ┌──────────────┐      ┌──────────────┐
    │   Product    │◀─────│  Finished    │
    │   Master     │      │Goods Stock   │
    └──────────────┘      └──────┬───────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
                    ▼                         ▼
            ┌──────────────┐          ┌──────────────┐
            │ Sales Order  │          │Export Order  │
            └──────────────┘          └──────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│ SYSTEM MODULES & PAGES                                                   │
└──────────────────────────────────────────────────────────────────────────┘

    INVENTORY MANAGEMENT:
    ├── Raw Materials (/raw-materials)
    ├── Products (/product/list)
    ├── Product Variants (/product/variants)
    ├── Bill of Materials (/bom)
    └── Stock Management (/stock/list)

    PROCUREMENT:
    ├── Suppliers (/vendor)
    ├── Purchase Orders (/order)
    └── Purchase Inward (/purchase-inward)

    PRODUCTION:
    └── Production Orders (/production)

    SALES & DISTRIBUTION:
    ├── Customers (/customer)
    ├── Sales Orders (/sales)
    ├── Export Orders (/export-orders)
    └── Shipments (/shipments)

    ADMINISTRATION:
    ├── Users (/user)
    ├── Roles (/roles)
    ├── Permissions (/permissions)
    ├── Branches (/branch)
    └── Audit Logs (/audit-logs)

    ANALYTICS:
    └── Reports (/report)


┌──────────────────────────────────────────────────────────────────────────┐
│ EXAMPLE: MANUFACTURING 100 T-SHIRTS                                      │
└──────────────────────────────────────────────────────────────────────────┘

    STEP 1: Purchase Raw Materials
    ┌─────────────────────────────────────────────────────────┐
    │ PO-001: Order from Supplier                             │
    │ - 200m Cotton Fabric @ ₹50/m = ₹10,000                 │
    │ - 100 Zippers @ ₹10/pc = ₹1,000                        │
    │ - 500m Thread @ ₹2/m = ₹1,000                          │
    │ Total: ₹12,000                                          │
    └─────────────────────────────────────────────────────────┘
                    ↓ (Approve & Receive)
    ┌─────────────────────────────────────────────────────────┐
    │ Raw Material Stock:                                     │
    │ ✓ 200m Cotton Fabric                                    │
    │ ✓ 100 Zippers                                           │
    │ ✓ 500m Thread                                           │
    └─────────────────────────────────────────────────────────┘

    STEP 2: Create BOM
    ┌─────────────────────────────────────────────────────────┐
    │ BOM: T-Shirt Standard (v1.0)                            │
    │ Per Unit Requirements:                                  │
    │ - 2m Cotton Fabric                                      │
    │ - 1 Zipper                                              │
    │ - 5m Thread                                             │
    └─────────────────────────────────────────────────────────┘

    STEP 3: Create Production Order
    ┌─────────────────────────────────────────────────────────┐
    │ PRO-001: Produce 100 T-Shirts                           │
    │ Required Materials (auto-calculated):                   │
    │ - 200m Cotton Fabric (100 × 2m)                         │
    │ - 100 Zippers (100 × 1)                                 │
    │ - 500m Thread (100 × 5m)                                │
    └─────────────────────────────────────────────────────────┘
                    ↓ (Start & Complete)
    ┌─────────────────────────────────────────────────────────┐
    │ Finished Goods Stock:                                   │
    │ ✓ 100 T-Shirts                                          │
    │                                                          │
    │ Raw Material Stock:                                     │
    │ ✗ 0m Cotton Fabric (consumed)                           │
    │ ✗ 0 Zippers (consumed)                                  │
    │ ✗ 0m Thread (consumed)                                  │
    └─────────────────────────────────────────────────────────┘

    STEP 4: Sell Products
    ┌─────────────────────────────────────────────────────────┐
    │ SO-001: Domestic Sale                                   │
    │ - 50 T-Shirts @ ₹500/pc = ₹25,000                      │
    └─────────────────────────────────────────────────────────┘
                    ↓ (Confirm & Ship)
    ┌─────────────────────────────────────────────────────────┐
    │ EXP-001: Export Order                                   │
    │ - 50 T-Shirts @ $10/pc = $500                          │
    └─────────────────────────────────────────────────────────┘
                    ↓ (Book & Ship)
    ┌─────────────────────────────────────────────────────────┐
    │ Finished Goods Stock:                                   │
    │ ✗ 0 T-Shirts (all sold)                                 │
    │                                                          │
    │ Revenue Generated:                                      │
    │ ✓ Domestic: ₹25,000                                     │
    │ ✓ Export: $500                                          │
    │ ✓ Total Cost: ₹12,000                                   │
    │ ✓ Profit: ₹13,000+ (excluding export)                   │
    └─────────────────────────────────────────────────────────┘


┌──────────────────────────────────────────────────────────────────────────┐
│ KEY INDICATORS & ALERTS                                                  │
└──────────────────────────────────────────────────────────────────────────┘

    🟢 GREEN: Stock Available / Order Completed
    🟡 YELLOW: Low Stock / Order Pending
    🔴 RED: Out of Stock / Order Cancelled
    🔵 BLUE: Order In Progress
    🟣 PURPLE: Order Shipped

    STOCK ALERTS:
    ├── Low Raw Material Stock → Trigger Purchase Order
    ├── Low Finished Goods → Trigger Production Order
    ├── Expired Batches → Stock Adjustment Required
    └── Reserved Stock → Monitor Sales Order Progress


┌──────────────────────────────────────────────────────────────────────────┐
│ REPORTS AVAILABLE                                                        │
└──────────────────────────────────────────────────────────────────────────┘

    📊 Inventory Reports:
    ├── Current Stock Levels
    ├── Stock Valuation
    ├── Low Stock Items
    └── Stock Movement History

    📈 Sales Reports:
    ├── Sales by Customer
    ├── Sales by Product
    ├── Revenue Analysis
    └── Export Performance

    🏭 Production Reports:
    ├── Production Efficiency
    ├── Material Consumption
    ├── Production Costs
    └── Waste Analysis

    💰 Financial Reports:
    ├── Purchase Summary
    ├── Sales Summary
    ├── Profit & Loss
    └── Cost Analysis
