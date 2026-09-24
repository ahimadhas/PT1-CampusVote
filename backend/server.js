const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || '*',
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ignore favicon and Chrome DevTools auto-probe requests
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.get(/^\/\.well-known(\/.*)?$/, (req, res) => res.status(204).end());

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Student Polling & Election Management API',
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/polls', require('./routes/pollRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Root API Info
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'CampusPortal API',
    status: 'online',
    frontendUrl: process.env.CLIENT_URL || 'http://localhost:5173',
    documentation: {
      health: '/api/health',
      auth: '/api/auth',
      polls: '/api/polls',
      admin: '/api/admin',
    },
  });
});

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect to Database and start server only when run directly
let server;
if (process.env.NODE_ENV !== 'test') {
  connectDB().then(() => {
    server = app.listen(PORT, () => {
      console.log(
        `[Server] Running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`
      );
    });
  });
}

// Graceful shutdown handling for nodemon and process signals
const { disconnectDB } = require('./config/db');
const handleShutdown = async () => {
  if (server) {
    server.close();
  }
  await disconnectDB();
  process.exit(0);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

module.exports = { app, server };
