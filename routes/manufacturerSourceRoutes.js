const express = require('express');
const router = express.Router();
const {
  getManufacturerSources,
  getManufacturerSource,
  createManufacturerSource,
  updateManufacturerSource,
  deleteManufacturerSource,
} = require('../controllers/manufacturerSourceController');
const ManufacturerSource = require('../models/ManufacturerSource');
const { protect, authorize } = require('../middleware/auth');
const { coerceStringBody, requireFields } = require('../middleware/validate');
const { auditTrail } = require('../middleware/audit');
const { bulkDeleteFor } = require('../controllers/bulkController');

// GET routes - public access (no authentication)
router.route('/').get(getManufacturerSources);
router.route('/:id').get(getManufacturerSource);

// Writes - require authentication and admin role; every change is audited
router.use(protect);
router.use(authorize('admin'));
router.use(auditTrail('manufacturer-sources', ManufacturerSource));

router.post('/bulk-delete', bulkDeleteFor('manufacturer-sources'));
router.route('/').post(coerceStringBody, requireFields('manufacturerName', 'title', 'link'), createManufacturerSource);
router.route('/:id').put(coerceStringBody, updateManufacturerSource).delete(deleteManufacturerSource);

module.exports = router;
