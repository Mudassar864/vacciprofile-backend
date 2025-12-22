const mongoose = require('mongoose');

const lastUpdateSchema = new mongoose.Schema(
  {
    modelName: {
      type: String,
      required: true,
      unique: true,
      enum: [
        'Vaccine',
        'Pathogen',
        'Manufacturer',
        'LicensingDate',
        'ProductProfile',
        'ManufacturerProduct',
        'ManufacturerSource',
        'ManufacturerCandidate',
        'NITAG',
        'Licenser',
      ],
    },
    lastUpdatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
lastUpdateSchema.index({ lastUpdatedAt: -1 });

module.exports = mongoose.model('LastUpdate', lastUpdateSchema);

