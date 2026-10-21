const express = require('express');
const router = express.Router();
const {
  getVaccinesPopulated,
  getVaccinePopulated,
  getVaccines,
  getVaccine,
  createVaccine,
  updateVaccine,
  deleteVaccine,
} = require('../controllers/vaccineController');
const Vaccine = require('../models/Vaccine');
const { protect, authorize } = require('../middleware/auth');
const { coerceStringBody, requireFields } = require('../middleware/validate');
const { auditTrail } = require('../middleware/audit');
const { bulkDeleteFor } = require('../controllers/bulkController');

// GET routes - public access (no authentication)
router.route('/populated').get(getVaccinesPopulated);
router.route('/:id/populated').get(getVaccinePopulated);
router.route('/').get(getVaccines);
router.route('/:id').get(getVaccine);

// Writes - require authentication and admin role; every change is audited
router.use(protect);
router.use(authorize('admin'));
router.use(auditTrail('vaccines', Vaccine));

router.post('/bulk-delete', bulkDeleteFor('vaccines'));
router.route('/').post(coerceStringBody, requireFields('name', 'vaccineType', 'pathogenNames', 'manufacturerNames'), createVaccine);
router.route('/:id').put(coerceStringBody, updateVaccine).delete(deleteVaccine);

module.exports = router;
