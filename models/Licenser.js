const mongoose = require('mongoose');

const licenserSchema = new mongoose.Schema(
  {
    acronym: {
      type: String,
      required: [true, 'Acronym is required'],
      trim: true,
    },
    region: {
      type: String,
      trim: true,
      default: '',
    },
    country: {
      type: String,
      trim: true,
      default: '',
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    parentOrganisation: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    approvalRoute: {
      type: String,
      trim: true,
      default: '',
    },
    vaccineRegulatoryRole: {
      type: String,
      trim: true,
      default: '',
    },
    regulatoryModel: {
      type: String,
      trim: true,
      default: '',
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
    regulatorySource: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

licenserSchema.index({ country: 1 });
licenserSchema.index({ acronym: 1 });

module.exports = mongoose.model('Licenser', licenserSchema);

