# Garment IMS (Inventory & Manufacturing System) Backend

A comprehensive backend system for garment manufacturing and inventory management built with Express.js, Sequelize, and MySQL.

## Features

### Core Modules
- **Authentication & Authorization** - JWT-based auth with role-based permissions
- **Master Data Management** - Categories, Suppliers, Customers, Branches
- **Raw Material Management** - Materials, batches, stock tracking with FIFO costing
- **Product Management** - Products, variants, SKU generation
- **Bill of Materials (BOM)** - Recipe management for production
- **Purchase Orders** - Procurement workflow with receiving and batch creation
- **Production Orders** - Manufacturing execution with consumption tracking
- **Sales & POS** - Point of sale with inventory deduction
- **Export Orders** - International shipping and compliance
- **Stock Management** - Real-time inventory with movements and adjustments
- **Reporting** - Stock valuation, production efficiency, sales analytics

### Key Capabilities
- **FIFO/LIFO Costing** - Accurate cost calculation for materials and products
- **Multi-branch Operations** - Factory, warehouse, and retail locations
- **Batch Traceability** - Complete lot tracking from raw materials to finished goods
- **Production Costing** - Automatic unit cost calculation including wastage
- **Stock Movements** - Comprehensive audit trail for all inventory changes
- **Role-based Security** - Granular permissions for different user types

## Technology Stack

- **Backend Framework**: Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Security**: Helmet, CORS, Rate Limiting
- **Architecture**: MVC Pattern

## Project Structure

```
src/
├── config/
│   └── database.js          # Database configuration
├── controllers/             # Business logic controllers
│   ├── authController.js
│   ├── categoryController.js
│   └── supplierController.js
├── middleware/              # Custom middleware
│   ├── authMiddleware.js
│   ├── errorMiddleware.js
│   └── validationMiddleware.js
├── models/                  # Sequelize models
│   ├── index.js
│   ├── User.js
│   ├── Product.js
│   └── ...
├── routes/                  # API route definitions
│   ├── index.js
│   ├── authRoutes.js
│   └── ...
└── utils/
    └── helpers.js           # Utility functions
```

## Installation & Setup

1. **Clone and Install Dependencies**
```bash
npm install
```

2. **Environment Configuration**
```bash
cp .env.example .env
# Edit .env with your database and JWT settings
```

3. **Database Setup**

**Option A: Automatic Setup (Recommended)**
```bash
# Create MySQL database first
mysql -u root -p
CREATE DATABASE garment_ims;
EXIT;

# Run automatic setup
npm run setup-db
```

**Option B: Manual Setup**
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE garment_ims;
EXIT;

# Run migrations and seeds manually
npm run migrate
npm run seed
```

4. **Start Development Server**
```bash
npm run dev
```

The server will automatically:
- Connect to the database
- Run migrations if needed
- Seed initial data if tables are empty
- Start on http://localhost:3000

## Database Management

### Available Scripts
- `npm run setup-db` - Complete database setup (migrations + seeds)
- `npm run migrate` - Run pending migrations only
- `npm run seed` - Run seeders only
- `npm run reset-db` - Reset and recreate entire database
- `npm run migrate:undo` - Rollback last migration

### Auto-Creation Features
- **Development Mode**: Tables auto-create on server start
- **Migrations**: Structured database schema management
- **Seeders**: Initial data for roles, permissions, and master data
- **Fallback Sync**: Uses Sequelize sync if migrations fail

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Master Data
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `GET /api/categories/:id/subcategories` - List subcategories
- `GET /api/suppliers` - List suppliers
- `POST /api/suppliers` - Create supplier

### Core Operations
- `GET /api/products` - List products and variants
- `GET /api/purchase-orders` - List purchase orders
- `GET /api/production-orders` - List production orders
- `GET /api/sales-orders` - List sales orders
- `GET /api/stock` - Stock levels and movements
- `GET /api/reports` - Various business reports

## Business Workflow

### 1. Procurement Flow
```
Create PO → Receive Goods → Create Batches → Update Stock
```

### 2. Production Flow
```
Create BOM → Plan Production → Consume Materials → Output Finished Goods
```

### 3. Sales Flow
```
Create Sales Order → Process Payment → Reduce Stock → Generate Invoice
```

### 4. Export Flow
```
Create Export Order → Pack Items → Create Shipment → Track Delivery
```

## Key Business Rules

1. **Stock Movements**: All inventory changes create audit trails
2. **FIFO Costing**: Raw materials consumed using First-In-First-Out method
3. **Production Costing**: Unit costs calculated from material consumption + labor/overhead
4. **Multi-branch**: Stock tracked separately per location with transfer capabilities
5. **Reservations**: Stock can be reserved for production orders
6. **Batch Tracking**: Complete traceability from raw materials to finished products

## Security Features

- JWT-based authentication
- Role-based access control (RBAC)
- Request rate limiting
- Input validation and sanitization
- SQL injection protection via Sequelize
- CORS configuration
- Security headers via Helmet

## Development

### Available Scripts
- `npm start` - Production server
- `npm run dev` - Development server with nodemon
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed initial data
- `npm test` - Run tests

### Adding New Features

1. **Create Model**: Add Sequelize model in `src/models/`
2. **Create Controller**: Add business logic in `src/controllers/`
3. **Create Routes**: Define API endpoints in `src/routes/`
4. **Add Validation**: Use express-validator for input validation
5. **Update Associations**: Modify `src/models/index.js` for relationships

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secret
4. Enable SSL/HTTPS
5. Configure reverse proxy (nginx)
6. Set up monitoring and logging
7. Configure backup strategy

## Contributing

1. Follow MVC architecture patterns
2. Use consistent naming conventions
3. Add proper validation for all inputs
4. Include error handling in controllers
5. Write meaningful commit messages
6. Add JSDoc comments for functions

## License

MIT License - see LICENSE file for details


 Available Commands
npm run setup-db      # Complete setup (migrations + seeds)
npm run migrate       # Run migrations only
npm run seed         # Run seeds only  
npm run reset-db      # Reset entire database
npm run dev   