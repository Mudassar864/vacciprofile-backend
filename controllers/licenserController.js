const Licenser = require('../models/Licenser');
const mongoose = require('mongoose');
const { updateLastUpdate } = require('./lastUpdateController');
const { buildListOptions, paginateQuery } = require('../utils/pagination');
const { handleError } = require('../utils/httpErrors');

// @desc    Get all licensers
// @route   GET /api/licensers
// @access  Private/Admin
exports.getLicensers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.region) filter.region = String(req.query.region);
    const { filter: query, sort, pagination } = buildListOptions(req.query, {
      searchFields: ['acronym', 'fullName', 'country', 'region', 'parentOrganisation'],
      sortFields: ['acronym', 'fullName', 'country', 'region', 'createdAt', 'updatedAt'],
      defaultSort: { acronym: 1 },
      filter,
    });
    const { docs: licensers, total, pagination: paginationMeta } = await paginateQuery(
      Licenser,
      query,
      sort,
      pagination
    );

    const formatted = licensers.map((l) => ({
      id: l._id.toString(),
      acronym: l.acronym,
      region: l.region,
      country: l.country,
      fullName: l.fullName,
      parentOrganisation: l.parentOrganisation || '',
      description: l.description,
      approvalRoute: l.approvalRoute || '',
      vaccineRegulatoryRole: l.vaccineRegulatoryRole || '',
      regulatoryModel: l.regulatoryModel || '',
      website: l.website,
      regulatorySource: l.regulatorySource || '',
      createdAt: l.createdAt,
      updatedAt: l.updatedAt,
    }));

    const payload = {
      success: true,
      count: pagination.enabled ? total : formatted.length,
      licensers: formatted,
    };
    if (paginationMeta) payload.pagination = paginationMeta;

    res.status(200).json(payload);
  } catch (error) {
    handleError(res, error);
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
        parentOrganisation: licenser.parentOrganisation || '',
        description: licenser.description,
        approvalRoute: licenser.approvalRoute || '',
        vaccineRegulatoryRole: licenser.vaccineRegulatoryRole || '',
        regulatoryModel: licenser.regulatoryModel || '',
        website: licenser.website,
        regulatorySource: licenser.regulatorySource || '',
        createdAt: licenser.createdAt,
        updatedAt: licenser.updatedAt,
      },
    });
  } catch (error) {
    handleError(res, error);
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
      parentOrganisation,
      description,
      approvalRoute,
      vaccineRegulatoryRole,
      regulatoryModel,
      website,
      regulatorySource,
    } = req.body;

    const query = { acronym: acronym.trim() };
    if (country && country.trim()) {
      query.country = country.trim();
    }
    const licenserExists = await Licenser.findOne(query);

    if (licenserExists) {
      return res.status(400).json({
        success: false,
        message: 'Licenser with this acronym and country already exists',
      });
    }

    const licenser = await Licenser.create({
      acronym: acronym.trim(),
      region: region ? region.trim() : '',
      country: country ? country.trim() : '',
      fullName: fullName ? fullName.trim() : acronym.trim(),
      parentOrganisation: parentOrganisation ? parentOrganisation.trim() : '',
      description: description ? description.trim() : '',
      approvalRoute: approvalRoute ? approvalRoute.trim() : '',
      vaccineRegulatoryRole: vaccineRegulatoryRole ? vaccineRegulatoryRole.trim() : '',
      regulatoryModel: regulatoryModel ? regulatoryModel.trim() : '',
      website: website ? website.trim() : '',
      regulatorySource: regulatorySource ? regulatorySource.trim() : '',
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
        parentOrganisation: licenser.parentOrganisation || '',
        description: licenser.description,
        approvalRoute: licenser.approvalRoute || '',
        vaccineRegulatoryRole: licenser.vaccineRegulatoryRole || '',
        regulatoryModel: licenser.regulatoryModel || '',
        website: licenser.website,
        regulatorySource: licenser.regulatorySource || '',
        createdAt: licenser.createdAt,
        updatedAt: licenser.updatedAt,
      },
    });
  } catch (error) {
    handleError(res, error);
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

    // Prepare update object - only include fields that are provided
    const updateData = {};
    const fields = [
      'acronym',
      'region',
      'country',
      'fullName',
      'parentOrganisation',
      'description',
      'approvalRoute',
      'vaccineRegulatoryRole',
      'regulatoryModel',
      'website',
      'regulatorySource',
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
        parentOrganisation: licenser.parentOrganisation || '',
        description: licenser.description,
        approvalRoute: licenser.approvalRoute || '',
        vaccineRegulatoryRole: licenser.vaccineRegulatoryRole || '',
        regulatoryModel: licenser.regulatoryModel || '',
        website: licenser.website,
        regulatorySource: licenser.regulatorySource || '',
        createdAt: licenser.createdAt,
        updatedAt: licenser.updatedAt,
      },
    });
  } catch (error) {
    handleError(res, error);
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
    handleError(res, error);
  }
};

