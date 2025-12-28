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
const { cacheMiddleware } = require('../middleware/cache');

// GET routes - public access (no authentication) with caching
router.route('/').get(cacheMiddleware(3600), getLicensers);
router.route('/:id').get(cacheMiddleware(3600), getLicenser);

// POST, PUT, DELETE routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/').post(createLicenser);
router.route('/:id').put(updateLicenser).delete(deleteLicenser);

module.exports = router;

