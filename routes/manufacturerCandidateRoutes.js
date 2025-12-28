const express = require('express');
const router = express.Router();
const {
  getManufacturerCandidates,
  getManufacturerCandidate,
  createManufacturerCandidate,
  updateManufacturerCandidate,
  deleteManufacturerCandidate,
} = require('../controllers/manufacturerCandidateController');
const { protect, authorize } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

// GET routes - public access (no authentication) with caching
router.route('/').get(cacheMiddleware(3600), getManufacturerCandidates);
router.route('/:id').get(cacheMiddleware(3600), getManufacturerCandidate);

// POST, PUT, DELETE routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/').post(createManufacturerCandidate);
router.route('/:id').put(updateManufacturerCandidate).delete(deleteManufacturerCandidate);

module.exports = router;

