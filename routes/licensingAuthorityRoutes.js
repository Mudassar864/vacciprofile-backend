const express = require('express');
const router = express.Router();
const {
  getLicensingAuthorities,
  getLicensingAuthority,
  getUniqueLicenserNames,
  getVaccinesForAuthority,
  getCountryCounts,
  createLicensingAuthority,
  updateLicensingAuthority,
  deleteLicensingAuthority,
  migrateSplitFields,
} = require('../controllers/licensingAuthorityController');
const LicensingAuthority = require('../models/LicensingAuthority');
const { protect, authorize } = require('../middleware/auth');
const { coerceStringBody } = require('../middleware/validate');
const { auditTrail } = require('../middleware/audit');
const { bulkDeleteFor } = require('../controllers/bulkController');

// GET routes - public access (no authentication)
router.route('/').get(getLicensingAuthorities);
router.route('/stats/unique-licenser-names').get(getUniqueLicenserNames);
router.route('/vaccines-for-authority').get(getVaccinesForAuthority);
router.route('/country-counts').get(getCountryCounts);
router.route('/:id').get(getLicensingAuthority);

// Writes - require authentication and admin role; every change is audited
router.use(protect);
router.use(authorize('admin'));
router.use(auditTrail('licensing-authorities', LicensingAuthority));

router.post('/migrate-split-fields', migrateSplitFields);
router.post('/bulk-delete', bulkDeleteFor('licensing-authorities'));
router.route('/').post(coerceStringBody, createLicensingAuthority);
router.route('/:id').put(coerceStringBody, updateLicensingAuthority).delete(deleteLicensingAuthority);

module.exports = router;
