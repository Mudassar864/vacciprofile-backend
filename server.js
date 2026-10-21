const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');

// Load env vars before anything reads process.env
dotenv.config();

const connectDB = require('./config/database');
const initializeAdmin = require('./utils/initializeAdmin');
const { sanitizeBody } = require('./middleware/validate');
const { apiLimiter } = require('./middleware/rateLimits');
const { publicCache } = require('./middleware/publicCache');
const { errorMiddleware } = require('./utils/httpErrors');

// Initialize Express app
const app = express();

app.disable('x-powered-by');
// Behind nginx / a load balancer: trust the first proxy so req.ip and rate limits use the client IP.
app.set('trust proxy', Number(process.env.TRUST_PROXY_HOPS ?? 1));
// "simple" parser: ?a[b]=c stays a plain string, so query values can never become Mongo operators.
app.set('query parser', 'simple');

// CORS — comma-separated origins in CORS_ORIGINS (scheme + host only)
function normalizeCorsOrigin(entry) {
  const trimmed = String(entry || '').trim();
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    return `${url.protocol}//${url.host}`;
  } catch {
    return trimmed.replace(/\/+$/, '');
  }
}

function parseCorsOrigins(raw) {
  return [...new Set(
    String(raw || '')
      .split(',')
      .map(normalizeCorsOrigin)
      .filter(Boolean)
  )];
}

const allowedOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);

if (!allowedOrigins.length) {
  console.warn('⚠️  CORS_ORIGINS is empty — browser clients will be blocked until it is set in .env');
}

app.use(
  helmet({
    // JSON API: the only HTML served is the temporary tree export, which uses inline styles.
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, origin);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    // Respond without CORS headers (browser blocks it) instead of turning this into a 500.
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Disposition', 'X-Cache'],
  maxAge: 600,
}));

// gzip JSON/CSV. Event streams (chat, CSV import progress) must not be buffered.
app.use(compression({
  filter(req, res) {
    const type = String(res.getHeader('Content-Type') || '');
    if (type.includes('text/event-stream')) return false;
    return compression.filter(req, res);
  },
}));

app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || '1mb' }));
app.use(express.urlencoded({ extended: false, limit: process.env.JSON_BODY_LIMIT || '1mb' }));
app.use(sanitizeBody);

// Request logging (never logs bodies — they contain passwords)
if (process.env.NODE_ENV === 'development' || process.env.LOG_REQUESTS === 'true') {
  app.use((req, res, next) => {
    const started = process.hrtime.bigint();
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - started) / 1e6;
      console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms.toFixed(1)}ms`);
    });
    next();
  });
}

// Health check route (also reports DB connectivity for load balancers)
app.get('/api/health', (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res.status(dbUp ? 200 : 503).json({
    success: dbUp,
    message: dbUp ? 'Server is running' : 'Database unavailable',
    db: dbUp ? 'connected' : 'disconnected',
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', apiLimiter);
// Anonymous reads (the public website) are cached in memory; writes invalidate the cache.
app.use('/api', publicCache);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/vaccines', require('./routes/vaccineRoutes'));
app.use('/api/licensing-authorities', require('./routes/licensingAuthorityRoutes'));
app.use('/api/product-profiles', require('./routes/productProfileRoutes'));
app.use('/api/manufacturers', require('./routes/manufacturerRoutes'));
app.use('/api/manufacturer-products', require('./routes/manufacturerProductRoutes'));
app.use('/api/manufacturer-sources', require('./routes/manufacturerSourceRoutes'));
app.use('/api/pathogens', require('./routes/pathogenRoutes'));
app.use('/api/manufacturer-candidates', require('./routes/manufacturerCandidateRoutes'));
app.use('/api/nitags', require('./routes/nitagRoutes'));
app.use('/api/licensers', require('./routes/licenserRoutes'));
app.use('/api/csv', require('./routes/csvRoutes'));
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/last-update', require('./routes/lastUpdateRoutes'));

// API Routes Documentation - Show all GET routes
app.get('/', (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;

  const routes = {
    vaccines: [
      '/api/vaccines',
      '/api/vaccines/populated',
      '/api/vaccines/:id',
      '/api/vaccines/:id/populated',
    ],
    pathogens: [
      '/api/pathogens',
      '/api/pathogens/populated',
      '/api/pathogens/temp-full-tree',
      '/api/pathogens/:id',
      '/api/pathogens/:id/populated',
    ],
    manufacturers: [
      '/api/manufacturers',
      '/api/manufacturers/populated',
      '/api/manufacturers/:id',
      '/api/manufacturers/:id/populated',
    ],
    licensingAuthorities: [
      '/api/licensing-authorities',
      '/api/licensing-authorities/stats/unique-licenser-names',
      '/api/licensing-authorities/vaccines-for-authority',
      '/api/licensing-authorities/:id',
    ],
    productProfiles: [
      '/api/product-profiles',
      '/api/product-profiles/:id',
    ],
    manufacturerProducts: [
      '/api/manufacturer-products',
      '/api/manufacturer-products/:id',
    ],
    manufacturerSources: [
      '/api/manufacturer-sources',
      '/api/manufacturer-sources/:id',
    ],
    manufacturerCandidates: [
      '/api/manufacturer-candidates',
      '/api/manufacturer-candidates/temp-full-tree',
      '/api/manufacturer-candidates/:id',
    ],
    nitags: [
      '/api/nitags',
      '/api/nitags/temp-full-tree',
      '/api/nitags/:id',
    ],
    licensers: [
      '/api/licensers',
      '/api/licensers/:id',
    ],
  };

  res.status(200).json({
    success: true,
    message: 'VacciProfile API - Available GET Routes',
    baseUrl,
    routes,
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});

// Error handler — maps validation/cast/duplicate errors to 4xx, hides internals in production
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();
  await initializeAdmin();

  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
  // Keep-alive longer than typical proxy idle timeouts to avoid 502s on reused sockets.
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  const shutdown = (signal) => {
    console.log(`${signal} received — closing server`);
    server.close(async () => {
      await mongoose.connection.close(false).catch(() => {});
      process.exit(0);
    });
    // Force-exit if connections do not drain in time.
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

// Not guarded by require.main: PM2's fork mode loads this file via require().
if (process.env.NO_LISTEN !== '1') {
  start();
}

module.exports = app;
