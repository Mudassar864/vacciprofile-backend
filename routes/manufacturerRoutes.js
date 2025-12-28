const express = require('express');
const router = express.Router();
const {
  getManufacturers,
  getManufacturer,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer,
  getManufacturersPopulated,
  getManufacturerPopulated,
} = require('../controllers/manufacturerController');
const { protect, authorize } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

// GET routes - public access (no authentication) with caching
router.route('/populated').get(cacheMiddleware(1800), getManufacturersPopulated);
router.route('/:id/populated').get(cacheMiddleware(1800), getManufacturerPopulated);
router.route('/').get(cacheMiddleware(3600), getManufacturers);
router.route('/:id').get(cacheMiddleware(3600), getManufacturer);

// POST, PUT, DELETE routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/').post(createManufacturer);
router.route('/:id').put(updateManufacturer).delete(deleteManufacturer);

module.exports = router;

