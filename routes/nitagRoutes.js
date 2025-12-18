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

// GET routes - public access (no authentication)
router.route('/').get(getNITAGs);
router.route('/:id').get(getNITAG);

// POST, PUT, DELETE routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/').post(createNITAG);
router.route('/:id').put(updateNITAG).delete(deleteNITAG);

module.exports = router;

