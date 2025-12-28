const express = require('express');
const router = express.Router();
const {
  getManufacturerSources,
  getManufacturerSource,
  createManufacturerSource,
  updateManufacturerSource,
  deleteManufacturerSource,
} = require('../controllers/manufacturerSourceController');
const { protect, authorize } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

// GET routes - public access (no authentication) with caching
router.route('/').get(cacheMiddleware(3600), getManufacturerSources);
router.route('/:id').get(cacheMiddleware(3600), getManufacturerSource);

// POST, PUT, DELETE routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/').post(createManufacturerSource);
router.route('/:id').put(updateManufacturerSource).delete(deleteManufacturerSource);

module.exports = router;

