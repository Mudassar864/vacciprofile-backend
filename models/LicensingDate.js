const mongoose = require('mongoose');

const licensingDateSchema = new mongoose.Schema(
  {
    vaccineName: {
      type: String,
      required: [true, 'Vaccine name is required'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Licensing authority name is required'],
      trim: true,
    },
    type: {
      type: String,
      default: 'N/A',
      trim: true,
    },
    approvalDate: {
      type: String,
      required: [true, 'Approval date is required'],
      trim: true,
    },
    source: {
      type: String,
      required: [true, 'Source URL is required'],
      trim: true,
    },
    lastUpdateOnVaccine: {
      type: String,
      default: 'N/A',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
licensingDateSchema.index({ vaccineName: 1 });

module.exports = mongoose.model('LicensingDate', licensingDateSchema);

