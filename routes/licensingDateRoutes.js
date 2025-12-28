const express = require('express');
const router = express.Router();
const {
  getLicensingDates,
  getLicensingDate,
  createLicensingDate,
  updateLicensingDate,
  deleteLicensingDate,
} = require('../controllers/licensingDateController');
const { protect, authorize } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

// GET routes - public access (no authentication) with caching
router.route('/').get(cacheMiddleware(3600), getLicensingDates);
router.route('/:id').get(cacheMiddleware(3600), getLicensingDate);

// POST, PUT, DELETE routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/').post(createLicensingDate);
router.route('/:id').put(updateLicensingDate).delete(deleteLicensingDate);

module.exports = router;

