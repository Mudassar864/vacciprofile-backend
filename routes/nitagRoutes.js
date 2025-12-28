const express = require('express');
const router = express.Router();
const {
  getNITAGs,
  getNITAG,
  createNITAG,
  updateNITAG,
  deleteNITAG,
} = require('../controllers/nitagController');
const { protect, authorize } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

// GET routes - public access (no authentication) with caching
router.route('/').get(cacheMiddleware(3600), getNITAGs);
router.route('/:id').get(cacheMiddleware(3600), getNITAG);

// POST, PUT, DELETE routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/').post(createNITAG);
router.route('/:id').put(updateNITAG).delete(deleteNITAG);

module.exports = router;

