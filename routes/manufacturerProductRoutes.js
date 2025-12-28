const express = require('express');
const router = express.Router();
const {
  getManufacturerProducts,
  getManufacturerProduct,
  createManufacturerProduct,
  updateManufacturerProduct,
  deleteManufacturerProduct,
} = require('../controllers/manufacturerProductController');
const { protect, authorize } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

// GET routes - public access (no authentication) with caching
router.route('/').get(cacheMiddleware(3600), getManufacturerProducts);
router.route('/:id').get(cacheMiddleware(3600), getManufacturerProduct);

// POST, PUT, DELETE routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/').post(createManufacturerProduct);
router.route('/:id').put(updateManufacturerProduct).delete(deleteManufacturerProduct);

module.exports = router;

