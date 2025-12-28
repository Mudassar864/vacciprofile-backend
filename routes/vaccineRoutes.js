const express = require('express');
const router = express.Router();
const {
  getVaccines,
  getVaccine,
  createVaccine,
  updateVaccine,
  deleteVaccine,
  getVaccinesPopulated,
  getVaccinePopulated,
} = require('../controllers/vaccineController');
const { protect, authorize } = require('../middleware/auth');
const { cacheMiddleware, clearCache } = require('../middleware/cache');

// GET routes - public access (no authentication) with caching
// Cache populated endpoints for 30 minutes (1800 seconds)
router.route('/populated').get(cacheMiddleware(1800), getVaccinesPopulated);
router.route('/:id/populated').get(cacheMiddleware(1800), getVaccinePopulated);
// Cache regular endpoints for 1 hour (3600 seconds)
router.route('/').get(cacheMiddleware(3600), getVaccines);
router.route('/:id').get(cacheMiddleware(3600), getVaccine);

// POST, PUT, DELETE routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/').post(createVaccine);
router.route('/:id').put(updateVaccine).delete(deleteVaccine);

module.exports = router;

