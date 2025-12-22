const Licenser = require('../models/Licenser');
const mongoose = require('mongoose');
const { updateLastUpdate } = require('./lastUpdateController');

// @desc    Get all licensers
// @route   GET /api/licensers
// @access  Private/Admin
exports.getLicensers = async (req, res) => {
  try {
    const licensers = await Licenser.find().sort({ acronym: 1 });

    const formatted = licensers.map((l) => ({
      id: l._id.toString(),
      acronym: l.acronym,
      region: l.region,
      country: l.country,
      fullName: l.fullName,
      description: l.description,
      website: l.website,
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      licensers: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single licenser
// @route   GET /api/licensers/:id
// @access  Private/Admin
exports.getLicenser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid licenser ID format',
      });
    }

    const licenser = await Licenser.findById(req.params.id);

    if (!licenser) {
      return res.status(404).json({
        success: false,
        message: 'Licenser not found',
      });
    }

    res.status(200).json({
      success: true,
      licenser: {
        id: licenser._id.toString(),
        acronym: licenser.acronym,
        region: licenser.region,
        country: licenser.country,
        fullName: licenser.fullName,
        description: licenser.description,
        website: licenser.website,
        createdAt: licenser.createdAt,
        updatedAt: licenser.updatedAt,
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

// @desc    Create licenser
// @route   POST /api/licensers
// @access  Private/Admin
exports.createLicenser = async (req, res) => {
  try {
    const {
      acronym,
      region,
      country,
      fullName,
      description,
      website,
    } = req.body;

    // Check if licenser already exists
    const licenserExists = await Licenser.findOne({ acronym: acronym.trim() });

    if (licenserExists) {
      return res.status(400).json({
        success: false,
        message: 'Licenser with this acronym already exists',
      });
    }

    const licenser = await Licenser.create({
      acronym: acronym.trim(),
      region: region ? region.trim() : '',
      country: country ? country.trim() : '',
      fullName: fullName.trim(),
      description: description ? description.trim() : '',
      website: website ? website.trim() : '',
    });

    await updateLastUpdate('Licenser');

    res.status(201).json({
      success: true,
      message: 'Licenser created successfully',
      licenser: {
        id: licenser._id.toString(),
        acronym: licenser.acronym,
        region: licenser.region,
        country: licenser.country,
        fullName: licenser.fullName,
        description: licenser.description,
        website: licenser.website,
        createdAt: licenser.createdAt,
        updatedAt: licenser.updatedAt,
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

// @desc    Update licenser
// @route   PUT /api/licensers/:id
// @access  Private/Admin
exports.updateLicenser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid licenser ID format',
      });
    }

    let licenser = await Licenser.findById(req.params.id);

    if (!licenser) {
      return res.status(404).json({
        success: false,
        message: 'Licenser not found',
      });
    }

    // Check if acronym is being changed and if it's already taken
    if (req.body.acronym && req.body.acronym.trim() !== licenser.acronym) {
      const acronymExists = await Licenser.findOne({
        acronym: req.body.acronym.trim(),
        _id: { $ne: req.params.id },
      });
      if (acronymExists) {
        return res.status(400).json({
          success: false,
          message: 'Licenser acronym already in use',
        });
      }
    }

    // Prepare update object - only include fields that are provided
    const updateData = {};
    const fields = [
      'acronym', 'region', 'country', 'fullName', 'description', 'website'
    ];

    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = typeof req.body[field] === 'string' 
          ? req.body[field].trim() 
          : String(req.body[field]).trim();
      }
    });

    licenser = await Licenser.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    await updateLastUpdate('Licenser');

    res.status(200).json({
      success: true,
      message: 'Licenser updated successfully',
      licenser: {
        id: licenser._id.toString(),
        acronym: licenser.acronym,
        region: licenser.region,
        country: licenser.country,
        fullName: licenser.fullName,
        description: licenser.description,
        website: licenser.website,
        createdAt: licenser.createdAt,
        updatedAt: licenser.updatedAt,
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

// @desc    Delete licenser
// @route   DELETE /api/licensers/:id
// @access  Private/Admin
exports.deleteLicenser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid licenser ID format',
      });
    }

    const licenser = await Licenser.findById(req.params.id);

    if (!licenser) {
      return res.status(404).json({
        success: false,
        message: 'Licenser not found',
      });
    }

    await Licenser.findByIdAndDelete(req.params.id);

    await updateLastUpdate('Licenser');

    res.status(200).json({
      success: true,
      message: 'Licenser deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

