const express = require('express');
const router = express.Router();
const {
  getProductProfiles,
  getProductProfile,
  createProductProfile,
  updateProductProfile,
  deleteProductProfile,
} = require('../controllers/productProfileController');
const { protect, authorize } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

// GET routes - public access (no authentication) with caching
router.route('/').get(cacheMiddleware(3600), getProductProfiles);
router.route('/:id').get(cacheMiddleware(3600), getProductProfile);

// POST, PUT, DELETE routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/').post(createProductProfile);
router.route('/:id').put(updateProductProfile).delete(deleteProductProfile);

module.exports = router;

