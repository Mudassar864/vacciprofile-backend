const mongoose = require('mongoose');

const licenserSchema = new mongoose.Schema(
  {
    acronym: {
      type: String,
      required: [true, 'Acronym is required'],
      trim: true,
      unique: true,
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
    description: {
      type: String,
      trim: true,
      default: '',
    },
    website: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Licenser', licenserSchema);

