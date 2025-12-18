const mongoose = require('mongoose');

const nitagSchema = new mongoose.Schema(
  {
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      unique: true,
    },
    availableNitag: {
      type: String,
      trim: true,
      default: '',
    },
    availableWebsite: {
      type: String,
      trim: true,
      default: '',
    },
    websiteUrl: {
      type: String,
      trim: true,
      default: '',
    },
    nationalNitagName: {
      type: String,
      trim: true,
      default: '',
    },
    yearEstablished: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('NITAG', nitagSchema);

