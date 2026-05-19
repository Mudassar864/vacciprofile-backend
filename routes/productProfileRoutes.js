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

// GET routes - public access (no authentication)
router.route('/').get(getProductProfiles);
router.route('/:id').get(getProductProfile);

// POST, PUT, DELETE routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/').post(createProductProfile);
router.route('/:id').put(updateProductProfile).delete(deleteProductProfile);

module.exports = router;

