const mongoose = require('mongoose');

const manufacturerProductSchema = new mongoose.Schema(
  {
    manufacturerName: {
      type: String,
      required: [true, 'Manufacturer name is required'],
      trim: true,
    },
    productName: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    productDescription: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
manufacturerProductSchema.index({ manufacturerName: 1 });

module.exports = mongoose.model('ManufacturerProduct', manufacturerProductSchema);

