const express = require('express');
const router = express.Router();
const {
  getManufacturerProducts,
  getManufacturerProduct,
  createManufacturerProduct,
  updateManufacturerProduct,
  deleteManufacturerProduct,
} = require('../controllers/manufacturerProductController');
const ManufacturerProduct = require('../models/ManufacturerProduct');
const { protect, authorize } = require('../middleware/auth');
const { coerceStringBody, requireFields } = require('../middleware/validate');
const { auditTrail } = require('../middleware/audit');
const { bulkDeleteFor } = require('../controllers/bulkController');

// GET routes - public access (no authentication)
router.route('/').get(getManufacturerProducts);
router.route('/:id').get(getManufacturerProduct);

// Writes - require authentication and admin role; every change is audited
router.use(protect);
router.use(authorize('admin'));
router.use(auditTrail('manufacturer-products', ManufacturerProduct));

router.post('/bulk-delete', bulkDeleteFor('manufacturer-products'));
router.route('/').post(coerceStringBody, requireFields('manufacturerName', 'productName'), createManufacturerProduct);
router.route('/:id').put(coerceStringBody, updateManufacturerProduct).delete(deleteManufacturerProduct);

module.exports = router;
