const mongoose = require('mongoose');

const manufacturerSourceSchema = new mongoose.Schema(
  {
    manufacturerName: {
      type: String,
      required: [true, 'Manufacturer name is required'],
      trim: true,
    },
    lastUpdated: {
      type: String,
      trim: true,
      default: '',
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    link: {
      type: String,
      required: [true, 'Link is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
manufacturerSourceSchema.index({ manufacturerName: 1 });

module.exports = mongoose.model('ManufacturerSource', manufacturerSourceSchema);

