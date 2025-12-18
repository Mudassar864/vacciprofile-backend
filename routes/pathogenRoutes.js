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

// GET routes - public access (no authentication)
router.route('/populated').get(getPathogensPopulated);
router.route('/:id/populated').get(getPathogenPopulated);
router.route('/').get(getPathogens);
router.route('/:id').get(getPathogen);

// POST, PUT, DELETE routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/').post(createPathogen);
router.route('/:id').put(updatePathogen).delete(deletePathogen);

module.exports = router;

