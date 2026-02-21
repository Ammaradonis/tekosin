// Only load .env in development (Fly.io sets env vars via secrets/fly.toml)
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const db = require('./models');

const isProduction = process.env.NODE_ENV === 'production';
const app = express();

// ── State ──────────────────────────────────────────────────────────────────
let dbReady = false;

// ── Middleware ──────────────────────────────────────────────────────────────
// Trust first proxy hop (Railway / any reverse proxy)
if (isProduction) app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,   // PayPal popups require cross-origin window access
  crossOriginResourcePolicy: false, // PayPal SDK loads cross-origin resources (iframes, scripts)
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }, // PayPal CDN needs referrer
  permittedCrossDomainPolicies: false  // Allow cross-domain PayPal resources
}));
app.use(cors({
  origin: function(origin, callback) { callback(null, true); },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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

app.use(express.json({
  limit: '10mb',
  verify: (req, res, buf) => {
    // Preserve raw body for PayPal webhook signature verification
    if (req.originalUrl === '/api/paypal/webhook') {
      req.rawBody = buf.toString();
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());
app.use(morgan(isProduction ? 'short' : 'combined'));

// ── Static uploads ─────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Database readiness guard (reject requests before DB is ready) ──────────
app.use('/api', (req, res, next) => {
  // Allow health check always
  if (req.path === '/health') return next();
  // Allow PayPal webhook always (must respond 200 immediately)
  if (req.path === '/paypal/webhook') return next();
  if (!dbReady) {
    return res.status(503).json({ error: 'Server is starting up. Please try again in a few seconds.' });
  }
  next();
});

// ── API Routes ─────────────────────────────────────────────────────────────
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

// ── Health check (Railway / platform health monitoring) ──────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    database: dbReady ? 'connected' : 'connecting',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// ── Catch-all for unknown /api/* — return JSON 404, never HTML ─────────────
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// ── Serve frontend (production only — built React app in ./public) ─────────
if (isProduction) {
  const staticCandidates = [
    process.env.FRONTEND_BUILD_PATH,
    path.join(__dirname, 'public'),
    path.join(__dirname, '..', 'frontend', 'build')
  ].filter(Boolean);

  const staticPath = staticCandidates.find((candidate) => fs.existsSync(path.join(candidate, 'index.html')));

  if (staticPath) {
    console.log(`✅ Serving frontend from: ${staticPath}`);
    app.use(express.static(staticPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(staticPath, 'index.html'));
    });
  } else {
    console.error('❌ Frontend build not found. Checked:', staticCandidates);
    app.get('*', (req, res) => {
      res.status(503).send('Frontend build not found on server. Please deploy frontend build artifacts.');
    });
  }
}

// ── Error handler ──────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Database connection with retries (Railway Postgres may need wake time) ──
const connectDB = async (maxRetries = 10, baseDelay = 3000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await db.sequelize.authenticate();
      console.log('✅ Database connected successfully');
      await db.sequelize.sync({ alter: true });
      console.log('✅ Database tables synced');

      // Drop broken trigger that references snake_case "updated_at" instead of Sequelize's "updatedAt"
      try {
        const tables = await db.sequelize.getQueryInterface().showAllTables();
        for (const table of tables) {
          await db.sequelize.query(
            `DROP TRIGGER IF EXISTS set_updated_at ON "${table}";`
          ).catch(() => {});
        }
        // Also drop the function itself
        await db.sequelize.query(
          `DROP FUNCTION IF EXISTS trigger_set_updated_at() CASCADE;`
        ).catch(() => {});
        console.log('✅ Cleaned up legacy updated_at triggers');
      } catch (triggerErr) {
        console.error('⚠️ Trigger cleanup error (non-fatal):', triggerErr.message);
      }

      // Seed default admin user if none exists
      try {
        const bcrypt = require('bcryptjs');
        const userCount = await db.User.count();
        if (userCount === 0) {
          const hashedPassword = await bcrypt.hash('Admin123!', 12);
          await db.User.create({
            email: 'admin@tekosin.org',
            password: hashedPassword,
            firstName: 'Admin',
            lastName: 'TÊKOȘÎN',
            role: 'super_admin',
            isActive: true,
            gdprConsent: true,
            gdprConsentDate: new Date()
          });
          console.log('✅ Default admin user created (admin@tekosin.org / Admin123!)');
        }
      } catch (seedErr) {
        console.error('⚠️ Admin seed error (non-fatal):', seedErr.message);
      }

      dbReady = true;
      return;
    } catch (error) {
      const delay = Math.min(baseDelay * attempt, 30000);
      console.error(`⏳ DB attempt ${attempt}/${maxRetries}: ${error.message}`);
      if (attempt < maxRetries) {
        console.log(`   Retrying in ${delay / 1000}s...`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        console.error('❌ All DB connection attempts exhausted. App running without DB.');
      }
    }
  }
};

// ── Find available port (development only) ─────────────────────────────────
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

// ── Start ──────────────────────────────────────────────────────────────────
const startServer = async () => {
  const port = isProduction
    ? (parseInt(process.env.PORT) || 8080)
    : await findPort(parseInt(process.env.PORT) || 3001);
  const host = isProduction ? '0.0.0.0' : 'localhost';

  // Bind to port IMMEDIATELY — platform proxy needs this before health checks
  app.listen(port, host, () => {
    console.log(`🚀 TÊKOȘÎN Admin Backend running on ${host}:${port}`);
    console.log(`   Mode: ${isProduction ? 'production' : 'development'}`);
    console.log(`   API:  http://${host}:${port}/api`);
  });

  // Connect to DB in background (non-blocking so port stays open)
  connectDB().catch(err => {
    console.error('❌ DB background error:', err.message);
  });
};

startServer();

module.exports = app;
