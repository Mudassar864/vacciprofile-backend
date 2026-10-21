const express = require('express');
const router = express.Router();
const {
  getManufacturerCandidatesTempFullTree,
  getManufacturerCandidates,
  getManufacturerCandidate,
  createManufacturerCandidate,
  updateManufacturerCandidate,
  deleteManufacturerCandidate,
} = require('../controllers/manufacturerCandidateController');
const ManufacturerCandidate = require('../models/ManufacturerCandidate');
const { protect, authorize } = require('../middleware/auth');
const { coerceStringBody, requireFields } = require('../middleware/validate');
const { auditTrail } = require('../middleware/audit');
const { bulkDeleteFor } = require('../controllers/bulkController');
const { heavyLimiter } = require('../middleware/rateLimits');

// GET routes - public access (no authentication)
// TEMPORARY tree export (HTML/PDF via Puppeteer) — rate limited because it is expensive
router.route('/temp-full-tree').get(heavyLimiter, getManufacturerCandidatesTempFullTree);
router.route('/').get(getManufacturerCandidates);
router.route('/:id').get(getManufacturerCandidate);

// Writes - require authentication and admin role; every change is audited
router.use(protect);
router.use(authorize('admin'));
router.use(auditTrail('manufacturer-candidates', ManufacturerCandidate));

router.post('/bulk-delete', bulkDeleteFor('manufacturer-candidates'));
router.route('/').post(coerceStringBody, requireFields('pathogenName', 'name'), createManufacturerCandidate);
router.route('/:id').put(coerceStringBody, updateManufacturerCandidate).delete(deleteManufacturerCandidate);

module.exports = router;
