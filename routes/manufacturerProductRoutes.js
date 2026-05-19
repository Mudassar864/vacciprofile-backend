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

// GET routes - public access (no authentication)
router.route('/').get(getManufacturerProducts);
router.route('/:id').get(getManufacturerProduct);

// POST, PUT, DELETE routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/').post(createManufacturerProduct);
router.route('/:id').put(updateManufacturerProduct).delete(deleteManufacturerProduct);

module.exports = router;

