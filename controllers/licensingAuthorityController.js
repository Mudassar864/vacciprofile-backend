const LicensingAuthority = require('../models/LicensingAuthority');
const Vaccine = require('../models/Vaccine');
const mongoose = require('mongoose');
const { updateLastUpdate } = require('./lastUpdateController');
const { parsePaginationQuery, paginateQuery } = require('../utils/pagination');
const { formatLicensingAuthorityDoc } = require('../utils/formatLicensingAuthorityResponse');
const {
  parseLicensingAuthorityPayload,
  buildAuthorityMatchOrConditions,
  resolveLicensingAuthorityFields,
} = require('../utils/licensingAuthorityFields');

function buildLicensingAuthoritySearchQuery(search) {
  const term = typeof search === 'string' ? search.trim() : '';
  if (!term) return {};

  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = { $regex: escaped, $options: 'i' };

  return {
    $or: [
      { vaccineName: regex },
      { vaccine_regulatory_authority: regex },
      { regulatory_authority_or_country: regex },
      { vaccine_country: regex },
      { approvalDate: regex },
      { source: regex },
      { approval_route: regex },
      { market_status: regex },
    ],
  };
}

function buildLicensingAuthorityListQuery({ vaccineName, search } = {}) {
  const parts = [];
  if (vaccineName) {
    parts.push({ vaccineName });
  }
  const searchQuery = buildLicensingAuthoritySearchQuery(search);
  if (Object.keys(searchQuery).length > 0) {
    parts.push(searchQuery);
  }
  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0];
  return { $and: parts };
}

// @desc    Distinct regulatory authority names
// @route   GET /api/licensing-authorities/stats/unique-licenser-names
// @access  Public
exports.getUniqueLicenserNames = async (req, res) => {
  try {
    const [authorityNames, legacyNames] = await Promise.all([
      LicensingAuthority.distinct('vaccine_regulatory_authority'),
      LicensingAuthority.distinct('regulatory_authority_or_country'),
    ]);
    const trimmed = [...authorityNames, ...legacyNames]
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
    const { vaccineName, search } = req.query;
    const query = buildLicensingAuthorityListQuery({ vaccineName, search });
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

    const rows = await LicensingAuthority.find({
      $or: buildAuthorityMatchOrConditions(keys),
    }).sort({
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

function validateLicensingPayload(parsed) {
  if (!parsed.vaccineName) {
    return 'Vaccine name is required';
  }
  if (!parsed.approvalDate) {
    return 'Approval date is required';
  }
  return null;
}

// @desc    Create licensing authority
// @route   POST /api/licensing-authorities
// @access  Private/Admin
exports.createLicensingAuthority = async (req, res) => {
  try {
    const parsed = parseLicensingAuthorityPayload(req.body);
    const validationError = validateLicensingPayload(parsed);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const licensingAuthority = await LicensingAuthority.create({
      vaccineName: parsed.vaccineName,
      vaccine_regulatory_authority: parsed.vaccine_regulatory_authority,
      vaccine_country: parsed.vaccine_country,
      approvalDate: parsed.approvalDate,
      source: parsed.source,
      approval_route: parsed.approval_route,
      market_status: parsed.market_status,
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

    const existing = await LicensingAuthority.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Licensing authority not found',
      });
    }

    const merged = {
      ...existing.toObject(),
      ...req.body,
    };
    const parsed = parseLicensingAuthorityPayload(merged);
    const validationError = validateLicensingPayload(parsed);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const licensingAuthority = await LicensingAuthority.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          vaccineName: parsed.vaccineName,
          vaccine_regulatory_authority: parsed.vaccine_regulatory_authority,
          vaccine_country: parsed.vaccine_country,
          approvalDate: parsed.approvalDate,
          source: parsed.source,
          approval_route: parsed.approval_route,
          market_status: parsed.market_status,
        },
        $unset: { regulatory_authority_or_country: '', type: '' },
      },
      { new: true, runValidators: true }
    );

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

// @desc    Backfill vaccine_regulatory_authority + vaccine_country from legacy field
// @route   POST /api/licensing-authorities/migrate-split-fields
// @access  Admin
exports.migrateSplitFields = async (req, res) => {
  try {
    const docs = await LicensingAuthority.find({
      $or: [
        { vaccine_regulatory_authority: { $exists: false } },
        { vaccine_country: { $exists: false } },
        { vaccine_regulatory_authority: '' },
        { vaccine_country: '' },
      ],
    });

    let updated = 0;
    for (const doc of docs) {
      const { vaccine_regulatory_authority, vaccine_country } = resolveLicensingAuthorityFields(
        doc.toObject()
      );
      await LicensingAuthority.updateOne(
        { _id: doc._id },
        {
          $set: { vaccine_regulatory_authority, vaccine_country },
          $unset: { regulatory_authority_or_country: '' },
        }
      );
      updated += 1;
    }

    res.status(200).json({
      success: true,
      message: `Migrated ${updated} licensing authority records`,
      updated,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
