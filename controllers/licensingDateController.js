const LicensingDate = require('../models/LicensingDate');
const mongoose = require('mongoose');
const { updateLastUpdate } = require('./lastUpdateController');

// @desc    Get all licensing dates
// @route   GET /api/licensing-dates
// @access  Private/Admin
exports.getLicensingDates = async (req, res) => {
  try {
    const { vaccineName } = req.query;
    const query = vaccineName ? { vaccineName } : {};

    const licensingDates = await LicensingDate.find(query).sort({ vaccineName: 1, approvalDate: 1 });

    const formatted = licensingDates.map((item) => ({
      id: item._id.toString(),
      vaccineName: item.vaccineName,
      name: item.name,
      type: item.type,
      approvalDate: item.approvalDate,
      source: item.source,
      lastUpdateOnVaccine: item.lastUpdateOnVaccine,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      licensingDates: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single licensing date
// @route   GET /api/licensing-dates/:id
// @access  Private/Admin
exports.getLicensingDate = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const licensingDate = await LicensingDate.findById(req.params.id);

    if (!licensingDate) {
      return res.status(404).json({
        success: false,
        message: 'Licensing date not found',
      });
    }

    res.status(200).json({
      success: true,
      licensingDate: {
        id: licensingDate._id.toString(),
        vaccineName: licensingDate.vaccineName,
        name: licensingDate.name,
        type: licensingDate.type,
        approvalDate: licensingDate.approvalDate,
        source: licensingDate.source,
        lastUpdateOnVaccine: licensingDate.lastUpdateOnVaccine,
        createdAt: licensingDate.createdAt,
        updatedAt: licensingDate.updatedAt,
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

// @desc    Create licensing date
// @route   POST /api/licensing-dates
// @access  Private/Admin
exports.createLicensingDate = async (req, res) => {
  try {
    const { vaccineName, name, type, approvalDate, source, lastUpdateOnVaccine } = req.body;

    const licensingDate = await LicensingDate.create({
      vaccineName: vaccineName.trim(),
      name: name.trim(),
      type: type ? type.trim() : 'N/A',
      approvalDate: approvalDate.trim(),
      source: source.trim(),
      lastUpdateOnVaccine: lastUpdateOnVaccine ? lastUpdateOnVaccine.trim() : 'N/A',
    });

    await updateLastUpdate('LicensingDate');

    res.status(201).json({
      success: true,
      message: 'Licensing date created successfully',
      licensingDate: {
        id: licensingDate._id.toString(),
        vaccineName: licensingDate.vaccineName,
        name: licensingDate.name,
        type: licensingDate.type,
        approvalDate: licensingDate.approvalDate,
        source: licensingDate.source,
        lastUpdateOnVaccine: licensingDate.lastUpdateOnVaccine,
        createdAt: licensingDate.createdAt,
        updatedAt: licensingDate.updatedAt,
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

// @desc    Update licensing date
// @route   PUT /api/licensing-dates/:id
// @access  Private/Admin
exports.updateLicensingDate = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const { vaccineName, name, type, approvalDate, source, lastUpdateOnVaccine } = req.body;

    let licensingDate = await LicensingDate.findById(req.params.id);

    if (!licensingDate) {
      return res.status(404).json({
        success: false,
        message: 'Licensing date not found',
      });
    }

    const updateData = {};
    if (vaccineName !== undefined) updateData.vaccineName = vaccineName.trim();
    if (name !== undefined) updateData.name = name.trim();
    if (type !== undefined) updateData.type = type.trim();
    if (approvalDate !== undefined) updateData.approvalDate = approvalDate.trim();
    if (source !== undefined) updateData.source = source.trim();
    if (lastUpdateOnVaccine !== undefined) updateData.lastUpdateOnVaccine = lastUpdateOnVaccine.trim();

    licensingDate = await LicensingDate.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    await updateLastUpdate('LicensingDate');

    res.status(200).json({
      success: true,
      message: 'Licensing date updated successfully',
      licensingDate: {
        id: licensingDate._id.toString(),
        vaccineName: licensingDate.vaccineName,
        name: licensingDate.name,
        type: licensingDate.type,
        approvalDate: licensingDate.approvalDate,
        source: licensingDate.source,
        lastUpdateOnVaccine: licensingDate.lastUpdateOnVaccine,
        createdAt: licensingDate.createdAt,
        updatedAt: licensingDate.updatedAt,
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

// @desc    Delete licensing date
// @route   DELETE /api/licensing-dates/:id
// @access  Private/Admin
exports.deleteLicensingDate = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const licensingDate = await LicensingDate.findById(req.params.id);

    if (!licensingDate) {
      return res.status(404).json({
        success: false,
        message: 'Licensing date not found',
      });
    }

    await LicensingDate.findByIdAndDelete(req.params.id);

    await updateLastUpdate('LicensingDate');

    res.status(200).json({
      success: true,
      message: 'Licensing date deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

