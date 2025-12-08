const mongoose = require('mongoose');

const manufacturerSchema = new mongoose.Schema({
  manufacturerId: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String
  },
  history: {
    type: String
  },
  details: {
    website: String,
    founded: String,
    headquarters: String,
    ceo: String,
    revenue: String,
    operatingIncome: String,
    netIncome: String,
    totalAssets: String,
    totalEquity: String,
    numberOfEmployees: String,
    products: String,
    sources: [{
      lastUpdated: String,
      title: String,
      link: String
    }]
  },
  vaccines: [{
    name: String,
    description: String
  }],
  products: [{
    name: String,
    description: String
  }],
  lastUpdated: {
    type: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

manufacturerSchema.virtual('licensedVaccines', {
  ref: 'Vaccine',
  localField: 'manufacturerId',
  foreignField: 'manufacturers.manufacturerId'
});

manufacturerSchema.virtual('candidateVaccines', {
  ref: 'CandidateVaccine',
  localField: 'name',
  foreignField: 'manufacturer'
});

module.exports = mongoose.model('Manufacturer', manufacturerSchema);