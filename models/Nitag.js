const mongoose = require('mongoose');

const nitagSchema = new mongoose.Schema({
  country: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  availableNitag: {
    type: String,
    enum: ['Yes', 'No'],
    required: true
  },
  availableWebsite: {
    type: String,
    enum: ['Yes', 'No', ''],
    default: ''
  },
  websiteUrl: {
    type: String,
    trim: true
  },
  nationalNitagName: {
    type: String,
    trim: true
  },
  yearEstablished: {
    type: Number
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Nitag', nitagSchema);
