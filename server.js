const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vaccine_db')
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB Connection Error:', err));

// Models (required for any shared use, but routes handle their own)
require('./models/Pathogen');
require('./models/Manufacturer');
require('./models/Vaccine');
require('./models/CandidateVaccine');
require('./models/Nitag');

// ===== ROUTES =====

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Vaccine Database API is running' });
});

// Mount route modules
app.use('/api/pathogens', require('./routes/pathogens'));
app.use('/api/manufacturers', require('./routes/manufacturers'));
app.use('/api/vaccines', require('./routes/vaccines'));
app.use('/api/candidate-vaccines', require('./routes/candidateVaccines'));
app.use('/api/nitags', require('./routes/nitags'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});