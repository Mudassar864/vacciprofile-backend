const express = require('express');
const router = express.Router();
const {
  getPathogensPopulated,
  getPathogensIndex,
  getPathogensTempFullTree,
  getPathogenPopulated,
  getPathogens,
  getPathogen,
  createPathogen,
  updatePathogen,
  deletePathogen,
} = require('../controllers/pathogenController');
const Pathogen = require('../models/Pathogen');
const { protect, authorize } = require('../middleware/auth');
const { coerceStringBody } = require('../middleware/validate');
const { auditTrail } = require('../middleware/audit');
const { bulkDeleteFor } = require('../controllers/bulkController');
const { heavyLimiter } = require('../middleware/rateLimits');

// GET routes - public access (no authentication)
router.route('/populated').get(getPathogensPopulated);
router.route('/index').get(getPathogensIndex);
// TEMPORARY tree export (HTML/PDF via Puppeteer) — rate limited because it is expensive
router.route('/temp-full-tree').get(heavyLimiter, getPathogensTempFullTree);
router.route('/:id/populated').get(getPathogenPopulated);
router.route('/').get(getPathogens);
router.route('/:id').get(getPathogen);

// Writes - require authentication and admin role; every change is audited
router.use(protect);
router.use(authorize('admin'));
router.use(auditTrail('pathogens', Pathogen));

router.post('/bulk-delete', bulkDeleteFor('pathogens'));
router.route('/').post(coerceStringBody, createPathogen);
router.route('/:id').put(coerceStringBody, updatePathogen).delete(deletePathogen);

module.exports = router;
