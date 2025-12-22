const Vaccine = require('../models/Vaccine');
const LicensingDate = require('../models/LicensingDate');
const ProductProfile = require('../models/ProductProfile');
const mongoose = require('mongoose');
const { updateLastUpdate } = require('./lastUpdateController');

// @desc    Get all vaccines
// @route   GET /api/vaccines
// @access  Private/Admin
exports.getVaccines = async (req, res) => {
  try {
    const vaccines = await Vaccine.find().sort({ name: 1 });

    const formattedVaccines = vaccines.map((vaccine) => ({
      id: vaccine._id.toString(),
      name: vaccine.name,
      vaccineType: vaccine.vaccineType,
      pathogenNames: vaccine.pathogenNames,
      manufacturerNames: vaccine.manufacturerNames,
      createdAt: vaccine.createdAt,
      updatedAt: vaccine.updatedAt,
    }));

    res.status(200).json({
      success: true,
      count: formattedVaccines.length,
      vaccines: formattedVaccines,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
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
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// Helper function to merge comma-separated strings without duplicates
const mergeStringArrays = (existingStr, newStr) => {
  if (!existingStr || !existingStr.trim()) return newStr.trim();
  if (!newStr || !newStr.trim()) return existingStr.trim();
  
  const existing = existingStr.split(',').map(s => s.trim()).filter(Boolean);
  const newItems = newStr.split(',').map(s => s.trim()).filter(Boolean);
  
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
      if (vaccineType && vaccineType.trim() && vaccineType.trim() !== vaccineExists.vaccineType) {
        updatedVaccineType = vaccineType.trim();
        wasUpdated = true;
      }

      if (manufacturerNames && manufacturerNames.trim()) {
        const existingManufacturers = (vaccineExists.manufacturerNames || '').split(',').map(s => s.trim().toLowerCase());
        const newManufacturers = manufacturerNames.trim().split(',').map(s => s.trim());
        
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
        const existingPathogens = (vaccineExists.pathogenNames || '').split(',').map(s => s.trim().toLowerCase());
        const newPathogens = pathogenNames.trim().split(',').map(s => s.trim());
        
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
      vaccineType,
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
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
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
    if (vaccineType !== undefined) updateData.vaccineType = vaccineType;
    if (pathogenNames !== undefined) updateData.pathogenNames = pathogenNames.trim();
    if (manufacturerNames !== undefined) updateData.manufacturerNames = manufacturerNames.trim();

    vaccine = await Vaccine.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

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
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
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
    await LicensingDate.deleteMany({ vaccineName: vaccine.name });
    await ProductProfile.deleteMany({ vaccineName: vaccine.name });

    await Vaccine.findByIdAndDelete(req.params.id);

    await updateLastUpdate('Vaccine');

    res.status(200).json({
      success: true,
      message: 'Vaccine and related data deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get all vaccines with populated licensing dates (product profiles fetched on demand)
// @route   GET /api/vaccines/populated
// @access  Public
exports.getVaccinesPopulated = async (req, res) => {
  try {
    const vaccines = await Vaccine.find().sort({ name: 1 });

    const formatted = await Promise.all(
      vaccines.map(async (v) => {
        // Find licensing dates for this vaccine
        const licensingDates = await LicensingDate.find({
          vaccineName: v.name,
        }).sort({ approvalDate: 1 });

        // Product profiles are not included - they should be fetched on demand via /api/product-profiles?vaccineName=...

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

        return {
          id: v._id.toString(),
          name: v.name,
          vaccineType: v.vaccineType,
          pathogenNames: v.pathogenNames,
          manufacturerNames: v.manufacturerNames,
          licensingDates: licensingDatesFormatted,
          // productProfiles removed - fetch on demand via /api/product-profiles?vaccineName=...
          createdAt: v.createdAt,
          updatedAt: v.updatedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: formatted.length,
      vaccines: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
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
    const licensingDates = await LicensingDate.find({
      vaccineName: vaccine.name,
    }).sort({ approvalDate: 1 });

    // Product profiles are not included - they should be fetched on demand via /api/product-profiles?vaccineName=...

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

    res.status(200).json({
      success: true,
      vaccine: {
        id: vaccine._id.toString(),
        name: vaccine.name,
        vaccineType: vaccine.vaccineType,
        pathogenNames: vaccine.pathogenNames,
        manufacturerNames: vaccine.manufacturerNames,
        licensingDates: licensingDatesFormatted,
        // productProfiles removed - fetch on demand via /api/product-profiles?vaccineName=...
        createdAt: vaccine.createdAt,
        updatedAt: vaccine.updatedAt,
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

