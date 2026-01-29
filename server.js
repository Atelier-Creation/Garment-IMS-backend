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

/* ==============================
   Security Middleware
================================ */
app.use(helmet());
app.use(compression());

/* ==============================
   CORS (MUST COME FIRST)
================================ */
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Explicit OPTIONS handler
app.options('*', cors());

/* ==============================
   Body Parsers
================================ */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/* ==============================
   Logging
================================ */
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

/* ==============================
   Rate Limiting (AFTER CORS)
================================ */
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  skip: (req) => req.method === 'OPTIONS', // 🔥 IMPORTANT
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later.'
});

app.use('/api', limiter);

/* ==============================
   Health Check
================================ */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/* ==============================
   Audit Logger
================================ */
app.use('/api', auditLogger({
  excludePaths: ['/health', '/api/auth/profile', '/api/audit-logs'],
  excludeMethods: ['GET'],
  includeRequestBody: true,
  includeResponseBody: false
}));

/* ==============================
   Routes
================================ */
app.use('/api', routes);

/* ==============================
   Error Handling
================================ */
app.use(notFound);
app.use(errorHandler);

/* ==============================
   Server Start (SAFE)
================================ */
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('⚠️ Database connection failed:', error.message);
    console.error('⚠️ Server will continue without DB');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔍 Health: /health`);
    console.log(`📦 API: /api`);
  });
};

startServer();

module.exports = app;
