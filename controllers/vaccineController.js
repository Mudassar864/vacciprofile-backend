const Vaccine = require('../models/Vaccine');
const LicensingDate = require('../models/LicensingDate');
const ProductProfile = require('../models/ProductProfile');
const mongoose = require('mongoose');

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

// @desc    Create vaccine
// @route   POST /api/vaccines
// @access  Private/Admin
exports.createVaccine = async (req, res) => {
  try {
    const { name, vaccineType, pathogenNames, manufacturerNames } = req.body;

    // Check if vaccine already exists
    const vaccineExists = await Vaccine.findOne({ name: name.trim() });

    if (vaccineExists) {
      return res.status(400).json({
        success: false,
        message: 'Vaccine with this name already exists',
      });
    }

    const vaccine = await Vaccine.create({
      name: name.trim(),
      vaccineType,
      pathogenNames: pathogenNames.trim(),
      manufacturerNames: manufacturerNames.trim(),
    });

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

// @desc    Get all vaccines with populated licensing dates and product profiles
// @route   GET /api/vaccines/populated
// @access  Private/Admin
exports.getVaccinesPopulated = async (req, res) => {
  try {
    const vaccines = await Vaccine.find().sort({ name: 1 });

    const formatted = await Promise.all(
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

// @desc    Get single vaccine with populated licensing dates and product profiles
// @route   GET /api/vaccines/:id/populated
// @access  Private/Admin
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

    // Find product profiles for this vaccine
    const productProfiles = await ProductProfile.find({
      vaccineName: vaccine.name,
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

    res.status(200).json({
      success: true,
      vaccine: {
        id: vaccine._id.toString(),
        name: vaccine.name,
        vaccineType: vaccine.vaccineType,
        pathogenNames: vaccine.pathogenNames,
        manufacturerNames: vaccine.manufacturerNames,
        licensingDates: licensingDatesFormatted,
        productProfiles: productProfilesFormatted,
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

