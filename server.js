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
   CORS (SINGLE, CORRECT CONFIG)
================================ */
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow Postman / server-to-server
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, origin); // ✅ exactly ONE origin
    }

    // ❗ Do NOT throw error (causes missing CORS headers)
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Apply CORS to ALL requests
app.use(cors(corsOptions));

// Apply SAME CORS config to preflight
app.options('*', cors(corsOptions));

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
   Server Start
================================ */
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');
  } catch (error) {
    console.error('⚠️ Database connection failed:', error.message);
    console.error('⚠️ Server running without DB');
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

startServer();

module.exports = app;
