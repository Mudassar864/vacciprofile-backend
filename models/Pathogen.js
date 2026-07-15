const mongoose = require('mongoose');

const pathogenSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Pathogen name is required'],
      trim: true,
      unique: true,
    },
    image: { type: String, trim: true, default: '' },
    link: { type: String, trim: true, default: '' },
    category: { type: String, trim: true, default: '' },
    scientific_feature_tags: { type: String, trim: true, default: '' },
    characteristic_tags: { type: String, trim: true, default: '' },
    clinical_public_health_tags: { type: String, trim: true, default: '' },
    disease_name: { type: String, trim: true, default: '' },
    pathogen_type: { type: String, trim: true, default: '' },
    transmission_type: { type: String, trim: true, default: '' },
    who_priority_level: { type: String, trim: true, default: '' },
    vaccine_available: { type: String, trim: true, default: '' },
    first_identified_year: { type: String, trim: true, default: '' },
    definition: { type: String, trim: true, default: '' },
    transmission: { type: String, trim: true, default: '' },
    symptoms: { type: String, trim: true, default: '' },
    prevention: { type: String, trim: true, default: '' },
    key_facts: { type: String, trim: true, default: '' },
    video_title: { type: String, trim: true, default: '' },
    video_url: { type: String, trim: true, default: '' },
    thumbnail_url: { type: String, trim: true, default: '' },
    /** Admin: comma-separated licensed vaccine names linked to this pathogen */
    vaccine_names: { type: String, trim: true, default: '' },
    /** Admin: comma-separated candidate vaccine names */
    candidate_vaccine_names: { type: String, trim: true, default: '' },
  },
  {
    timestamps: true,
    strict: false,
  }
);

module.exports = mongoose.model('Pathogen', pathogenSchema);
