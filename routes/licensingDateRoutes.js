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

// GET routes - public access (no authentication)
router.route('/').get(getLicensingDates);
router.route('/:id').get(getLicensingDate);

// POST, PUT, DELETE routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/').post(createLicensingDate);
router.route('/:id').put(updateLicensingDate).delete(deleteLicensingDate);

module.exports = router;

