const LicensingAuthority = require('../models/LicensingAuthority');
const Vaccine = require('../models/Vaccine');
const mongoose = require('mongoose');
const { updateLastUpdate } = require('./lastUpdateController');
const { parsePaginationQuery, paginateQuery } = require('../utils/pagination');
const { formatLicensingAuthorityDoc } = require('../utils/formatLicensingAuthorityResponse');

// @desc    Distinct licensing authority names
// @route   GET /api/licensing-authorities/stats/unique-licenser-names
// @access  Public
exports.getUniqueLicenserNames = async (req, res) => {
  try {
    const names = await LicensingAuthority.distinct('regulatory_authority_or_country');
    const trimmed = names
      .filter((n) => typeof n === 'string' && n.trim())
      .map((n) => n.trim());
    const uniqueSorted = [...new Set(trimmed)].sort((a, b) => a.localeCompare(b));

    res.status(200).json({
      success: true,
      totalUniqueLicenserNames: uniqueSorted.length,
      licenserNames: uniqueSorted,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get all licensing authorities
// @route   GET /api/licensing-authorities
// @access  Private/Admin
exports.getLicensingAuthorities = async (req, res) => {
  try {
    const { vaccineName } = req.query;
    const query = vaccineName ? { vaccineName } : {};
    const pagination = parsePaginationQuery(req.query);
    const { docs: licensingAuthorities, total, pagination: paginationMeta } = await paginateQuery(
      LicensingAuthority,
      query,
      { vaccineName: 1, approvalDate: 1 },
      pagination
    );

    const formatted = licensingAuthorities.map((item) => formatLicensingAuthorityDoc(item));

    const payload = {
      success: true,
      count: pagination.enabled ? total : formatted.length,
      licensingAuthorities: formatted,
    };
    if (paginationMeta) payload.pagination = paginationMeta;

    res.status(200).json(payload);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Vaccines licensed by authority name(s) — for authorities browse page
// @route   GET /api/licensing-authorities/vaccines-for-authority
// @access  Public
exports.getVaccinesForAuthority = async (req, res) => {
  try {
    const rawKeys = req.query.keys || req.query.key || '';
    const keys = String(rawKeys)
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    if (!keys.length) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter keys is required',
      });
    }

    const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const orConditions = keys.flatMap((k) => [
      { regulatory_authority_or_country: { $regex: new RegExp(`^${escapeRegex(k)}$`, 'i') } },
      { regulatory_authority_or_country: { $regex: new RegExp(escapeRegex(k), 'i') } },
    ]);

    const rows = await LicensingAuthority.find({ $or: orConditions }).sort({
      vaccineName: 1,
      approvalDate: 1,
    });

    const byVaccine = new Map();
    for (const row of rows) {
      const vn = row.vaccineName;
      if (!byVaccine.has(vn)) byVaccine.set(vn, []);
      byVaccine.get(vn).push(row);
    }

    const vaccineNames = Array.from(byVaccine.keys());
    const vaccines = await Vaccine.find({ name: { $in: vaccineNames } }).sort({ name: 1 });

    const formatted = vaccines.map((v) => {
      const authorityRows = byVaccine.get(v.name) || [];
      const licensingAuthorities = authorityRows.map((ld) => formatLicensingAuthorityDoc(ld));

      return {
        id: v._id.toString(),
        name: v.name,
        vaccineType: v.vaccineType,
        pathogenNames: v.pathogenNames,
        manufacturerNames: v.manufacturerNames,
        licensingAuthorities,
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
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Get single licensing authority
// @route   GET /api/licensing-authorities/:id
// @access  Private/Admin
exports.getLicensingAuthority = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const licensingAuthority = await LicensingAuthority.findById(req.params.id);

    if (!licensingAuthority) {
      return res.status(404).json({
        success: false,
        message: 'Licensing authority not found',
      });
    }

    res.status(200).json({
      success: true,
      licensingAuthority: formatLicensingAuthorityDoc(licensingAuthority),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Create licensing authority
// @route   POST /api/licensing-authorities
// @access  Private/Admin
exports.createLicensingAuthority = async (req, res) => {
  try {
    const {
      vaccineName,
      regulatory_authority_or_country,
      type,
      approvalDate,
      source,
      approval_route,
      market_status,
    } = req.body;

    if (!vaccineName || typeof vaccineName !== 'string' || !vaccineName.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vaccine name is required',
      });
    }

    if (
      !regulatory_authority_or_country ||
      typeof regulatory_authority_or_country !== 'string' ||
      !regulatory_authority_or_country.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: 'Regulatory authority or country is required',
      });
    }

    if (!approvalDate || typeof approvalDate !== 'string' || !approvalDate.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Approval date is required',
      });
    }

    if (!source || typeof source !== 'string' || !source.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Source URL is required',
      });
    }

    const licensingAuthority = await LicensingAuthority.create({
      vaccineName: vaccineName.trim(),
      regulatory_authority_or_country: regulatory_authority_or_country.trim(),
      type: type && typeof type === 'string' && type.trim() ? type.trim() : 'N/A',
      approvalDate: approvalDate.trim(),
      source: source.trim(),
      approval_route:
        approval_route && typeof approval_route === 'string' && approval_route.trim()
          ? approval_route.trim()
          : 'N/A',
      market_status:
        market_status && typeof market_status === 'string' && market_status.trim()
          ? market_status.trim()
          : 'N/A',
    });

    await updateLastUpdate('LicensingAuthority');

    res.status(201).json({
      success: true,
      message: 'Licensing authority created successfully',
      licensingAuthority: formatLicensingAuthorityDoc(licensingAuthority),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Update licensing authority
// @route   PUT /api/licensing-authorities/:id
// @access  Private/Admin
exports.updateLicensingAuthority = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const {
      vaccineName,
      regulatory_authority_or_country,
      type,
      approvalDate,
      source,
      approval_route,
      market_status,
    } = req.body;

    let licensingAuthority = await LicensingAuthority.findById(req.params.id);

    if (!licensingAuthority) {
      return res.status(404).json({
        success: false,
        message: 'Licensing authority not found',
      });
    }

    const updateData = {};
    if (vaccineName !== undefined && vaccineName !== null) {
      if (typeof vaccineName !== 'string' || !vaccineName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Vaccine name cannot be empty',
        });
      }
      updateData.vaccineName = vaccineName.trim();
    }
    if (regulatory_authority_or_country !== undefined && regulatory_authority_or_country !== null) {
      if (typeof regulatory_authority_or_country !== 'string' || !regulatory_authority_or_country.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Regulatory authority or country cannot be empty',
        });
      }
      updateData.regulatory_authority_or_country = regulatory_authority_or_country.trim();
    }
    if (type !== undefined && type !== null) {
      updateData.type = typeof type === 'string' && type.trim() ? type.trim() : 'N/A';
    }
    if (approvalDate !== undefined && approvalDate !== null) {
      if (typeof approvalDate !== 'string' || !approvalDate.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Approval date cannot be empty',
        });
      }
      updateData.approvalDate = approvalDate.trim();
    }
    if (source !== undefined && source !== null) {
      if (typeof source !== 'string' || !source.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Source URL cannot be empty',
        });
      }
      updateData.source = source.trim();
    }
    if (approval_route !== undefined && approval_route !== null) {
      updateData.approval_route =
        typeof approval_route === 'string' && approval_route.trim() ? approval_route.trim() : 'N/A';
    }
    if (market_status !== undefined && market_status !== null) {
      updateData.market_status =
        typeof market_status === 'string' && market_status.trim() ? market_status.trim() : 'N/A';
    }

    licensingAuthority = await LicensingAuthority.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    await updateLastUpdate('LicensingAuthority');

    res.status(200).json({
      success: true,
      message: 'Licensing authority updated successfully',
      licensingAuthority: formatLicensingAuthorityDoc(licensingAuthority),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// @desc    Delete licensing authority
// @route   DELETE /api/licensing-authorities/:id
// @access  Private/Admin
exports.deleteLicensingAuthority = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const licensingAuthority = await LicensingAuthority.findById(req.params.id);

    if (!licensingAuthority) {
      return res.status(404).json({
        success: false,
        message: 'Licensing authority not found',
      });
    }

    await LicensingAuthority.findByIdAndDelete(req.params.id);

    await updateLastUpdate('LicensingAuthority');

    res.status(200).json({
      success: true,
      message: 'Licensing authority deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
