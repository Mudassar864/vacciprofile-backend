const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('../config/database');
const initializeAdmin = require('../utils/initializeAdmin');

// Load env vars
dotenv.config();

// Initialize Express app
const app = express();

// CORS configuration - allow multiple origins
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.PORTAL_URL,
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
].filter(Boolean);

// Add Vercel deployment URLs dynamically
if (process.env.VERCEL_URL) {
  allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
}
if (process.env.VERCEL_ENV === 'production' && process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

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
        // In production, be more permissive for Vercel preview deployments
        if (process.env.VERCEL_ENV && origin.includes('vercel.app')) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
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

// Database connection state
let dbConnected = false;
let dbConnecting = false;

// Middleware to ensure database connection
const ensureDBConnection = async (req, res, next) => {
  if (dbConnected) {
    return next();
  }

  if (dbConnecting) {
    // Wait for connection to complete
    let attempts = 0;
    while (dbConnecting && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
      if (dbConnected) {
        return next();
      }
    }
  }

  try {
    dbConnecting = true;
    await connectDB();
    dbConnected = true;
    dbConnecting = false;
    
    // Initialize admin user (only once)
    if (!global.adminInitialized) {
      try {
        await initializeAdmin();
        global.adminInitialized = true;
      } catch (error) {
        console.error('Error initializing admin:', error.message);
      }
    }
    
    next();
  } catch (error) {
    dbConnecting = false;
    console.error('Database connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
};

// Apply database connection middleware to all routes
app.use(ensureDBConnection);

// Routes - Vercel routes all requests to this function
app.use('/api/auth', require('../routes/authRoutes'));
app.use('/api/users', require('../routes/userRoutes'));
app.use('/api/vaccines', require('../routes/vaccineRoutes'));
app.use('/api/licensing-dates', require('../routes/licensingDateRoutes'));
app.use('/api/product-profiles', require('../routes/productProfileRoutes'));
app.use('/api/manufacturers', require('../routes/manufacturerRoutes'));
app.use('/api/manufacturer-products', require('../routes/manufacturerProductRoutes'));
app.use('/api/manufacturer-sources', require('../routes/manufacturerSourceRoutes'));
app.use('/api/pathogens', require('../routes/pathogenRoutes'));
app.use('/api/manufacturer-candidates', require('../routes/manufacturerCandidateRoutes'));
app.use('/api/nitags', require('../routes/nitagRoutes'));
app.use('/api/licensers', require('../routes/licenserRoutes'));
app.use('/api/csv', require('../routes/csvRoutes'));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    dbConnected: dbConnected,
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
  console.error('Error:', err);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Export for Vercel serverless
module.exports = app;

