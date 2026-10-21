const Vaccine = require('../models/Vaccine');
const LicensingAuthority = require('../models/LicensingAuthority');
const ProductProfile = require('../models/ProductProfile');
const mongoose = require('mongoose');
const { updateLastUpdate } = require('./lastUpdateController');
const { buildListOptions, paginateQuery } = require('../utils/pagination');
const { formatLicensingAuthorityDoc } = require('../utils/formatLicensingAuthorityResponse');
const { parseDelimitedList } = require('../utils/parseDelimitedList');
const { normalizeVaccineType } = require('../utils/normalizeVaccineType');
const { handleError } = require('../utils/httpErrors');

const VACCINE_SEARCH_FIELDS = ['name', 'pathogenNames', 'manufacturerNames', 'vaccineType'];
const VACCINE_SORT_FIELDS = ['name', 'vaccineType', 'pathogenNames', 'manufacturerNames', 'createdAt', 'updatedAt'];

// @desc    Get all vaccines (?search=&vaccineType=&sort=&page=&limit=)
// @route   GET /api/vaccines
// @access  Public
exports.getVaccines = async (req, res) => {
  try {
    const filter = {};
    if (req.query.vaccineType) filter.vaccineType = String(req.query.vaccineType);
    const { filter: query, sort, pagination } = buildListOptions(req.query, {
      searchFields: VACCINE_SEARCH_FIELDS,
      sortFields: VACCINE_SORT_FIELDS,
      defaultSort: { name: 1 },
      filter,
    });
    const { docs: vaccines, total, pagination: paginationMeta } = await paginateQuery(
      Vaccine,
      query,
      sort,
      pagination
    );

    const formattedVaccines = vaccines.map((vaccine) => ({
      id: vaccine._id.toString(),
      name: vaccine.name,
      vaccineType: vaccine.vaccineType,
      pathogenNames: vaccine.pathogenNames,
      manufacturerNames: vaccine.manufacturerNames,
      createdAt: vaccine.createdAt,
      updatedAt: vaccine.updatedAt,
    }));

    const payload = {
      success: true,
      count: pagination.enabled ? total : formattedVaccines.length,
      vaccines: formattedVaccines,
    };
    if (paginationMeta) payload.pagination = paginationMeta;

    res.status(200).json(payload);
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Get single vaccine
// @route   GET /api/vaccines/:id
// @access  Private/Admin
exports.getVaccine = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vaccine ID format',
      });
    }

    const vaccine = await Vaccine.findById(req.params.id);

    if (!vaccine) {
      return res.status(404).json({
        success: false,
        message: 'Vaccine not found',
      });
    }

    res.status(200).json({
      success: true,
      vaccine: {
        id: vaccine._id.toString(),
        name: vaccine.name,
        vaccineType: vaccine.vaccineType,
        pathogenNames: vaccine.pathogenNames,
        manufacturerNames: vaccine.manufacturerNames,
        createdAt: vaccine.createdAt,
        updatedAt: vaccine.updatedAt,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Helper function to merge comma-separated strings without duplicates
const mergeStringArrays = (existingStr, newStr) => {
  if (!existingStr || !existingStr.trim()) return newStr.trim();
  if (!newStr || !newStr.trim()) return existingStr.trim();

  const existing = parseDelimitedList(existingStr);
  const newItems = parseDelimitedList(newStr);

  const merged = [...new Set([...existing, ...newItems])];
  return merged.join(', ');
};

// @desc    Create vaccine
// @route   POST /api/vaccines
// @access  Private/Admin
exports.createVaccine = async (req, res) => {
  try {
    const { name, vaccineType, pathogenNames, manufacturerNames } = req.body;

    // Check if vaccine already exists
    const vaccineExists = await Vaccine.findOne({ name: name.trim() });

    if (vaccineExists) {
      // Vaccine exists - merge manufacturerNames, pathogenNames, and update vaccineType if they don't match
      let updatedManufacturerNames = vaccineExists.manufacturerNames;
      let updatedPathogenNames = vaccineExists.pathogenNames;
      let updatedVaccineType = vaccineExists.vaccineType;
      let wasUpdated = false;

      // Check and update vaccineType if provided and different
      if (vaccineType && String(vaccineType).trim()) {
        const normalizedType = normalizeVaccineType(vaccineType);
        if (normalizedType && normalizedType !== vaccineExists.vaccineType) {
          updatedVaccineType = normalizedType;
          wasUpdated = true;
        }
      }

      if (manufacturerNames && manufacturerNames.trim()) {
        const existingManufacturers = parseDelimitedList(vaccineExists.manufacturerNames).map((s) =>
          s.toLowerCase()
        );
        const newManufacturers = parseDelimitedList(manufacturerNames.trim());
        
        // Check if any new manufacturer doesn't exist
        const hasNewManufacturer = newManufacturers.some(m => 
          !existingManufacturers.includes(m.trim().toLowerCase())
        );

        if (hasNewManufacturer) {
          updatedManufacturerNames = mergeStringArrays(vaccineExists.manufacturerNames, manufacturerNames);
          wasUpdated = true;
        }
      }

      if (pathogenNames && pathogenNames.trim()) {
        const existingPathogens = parseDelimitedList(vaccineExists.pathogenNames).map((s) =>
          s.toLowerCase()
        );
        const newPathogens = parseDelimitedList(pathogenNames.trim());
        
        // Check if any new pathogen doesn't exist
        const hasNewPathogen = newPathogens.some(p => 
          !existingPathogens.includes(p.trim().toLowerCase())
        );

        if (hasNewPathogen) {
          updatedPathogenNames = mergeStringArrays(vaccineExists.pathogenNames, pathogenNames);
          wasUpdated = true;
        }
      }

      // Update vaccine if there were changes
      if (wasUpdated) {
        vaccineExists.manufacturerNames = updatedManufacturerNames;
        vaccineExists.pathogenNames = updatedPathogenNames;
        vaccineExists.vaccineType = updatedVaccineType;
        await vaccineExists.save();
        await updateLastUpdate('Vaccine');
      }

      return res.status(200).json({
        success: true,
        message: wasUpdated 
          ? 'Vaccine updated with new manufacturer/pathogen names' 
          : 'Vaccine already exists with matching information',
        vaccine: {
          id: vaccineExists._id.toString(),
          name: vaccineExists.name,
          vaccineType: vaccineExists.vaccineType,
          pathogenNames: vaccineExists.pathogenNames,
          manufacturerNames: vaccineExists.manufacturerNames,
          createdAt: vaccineExists.createdAt,
          updatedAt: vaccineExists.updatedAt,
        },
        wasUpdated,
      });
    }

    // Vaccine doesn't exist - create new one
    const vaccine = await Vaccine.create({
      name: name.trim(),
      vaccineType: normalizeVaccineType(vaccineType),
      pathogenNames: pathogenNames.trim(),
      manufacturerNames: manufacturerNames.trim(),
    });

    await updateLastUpdate('Vaccine');

    res.status(201).json({
      success: true,
      message: 'Vaccine created successfully',
      vaccine: {
        id: vaccine._id.toString(),
        name: vaccine.name,
        vaccineType: vaccine.vaccineType,
        pathogenNames: vaccine.pathogenNames,
        manufacturerNames: vaccine.manufacturerNames,
        createdAt: vaccine.createdAt,
        updatedAt: vaccine.updatedAt,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Update vaccine
// @route   PUT /api/vaccines/:id
// @access  Private/Admin
exports.updateVaccine = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vaccine ID format',
      });
    }

    const { name, vaccineType, pathogenNames, manufacturerNames } = req.body;

    let vaccine = await Vaccine.findById(req.params.id);

    if (!vaccine) {
      return res.status(404).json({
        success: false,
        message: 'Vaccine not found',
      });
    }

    // Check if name is being changed and if it's already taken
    if (name && name.trim() !== vaccine.name) {
      const nameExists = await Vaccine.findOne({
        name: name.trim(),
        _id: { $ne: req.params.id },
      });
      if (nameExists) {
        return res.status(400).json({
          success: false,
          message: 'Vaccine name already in use',
        });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (vaccineType !== undefined) updateData.vaccineType = normalizeVaccineType(vaccineType);
    if (pathogenNames !== undefined) updateData.pathogenNames = pathogenNames.trim();
    if (manufacturerNames !== undefined) updateData.manufacturerNames = manufacturerNames.trim();

    const previousName = vaccine.name;
    vaccine = await Vaccine.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    // Licensing rows and product profiles reference vaccines by name; keep them attached on rename.
    if (updateData.name && updateData.name !== previousName) {
      await Promise.all([
        LicensingAuthority.updateMany({ vaccineName: previousName }, { $set: { vaccineName: updateData.name } }),
        ProductProfile.updateMany({ vaccineName: previousName }, { $set: { vaccineName: updateData.name } }),
      ]);
      await Promise.all([updateLastUpdate('LicensingAuthority'), updateLastUpdate('ProductProfile')]);
    }

    await updateLastUpdate('Vaccine');

    res.status(200).json({
      success: true,
      message: 'Vaccine updated successfully',
      vaccine: {
        id: vaccine._id.toString(),
        name: vaccine.name,
        vaccineType: vaccine.vaccineType,
        pathogenNames: vaccine.pathogenNames,
        manufacturerNames: vaccine.manufacturerNames,
        createdAt: vaccine.createdAt,
        updatedAt: vaccine.updatedAt,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Delete vaccine
// @route   DELETE /api/vaccines/:id
// @access  Private/Admin
exports.deleteVaccine = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vaccine ID format',
      });
    }

    const vaccine = await Vaccine.findById(req.params.id);

    if (!vaccine) {
      return res.status(404).json({
        success: false,
        message: 'Vaccine not found',
      });
    }

    // Delete related licensing dates and product profiles
    await Promise.all([
      LicensingAuthority.deleteMany({ vaccineName: vaccine.name }),
      ProductProfile.deleteMany({ vaccineName: vaccine.name }),
    ]);

    await Vaccine.findByIdAndDelete(req.params.id);

    await updateLastUpdate('Vaccine');

    res.status(200).json({
      success: true,
      message: 'Vaccine and related data deleted successfully',
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Get all vaccines with populated licensing dates (product profiles fetched on demand)
// @route   GET /api/vaccines/populated
// @access  Public
exports.getVaccinesPopulated = async (req, res) => {
  try {
    const [vaccines, allLicensingAuthorities] = await Promise.all([
      Vaccine.find().sort({ name: 1 }).lean(),
      LicensingAuthority.find().sort({ vaccineName: 1, approvalDate: 1 }).lean(),
    ]);

    const licensingByVaccineName = new Map();
    for (const row of allLicensingAuthorities) {
      const key = row.vaccineName;
      if (!licensingByVaccineName.has(key)) {
        licensingByVaccineName.set(key, []);
      }
      licensingByVaccineName.get(key).push(row);
    }

    const formatted = vaccines.map((v) => {
      const licensingAuthorities = licensingByVaccineName.get(v.name) || [];
      const licensingAuthoritiesFormatted = licensingAuthorities.map((ld) =>
        formatLicensingAuthorityDoc(ld)
      );

      return {
        id: v._id.toString(),
        name: v.name,
        vaccineType: v.vaccineType,
        pathogenNames: v.pathogenNames,
        manufacturerNames: v.manufacturerNames,
        licensingAuthorities: licensingAuthoritiesFormatted,
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      };
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      vaccines: formatted,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Get single vaccine with populated licensing dates (product profiles fetched on demand)
// @route   GET /api/vaccines/:id/populated
// @access  Public
exports.getVaccinePopulated = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vaccine ID format',
      });
    }

    const vaccine = await Vaccine.findById(req.params.id);

    if (!vaccine) {
      return res.status(404).json({
        success: false,
        message: 'Vaccine not found',
      });
    }

    // Find licensing dates for this vaccine
    const licensingAuthorities = await LicensingAuthority.find({
      vaccineName: vaccine.name,
    }).sort({ approvalDate: 1 });

    // Product profiles are not included - they should be fetched on demand via /api/product-profiles?vaccineName=...

    const licensingAuthoritiesFormatted = licensingAuthorities.map((ld) =>
      formatLicensingAuthorityDoc(ld)
    );

    res.status(200).json({
      success: true,
      vaccine: {
        id: vaccine._id.toString(),
        name: vaccine.name,
        vaccineType: vaccine.vaccineType,
        pathogenNames: vaccine.pathogenNames,
        manufacturerNames: vaccine.manufacturerNames,
        licensingAuthorities: licensingAuthoritiesFormatted,
        // productProfiles removed - fetch on demand via /api/product-profiles?vaccineName=...
        createdAt: vaccine.createdAt,
        updatedAt: vaccine.updatedAt,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

