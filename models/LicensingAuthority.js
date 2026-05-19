const mongoose = require('mongoose');

const licensingAuthoritySchema = new mongoose.Schema(
  {
    vaccineName: {
      type: String,
      required: [true, 'Vaccine name is required'],
      trim: true,
    },
    regulatory_authority_or_country: {
      type: String,
      required: [true, 'Regulatory authority or country is required'],
      default: 'N/A',
      trim: true,
    },
    type: {
      type: String,
      default: 'N/A',
      trim: true,
    },
    source: {
      type: String,
      required: [true, 'Source is required'],
      default: 'N/A',
      trim: true,
    },
    approvalDate: {
      type: String,
      required: [true, 'Approval date is required'],
      default: 'N/A',
      trim: true,
    },
    approval_route: {
      type: String,
      default: 'N/A',
      trim: true,
    },
    market_status: {
      type: String,
      default: 'N/A',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

licensingAuthoritySchema.index({ vaccineName: 1 });
licensingAuthoritySchema.index({ regulatory_authority_or_country: 1 });

module.exports = mongoose.model(
  'LicensingAuthority',
  licensingAuthoritySchema,
  'licensing_authorities'
);
