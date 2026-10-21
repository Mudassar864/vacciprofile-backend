const mongoose = require('mongoose');
const ActivityLog = require('../models/ActivityLog');
const LastUpdate = require('../models/LastUpdate');
const User = require('../models/User');
const Vaccine = require('../models/Vaccine');
const LicensingAuthority = require('../models/LicensingAuthority');
const ProductProfile = require('../models/ProductProfile');
const Manufacturer = require('../models/Manufacturer');
const ManufacturerProduct = require('../models/ManufacturerProduct');
const ManufacturerSource = require('../models/ManufacturerSource');
const ManufacturerCandidate = require('../models/ManufacturerCandidate');
const { resources, userResource, optionFields, getResource } = require('../utils/resourceRegistry');
const { buildSearchFilter, parsePaginationQuery, buildPaginationMeta, combineFilters } = require('../utils/pagination');
const { getPublicCacheStats } = require('../middleware/publicCache');
const { handleError, HttpError } = require('../utils/httpErrors');

const DAY_MS = 24 * 60 * 60 * 1000;

function formatActivity(entry) {
  return {
    id: entry._id.toString(),
    action: entry.action,
    entity: entry.entity,
    entityId: entry.entityId,
    label: entry.label,
    userId: entry.user ? entry.user.toString() : null,
    userName: entry.userName,
    userEmail: entry.userEmail,
    meta: entry.meta || null,
    createdAt: entry.createdAt,
  };
}

// @desc    Dashboard numbers: per-resource counts, users, recent activity, freshness
// @route   GET /api/admin/stats
// @access  Admin
exports.getStats = async (req, res) => {
  try {
    const entries = Object.entries(resources);
    // UTC midnight, so the day keys line up with $dateToString (which formats in UTC).
    const since = new Date(Date.now() - 13 * DAY_MS);
    since.setUTCHours(0, 0, 0, 0);

    const [counts, userTotals, lastUpdates, recent, perDay] = await Promise.all([
      Promise.all(entries.map(([, r]) => r.Model.estimatedDocumentCount())),
      User.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: { $sum: { $cond: ['$isActive', 1, 0] } },
            admins: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
          },
        },
      ]),
      LastUpdate.find().lean(),
      ActivityLog.find().sort({ createdAt: -1 }).limit(12).lean(),
      ActivityLog.aggregate([
        { $match: { createdAt: { $gte: since }, action: { $nin: ['login'] } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const lastUpdatedByModel = Object.fromEntries(lastUpdates.map((u) => [u.modelName, u.lastUpdatedAt]));

    const resourceStats = entries.map(([key, r], i) => ({
      key,
      title: r.title,
      count: counts[i],
      lastUpdatedAt: lastUpdatedByModel[r.modelName] || null,
    }));

    const perDayMap = Object.fromEntries(perDay.map((d) => [d._id, d.count]));
    const activityByDay = [];
    for (let i = 0; i < 14; i += 1) {
      const day = new Date(since.getTime() + i * DAY_MS);
      const key = day.toISOString().slice(0, 10);
      activityByDay.push({ date: key, count: perDayMap[key] || 0 });
    }

    const users = userTotals[0] || { total: 0, active: 0, admins: 0 };

    res.status(200).json({
      success: true,
      resources: resourceStats,
      totalRecords: resourceStats.reduce((sum, r) => sum + r.count, 0),
      users: { total: users.total, active: users.active, admins: users.admins },
      recentActivity: recent.map(formatActivity),
      activityByDay,
      system: {
        uptimeSeconds: Math.round(process.uptime()),
        node: process.version,
        memoryMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        dbState: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        cache: getPublicCacheStats(),
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Search every content type at once (command palette)
// @route   GET /api/admin/search?q=
// @access  Admin
exports.globalSearch = async (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (q.length < 2) {
      return res.status(200).json({ success: true, query: q, groups: [] });
    }
    const perGroup = Math.min(10, Math.max(1, parseInt(req.query.limit, 10) || 5));

    const searchable = [...Object.entries(resources), ['users', userResource]];
    const results = await Promise.all(
      searchable.map(([, r]) =>
        r.Model.find(buildSearchFilter(q, r.searchFields))
          .select(`${r.label} ${r.subtitle}`)
          .sort({ [r.label]: 1 })
          .limit(perGroup)
          .lean()
      )
    );

    const groups = searchable
      .map(([key, r], i) => ({
        resource: key,
        title: r.title,
        items: results[i].map((doc) => ({
          id: doc._id.toString(),
          label: doc[r.label] || '(untitled)',
          subtitle: doc[r.subtitle] || '',
        })),
      }))
      .filter((g) => g.items.length > 0);

    res.status(200).json({ success: true, query: q, groups });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Distinct values for dropdowns / autocomplete (light-weight, names only)
// @route   GET /api/admin/options/:resource?field=name
// @access  Admin
exports.getOptions = async (req, res) => {
  try {
    const key = req.params.resource;
    const resource = getResource(key);
    const allowed = optionFields[key];
    if (!resource || !allowed) throw new HttpError(404, 'Unknown resource');

    const field = typeof req.query.field === 'string' && req.query.field ? req.query.field : allowed[0];
    if (!allowed.includes(field)) {
      throw new HttpError(400, `field must be one of: ${allowed.join(', ')}`);
    }

    const values = await resource.Model.distinct(field);
    const options = [...new Set(
      values
        .filter((v) => typeof v === 'string')
        .map((v) => v.trim())
        .filter((v) => v && v.toUpperCase() !== 'N/A')
    )].sort((a, b) => a.localeCompare(b));

    res.status(200).json({ success: true, resource: key, field, count: options.length, options });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Audit trail with filters
// @route   GET /api/admin/activity?entity=&action=&user=&page=&limit=
// @access  Admin
exports.getActivity = async (req, res) => {
  try {
    const { entity, action, user, from, to } = req.query;
    const filter = {};
    if (typeof entity === 'string' && entity) filter.entity = entity;
    if (typeof action === 'string' && action) filter.action = action;
    if (typeof user === 'string' && mongoose.Types.ObjectId.isValid(user)) filter.user = user;
    const range = {};
    if (from && !Number.isNaN(Date.parse(from))) range.$gte = new Date(from);
    if (to && !Number.isNaN(Date.parse(to))) range.$lte = new Date(to);
    if (Object.keys(range).length) filter.createdAt = range;

    const finalFilter = combineFilters(
      filter,
      buildSearchFilter(req.query.search, ['label', 'userName', 'userEmail', 'entity'])
    );

    const pagination = parsePaginationQuery({ page: 1, limit: 25, ...req.query });
    const [items, total] = await Promise.all([
      ActivityLog.find(finalFilter)
        .sort({ createdAt: -1 })
        .skip(pagination.skip)
        .limit(pagination.limit)
        .lean(),
      ActivityLog.countDocuments(finalFilter),
    ]);

    res.status(200).json({
      success: true,
      count: total,
      activity: items.map(formatActivity),
      pagination: buildPaginationMeta(total, pagination.page, pagination.limit),
    });
  } catch (error) {
    handleError(res, error);
  }
};

const SAMPLE = 25;

function missingFrom(values, known) {
  const knownSet = new Set(known.filter(Boolean).map((v) => v.trim().toLowerCase()));
  return values
    .filter((v) => typeof v === 'string' && v.trim())
    .filter((v) => !knownSet.has(v.trim().toLowerCase()));
}

// @desc    Data-quality report: rows that reference records which do not exist
// @route   GET /api/admin/integrity
// @access  Admin
exports.getIntegrity = async (req, res) => {
  try {
    const [
      vaccineNames,
      manufacturerNames,
      licensingVaccineNames,
      profileVaccineNames,
      productManufacturers,
      sourceManufacturers,
      candidateManufacturers,
    ] = await Promise.all([
      Vaccine.distinct('name'),
      Manufacturer.distinct('name'),
      LicensingAuthority.distinct('vaccineName'),
      ProductProfile.distinct('vaccineName'),
      ManufacturerProduct.distinct('manufacturerName'),
      ManufacturerSource.distinct('manufacturerName'),
      ManufacturerCandidate.distinct('manufacturer'),
    ]);

    const licensingOrphans = missingFrom(licensingVaccineNames, vaccineNames);
    const profileOrphans = missingFrom(profileVaccineNames, vaccineNames);
    const productOrphans = missingFrom(productManufacturers, manufacturerNames);
    const sourceOrphans = missingFrom(sourceManufacturers, manufacturerNames);
    const candidateOrphans = missingFrom(candidateManufacturers, manufacturerNames);
    const vaccinesWithoutLicensing = missingFrom(vaccineNames, licensingVaccineNames);

    const [licensingRows, profileRows, productRows, sourceRows] = await Promise.all([
      licensingOrphans.length ? LicensingAuthority.countDocuments({ vaccineName: { $in: licensingOrphans } }) : 0,
      profileOrphans.length ? ProductProfile.countDocuments({ vaccineName: { $in: profileOrphans } }) : 0,
      productOrphans.length ? ManufacturerProduct.countDocuments({ manufacturerName: { $in: productOrphans } }) : 0,
      sourceOrphans.length ? ManufacturerSource.countDocuments({ manufacturerName: { $in: sourceOrphans } }) : 0,
    ]);

    const check = (key, title, description, resource, names, rows, severity = 'warning') => ({
      key,
      title,
      description,
      resource,
      severity,
      count: rows ?? names.length,
      distinctNames: names.length,
      sample: names.slice(0, SAMPLE),
    });

    const checks = [
      check(
        'licensing-orphans',
        'Licensing rows for unknown vaccines',
        'Licensing authority rows whose vaccine name does not match any vaccine record.',
        'licensing-authorities',
        licensingOrphans,
        licensingRows,
        'error'
      ),
      check(
        'profile-orphans',
        'Product profiles for unknown vaccines',
        'Product profiles whose vaccine name does not match any vaccine record.',
        'product-profiles',
        profileOrphans,
        profileRows,
        'error'
      ),
      check(
        'product-orphans',
        'Products for unknown manufacturers',
        'Manufacturer products whose manufacturer name does not match any manufacturer.',
        'manufacturer-products',
        productOrphans,
        productRows
      ),
      check(
        'source-orphans',
        'Sources for unknown manufacturers',
        'Manufacturer sources whose manufacturer name does not match any manufacturer.',
        'manufacturer-sources',
        sourceOrphans,
        sourceRows
      ),
      check(
        'candidate-orphans',
        'Candidates with unknown manufacturers',
        'Vaccine candidates naming a manufacturer that has no manufacturer record.',
        'manufacturer-candidates',
        candidateOrphans
      ),
      check(
        'vaccines-unlicensed',
        'Vaccines without licensing rows',
        'Vaccines that have no licensing authority entries yet.',
        'vaccines',
        vaccinesWithoutLicensing,
        undefined,
        'info'
      ),
    ];

    res.status(200).json({
      success: true,
      generatedAt: new Date().toISOString(),
      issues: checks.filter((c) => c.severity !== 'info').reduce((sum, c) => sum + c.count, 0),
      checks,
    });
  } catch (error) {
    handleError(res, error);
  }
};
