require('dotenv').config();
const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const compression = require('compression');
const rateLimit   = require('express-rate-limit');

const { initDb }         = require('../src/db/database');
const exerciseRoutes     = require('../src/routes/exercises');
const sessionRoutes      = require('../src/routes/sessions');
const userRoutes         = require('../src/routes/users');
const analyticsRoutes    = require('../src/routes/analytics');

const app = express();

// Allowed origins
const allowedOrigins = [
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(u => u.trim()) : []),
  'http://localhost:3000'
].filter(Boolean);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  message:  { success: false, error: 'Too many requests' },
}));

// Init DB before handling requests
let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initDb();
      dbInitialized = true;
    } catch (err) {
      console.error('DB init failed:', err);
    }
  }
  next();
});

// Routes
app.use('/api/exercises', exerciseRoutes);
app.use('/api/sessions',  sessionRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal server error' });
});

module.exports = app;
