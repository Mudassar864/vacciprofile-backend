const mongoose = require('mongoose');

const productProfileSchema = new mongoose.Schema(
  {
    vaccineName: {
      type: String,
      required: [true, 'Vaccine name is required'],
      trim: true,
    },
    type: {
      type: String,
      required: [true, 'Profile type is required'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Profile name is required'],
      trim: true,
    },
    composition: {
      type: String,
      default: '- not licensed yet -',
      trim: true,
    },
    strainCoverage: {
      type: String,
      default: '- not licensed yet -',
      trim: true,
    },
    indication: {
      type: String,
      default: '- not licensed yet -',
      trim: true,
    },
    contraindication: {
      type: String,
      default: '- not licensed yet -',
      trim: true,
    },
    dosing: {
      type: String,
      default: '- not licensed yet -',
      trim: true,
    },
    immunogenicity: {
      type: String,
      default: '- not licensed yet -',
      trim: true,
    },
    Efficacy: {
      type: String,
      default: '- not licensed yet -',
      trim: true,
    },
    durationOfProtection: {
      type: String,
      default: '- not licensed yet -',
      trim: true,
    },
    coAdministration: {
      type: String,
      default: '- not licensed yet -',
      trim: true,
    },
    reactogenicity: {
      type: String,
      default: '- not licensed yet -',
      trim: true,
    },
    safety: {
      type: String,
      default: '- not licensed yet -',
      trim: true,
    },
    vaccinationGoal: {
      type: String,
      default: '- not licensed yet -',
      trim: true,
    },
    others: {
      type: String,
      default: '- not licensed yet -',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
productProfileSchema.index({ vaccineName: 1, type: 1 });

module.exports = mongoose.model('ProductProfile', productProfileSchema);

