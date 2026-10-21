const Manufacturer = require('../models/Manufacturer');
const ManufacturerProduct = require('../models/ManufacturerProduct');
const ManufacturerSource = require('../models/ManufacturerSource');
const ManufacturerCandidate = require('../models/ManufacturerCandidate');
const Vaccine = require('../models/Vaccine');
const LicensingAuthority = require('../models/LicensingAuthority');
const mongoose = require('mongoose');
const { updateLastUpdate } = require('./lastUpdateController');
const { buildListOptions, paginateQuery } = require('../utils/pagination');
const { formatLicensingAuthorityDoc } = require('../utils/formatLicensingAuthorityResponse');
const { handleError } = require('../utils/httpErrors');

// @desc    Get all manufacturers (?search=&sort=&page=&limit=)
// @route   GET /api/manufacturers
// @access  Public
exports.getManufacturers = async (req, res) => {
  try {
    const { filter, sort, pagination } = buildListOptions(req.query, {
      searchFields: ['name', 'description', 'details_headquarters', 'details_ceo', 'licensedVaccineNames', 'candidateVaccineNames'],
      sortFields: ['name', 'details_headquarters', 'details_founded', 'lastUpdated', 'createdAt', 'updatedAt'],
      defaultSort: { name: 1 },
    });
    const { docs: manufacturers, total, pagination: paginationMeta } = await paginateQuery(
      Manufacturer,
      filter,
      sort,
      pagination
    );

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

    const payload = {
      success: true,
      count: pagination.enabled ? total : formatted.length,
      manufacturers: formatted,
    };
    if (paginationMeta) payload.pagination = paginationMeta;

    res.status(200).json(payload);
  } catch (error) {
    handleError(res, error);
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
    handleError(res, error);
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

    await updateLastUpdate('Manufacturer');

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
    handleError(res, error);
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

    const previousName = manufacturer.name;
    manufacturer = await Manufacturer.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    // Products, sources and candidates reference the manufacturer by name; keep them attached.
    if (updateData.name && updateData.name !== previousName) {
      await Promise.all([
        ManufacturerProduct.updateMany({ manufacturerName: previousName }, { $set: { manufacturerName: updateData.name } }),
        ManufacturerSource.updateMany({ manufacturerName: previousName }, { $set: { manufacturerName: updateData.name } }),
        ManufacturerCandidate.updateMany({ manufacturer: previousName }, { $set: { manufacturer: updateData.name } }),
      ]);
      await Promise.all([
        updateLastUpdate('ManufacturerProduct'),
        updateLastUpdate('ManufacturerSource'),
        updateLastUpdate('ManufacturerCandidate'),
      ]);
    }

    await updateLastUpdate('Manufacturer');

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
    handleError(res, error);
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
    await Promise.all([
      ManufacturerProduct.deleteMany({ manufacturerName: manufacturer.name }),
      ManufacturerSource.deleteMany({ manufacturerName: manufacturer.name }),
    ]);

    await Manufacturer.findByIdAndDelete(req.params.id);

    await updateLastUpdate('Manufacturer');

    res.status(200).json({
      success: true,
      message: 'Manufacturer and related data deleted successfully',
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Shape shared by /populated and /:id/populated (unchanged for the public site).
function formatManufacturerBase(m) {
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
  };
}

function groupBy(rows, keyOf) {
  const map = new Map();
  for (const row of rows) {
    const key = keyOf(row);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
}

function licensedNamesOf(m) {
  return m.licensedVaccineNames ? m.licensedVaccineNames.split(',').map((name) => name.trim()) : [];
}

/**
 * Populate products, sources, licensed vaccines (+ licensing rows) and candidates for a set
 * of manufacturers with a fixed number of queries. The previous version issued
 * 4 queries per manufacturer plus 1 per vaccine.
 */
async function populateManufacturers(manufacturers) {
  const names = manufacturers.map((m) => m.name);
  const vaccineNames = [...new Set(manufacturers.flatMap(licensedNamesOf))];

  const [products, sources, candidates, vaccines] = await Promise.all([
    ManufacturerProduct.find({ manufacturerName: { $in: names } }).sort({ productName: 1 }).lean(),
    ManufacturerSource.find({ manufacturerName: { $in: names } }).sort({ title: 1 }).lean(),
    ManufacturerCandidate.find({ manufacturer: { $in: names } }).sort({ pathogenName: 1, name: 1 }).lean(),
    vaccineNames.length
      ? Vaccine.find({ name: { $in: vaccineNames } }).sort({ name: 1 }).lean()
      : [],
  ]);

  const licensing = vaccines.length
    ? await LicensingAuthority.find({ vaccineName: { $in: vaccines.map((v) => v.name) } })
        .sort({ approvalDate: 1 })
        .lean()
    : [];

  const productsBy = groupBy(products, (p) => p.manufacturerName);
  const sourcesBy = groupBy(sources, (s) => s.manufacturerName);
  const candidatesBy = groupBy(candidates, (c) => c.manufacturer);
  const licensingBy = groupBy(licensing, (l) => l.vaccineName);

  const vaccinesFormatted = new Map(
    vaccines.map((v) => [
      v.name,
      {
        id: v._id.toString(),
        name: v.name,
        vaccineType: v.vaccineType,
        pathogenNames: v.pathogenNames,
        manufacturerNames: v.manufacturerNames,
        licensingAuthorities: (licensingBy.get(v.name) || []).map((ld) => formatLicensingAuthorityDoc(ld)),
        // productProfiles removed - fetch on demand via /api/product-profiles?vaccineName=...
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      },
    ])
  );

  return manufacturers.map((m) => {
    const wanted = new Set(licensedNamesOf(m));
    return {
      ...formatManufacturerBase(m),
      products: (productsBy.get(m.name) || []).map((p) => ({
        id: p._id.toString(),
        manufacturerName: p.manufacturerName,
        productName: p.productName,
        productDescription: p.productDescription,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })),
      sources: (sourcesBy.get(m.name) || []).map((s) => ({
        id: s._id.toString(),
        manufacturerName: s.manufacturerName,
        lastUpdated: s.lastUpdated,
        title: s.title,
        link: s.link,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      // Vaccines are already name-sorted, matching the old per-manufacturer query order.
      vaccines: vaccines.filter((v) => wanted.has(v.name)).map((v) => vaccinesFormatted.get(v.name)),
      candidates: (candidatesBy.get(m.name) || []).map((c) => ({
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
      })),
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    };
  });
}

// @desc    Get all manufacturers with populated products, sources, vaccines, and candidates (product profiles fetched on demand)
// @route   GET /api/manufacturers/populated
// @access  Public
exports.getManufacturersPopulated = async (req, res) => {
  try {
    const manufacturers = await Manufacturer.find().sort({ name: 1 }).lean();
    const formatted = await populateManufacturers(manufacturers);

    res.status(200).json({
      success: true,
      count: formatted.length,
      manufacturers: formatted,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Get single manufacturer with populated products, sources, vaccines, and candidates (product profiles fetched on demand)
// @route   GET /api/manufacturers/:id/populated
// @access  Public
exports.getManufacturerPopulated = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid manufacturer ID format',
      });
    }

    const manufacturer = await Manufacturer.findById(req.params.id).lean();

    if (!manufacturer) {
      return res.status(404).json({
        success: false,
        message: 'Manufacturer not found',
      });
    }

    const [formatted] = await populateManufacturers([manufacturer]);

    res.status(200).json({
      success: true,
      manufacturer: formatted,
    });
  } catch (error) {
    handleError(res, error);
  }
};
