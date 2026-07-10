const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');
const initializeAdmin = require('./utils/initializeAdmin');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

// Initialize Express app
const app = express();

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

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, origin);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (for debugging)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.body);
    next();
  });
}

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
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

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

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

// Error handler
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
  });
});

const PORT = process.env.PORT || 5000;

// Initialize admin user on server start
initializeAdmin().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});

module.exports = app;

