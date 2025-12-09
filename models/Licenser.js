const mongoose = require("mongoose");

const licenserSchema = new mongoose.Schema({
  licenserId: {
    type: Number,
    required: true,
    unique: true
  },
  acronym: {
    type: String,
    required: true,
    trim: true
  },
  region: {
    type: String,
    default: null
  },
  country: {
    type: String,
    default: null
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
  },
  website: {
    type: String,
    required: true,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model("Licenser", licenserSchema);