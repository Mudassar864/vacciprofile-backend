const Vaccine = require('../models/Vaccine');
const LicensingDate = require('../models/LicensingDate');
const ProductProfile = require('../models/ProductProfile');
const Manufacturer = require('../models/Manufacturer');
const ManufacturerProduct = require('../models/ManufacturerProduct');
const ManufacturerSource = require('../models/ManufacturerSource');
const Pathogen = require('../models/Pathogen');
const ManufacturerCandidate = require('../models/ManufacturerCandidate');
const NITAG = require('../models/NITAG');
const Licenser = require('../models/Licenser');
const { parse } = require('csv-parse');
const { stringify } = require('csv-stringify');

// @desc    Import vaccines from CSV
// @route   POST /api/csv/import/vaccines
// @access  Private/Admin
exports.importVaccines = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required',
      });
    }

    const csvData = req.file.buffer.toString('utf-8');
    const records = await new Promise((resolve, reject) => {
      parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    const results = {
      success: [],
      errors: [],
    };

    for (const record of records) {
      try {
        const vaccine = await Vaccine.create({
          name: record.name || record.vaccineName,
          vaccineType: record.vaccineType || 'single',
          pathogenNames: record.pathogenNames,
          manufacturerNames: record.manufacturerNames,
        });
        results.success.push(vaccine.name);
      } catch (error) {
        results.errors.push({
          name: record.name || record.vaccineName,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Imported ${results.success.length} vaccines successfully`,
      imported: results.success.length,
      errors: results.errors.length,
      details: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Export vaccines to CSV
// @route   GET /api/csv/export/vaccines
// @access  Private/Admin
exports.exportVaccines = async (req, res) => {
  try {
    const vaccines = await Vaccine.find().sort({ name: 1 });

    const csvData = await new Promise((resolve, reject) => {
      stringify(vaccines, {
        header: true,
        columns: ['name', 'vaccineType', 'pathogenNames', 'manufacturerNames'],
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=vaccines.csv');
    res.send(csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Import licensing dates from CSV
// @route   POST /api/csv/import/licensing-dates
// @access  Private/Admin
exports.importLicensingDates = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required',
      });
    }

    const csvData = req.file.buffer.toString('utf-8');
    const records = await new Promise((resolve, reject) => {
      parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    const results = {
      success: [],
      errors: [],
    };

    for (const record of records) {
      try {
        // Handle lastUpdateOnVaccine - preserve the value from CSV if it exists
        // Only default to 'N/A' if the field is truly missing or empty
        const lastUpdate = (record.lastUpdateOnVaccine !== undefined && record.lastUpdateOnVaccine !== null && String(record.lastUpdateOnVaccine).trim() !== '')
          ? String(record.lastUpdateOnVaccine).trim()
          : 'N/A';

        // Handle type field similarly
        const type = (record.type !== undefined && record.type !== null && String(record.type).trim() !== '')
          ? String(record.type).trim()
          : 'N/A';

        const licensingDate = await LicensingDate.create({
          vaccineName: record.vaccineName,
          name: record.name,
          type: type,
          approvalDate: record.approvalDate,
          source: record.source,
          lastUpdateOnVaccine: lastUpdate,
        });
        results.success.push(`${licensingDate.vaccineName} - ${licensingDate.name}`);
      } catch (error) {
        results.errors.push({
          vaccineName: record.vaccineName,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Imported ${results.success.length} licensing dates successfully`,
      imported: results.success.length,
      errors: results.errors.length,
      details: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Export licensing dates to CSV
// @route   GET /api/csv/export/licensing-dates
// @access  Private/Admin
exports.exportLicensingDates = async (req, res) => {
  try {
    const licensingDates = await LicensingDate.find().sort({ vaccineName: 1 });

    const csvData = await new Promise((resolve, reject) => {
      stringify(licensingDates, {
        header: true,
        columns: [
          'vaccineName',
          'name',
          'type',
          'approvalDate',
          'source',
          'lastUpdateOnVaccine',
        ],
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=licensing-dates.csv');
    res.send(csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Import product profiles from CSV
// @route   POST /api/csv/import/product-profiles
// @access  Private/Admin
exports.importProductProfiles = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required',
      });
    }

    const csvData = req.file.buffer.toString('utf-8');
    const records = await new Promise((resolve, reject) => {
      parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    const results = {
      success: [],
      errors: [],
    };

    for (const record of records) {
      try {
        // Helper function to handle default values - only use default if field is truly empty
        const getValue = (value, defaultValue) => {
          return (value !== undefined && value !== null && String(value).trim() !== '')
            ? String(value).trim()
            : defaultValue;
        };

        const productProfile = await ProductProfile.create({
          vaccineName: record.vaccineName,
          type: record.type,
          name: record.name,
          composition: getValue(record.composition, '- not licensed yet -'),
          strainCoverage: getValue(record.strainCoverage, '- not licensed yet -'),
          indication: getValue(record.indication, '- not licensed yet -'),
          contraindication: getValue(record.contraindication, '- not licensed yet -'),
          dosing: getValue(record.dosing, '- not licensed yet -'),
          immunogenicity: getValue(record.immunogenicity, '- not licensed yet -'),
          Efficacy: getValue(record.Efficacy, '- not licensed yet -'),
          durationOfProtection: getValue(record.durationOfProtection, '- not licensed yet -'),
          coAdministration: getValue(record.coAdministration, '- not licensed yet -'),
          reactogenicity: getValue(record.reactogenicity, '- not licensed yet -'),
          safety: getValue(record.safety, '- not licensed yet -'),
          vaccinationGoal: getValue(record.vaccinationGoal, '- not licensed yet -'),
          others: getValue(record.others, '- not licensed yet -'),
        });
        results.success.push(`${productProfile.vaccineName} - ${productProfile.type}`);
      } catch (error) {
        results.errors.push({
          vaccineName: record.vaccineName,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Imported ${results.success.length} product profiles successfully`,
      imported: results.success.length,
      errors: results.errors.length,
      details: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Export product profiles to CSV
// @route   GET /api/csv/export/product-profiles
// @access  Private/Admin
exports.exportProductProfiles = async (req, res) => {
  try {
    const productProfiles = await ProductProfile.find().sort({ vaccineName: 1, type: 1 });

    const csvData = await new Promise((resolve, reject) => {
      stringify(productProfiles, {
        header: true,
        columns: [
          'vaccineName',
          'type',
          'name',
          'composition',
          'strainCoverage',
          'indication',
          'contraindication',
          'dosing',
          'immunogenicity',
          'Efficacy',
          'durationOfProtection',
          'coAdministration',
          'reactogenicity',
          'safety',
          'vaccinationGoal',
          'others',
        ],
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=product-profiles.csv');
    res.send(csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Import manufacturers from CSV
// @route   POST /api/csv/import/manufacturers
// @access  Private/Admin
exports.importManufacturers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required',
      });
    }

    const csvData = req.file.buffer.toString('utf-8');
    const records = await new Promise((resolve, reject) => {
      parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    const results = {
      success: [],
      errors: [],
    };

    for (const record of records) {
      try {
        const manufacturer = await Manufacturer.create({
          name: record.name.trim(),
          description: record.description ? record.description.trim() : '',
          history: record.history ? record.history.trim() : '',
          lastUpdated: record.lastUpdated ? record.lastUpdated.trim() : '',
          details_website: record.details_website ? record.details_website.trim() : '',
          details_founded: record.details_founded ? String(record.details_founded).trim() : '',
          details_headquarters: record.details_headquarters ? record.details_headquarters.trim() : '',
          details_ceo: record.details_ceo ? record.details_ceo.trim() : '',
          details_revenue: record.details_revenue ? record.details_revenue.trim() : '',
          details_operatingIncome: record.details_operatingIncome ? record.details_operatingIncome.trim() : '',
          details_netIncome: record.details_netIncome ? record.details_netIncome.trim() : '',
          details_totalAssets: record.details_totalAssets ? record.details_totalAssets.trim() : '',
          details_totalEquity: record.details_totalEquity ? record.details_totalEquity.trim() : '',
          details_numberOfEmployees: record.details_numberOfEmployees ? String(record.details_numberOfEmployees).trim() : '',
          details_products: record.details_products ? record.details_products.trim() : '',
          licensedVaccineNames: record.licensedVaccineNames ? record.licensedVaccineNames.trim() : '',
          candidateVaccineNames: record.candidateVaccineNames ? record.candidateVaccineNames.trim() : '',
        });
        results.success.push(manufacturer.name);
      } catch (error) {
        results.errors.push({
          name: record.name || 'Unknown',
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Imported ${results.success.length} manufacturers successfully`,
      imported: results.success.length,
      errors: results.errors.length,
      details: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Export manufacturers to CSV
// @route   GET /api/csv/export/manufacturers
// @access  Private/Admin
exports.exportManufacturers = async (req, res) => {
  try {
    const manufacturers = await Manufacturer.find().sort({ name: 1 });

    const csvData = await new Promise((resolve, reject) => {
      stringify(manufacturers, {
        header: true,
        columns: [
          'name',
          'description',
          'history',
          'lastUpdated',
          'details_website',
          'details_founded',
          'details_headquarters',
          'details_ceo',
          'details_revenue',
          'details_operatingIncome',
          'details_netIncome',
          'details_totalAssets',
          'details_totalEquity',
          'details_numberOfEmployees',
          'details_products',
          'licensedVaccineNames',
          'candidateVaccineNames',
        ],
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=manufacturers.csv');
    res.send(csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Import manufacturer products from CSV
// @route   POST /api/csv/import/manufacturer-products
// @access  Private/Admin
exports.importManufacturerProducts = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required',
      });
    }

    const csvData = req.file.buffer.toString('utf-8');
    const records = await new Promise((resolve, reject) => {
      parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    const results = {
      success: [],
      errors: [],
    };

    for (const record of records) {
      try {
        const product = await ManufacturerProduct.create({
          manufacturerName: record.manufacturerName.trim(),
          productName: record.productName.trim(),
          productDescription: record.productDescription ? record.productDescription.trim() : '',
        });
        results.success.push(`${product.manufacturerName} - ${product.productName}`);
      } catch (error) {
        results.errors.push({
          manufacturerName: record.manufacturerName || 'Unknown',
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Imported ${results.success.length} manufacturer products successfully`,
      imported: results.success.length,
      errors: results.errors.length,
      details: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Export manufacturer products to CSV
// @route   GET /api/csv/export/manufacturer-products
// @access  Private/Admin
exports.exportManufacturerProducts = async (req, res) => {
  try {
    const products = await ManufacturerProduct.find().sort({ manufacturerName: 1, productName: 1 });

    const csvData = await new Promise((resolve, reject) => {
      stringify(products, {
        header: true,
        columns: ['manufacturerName', 'productName', 'productDescription'],
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=manufacturer-products.csv');
    res.send(csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Import manufacturer sources from CSV
// @route   POST /api/csv/import/manufacturer-sources
// @access  Private/Admin
exports.importManufacturerSources = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required',
      });
    }

    const csvData = req.file.buffer.toString('utf-8');
    const records = await new Promise((resolve, reject) => {
      parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    const results = {
      success: [],
      errors: [],
    };

    for (const record of records) {
      try {
        const source = await ManufacturerSource.create({
          manufacturerName: record.manufacturerName.trim(),
          lastUpdated: record.lastUpdated ? String(record.lastUpdated).trim() : '',
          title: record.title.trim(),
          link: record.link.trim(),
        });
        results.success.push(`${source.manufacturerName} - ${source.title}`);
      } catch (error) {
        results.errors.push({
          manufacturerName: record.manufacturerName || 'Unknown',
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Imported ${results.success.length} manufacturer sources successfully`,
      imported: results.success.length,
      errors: results.errors.length,
      details: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Export manufacturer sources to CSV
// @route   GET /api/csv/export/manufacturer-sources
// @access  Private/Admin
exports.exportManufacturerSources = async (req, res) => {
  try {
    const sources = await ManufacturerSource.find().sort({ manufacturerName: 1, title: 1 });

    const csvData = await new Promise((resolve, reject) => {
      stringify(sources, {
        header: true,
        columns: ['manufacturerName', 'lastUpdated', 'title', 'link'],
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=manufacturer-sources.csv');
    res.send(csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Import pathogens from CSV
// @route   POST /api/csv/import/pathogens
// @access  Private/Admin
exports.importPathogens = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required',
      });
    }

    const csvData = req.file.buffer.toString('utf-8');
    const records = await new Promise((resolve, reject) => {
      parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    const results = {
      success: [],
      errors: [],
    };

    for (const record of records) {
      try {
        const pathogen = await Pathogen.create({
          name: record.name.trim(),
          description: record.description ? record.description.trim() : '',
          image: record.image ? record.image.trim() : '',
          bulletpoints: record.bulletpoints ? record.bulletpoints.trim() : '',
          link: record.link ? record.link.trim() : '',
          vaccineNames: record.vaccineNames ? record.vaccineNames.trim() : '',
          candidateVaccineNames: record.candidateVaccineNames ? record.candidateVaccineNames.trim() : '',
        });
        results.success.push(pathogen.name);
      } catch (error) {
        results.errors.push({
          name: record.name || 'Unknown',
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Imported ${results.success.length} pathogens successfully`,
      imported: results.success.length,
      errors: results.errors.length,
      details: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Export pathogens to CSV
// @route   GET /api/csv/export/pathogens
// @access  Private/Admin
exports.exportPathogens = async (req, res) => {
  try {
    const pathogens = await Pathogen.find().sort({ name: 1 });

    const csvData = await new Promise((resolve, reject) => {
      stringify(pathogens, {
        header: true,
        columns: [
          'name',
          'description',
          'image',
          'bulletpoints',
          'link',
          'vaccineNames',
          'candidateVaccineNames',
        ],
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=pathogens.csv');
    res.send(csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Import manufacturer candidates from CSV
// @route   POST /api/csv/import/manufacturer-candidates
// @access  Private/Admin
exports.importManufacturerCandidates = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required',
      });
    }

    const csvData = req.file.buffer.toString('utf-8');
    const records = await new Promise((resolve, reject) => {
      parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    const results = {
      success: [],
      errors: [],
    };

    for (const record of records) {
      try {
        const candidate = await ManufacturerCandidate.create({
          pathogenName: record.pathogenName.trim(),
          name: record.name.trim(),
          manufacturer: record.manufacturer ? record.manufacturer.trim() : '',
          platform: record.platform ? record.platform.trim() : '',
          clinicalPhase: record.clinicalPhase ? record.clinicalPhase.trim() : '',
          companyUrl: record.companyUrl ? record.companyUrl.trim() : '',
          other: record.other ? record.other.trim() : '',
        });
        results.success.push(`${candidate.pathogenName} - ${candidate.name}`);
      } catch (error) {
        results.errors.push({
          pathogenName: record.pathogenName || 'Unknown',
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Imported ${results.success.length} manufacturer candidates successfully`,
      imported: results.success.length,
      errors: results.errors.length,
      details: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Export manufacturer candidates to CSV
// @route   GET /api/csv/export/manufacturer-candidates
// @access  Private/Admin
exports.exportManufacturerCandidates = async (req, res) => {
  try {
    const candidates = await ManufacturerCandidate.find().sort({ pathogenName: 1, name: 1 });

    const csvData = await new Promise((resolve, reject) => {
      stringify(candidates, {
        header: true,
        columns: ['pathogenName', 'name', 'manufacturer', 'platform', 'clinicalPhase', 'companyUrl', 'other'],
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=manufacturer-candidates.csv');
    res.send(csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Import NITAGs from CSV
// @route   POST /api/csv/import/nitags
// @access  Private/Admin
exports.importNITAGs = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required',
      });
    }

    const csvData = req.file.buffer.toString('utf-8');
    const records = await new Promise((resolve, reject) => {
      parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    const results = {
      success: [],
      errors: [],
    };

    for (const record of records) {
      try {
        const nitag = await NITAG.create({
          country: record.country.trim(),
          availableNitag: record.availableNitag ? record.availableNitag.trim() : '',
          availableWebsite: record.availableWebsite ? record.availableWebsite.trim() : '',
          websiteUrl: record.websiteUrl ? record.websiteUrl.trim() : '',
          nationalNitagName: record.nationalNitagName ? record.nationalNitagName.trim() : '',
          yearEstablished: record.yearEstablished ? String(record.yearEstablished).trim() : '',
        });
        results.success.push(nitag.country);
      } catch (error) {
        results.errors.push({
          country: record.country || 'Unknown',
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Imported ${results.success.length} NITAGs successfully`,
      imported: results.success.length,
      errors: results.errors.length,
      details: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Export NITAGs to CSV
// @route   GET /api/csv/export/nitags
// @access  Private/Admin
exports.exportNITAGs = async (req, res) => {
  try {
    const nitags = await NITAG.find().sort({ country: 1 });

    const csvData = await new Promise((resolve, reject) => {
      stringify(nitags, {
        header: true,
        columns: ['country', 'availableNitag', 'availableWebsite', 'websiteUrl', 'nationalNitagName', 'yearEstablished'],
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=nitags.csv');
    res.send(csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Import licensers from CSV
// @route   POST /api/csv/import/licensers
// @access  Private/Admin
exports.importLicensers = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is required',
      });
    }

    const csvData = req.file.buffer.toString('utf-8');
    const records = await new Promise((resolve, reject) => {
      parse(csvData, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    const results = {
      success: [],
      errors: [],
    };

    for (const record of records) {
      try {
        const licenser = await Licenser.create({
          acronym: record.acronym.trim(),
          region: record.region ? record.region.trim() : '',
          country: record.country ? record.country.trim() : '',
          fullName: record.fullName.trim(),
          description: record.description ? record.description.trim() : '',
          website: record.website ? record.website.trim() : '',
        });
        results.success.push(licenser.acronym);
      } catch (error) {
        results.errors.push({
          acronym: record.acronym || 'Unknown',
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Imported ${results.success.length} licensers successfully`,
      imported: results.success.length,
      errors: results.errors.length,
      details: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Export licensers to CSV
// @route   GET /api/csv/export/licensers
// @access  Private/Admin
exports.exportLicensers = async (req, res) => {
  try {
    const licensers = await Licenser.find().sort({ acronym: 1 });

    const csvData = await new Promise((resolve, reject) => {
      stringify(licensers, {
        header: true,
        columns: ['acronym', 'region', 'country', 'fullName', 'description', 'website'],
      }, (err, output) => {
        if (err) reject(err);
        else resolve(output);
      });
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=licensers.csv');
    res.send(csvData);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

