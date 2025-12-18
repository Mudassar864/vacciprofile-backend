const ManufacturerCandidate = require('../models/ManufacturerCandidate');
const mongoose = require('mongoose');

// @desc    Get all manufacturer candidates
// @route   GET /api/manufacturer-candidates
// @access  Private/Admin
exports.getManufacturerCandidates = async (req, res) => {
  try {
    const { pathogenName, manufacturer } = req.query;
    const query = {};
    if (pathogenName) query.pathogenName = pathogenName;
    if (manufacturer) query.manufacturer = manufacturer;

    const candidates = await ManufacturerCandidate.find(query).sort({ pathogenName: 1, name: 1 });

    const formatted = candidates.map((c) => ({
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
      count: formatted.length,
      candidates: formatted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single manufacturer candidate
// @route   GET /api/manufacturer-candidates/:id
// @access  Private/Admin
exports.getManufacturerCandidate = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const candidate = await ManufacturerCandidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    res.status(200).json({
      success: true,
      candidate: {
        id: candidate._id.toString(),
        pathogenName: candidate.pathogenName,
        name: candidate.name,
        manufacturer: candidate.manufacturer,
        platform: candidate.platform,
        clinicalPhase: candidate.clinicalPhase,
        companyUrl: candidate.companyUrl,
        other: candidate.other,
        createdAt: candidate.createdAt,
        updatedAt: candidate.updatedAt,
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

// @desc    Create manufacturer candidate
// @route   POST /api/manufacturer-candidates
// @access  Private/Admin
exports.createManufacturerCandidate = async (req, res) => {
  try {
    const {
      pathogenName,
      name,
      manufacturer,
      platform,
      clinicalPhase,
      companyUrl,
      other,
    } = req.body;

    const candidate = await ManufacturerCandidate.create({
      pathogenName: pathogenName.trim(),
      name: name.trim(),
      manufacturer: manufacturer ? manufacturer.trim() : '',
      platform: platform ? platform.trim() : '',
      clinicalPhase: clinicalPhase ? clinicalPhase.trim() : '',
      companyUrl: companyUrl ? companyUrl.trim() : '',
      other: other ? other.trim() : '',
    });

    res.status(201).json({
      success: true,
      message: 'Manufacturer candidate created successfully',
      candidate: {
        id: candidate._id.toString(),
        pathogenName: candidate.pathogenName,
        name: candidate.name,
        manufacturer: candidate.manufacturer,
        platform: candidate.platform,
        clinicalPhase: candidate.clinicalPhase,
        companyUrl: candidate.companyUrl,
        other: candidate.other,
        createdAt: candidate.createdAt,
        updatedAt: candidate.updatedAt,
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

// @desc    Update manufacturer candidate
// @route   PUT /api/manufacturer-candidates/:id
// @access  Private/Admin
exports.updateManufacturerCandidate = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const {
      pathogenName,
      name,
      manufacturer,
      platform,
      clinicalPhase,
      companyUrl,
      other,
    } = req.body;

    let candidate = await ManufacturerCandidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    const updateData = {};
    if (pathogenName !== undefined) updateData.pathogenName = pathogenName.trim();
    if (name !== undefined) updateData.name = name.trim();
    if (manufacturer !== undefined) updateData.manufacturer = manufacturer.trim();
    if (platform !== undefined) updateData.platform = platform.trim();
    if (clinicalPhase !== undefined) updateData.clinicalPhase = clinicalPhase.trim();
    if (companyUrl !== undefined) updateData.companyUrl = companyUrl.trim();
    if (other !== undefined) updateData.other = other.trim();

    candidate = await ManufacturerCandidate.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      message: 'Manufacturer candidate updated successfully',
      candidate: {
        id: candidate._id.toString(),
        pathogenName: candidate.pathogenName,
        name: candidate.name,
        manufacturer: candidate.manufacturer,
        platform: candidate.platform,
        clinicalPhase: candidate.clinicalPhase,
        companyUrl: candidate.companyUrl,
        other: candidate.other,
        createdAt: candidate.createdAt,
        updatedAt: candidate.updatedAt,
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

// @desc    Delete manufacturer candidate
// @route   DELETE /api/manufacturer-candidates/:id
// @access  Private/Admin
exports.deleteManufacturerCandidate = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const candidate = await ManufacturerCandidate.findById(req.params.id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    await ManufacturerCandidate.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Manufacturer candidate deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

