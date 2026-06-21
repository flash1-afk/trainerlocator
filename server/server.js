const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const supabase = require('./config/supabase'); // Import Supabase client

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Allowed origins for CORS (supports comma-separated CLIENT_URL for multiple frontends)
const allowedOrigins = [
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(u => u.trim()) : []),
  'http://localhost:3003',
  'http://localhost:3000'
].filter(Boolean);

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);

app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Serve static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/trainers', require('./routes/trainers'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/admin', require('./routes/admin'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  const dbStatus = supabase ? 'connected' : 'disconnected';

  res.status(200).json({
    status: 'OK',
    message: 'TRAINERLOCATOR Server is running',
    database: `Supabase (${dbStatus})`,
    timestamp: new Date().toISOString()
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 User connected: ${socket.id}`);

  // Join room based on user type
  socket.on('join_room', (data) => {
    if (data && data.room) {
      socket.join(data.room);
      console.log(`👤 User ${socket.id} joined room: ${data.room}`);
    }
  });

  // Handle trainer location updates
  socket.on('trainer_location_update', (data) => {
    if (data) {
      socket.to('users').emit('trainer_location_updated', data);
    }
  });

  // Handle session requests
  socket.on('session_request', (data) => {
    if (data && data.trainerId) {
      socket.to(`trainer_${data.trainerId}`).emit('new_session_request', data);
    }
  });

  // Handle session responses
  socket.on('session_response', (data) => {
    if (data && data.userId) {
      socket.to(`user_${data.userId}`).emit('session_response_received', data);
    }
  });

  // Handle live session updates
  socket.on('session_started', (data) => {
    if (data && data.sessionId) {
      socket.to(`session_${data.sessionId}`).emit('session_started', data);
    }
  });

  socket.on('session_ended', (data) => {
    if (data && data.sessionId) {
      socket.to(`session_${data.sessionId}`).emit('session_ended', data);
    }
  });

  // Handle AI feedback during sessions
  socket.on('ai_feedback', (data) => {
    if (data && data.sessionId) {
      socket.to(`session_${data.sessionId}`).emit('ai_feedback_received', data);
    }
  });

  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.id}`);
  });
});

// Error handling middleware
app.use(require('./middleware/errorHandler'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 TRAINERLOCATOR Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Access server at: http://localhost:${PORT}`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});

module.exports = { app, server, io };