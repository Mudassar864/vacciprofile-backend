const express = require('express');
const router = express.Router();
const {
  getLicensers,
  getLicenser,
  createLicenser,
  updateLicenser,
  deleteLicenser,
} = require('../controllers/licenserController');
const Licenser = require('../models/Licenser');
const { protect, authorize } = require('../middleware/auth');
const { coerceStringBody, requireFields } = require('../middleware/validate');
const { auditTrail } = require('../middleware/audit');
const { bulkDeleteFor } = require('../controllers/bulkController');

// GET routes - public access (no authentication)
router.route('/').get(getLicensers);
router.route('/:id').get(getLicenser);

// Writes - require authentication and admin role; every change is audited
router.use(protect);
router.use(authorize('admin'));
router.use(auditTrail('licensers', Licenser));

router.post('/bulk-delete', bulkDeleteFor('licensers'));
router.route('/').post(coerceStringBody, requireFields('acronym', 'fullName'), createLicenser);
router.route('/:id').put(coerceStringBody, updateLicenser).delete(deleteLicenser);

module.exports = router;
