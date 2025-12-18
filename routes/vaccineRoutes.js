const express = require('express');
const router = express.Router();
const {
  getVaccines,
  getVaccine,
  createVaccine,
  updateVaccine,
  deleteVaccine,
  getVaccinesPopulated,
  getVaccinePopulated,
} = require('../controllers/vaccineController');
const { protect, authorize } = require('../middleware/auth');

// GET routes - public access (no authentication)
router.route('/populated').get(getVaccinesPopulated);
router.route('/:id/populated').get(getVaccinePopulated);
router.route('/').get(getVaccines);
router.route('/:id').get(getVaccine);

// POST, PUT, DELETE routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/').post(createVaccine);
router.route('/:id').put(updateVaccine).delete(deleteVaccine);

module.exports = router;

