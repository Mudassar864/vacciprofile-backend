const ManufacturerProduct = require('../models/ManufacturerProduct');
const mongoose = require('mongoose');
const { updateLastUpdate } = require('./lastUpdateController');
const { buildListOptions, paginateQuery } = require('../utils/pagination');
const { handleError } = require('../utils/httpErrors');

// @desc    Get all manufacturer products
// @route   GET /api/manufacturer-products
// @access  Private/Admin
exports.getManufacturerProducts = async (req, res) => {
  try {
    const { manufacturerName } = req.query;
    const { filter: query, sort, pagination } = buildListOptions(req.query, {
      searchFields: ['productName', 'manufacturerName', 'productDescription'],
      sortFields: ['productName', 'manufacturerName', 'createdAt', 'updatedAt'],
      defaultSort: { manufacturerName: 1, productName: 1 },
      filter: manufacturerName ? { manufacturerName } : {},
    });
    const { docs: products, total, pagination: paginationMeta } = await paginateQuery(
      ManufacturerProduct,
      query,
      sort,
      pagination
    );

    const formatted = products.map((item) => ({
      id: item._id.toString(),
      manufacturerName: item.manufacturerName,
      productName: item.productName,
      productDescription: item.productDescription,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    const payload = {
      success: true,
      count: pagination.enabled ? total : formatted.length,
      products: formatted,
    };
    if (paginationMeta) payload.pagination = paginationMeta;

    res.status(200).json(payload);
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Get single manufacturer product
// @route   GET /api/manufacturer-products/:id
// @access  Private/Admin
exports.getManufacturerProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const product = await ManufacturerProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      product: {
        id: product._id.toString(),
        manufacturerName: product.manufacturerName,
        productName: product.productName,
        productDescription: product.productDescription,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Create manufacturer product
// @route   POST /api/manufacturer-products
// @access  Private/Admin
exports.createManufacturerProduct = async (req, res) => {
  try {
    const { manufacturerName, productName, productDescription } = req.body;

    const product = await ManufacturerProduct.create({
      manufacturerName: manufacturerName.trim(),
      productName: productName.trim(),
      productDescription: productDescription ? productDescription.trim() : '',
    });

    await updateLastUpdate('ManufacturerProduct');

    res.status(201).json({
      success: true,
      message: 'Manufacturer product created successfully',
      product: {
        id: product._id.toString(),
        manufacturerName: product.manufacturerName,
        productName: product.productName,
        productDescription: product.productDescription,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Update manufacturer product
// @route   PUT /api/manufacturer-products/:id
// @access  Private/Admin
exports.updateManufacturerProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const { manufacturerName, productName, productDescription } = req.body;

    let product = await ManufacturerProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    const updateData = {};
    if (manufacturerName !== undefined) updateData.manufacturerName = manufacturerName.trim();
    if (productName !== undefined) updateData.productName = productName.trim();
    if (productDescription !== undefined) updateData.productDescription = productDescription.trim();

    product = await ManufacturerProduct.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    await updateLastUpdate('ManufacturerProduct');

    res.status(200).json({
      success: true,
      message: 'Manufacturer product updated successfully',
      product: {
        id: product._id.toString(),
        manufacturerName: product.manufacturerName,
        productName: product.productName,
        productDescription: product.productDescription,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Delete manufacturer product
// @route   DELETE /api/manufacturer-products/:id
// @access  Private/Admin
exports.deleteManufacturerProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
      });
    }

    const product = await ManufacturerProduct.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    await ManufacturerProduct.findByIdAndDelete(req.params.id);

    await updateLastUpdate('ManufacturerProduct');

    res.status(200).json({
      success: true,
      message: 'Manufacturer product deleted successfully',
    });
  } catch (error) {
    handleError(res, error);
  }
};

