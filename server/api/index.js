const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Set up environment variables for Vercel
// (Vercel injects env vars automatically, no dotenv needed in production)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
}

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(u => u.trim()) : []),
  'http://localhost:3003',
  'http://localhost:3000'
].filter(Boolean);

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('../routes/auth'));
app.use('/api/users', require('../routes/users'));
app.use('/api/trainers', require('../routes/trainers'));
app.use('/api/sessions', require('../routes/sessions'));
app.use('/api/bookings', require('../routes/bookings'));
app.use('/api/notifications', require('../routes/notifications'));
app.use('/api/upload', require('../routes/upload'));
app.use('/api/admin', require('../routes/admin'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'TRAINERLOCATOR Server is running on Vercel',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(require('../middleware/errorHandler'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

module.exports = app;
