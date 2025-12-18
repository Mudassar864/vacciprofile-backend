const Manufacturer = require('../models/Manufacturer');
const ManufacturerProduct = require('../models/ManufacturerProduct');
const ManufacturerSource = require('../models/ManufacturerSource');
const ManufacturerCandidate = require('../models/ManufacturerCandidate');
const Vaccine = require('../models/Vaccine');
const LicensingDate = require('../models/LicensingDate');
const ProductProfile = require('../models/ProductProfile');
const mongoose = require('mongoose');

// @desc    Get all manufacturers
// @route   GET /api/manufacturers
// @access  Private/Admin
exports.getManufacturers = async (req, res) => {
  try {
    const manufacturers = await Manufacturer.find().sort({ name: 1 });

    const formatted = manufacturers.map((m) => ({
      id: m._id.toString(),
      name: m.name,
      description: m.description,
      history: m.history,
      lastUpdated: m.lastUpdated,
      details_website: m.details_website,
      details_founded: m.details_founded,
      details_headquarters: m.details_headquarters,
      details_ceo: m.details_ceo,
      details_revenue: m.details_revenue,
      details_operatingIncome: m.details_operatingIncome,
      details_netIncome: m.details_netIncome,
      details_totalAssets: m.details_totalAssets,
      details_totalEquity: m.details_totalEquity,
      details_numberOfEmployees: m.details_numberOfEmployees,
      details_products: m.details_products,
      licensedVaccineNames: m.licensedVaccineNames,
      candidateVaccineNames: m.candidateVaccineNames,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      manufacturers: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single manufacturer
// @route   GET /api/manufacturers/:id
// @access  Private/Admin
exports.getManufacturer = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid manufacturer ID format',
      });
    }

    const manufacturer = await Manufacturer.findById(req.params.id);

    if (!manufacturer) {
      return res.status(404).json({
        success: false,
        message: 'Manufacturer not found',
      });
    }

    res.status(200).json({
      success: true,
      manufacturer: {
        id: manufacturer._id.toString(),
        name: manufacturer.name,
        description: manufacturer.description,
        history: manufacturer.history,
        lastUpdated: manufacturer.lastUpdated,
        details_website: manufacturer.details_website,
        details_founded: manufacturer.details_founded,
        details_headquarters: manufacturer.details_headquarters,
        details_ceo: manufacturer.details_ceo,
        details_revenue: manufacturer.details_revenue,
        details_operatingIncome: manufacturer.details_operatingIncome,
        details_netIncome: manufacturer.details_netIncome,
        details_totalAssets: manufacturer.details_totalAssets,
        details_totalEquity: manufacturer.details_totalEquity,
        details_numberOfEmployees: manufacturer.details_numberOfEmployees,
        details_products: manufacturer.details_products,
        licensedVaccineNames: manufacturer.licensedVaccineNames,
        candidateVaccineNames: manufacturer.candidateVaccineNames,
        createdAt: manufacturer.createdAt,
        updatedAt: manufacturer.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Create manufacturer
// @route   POST /api/manufacturers
// @access  Private/Admin
exports.createManufacturer = async (req, res) => {
  try {
    const {
      name,
      description,
      history,
      lastUpdated,
      details_website,
      details_founded,
      details_headquarters,
      details_ceo,
      details_revenue,
      details_operatingIncome,
      details_netIncome,
      details_totalAssets,
      details_totalEquity,
      details_numberOfEmployees,
      details_products,
      licensedVaccineNames,
      candidateVaccineNames,
    } = req.body;

    // Check if manufacturer already exists
    const manufacturerExists = await Manufacturer.findOne({ name: name.trim() });

    if (manufacturerExists) {
      return res.status(400).json({
        success: false,
        message: 'Manufacturer with this name already exists',
      });
    }

    const manufacturer = await Manufacturer.create({
      name: name.trim(),
      description: description ? description.trim() : '',
      history: history ? history.trim() : '',
      lastUpdated: lastUpdated ? lastUpdated.trim() : '',
      details_website: details_website ? details_website.trim() : '',
      details_founded: details_founded ? String(details_founded).trim() : '',
      details_headquarters: details_headquarters ? details_headquarters.trim() : '',
      details_ceo: details_ceo ? details_ceo.trim() : '',
      details_revenue: details_revenue ? details_revenue.trim() : '',
      details_operatingIncome: details_operatingIncome ? details_operatingIncome.trim() : '',
      details_netIncome: details_netIncome ? details_netIncome.trim() : '',
      details_totalAssets: details_totalAssets ? details_totalAssets.trim() : '',
      details_totalEquity: details_totalEquity ? details_totalEquity.trim() : '',
      details_numberOfEmployees: details_numberOfEmployees ? String(details_numberOfEmployees).trim() : '',
      details_products: details_products ? details_products.trim() : '',
      licensedVaccineNames: licensedVaccineNames ? licensedVaccineNames.trim() : '',
      candidateVaccineNames: candidateVaccineNames ? candidateVaccineNames.trim() : '',
    });

    res.status(201).json({
      success: true,
      message: 'Manufacturer created successfully',
      manufacturer: {
        id: manufacturer._id.toString(),
        name: manufacturer.name,
        description: manufacturer.description,
        history: manufacturer.history,
        lastUpdated: manufacturer.lastUpdated,
        details_website: manufacturer.details_website,
        details_founded: manufacturer.details_founded,
        details_headquarters: manufacturer.details_headquarters,
        details_ceo: manufacturer.details_ceo,
        details_revenue: manufacturer.details_revenue,
        details_operatingIncome: manufacturer.details_operatingIncome,
        details_netIncome: manufacturer.details_netIncome,
        details_totalAssets: manufacturer.details_totalAssets,
        details_totalEquity: manufacturer.details_totalEquity,
        details_numberOfEmployees: manufacturer.details_numberOfEmployees,
        details_products: manufacturer.details_products,
        licensedVaccineNames: manufacturer.licensedVaccineNames,
        candidateVaccineNames: manufacturer.candidateVaccineNames,
        createdAt: manufacturer.createdAt,
        updatedAt: manufacturer.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update manufacturer
// @route   PUT /api/manufacturers/:id
// @access  Private/Admin
exports.updateManufacturer = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid manufacturer ID format',
      });
    }

    let manufacturer = await Manufacturer.findById(req.params.id);

    if (!manufacturer) {
      return res.status(404).json({
        success: false,
        message: 'Manufacturer not found',
      });
    }

    // Check if name is being changed and if it's already taken
    if (req.body.name && req.body.name.trim() !== manufacturer.name) {
      const nameExists = await Manufacturer.findOne({
        name: req.body.name.trim(),
        _id: { $ne: req.params.id },
      });
      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: 'Manufacturer name already in use',
        });
      }
    }

    // Prepare update object - only include fields that are provided
    const updateData = {};
    const fields = [
      'name', 'description', 'history', 'lastUpdated', 'details_website',
      'details_founded', 'details_headquarters', 'details_ceo', 'details_revenue',
      'details_operatingIncome', 'details_netIncome', 'details_totalAssets',
      'details_totalEquity', 'details_numberOfEmployees', 'details_products',
      'licensedVaccineNames', 'candidateVaccineNames'
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = typeof req.body[field] === 'string' 
          ? req.body[field].trim() 
          : String(req.body[field]).trim();
      }
    });

    manufacturer = await Manufacturer.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Manufacturer updated successfully',
      manufacturer: {
        id: manufacturer._id.toString(),
        name: manufacturer.name,
        description: manufacturer.description,
        history: manufacturer.history,
        lastUpdated: manufacturer.lastUpdated,
        details_website: manufacturer.details_website,
        details_founded: manufacturer.details_founded,
        details_headquarters: manufacturer.details_headquarters,
        details_ceo: manufacturer.details_ceo,
        details_revenue: manufacturer.details_revenue,
        details_operatingIncome: manufacturer.details_operatingIncome,
        details_netIncome: manufacturer.details_netIncome,
        details_totalAssets: manufacturer.details_totalAssets,
        details_totalEquity: manufacturer.details_totalEquity,
        details_numberOfEmployees: manufacturer.details_numberOfEmployees,
        details_products: manufacturer.details_products,
        licensedVaccineNames: manufacturer.licensedVaccineNames,
        candidateVaccineNames: manufacturer.candidateVaccineNames,
        createdAt: manufacturer.createdAt,
        updatedAt: manufacturer.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete manufacturer
// @route   DELETE /api/manufacturers/:id
// @access  Private/Admin
exports.deleteManufacturer = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid manufacturer ID format',
      });
    }

    const manufacturer = await Manufacturer.findById(req.params.id);

    if (!manufacturer) {
      return res.status(404).json({
        success: false,
        message: 'Manufacturer not found',
      });
    }

    // Delete related products and sources
    await ManufacturerProduct.deleteMany({ manufacturerName: manufacturer.name });
    await ManufacturerSource.deleteMany({ manufacturerName: manufacturer.name });

    await Manufacturer.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Manufacturer and related data deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get all manufacturers with populated products, sources, vaccines, and candidates
// @route   GET /api/manufacturers/populated
// @access  Private/Admin
exports.getManufacturersPopulated = async (req, res) => {
  try {
    const manufacturers = await Manufacturer.find().sort({ name: 1 });

    const formatted = await Promise.all(
      manufacturers.map(async (m) => {
        // Find manufacturer products
        const products = await ManufacturerProduct.find({
          manufacturerName: m.name,
        }).sort({ productName: 1 });

        // Find manufacturer sources
        const sources = await ManufacturerSource.find({
          manufacturerName: m.name,
        }).sort({ title: 1 });

        // Find vaccines where this manufacturer appears in licensedVaccineNames
        // Split the licensedVaccineNames string and search for each vaccine name
        const licensedVaccineNamesList = m.licensedVaccineNames
          ? m.licensedVaccineNames.split(',').map((name) => name.trim())
          : [];

        const vaccines = await Vaccine.find({
          name: { $in: licensedVaccineNamesList },
        }).sort({ name: 1 });

        // Find manufacturer candidates
        const candidates = await ManufacturerCandidate.find({
          manufacturer: m.name,
        }).sort({ pathogenName: 1, name: 1 });

        const productsFormatted = products.map((p) => ({
          id: p._id.toString(),
          manufacturerName: p.manufacturerName,
          productName: p.productName,
          productDescription: p.productDescription,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
        }));

        const sourcesFormatted = sources.map((s) => ({
          id: s._id.toString(),
          manufacturerName: s.manufacturerName,
          lastUpdated: s.lastUpdated,
          title: s.title,
          link: s.link,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }));

        // For each vaccine, get licensing dates and product profiles
        const vaccinesFormatted = await Promise.all(
          vaccines.map(async (v) => {
            // Find licensing dates for this vaccine
            const licensingDates = await LicensingDate.find({
              vaccineName: v.name,
            }).sort({ approvalDate: 1 });

            // Find product profiles for this vaccine
            const productProfiles = await ProductProfile.find({
              vaccineName: v.name,
            }).sort({ type: 1, name: 1 });

            const licensingDatesFormatted = licensingDates.map((ld) => ({
              id: ld._id.toString(),
              vaccineName: ld.vaccineName,
              name: ld.name,
              type: ld.type,
              approvalDate: ld.approvalDate,
              source: ld.source,
              lastUpdateOnVaccine: ld.lastUpdateOnVaccine,
              createdAt: ld.createdAt,
              updatedAt: ld.updatedAt,
            }));

            const productProfilesFormatted = productProfiles.map((pp) => ({
              id: pp._id.toString(),
              vaccineName: pp.vaccineName,
              type: pp.type,
              name: pp.name,
              composition: pp.composition,
              strainCoverage: pp.strainCoverage,
              indication: pp.indication,
              contraindication: pp.contraindication,
              dosing: pp.dosing,
              immunogenicity: pp.immunogenicity,
              Efficacy: pp.Efficacy,
              durationOfProtection: pp.durationOfProtection,
              coAdministration: pp.coAdministration,
              reactogenicity: pp.reactogenicity,
              safety: pp.safety,
              vaccinationGoal: pp.vaccinationGoal,
              others: pp.others,
              createdAt: pp.createdAt,
              updatedAt: pp.updatedAt,
            }));

            return {
              id: v._id.toString(),
              name: v.name,
              vaccineType: v.vaccineType,
              pathogenNames: v.pathogenNames,
              manufacturerNames: v.manufacturerNames,
              licensingDates: licensingDatesFormatted,
              productProfiles: productProfilesFormatted,
              createdAt: v.createdAt,
              updatedAt: v.updatedAt,
            };
          })
        );

        const candidatesFormatted = candidates.map((c) => ({
          id: c._id.toString(),
          pathogenName: c.pathogenName,
          name: c.name,
          manufacturer: c.manufacturer,
          platform: c.platform,
          clinicalPhase: c.clinicalPhase,
          companyUrl: c.companyUrl,
          other: c.other,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));

        return {
          id: m._id.toString(),
          name: m.name,
          description: m.description,
          history: m.history,
          lastUpdated: m.lastUpdated,
          details_website: m.details_website,
          details_founded: m.details_founded,
          details_headquarters: m.details_headquarters,
          details_ceo: m.details_ceo,
          details_revenue: m.details_revenue,
          details_operatingIncome: m.details_operatingIncome,
          details_netIncome: m.details_netIncome,
          details_totalAssets: m.details_totalAssets,
          details_totalEquity: m.details_totalEquity,
          details_numberOfEmployees: m.details_numberOfEmployees,
          details_products: m.details_products,
          licensedVaccineNames: m.licensedVaccineNames,
          candidateVaccineNames: m.candidateVaccineNames,
          products: productsFormatted,
          sources: sourcesFormatted,
          vaccines: vaccinesFormatted,
          candidates: candidatesFormatted,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: formatted.length,
      manufacturers: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single manufacturer with populated products, sources, vaccines, and candidates
// @route   GET /api/manufacturers/:id/populated
// @access  Private/Admin
exports.getManufacturerPopulated = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid manufacturer ID format',
      });
    }

    const manufacturer = await Manufacturer.findById(req.params.id);

    if (!manufacturer) {
      return res.status(404).json({
        success: false,
        message: 'Manufacturer not found',
      });
    }

    // Find manufacturer products
    const products = await ManufacturerProduct.find({
      manufacturerName: manufacturer.name,
    }).sort({ productName: 1 });

    // Find manufacturer sources
    const sources = await ManufacturerSource.find({
      manufacturerName: manufacturer.name,
    }).sort({ title: 1 });

    // Find vaccines where this manufacturer appears in licensedVaccineNames
    const licensedVaccineNamesList = manufacturer.licensedVaccineNames
      ? manufacturer.licensedVaccineNames.split(',').map((name) => name.trim())
      : [];

    const vaccines = await Vaccine.find({
      name: { $in: licensedVaccineNamesList },
    }).sort({ name: 1 });

    // Find manufacturer candidates
    const candidates = await ManufacturerCandidate.find({
      manufacturer: manufacturer.name,
    }).sort({ pathogenName: 1, name: 1 });

    const productsFormatted = products.map((p) => ({
      id: p._id.toString(),
      manufacturerName: p.manufacturerName,
      productName: p.productName,
      productDescription: p.productDescription,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    const sourcesFormatted = sources.map((s) => ({
      id: s._id.toString(),
      manufacturerName: s.manufacturerName,
      lastUpdated: s.lastUpdated,
      title: s.title,
      link: s.link,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    // For each vaccine, get licensing dates and product profiles
    const vaccinesFormatted = await Promise.all(
      vaccines.map(async (v) => {
        // Find licensing dates for this vaccine
        const licensingDates = await LicensingDate.find({
          vaccineName: v.name,
        }).sort({ approvalDate: 1 });

        // Find product profiles for this vaccine
        const productProfiles = await ProductProfile.find({
          vaccineName: v.name,
        }).sort({ type: 1, name: 1 });

        const licensingDatesFormatted = licensingDates.map((ld) => ({
          id: ld._id.toString(),
          vaccineName: ld.vaccineName,
          name: ld.name,
          type: ld.type,
          approvalDate: ld.approvalDate,
          source: ld.source,
          lastUpdateOnVaccine: ld.lastUpdateOnVaccine,
          createdAt: ld.createdAt,
          updatedAt: ld.updatedAt,
        }));

        const productProfilesFormatted = productProfiles.map((pp) => ({
          id: pp._id.toString(),
          vaccineName: pp.vaccineName,
          type: pp.type,
          name: pp.name,
          composition: pp.composition,
          strainCoverage: pp.strainCoverage,
          indication: pp.indication,
          contraindication: pp.contraindication,
          dosing: pp.dosing,
          immunogenicity: pp.immunogenicity,
          Efficacy: pp.Efficacy,
          durationOfProtection: pp.durationOfProtection,
          coAdministration: pp.coAdministration,
          reactogenicity: pp.reactogenicity,
          safety: pp.safety,
          vaccinationGoal: pp.vaccinationGoal,
          others: pp.others,
          createdAt: pp.createdAt,
          updatedAt: pp.updatedAt,
        }));

        return {
          id: v._id.toString(),
          name: v.name,
          vaccineType: v.vaccineType,
          pathogenNames: v.pathogenNames,
          manufacturerNames: v.manufacturerNames,
          licensingDates: licensingDatesFormatted,
          productProfiles: productProfilesFormatted,
          createdAt: v.createdAt,
          updatedAt: v.updatedAt,
        };
      })
    );

    const candidatesFormatted = candidates.map((c) => ({
      id: c._id.toString(),
      pathogenName: c.pathogenName,
      name: c.name,
      manufacturer: c.manufacturer,
      platform: c.platform,
      clinicalPhase: c.clinicalPhase,
      companyUrl: c.companyUrl,
      other: c.other,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    res.status(200).json({
      success: true,
      manufacturer: {
        id: manufacturer._id.toString(),
        name: manufacturer.name,
        description: manufacturer.description,
        history: manufacturer.history,
        lastUpdated: manufacturer.lastUpdated,
        details_website: manufacturer.details_website,
        details_founded: manufacturer.details_founded,
        details_headquarters: manufacturer.details_headquarters,
        details_ceo: manufacturer.details_ceo,
        details_revenue: manufacturer.details_revenue,
        details_operatingIncome: manufacturer.details_operatingIncome,
        details_netIncome: manufacturer.details_netIncome,
        details_totalAssets: manufacturer.details_totalAssets,
        details_totalEquity: manufacturer.details_totalEquity,
        details_numberOfEmployees: manufacturer.details_numberOfEmployees,
        details_products: manufacturer.details_products,
        licensedVaccineNames: manufacturer.licensedVaccineNames,
        candidateVaccineNames: manufacturer.candidateVaccineNames,
        products: productsFormatted,
        sources: sourcesFormatted,
        vaccines: vaccinesFormatted,
        candidates: candidatesFormatted,
        createdAt: manufacturer.createdAt,
        updatedAt: manufacturer.updatedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

