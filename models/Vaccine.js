const mongoose = require('mongoose');

const vaccineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Vaccine name is required'],
      trim: true,
      unique: true,
    },
    vaccineType: {
      type: String,
      enum: ['single', 'combination'],
      required: [true, 'Vaccine type is required'],
    },
    pathogenNames: {
      type: String,
      required: [true, 'Pathogen names are required'],
      trim: true,
    },
    manufacturerNames: {
      type: String,
      required: [true, 'Manufacturer names are required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Vaccine', vaccineSchema);

