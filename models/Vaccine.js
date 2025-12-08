const mongoose = require('mongoose');

const productProfileSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['EMA', 'FDA', 'WHO'],
    required: true
  },
  name: String,
  composition: String,
  strainCoverage: String,
  indication: String,
  contraindication: String,
  dosing: String,
  immunogenicity: String,
  Efficacy: String,
  durationOfProtection: String,
  coAdministration: String,
  reactogenicity: String,
  safety: String,
  vaccinationGoal: String,
  others: String
}, { _id: false });

const licensingDateSchema = new mongoose.Schema({
  name: String,
  type: String,
  approvalDate: String,
  source: String,
  lastUpdated: String
}, { _id: false });

const vaccineSchema = new mongoose.Schema({
  vaccineId: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  pathogenId: [{
    type: Number,
    ref: 'Pathogen'
  }],
  manufacturers: [{
    manufacturerId: {
      type: Number,
      ref: 'Manufacturer'
    }
  }],
  productProfiles: [productProfileSchema],
  vaccineType: {
    type: String,
    enum: ['single', 'combination'],
    default: 'single'
  },
  licensingDates: [licensingDateSchema]
}, {
  timestamps: true
});
vaccineSchema.virtual("manufacturerDetails", {
  ref: "Manufacturer",
  localField: "manufacturers.manufacturerId",
  foreignField: "manufacturerId"
});

vaccineSchema.set("toJSON", { virtuals: true });
vaccineSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model('Vaccine', vaccineSchema);