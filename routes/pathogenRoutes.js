const express = require('express');
const router = express.Router();
const {
  getPathogens,
  getPathogen,
  createPathogen,
  updatePathogen,
  deletePathogen,
  getPathogensPopulated,
  getPathogenPopulated,
} = require('../controllers/pathogenController');
const { protect, authorize } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

// GET routes - public access (no authentication) with caching
router.route('/populated').get(cacheMiddleware(1800), getPathogensPopulated);
router.route('/:id/populated').get(cacheMiddleware(1800), getPathogenPopulated);
router.route('/').get(cacheMiddleware(3600), getPathogens);
router.route('/:id').get(cacheMiddleware(3600), getPathogen);

// POST, PUT, DELETE routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/').post(createPathogen);
router.route('/:id').put(updatePathogen).delete(deletePathogen);

module.exports = router;

