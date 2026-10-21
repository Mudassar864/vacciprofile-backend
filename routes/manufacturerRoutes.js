const express = require('express');
const router = express.Router();
const {
  getManufacturersPopulated,
  getManufacturerPopulated,
  getManufacturers,
  getManufacturer,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer,
} = require('../controllers/manufacturerController');
const Manufacturer = require('../models/Manufacturer');
const { protect, authorize } = require('../middleware/auth');
const { coerceStringBody, requireFields } = require('../middleware/validate');
const { auditTrail } = require('../middleware/audit');
const { bulkDeleteFor } = require('../controllers/bulkController');

// GET routes - public access (no authentication)
router.route('/populated').get(getManufacturersPopulated);
router.route('/:id/populated').get(getManufacturerPopulated);
router.route('/').get(getManufacturers);
router.route('/:id').get(getManufacturer);

// Writes - require authentication and admin role; every change is audited
router.use(protect);
router.use(authorize('admin'));
router.use(auditTrail('manufacturers', Manufacturer));

router.post('/bulk-delete', bulkDeleteFor('manufacturers'));
router.route('/').post(coerceStringBody, requireFields('name'), createManufacturer);
router.route('/:id').put(coerceStringBody, updateManufacturer).delete(deleteManufacturer);

module.exports = router;
