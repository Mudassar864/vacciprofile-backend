const express = require('express');
const router = express.Router();
const {
  getManufacturers,
  getManufacturer,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer,
  getManufacturersPopulated,
  getManufacturerPopulated,
} = require('../controllers/manufacturerController');
const { protect, authorize } = require('../middleware/auth');

// GET routes - public access (no authentication)
router.route('/populated').get(getManufacturersPopulated);
router.route('/:id/populated').get(getManufacturerPopulated);
router.route('/').get(getManufacturers);
router.route('/:id').get(getManufacturer);

// POST, PUT, DELETE routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/').post(createManufacturer);
router.route('/:id').put(updateManufacturer).delete(deleteManufacturer);

module.exports = router;

