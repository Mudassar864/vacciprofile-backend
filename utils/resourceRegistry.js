const Vaccine = require('../models/Vaccine');
const LicensingAuthority = require('../models/LicensingAuthority');
const ProductProfile = require('../models/ProductProfile');
const Manufacturer = require('../models/Manufacturer');
const ManufacturerProduct = require('../models/ManufacturerProduct');
const ManufacturerSource = require('../models/ManufacturerSource');
const ManufacturerCandidate = require('../models/ManufacturerCandidate');
const Pathogen = require('../models/Pathogen');
const NITAG = require('../models/NITAG');
const Licenser = require('../models/Licenser');
const User = require('../models/User');

/**
 * One place that knows every content type the CMS manages.
 * Adding a new resource here wires it into stats, global search, dropdown options,
 * and bulk delete without touching those features.
 *
 * - modelName:   LastUpdate key
 * - label:       field shown as the record title
 * - subtitle:    secondary field for search results
 * - searchFields: fields matched by the global search box
 * - onDelete:    cascade cleanup for removed documents (receives lean docs)
 */
const resources = {
  vaccines: {
    Model: Vaccine,
    modelName: 'Vaccine',
    title: 'Vaccines',
    label: 'name',
    subtitle: 'manufacturerNames',
    searchFields: ['name', 'pathogenNames', 'manufacturerNames'],
    async onDelete(docs) {
      const names = docs.map((d) => d.name).filter(Boolean);
      if (!names.length) return {};
      const [licensing, profiles] = await Promise.all([
        LicensingAuthority.deleteMany({ vaccineName: { $in: names } }),
        ProductProfile.deleteMany({ vaccineName: { $in: names } }),
      ]);
      return {
        licensingAuthorities: licensing.deletedCount,
        productProfiles: profiles.deletedCount,
      };
    },
  },
  'licensing-authorities': {
    Model: LicensingAuthority,
    modelName: 'LicensingAuthority',
    title: 'Licensing authorities',
    label: 'vaccineName',
    subtitle: 'vaccine_regulatory_authority',
    searchFields: ['vaccineName', 'vaccine_regulatory_authority', 'vaccine_country'],
  },
  'product-profiles': {
    Model: ProductProfile,
    modelName: 'ProductProfile',
    title: 'Product profiles',
    label: 'name',
    subtitle: 'vaccineName',
    searchFields: ['name', 'vaccineName', 'type'],
  },
  pathogens: {
    Model: Pathogen,
    modelName: 'Pathogen',
    title: 'Pathogens',
    label: 'name',
    subtitle: 'disease_name',
    searchFields: ['name', 'disease_name', 'category'],
  },
  'manufacturer-candidates': {
    Model: ManufacturerCandidate,
    modelName: 'ManufacturerCandidate',
    title: 'Vaccine candidates',
    label: 'name',
    subtitle: 'manufacturer',
    searchFields: ['name', 'pathogenName', 'manufacturer', 'platform'],
  },
  manufacturers: {
    Model: Manufacturer,
    modelName: 'Manufacturer',
    title: 'Manufacturers',
    label: 'name',
    subtitle: 'details_headquarters',
    searchFields: ['name', 'details_headquarters', 'details_ceo'],
    async onDelete(docs) {
      const names = docs.map((d) => d.name).filter(Boolean);
      if (!names.length) return {};
      const [products, sources] = await Promise.all([
        ManufacturerProduct.deleteMany({ manufacturerName: { $in: names } }),
        ManufacturerSource.deleteMany({ manufacturerName: { $in: names } }),
      ]);
      return {
        manufacturerProducts: products.deletedCount,
        manufacturerSources: sources.deletedCount,
      };
    },
  },
  'manufacturer-products': {
    Model: ManufacturerProduct,
    modelName: 'ManufacturerProduct',
    title: 'Manufacturer products',
    label: 'productName',
    subtitle: 'manufacturerName',
    searchFields: ['productName', 'manufacturerName'],
  },
  'manufacturer-sources': {
    Model: ManufacturerSource,
    modelName: 'ManufacturerSource',
    title: 'Manufacturer sources',
    label: 'title',
    subtitle: 'manufacturerName',
    searchFields: ['title', 'manufacturerName', 'link'],
  },
  nitags: {
    Model: NITAG,
    modelName: 'NITAG',
    title: 'NITAGs',
    label: 'country',
    subtitle: 'nationalNitagName',
    searchFields: ['country', 'nationalNitagName'],
  },
  licensers: {
    Model: Licenser,
    modelName: 'Licenser',
    title: 'Licensers',
    label: 'acronym',
    subtitle: 'fullName',
    searchFields: ['acronym', 'fullName', 'country', 'region'],
  },
};

/** Users are listed in stats/search but are never part of the public cache or bulk content delete. */
const userResource = {
  Model: User,
  title: 'Users',
  label: 'name',
  subtitle: 'email',
  searchFields: ['name', 'email'],
};

/** Fields that may be requested from /api/admin/options/:resource (names for dropdowns). */
const optionFields = {
  vaccines: ['name'],
  pathogens: ['name', 'category'],
  manufacturers: ['name'],
  licensers: ['acronym', 'country', 'fullName', 'region'],
  nitags: ['country'],
  'licensing-authorities': ['vaccine_regulatory_authority', 'vaccine_country', 'approval_route', 'market_status'],
  'product-profiles': ['type'],
  'manufacturer-candidates': ['clinicalPhase', 'platform'],
};

function getResource(key) {
  return Object.prototype.hasOwnProperty.call(resources, key) ? resources[key] : null;
}

module.exports = { resources, userResource, optionFields, getResource };
