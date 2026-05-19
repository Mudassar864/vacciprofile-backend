const express = require('express');
const router = express.Router();
const {
  getLicensers,
  getLicenser,
  createLicenser,
  updateLicenser,
  deleteLicenser,
} = require('../controllers/licenserController');
const { protect, authorize } = require('../middleware/auth');

// GET routes - public access (no authentication)
router.route('/').get(getLicensers);
router.route('/:id').get(getLicenser);

// POST, PUT, DELETE routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/').post(createLicenser);
router.route('/:id').put(updateLicenser).delete(deleteLicenser);

module.exports = router;

