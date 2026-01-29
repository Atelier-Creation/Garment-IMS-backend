require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { sequelize } = require('./src/models');
const routes = require('./src/routes');
const { errorHandler, notFound } = require('./src/middleware/errorMiddleware');
const { auditLogger } = require('./src/middleware/auditMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Audit logging middleware (after authentication but before routes)
app.use('/api', auditLogger({
  excludePaths: ['/health', '/api/auth/profile', '/api/audit-logs'], // Don't audit these paths
  excludeMethods: ['GET'], // Don't audit GET requests by default
  includeRequestBody: true,
  includeResponseBody: false
}));

// API routes
app.use('/api', routes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Database connection and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Auto-create tables and seed data in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Running database migrations...');
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      try {
        // Run migrations
        await execAsync('npx sequelize-cli db:migrate');
        console.log('Database migrations completed successfully.');
        
        // Check if we need to seed data
        const roleCount = await sequelize.query('SELECT COUNT(*) as count FROM roles', {
          type: sequelize.QueryTypes.SELECT
        });
        
        if (roleCount[0].count === 0) {
          console.log('Seeding initial data...');
          await execAsync('npx sequelize-cli db:seed:all');
          console.log('Database seeding completed successfully.');
        }
      } catch (migrationError) {
        console.log('Migration/Seeding info:', migrationError.message);
        // Fallback to sync if migrations fail
        await sequelize.sync({ force: false, alter: true });
        console.log('Database synchronized using Sequelize sync.');
      }
    }
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`API Base URL: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
