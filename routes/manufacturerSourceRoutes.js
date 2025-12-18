const express = require('express');
const router = express.Router();
const {
  getManufacturerSources,
  getManufacturerSource,
  createManufacturerSource,
  updateManufacturerSource,
  deleteManufacturerSource,
} = require('../controllers/manufacturerSourceController');
const { protect, authorize } = require('../middleware/auth');

// GET routes - public access (no authentication)
router.route('/').get(getManufacturerSources);
router.route('/:id').get(getManufacturerSource);

// POST, PUT, DELETE routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/').post(createManufacturerSource);
router.route('/:id').put(updateManufacturerSource).delete(deleteManufacturerSource);

module.exports = router;

