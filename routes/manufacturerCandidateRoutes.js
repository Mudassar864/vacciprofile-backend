const express = require('express');
const router = express.Router();
const {
  getManufacturerCandidates,
  getManufacturerCandidate,
  createManufacturerCandidate,
  updateManufacturerCandidate,
  deleteManufacturerCandidate,
} = require('../controllers/manufacturerCandidateController');
const { protect, authorize } = require('../middleware/auth');

// GET routes - public access (no authentication)
router.route('/').get(getManufacturerCandidates);
router.route('/:id').get(getManufacturerCandidate);

// POST, PUT, DELETE routes - require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/').post(createManufacturerCandidate);
router.route('/:id').put(updateManufacturerCandidate).delete(deleteManufacturerCandidate);

module.exports = router;

