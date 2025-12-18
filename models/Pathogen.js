const mongoose = require('mongoose');

const pathogenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Pathogen name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    image: {
      type: String,
      trim: true,
      default: '',
    },
    bulletpoints: {
      type: String,
      trim: true,
      default: '',
    },
    link: {
      type: String,
      trim: true,
      default: '',
    },
    vaccineNames: {
      type: String,
      trim: true,
      default: '',
    },
    candidateVaccineNames: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Pathogen', pathogenSchema);

