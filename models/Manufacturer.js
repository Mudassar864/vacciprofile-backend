const mongoose = require('mongoose');

const manufacturerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Manufacturer name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    history: {
      type: String,
      trim: true,
      default: '',
    },
    lastUpdated: {
      type: String,
      trim: true,
      default: '',
    },
    details_website: {
      type: String,
      trim: true,
      default: '',
    },
    details_founded: {
      type: String,
      trim: true,
      default: '',
    },
    details_headquarters: {
      type: String,
      trim: true,
      default: '',
    },
    details_ceo: {
      type: String,
      trim: true,
      default: '',
    },
    details_revenue: {
      type: String,
      trim: true,
      default: '',
    },
    details_operatingIncome: {
      type: String,
      trim: true,
      default: '',
    },
    details_netIncome: {
      type: String,
      trim: true,
      default: '',
    },
    details_totalAssets: {
      type: String,
      trim: true,
      default: '',
    },
    details_totalEquity: {
      type: String,
      trim: true,
      default: '',
    },
    details_numberOfEmployees: {
      type: String,
      trim: true,
      default: '',
    },
    details_products: {
      type: String,
      trim: true,
      default: '',
    },
    licensedVaccineNames: {
      type: String,
      trim: true,
      default: '',
    },
    candidateVaccineNames: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Manufacturer', manufacturerSchema);

