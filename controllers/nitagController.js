const NITAG = require('../models/NITAG');
const mongoose = require('mongoose');
const { updateLastUpdate } = require('./lastUpdateController');

// @desc    Get all NITAGs
// @route   GET /api/nitags
// @access  Private/Admin
exports.getNITAGs = async (req, res) => {
  try {
    const nitags = await NITAG.find().sort({ country: 1 });

    const formatted = nitags.map((n) => ({
      id: n._id.toString(),
      country: n.country,
      availableNitag: n.availableNitag,
      availableWebsite: n.availableWebsite,
      websiteUrl: n.websiteUrl,
      nationalNitagName: n.nationalNitagName,
      yearEstablished: n.yearEstablished,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      nitags: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single NITAG
// @route   GET /api/nitags/:id
// @access  Private/Admin
exports.getNITAG = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid NITAG ID format',
      });
    }

    const nitag = await NITAG.findById(req.params.id);

    if (!nitag) {
      return res.status(404).json({
        success: false,
        message: 'NITAG not found',
      });
    }

    res.status(200).json({
      success: true,
      nitag: {
        id: nitag._id.toString(),
        country: nitag.country,
        availableNitag: nitag.availableNitag,
        availableWebsite: nitag.availableWebsite,
        websiteUrl: nitag.websiteUrl,
        nationalNitagName: nitag.nationalNitagName,
        yearEstablished: nitag.yearEstablished,
        createdAt: nitag.createdAt,
        updatedAt: nitag.updatedAt,
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

// @desc    Create NITAG
// @route   POST /api/nitags
// @access  Private/Admin
exports.createNITAG = async (req, res) => {
  try {
    const {
      country,
      availableNitag,
      availableWebsite,
      websiteUrl,
      nationalNitagName,
      yearEstablished,
    } = req.body;

    // Check if NITAG already exists
    const nitagExists = await NITAG.findOne({ country: country.trim() });

    if (nitagExists) {
      return res.status(400).json({
        success: false,
        message: 'NITAG for this country already exists',
      });
    }

    const nitag = await NITAG.create({
      country: country.trim(),
      availableNitag: availableNitag ? availableNitag.trim() : '',
      availableWebsite: availableWebsite ? availableWebsite.trim() : '',
      websiteUrl: websiteUrl ? websiteUrl.trim() : '',
      nationalNitagName: nationalNitagName ? nationalNitagName.trim() : '',
      yearEstablished: yearEstablished ? String(yearEstablished).trim() : '',
    });

    await updateLastUpdate('NITAG');

    res.status(201).json({
      success: true,
      message: 'NITAG created successfully',
      nitag: {
        id: nitag._id.toString(),
        country: nitag.country,
        availableNitag: nitag.availableNitag,
        availableWebsite: nitag.availableWebsite,
        websiteUrl: nitag.websiteUrl,
        nationalNitagName: nitag.nationalNitagName,
        yearEstablished: nitag.yearEstablished,
        createdAt: nitag.createdAt,
        updatedAt: nitag.updatedAt,
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

// @desc    Update NITAG
// @route   PUT /api/nitags/:id
// @access  Private/Admin
exports.updateNITAG = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid NITAG ID format',
      });
    }

    let nitag = await NITAG.findById(req.params.id);

    if (!nitag) {
      return res.status(404).json({
        success: false,
        message: 'NITAG not found',
      });
    }

    // Check if country is being changed and if it's already taken
    if (req.body.country && req.body.country.trim() !== nitag.country) {
      const countryExists = await NITAG.findOne({
        country: req.body.country.trim(),
        _id: { $ne: req.params.id },
      });
      if (countryExists) {
        return res.status(400).json({
          success: false,
          message: 'NITAG for this country already exists',
        });
      }
    }

    // Prepare update object - only include fields that are provided
    const updateData = {};
    const fields = [
      'country', 'availableNitag', 'availableWebsite', 'websiteUrl',
      'nationalNitagName', 'yearEstablished'
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = typeof req.body[field] === 'string' 
          ? req.body[field].trim() 
          : String(req.body[field]).trim();
      }
    });

    nitag = await NITAG.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    await updateLastUpdate('NITAG');

    res.status(200).json({
      success: true,
      message: 'NITAG updated successfully',
      nitag: {
        id: nitag._id.toString(),
        country: nitag.country,
        availableNitag: nitag.availableNitag,
        availableWebsite: nitag.availableWebsite,
        websiteUrl: nitag.websiteUrl,
        nationalNitagName: nitag.nationalNitagName,
        yearEstablished: nitag.yearEstablished,
        createdAt: nitag.createdAt,
        updatedAt: nitag.updatedAt,
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

// @desc    Delete NITAG
// @route   DELETE /api/nitags/:id
// @access  Private/Admin
exports.deleteNITAG = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid NITAG ID format',
      });
    }

    const nitag = await NITAG.findById(req.params.id);

    if (!nitag) {
      return res.status(404).json({
        success: false,
        message: 'NITAG not found',
      });
    }

    await NITAG.findByIdAndDelete(req.params.id);

    await updateLastUpdate('NITAG');

    res.status(200).json({
      success: true,
      message: 'NITAG deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

