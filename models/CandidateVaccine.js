const mongoose = require('mongoose');

const candidateVaccineSchema = new mongoose.Schema({
  pathogenName: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  manufacturer: {
    type: String,
    trim: true
  },
  platform: {
    type: String
  },
  clinicalPhase: {
    type: String,
    enum: ['Preclinical', 'Phase I', 'Phase II', 'Phase III', 'Phase IV', 'No data']
  },
  companyUrl: {
    type: String
  },
  lastUpdated: {
    type: String
  },
  other: {
    type: String
  }
}, {
  timestamps: true
});

// Index for faster queries
candidateVaccineSchema.index({ pathogenName: 1 });
candidateVaccineSchema.index({ manufacturer: 1 });

module.exports = mongoose.model('CandidateVaccine', candidateVaccineSchema);