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

// Middleware
// CORS configuration - allow multiple origins
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3001',
  process.env.PORTAL_URL || 'http://localhost:3001',
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // In development, allow any localhost origin
      if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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
app.use('/api/licensing-dates', require('./routes/licensingDateRoutes'));
app.use('/api/product-profiles', require('./routes/productProfileRoutes'));
app.use('/api/manufacturers', require('./routes/manufacturerRoutes'));
app.use('/api/manufacturer-products', require('./routes/manufacturerProductRoutes'));
app.use('/api/manufacturer-sources', require('./routes/manufacturerSourceRoutes'));
app.use('/api/pathogens', require('./routes/pathogenRoutes'));
app.use('/api/manufacturer-candidates', require('./routes/manufacturerCandidateRoutes'));
app.use('/api/nitags', require('./routes/nitagRoutes'));
app.use('/api/licensers', require('./routes/licenserRoutes'));
app.use('/api/csv', require('./routes/csvRoutes'));

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
      '/api/pathogens/:id',
      '/api/pathogens/:id/populated',
    ],
    manufacturers: [
      '/api/manufacturers',
      '/api/manufacturers/populated',
      '/api/manufacturers/:id',
      '/api/manufacturers/:id/populated',
    ],
    licensingDates: [
      '/api/licensing-dates',
      '/api/licensing-dates/:id',
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
      '/api/manufacturer-candidates/:id',
    ],
    nitags: [
      '/api/nitags',
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

