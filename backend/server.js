require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const db = require('./models');

const app = express();

// Trust proxy (required behind Fly.io reverse proxy for correct IP detection and rate limiting)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: function(origin, callback) {
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many login attempts, please try again later.' }
});
app.use('/api/auth/login', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());
app.use(morgan('combined'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/members', require('./routes/members'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/content', require('./routes/content'));
app.use('/api/events', require('./routes/events'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/exports', require('./routes/exports'));
app.use('/api/volunteers', require('./routes/volunteers'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/newsletters', require('./routes/newsletters'));
app.use('/api/paypal', require('./routes/paypal'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date(), uptime: process.uptime() });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, 'public');
  app.use(express.static(staticPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Find available port (development only)
const findPort = async (startPort) => {
  const net = require('net');
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => resolve(findPort(startPort + 1)));
  });
};

// Connect to database with retries (Fly Postgres may be waking from zero-scale)
let dbReady = false;
const connectDB = async (maxRetries = 10, baseDelay = 2000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await db.sequelize.authenticate();
      console.log('✅ Database connected successfully');
      await db.sequelize.sync({ alter: true });
      console.log('✅ Database tables synced');
      dbReady = true;
      return;
    } catch (error) {
      const delay = Math.min(baseDelay * attempt, 30000);
      console.error(`⏳ DB connection attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      if (attempt < maxRetries) {
        console.log(`   Retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        console.error('❌ All DB connection attempts failed. App running without DB.');
      }
    }
  }
};

// Start server - bind to port FIRST, then connect DB in background
const startServer = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const port = isProduction
    ? (parseInt(process.env.PORT) || 8080)
    : await findPort(parseInt(process.env.PORT) || 3001);
  const host = isProduction ? '0.0.0.0' : 'localhost';

  // Start listening IMMEDIATELY so Fly.io health checks pass
  app.listen(port, host, () => {
    console.log(`🚀 TÊKOȘÎN Admin Backend running on ${host}:${port}`);
    console.log(`📡 API: http://${host}:${port}/api`);
    console.log(`🏥 Health: http://${host}:${port}/api/health`);
  });

  // Connect to DB in background with retries
  connectDB().catch(err => {
    console.error('❌ DB background connection error:', err.message);
  });
};

startServer();

module.exports = app;
