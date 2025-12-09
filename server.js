const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

const pathogenRoutes = require('./routes/pathogenRoutes');
const manufacturerRoutes = require('./routes/manufacturerRoutes');
const vaccineRoutes = require('./routes/vaccineRoutes');
const candidateVaccineRoutes = require('./routes/candidateVaccineRoutes');
const nitagRoutes = require('./routes/nitagRoutes');
const licenserRoutes = require('./routes/licenserRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Vaccine Database API is running' });
});

// Routes
app.use('/api/pathogens', pathogenRoutes);
app.use('/api/manufacturers', manufacturerRoutes);
app.use('/api/vaccines', vaccineRoutes);
app.use('/api/candidate-vaccines', candidateVaccineRoutes);
app.use('/api/nitags', nitagRoutes);
app.use("/api/licensers", licenserRoutes);

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: 'NotFound', message: 'Route not found' });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Connect to Database THEN start server to avoid buffered timeouts
const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB, server not started:', err);
    process.exit(1);
  });