require('dotenv').config();
const express     = require('express');
const http        = require('http');
const { Server }  = require('socket.io');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const compression = require('compression');
const rateLimit   = require('express-rate-limit');
const path        = require('path');

const { initDb }         = require('./db/database');
const exerciseRoutes     = require('./routes/exercises');
const sessionRoutes      = require('./routes/sessions');
const userRoutes         = require('./routes/users');
const analyticsRoutes    = require('./routes/analytics');
const { registerSocketHandlers } = require('./sockets/socketHandlers');

const app    = express();
const server = http.createServer(app);

// Allowed origins (FRONTEND_URL can be comma-separated for multiple frontends)
const allowedOrigins = [
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',').map(u => u.trim()) : []),
  'http://localhost:3000',
  'https://avatar-exercise-tawny.vercel.app'
].filter(Boolean);

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:  allowedOrigins,
    methods: ['GET', 'POST'],
  },
  maxHttpBufferSize: 5e6, // 5MB for pose frame payloads
  transports: ['websocket', 'polling'],
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  message:  { success: false, error: 'Too many requests' },
}));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/exercises', exerciseRoutes);
app.use('/api/sessions',  sessionRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/analytics', analyticsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), uptime: process.uptime() });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(err.status || 500).json({ success: false, error: err.message || 'Internal server error' });
});

// ─── Socket Handlers ─────────────────────────────────────────────────────────
registerSocketHandlers(io);

// ─── Bootstrap ───────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4000;

async function bootstrap() {
  try {
    await initDb();
    server.listen(PORT, () => {
      console.log(`\n🚀 Avatar Exercise Buddy Backend`);
      console.log(`   REST API : http://localhost:${PORT}/api`);
      console.log(`   Socket   : ws://localhost:${PORT}`);
      console.log(`   Health   : http://localhost:${PORT}/health\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
