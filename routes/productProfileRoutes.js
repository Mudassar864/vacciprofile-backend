const express = require('express');
const router = express.Router();
const {
  getProductProfiles,
  getProductProfile,
  createProductProfile,
  updateProductProfile,
  deleteProductProfile,
} = require('../controllers/productProfileController');
const ProductProfile = require('../models/ProductProfile');
const { protect, authorize } = require('../middleware/auth');
const { coerceStringBody, requireFields } = require('../middleware/validate');
const { auditTrail } = require('../middleware/audit');
const { bulkDeleteFor } = require('../controllers/bulkController');

// GET routes - public access (no authentication)
router.route('/').get(getProductProfiles);
router.route('/:id').get(getProductProfile);

// Writes - require authentication and admin role; every change is audited
router.use(protect);
router.use(authorize('admin'));
router.use(auditTrail('product-profiles', ProductProfile));

router.post('/bulk-delete', bulkDeleteFor('product-profiles'));
router.route('/').post(coerceStringBody, requireFields('vaccineName', 'type', 'name'), createProductProfile);
router.route('/:id').put(coerceStringBody, updateProductProfile).delete(deleteProductProfile);

module.exports = router;
