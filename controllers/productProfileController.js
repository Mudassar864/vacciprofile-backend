const ProductProfile = require('../models/ProductProfile');
const mongoose = require('mongoose');
const { updateLastUpdate } = require('./lastUpdateController');

// @desc    Get all product profiles
// @route   GET /api/product-profiles
// @access  Private/Admin
exports.getProductProfiles = async (req, res) => {
  try {
    const { vaccineName, type } = req.query;
    const query = {};
    if (vaccineName) query.vaccineName = vaccineName;
    if (type) query.type = type;

    const productProfiles = await ProductProfile.find(query).sort({ vaccineName: 1, type: 1 });

    const formatted = productProfiles.map((item) => ({
      id: item._id.toString(),
      vaccineName: item.vaccineName,
      type: item.type,
      name: item.name,
      composition: item.composition,
      strainCoverage: item.strainCoverage,
      indication: item.indication,
      contraindication: item.contraindication,
      dosing: item.dosing,
      immunogenicity: item.immunogenicity,
      Efficacy: item.Efficacy,
      durationOfProtection: item.durationOfProtection,
      coAdministration: item.coAdministration,
      reactogenicity: item.reactogenicity,
      safety: item.safety,
      vaccinationGoal: item.vaccinationGoal,
      others: item.others,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      productProfiles: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single product profile
// @route   GET /api/product-profiles/:id
// @access  Private/Admin
exports.getProductProfile = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const productProfile = await ProductProfile.findById(req.params.id);

    if (!productProfile) {
      return res.status(404).json({
        success: false,
        message: 'Product profile not found',
      });
    }

    res.status(200).json({
      success: true,
      productProfile: {
        id: productProfile._id.toString(),
        vaccineName: productProfile.vaccineName,
        type: productProfile.type,
        name: productProfile.name,
        composition: productProfile.composition,
        strainCoverage: productProfile.strainCoverage,
        indication: productProfile.indication,
        contraindication: productProfile.contraindication,
        dosing: productProfile.dosing,
        immunogenicity: productProfile.immunogenicity,
        Efficacy: productProfile.Efficacy,
        durationOfProtection: productProfile.durationOfProtection,
        coAdministration: productProfile.coAdministration,
        reactogenicity: productProfile.reactogenicity,
        safety: productProfile.safety,
        vaccinationGoal: productProfile.vaccinationGoal,
        others: productProfile.others,
        createdAt: productProfile.createdAt,
        updatedAt: productProfile.updatedAt,
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

// @desc    Create product profile
// @route   POST /api/product-profiles
// @access  Private/Admin
exports.createProductProfile = async (req, res) => {
  try {
    const {
      vaccineName,
      type,
      name,
      composition,
      strainCoverage,
      indication,
      contraindication,
      dosing,
      immunogenicity,
      Efficacy,
      durationOfProtection,
      coAdministration,
      reactogenicity,
      safety,
      vaccinationGoal,
      others,
    } = req.body;

    const productProfile = await ProductProfile.create({
      vaccineName: vaccineName.trim(),
      type: type.trim(),
      name: name.trim(),
      composition: composition ? composition.trim() : '- not licensed yet -',
      strainCoverage: strainCoverage ? strainCoverage.trim() : '- not licensed yet -',
      indication: indication ? indication.trim() : '- not licensed yet -',
      contraindication: contraindication ? contraindication.trim() : '- not licensed yet -',
      dosing: dosing ? dosing.trim() : '- not licensed yet -',
      immunogenicity: immunogenicity ? immunogenicity.trim() : '- not licensed yet -',
      Efficacy: Efficacy ? Efficacy.trim() : '- not licensed yet -',
      durationOfProtection: durationOfProtection ? durationOfProtection.trim() : '- not licensed yet -',
      coAdministration: coAdministration ? coAdministration.trim() : '- not licensed yet -',
      reactogenicity: reactogenicity ? reactogenicity.trim() : '- not licensed yet -',
      safety: safety ? safety.trim() : '- not licensed yet -',
      vaccinationGoal: vaccinationGoal ? vaccinationGoal.trim() : '- not licensed yet -',
      others: others ? others.trim() : '- not licensed yet -',
    });

    await updateLastUpdate('ProductProfile');

    res.status(201).json({
      success: true,
      message: 'Product profile created successfully',
      productProfile: {
        id: productProfile._id.toString(),
        vaccineName: productProfile.vaccineName,
        type: productProfile.type,
        name: productProfile.name,
        composition: productProfile.composition,
        strainCoverage: productProfile.strainCoverage,
        indication: productProfile.indication,
        contraindication: productProfile.contraindication,
        dosing: productProfile.dosing,
        immunogenicity: productProfile.immunogenicity,
        Efficacy: productProfile.Efficacy,
        durationOfProtection: productProfile.durationOfProtection,
        coAdministration: productProfile.coAdministration,
        reactogenicity: productProfile.reactogenicity,
        safety: productProfile.safety,
        vaccinationGoal: productProfile.vaccinationGoal,
        others: productProfile.others,
        createdAt: productProfile.createdAt,
        updatedAt: productProfile.updatedAt,
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

// @desc    Update product profile
// @route   PUT /api/product-profiles/:id
// @access  Private/Admin
exports.updateProductProfile = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const {
      vaccineName,
      type,
      name,
      composition,
      strainCoverage,
      indication,
      contraindication,
      dosing,
      immunogenicity,
      Efficacy,
      durationOfProtection,
      coAdministration,
      reactogenicity,
      safety,
      vaccinationGoal,
      others,
    } = req.body;

    let productProfile = await ProductProfile.findById(req.params.id);

    if (!productProfile) {
      return res.status(404).json({
        success: false,
        message: 'Product profile not found',
      });
    }

    const updateData = {};
    if (vaccineName !== undefined) updateData.vaccineName = vaccineName.trim();
    if (type !== undefined) updateData.type = type.trim();
    if (name !== undefined) updateData.name = name.trim();
    if (composition !== undefined) updateData.composition = composition.trim();
    if (strainCoverage !== undefined) updateData.strainCoverage = strainCoverage.trim();
    if (indication !== undefined) updateData.indication = indication.trim();
    if (contraindication !== undefined) updateData.contraindication = contraindication.trim();
    if (dosing !== undefined) updateData.dosing = dosing.trim();
    if (immunogenicity !== undefined) updateData.immunogenicity = immunogenicity.trim();
    if (Efficacy !== undefined) updateData.Efficacy = Efficacy.trim();
    if (durationOfProtection !== undefined) updateData.durationOfProtection = durationOfProtection.trim();
    if (coAdministration !== undefined) updateData.coAdministration = coAdministration.trim();
    if (reactogenicity !== undefined) updateData.reactogenicity = reactogenicity.trim();
    if (safety !== undefined) updateData.safety = safety.trim();
    if (vaccinationGoal !== undefined) updateData.vaccinationGoal = vaccinationGoal.trim();
    if (others !== undefined) updateData.others = others.trim();

    productProfile = await ProductProfile.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    await updateLastUpdate('ProductProfile');

    res.status(200).json({
      success: true,
      message: 'Product profile updated successfully',
      productProfile: {
        id: productProfile._id.toString(),
        vaccineName: productProfile.vaccineName,
        type: productProfile.type,
        name: productProfile.name,
        composition: productProfile.composition,
        strainCoverage: productProfile.strainCoverage,
        indication: productProfile.indication,
        contraindication: productProfile.contraindication,
        dosing: productProfile.dosing,
        immunogenicity: productProfile.immunogenicity,
        Efficacy: productProfile.Efficacy,
        durationOfProtection: productProfile.durationOfProtection,
        coAdministration: productProfile.coAdministration,
        reactogenicity: productProfile.reactogenicity,
        safety: productProfile.safety,
        vaccinationGoal: productProfile.vaccinationGoal,
        others: productProfile.others,
        createdAt: productProfile.createdAt,
        updatedAt: productProfile.updatedAt,
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

// @desc    Delete product profile
// @route   DELETE /api/product-profiles/:id
// @access  Private/Admin
exports.deleteProductProfile = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const productProfile = await ProductProfile.findById(req.params.id);

    if (!productProfile) {
      return res.status(404).json({
        success: false,
        message: 'Product profile not found',
      });
    }

    await ProductProfile.findByIdAndDelete(req.params.id);

    await updateLastUpdate('ProductProfile');

    res.status(200).json({
      success: true,
      message: 'Product profile deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

