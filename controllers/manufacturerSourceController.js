const ManufacturerSource = require('../models/ManufacturerSource');
const mongoose = require('mongoose');
const { updateLastUpdate } = require('./lastUpdateController');
const { buildListOptions, paginateQuery } = require('../utils/pagination');
const { handleError } = require('../utils/httpErrors');

// @desc    Get all manufacturer sources
// @route   GET /api/manufacturer-sources
// @access  Private/Admin
exports.getManufacturerSources = async (req, res) => {
  try {
    const { manufacturerName } = req.query;
    const { filter: query, sort, pagination } = buildListOptions(req.query, {
      searchFields: ['title', 'manufacturerName', 'link'],
      sortFields: ['title', 'manufacturerName', 'lastUpdated', 'createdAt', 'updatedAt'],
      defaultSort: { manufacturerName: 1, title: 1 },
      filter: manufacturerName ? { manufacturerName } : {},
    });
    const { docs: sources, total, pagination: paginationMeta } = await paginateQuery(
      ManufacturerSource,
      query,
      sort,
      pagination
    );

    const formatted = sources.map((item) => ({
      id: item._id.toString(),
      manufacturerName: item.manufacturerName,
      lastUpdated: item.lastUpdated,
      title: item.title,
      link: item.link,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    const payload = {
      success: true,
      count: pagination.enabled ? total : formatted.length,
      sources: formatted,
    };
    if (paginationMeta) payload.pagination = paginationMeta;

    res.status(200).json(payload);
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Get single manufacturer source
// @route   GET /api/manufacturer-sources/:id
// @access  Private/Admin
exports.getManufacturerSource = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const source = await ManufacturerSource.findById(req.params.id);

    if (!source) {
      return res.status(404).json({
        success: false,
        message: 'Source not found',
      });
    }

    res.status(200).json({
      success: true,
      source: {
        id: source._id.toString(),
        manufacturerName: source.manufacturerName,
        lastUpdated: source.lastUpdated,
        title: source.title,
        link: source.link,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Create manufacturer source
// @route   POST /api/manufacturer-sources
// @access  Private/Admin
exports.createManufacturerSource = async (req, res) => {
  try {
    const { manufacturerName, lastUpdated, title, link } = req.body;

    const source = await ManufacturerSource.create({
      manufacturerName: manufacturerName.trim(),
      lastUpdated: lastUpdated ? String(lastUpdated).trim() : '',
      title: title.trim(),
      link: link.trim(),
    });

    await updateLastUpdate('ManufacturerSource');

    res.status(201).json({
      success: true,
      message: 'Manufacturer source created successfully',
      source: {
        id: source._id.toString(),
        manufacturerName: source.manufacturerName,
        lastUpdated: source.lastUpdated,
        title: source.title,
        link: source.link,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Update manufacturer source
// @route   PUT /api/manufacturer-sources/:id
// @access  Private/Admin
exports.updateManufacturerSource = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const { manufacturerName, lastUpdated, title, link } = req.body;

    let source = await ManufacturerSource.findById(req.params.id);

    if (!source) {
      return res.status(404).json({
        success: false,
        message: 'Source not found',
      });
    }

    const updateData = {};
    if (manufacturerName !== undefined) updateData.manufacturerName = manufacturerName.trim();
    if (lastUpdated !== undefined) updateData.lastUpdated = String(lastUpdated).trim();
    if (title !== undefined) updateData.title = title.trim();
    if (link !== undefined) updateData.link = link.trim();

    source = await ManufacturerSource.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    await updateLastUpdate('ManufacturerSource');

    res.status(200).json({
      success: true,
      message: 'Manufacturer source updated successfully',
      source: {
        id: source._id.toString(),
        manufacturerName: source.manufacturerName,
        lastUpdated: source.lastUpdated,
        title: source.title,
        link: source.link,
        createdAt: source.createdAt,
        updatedAt: source.updatedAt,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Delete manufacturer source
// @route   DELETE /api/manufacturer-sources/:id
// @access  Private/Admin
exports.deleteManufacturerSource = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const source = await ManufacturerSource.findById(req.params.id);

    if (!source) {
      return res.status(404).json({
        success: false,
        message: 'Source not found',
      });
    }

    await ManufacturerSource.findByIdAndDelete(req.params.id);

    await updateLastUpdate('ManufacturerSource');

    res.status(200).json({
      success: true,
      message: 'Manufacturer source deleted successfully',
    });
  } catch (error) {
    handleError(res, error);
  }
};

