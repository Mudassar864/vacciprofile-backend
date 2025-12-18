const mongoose = require('mongoose');

const manufacturerCandidateSchema = new mongoose.Schema(
  {
    pathogenName: {
      type: String,
      required: [true, 'Pathogen name is required'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Candidate name is required'],
      trim: true,
    },
    manufacturer: {
      type: String,
      trim: true,
      default: '',
    },
    platform: {
      type: String,
      trim: true,
      default: '',
    },
    clinicalPhase: {
      type: String,
      trim: true,
      default: '',
    },
    companyUrl: {
      type: String,
      trim: true,
      default: '',
    },
    other: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
manufacturerCandidateSchema.index({ pathogenName: 1 });
manufacturerCandidateSchema.index({ manufacturer: 1 });

module.exports = mongoose.model('ManufacturerCandidate', manufacturerCandidateSchema);

