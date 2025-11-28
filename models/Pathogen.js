const mongoose = require('mongoose');

const pathogenSchema = new mongoose.Schema({
  pathogenId: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  diseases: {
    type: String,
    trim: true
  },
  description: {
    type: String
  },
  image: {
    type: String
  },
  bulletpoints: {
    type: String
  },
  link: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual to get all vaccines for this pathogen
pathogenSchema.virtual('vaccines', {
  ref: 'Vaccine',
  localField: 'pathogenId',
  foreignField: 'pathogenId'
});

// Virtual to get all candidate vaccines for this pathogen
pathogenSchema.virtual('candidateVaccines', {
  ref: 'CandidateVaccine',
  localField: 'name',
  foreignField: 'pathogenName'
});

module.exports = mongoose.model('Pathogen', pathogenSchema);