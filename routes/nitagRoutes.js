const express = require('express');
const router = express.Router();
const {
  getNITAGsTempFullTree,
  getNITAGs,
  getNITAG,
  createNITAG,
  updateNITAG,
  deleteNITAG,
} = require('../controllers/nitagController');
const NITAG = require('../models/NITAG');
const { protect, authorize } = require('../middleware/auth');
const { coerceStringBody, requireFields } = require('../middleware/validate');
const { auditTrail } = require('../middleware/audit');
const { bulkDeleteFor } = require('../controllers/bulkController');
const { heavyLimiter } = require('../middleware/rateLimits');

// GET routes - public access (no authentication)
// TEMPORARY tree export (HTML/PDF via Puppeteer) — rate limited because it is expensive
router.route('/temp-full-tree').get(heavyLimiter, getNITAGsTempFullTree);
router.route('/').get(getNITAGs);
router.route('/:id').get(getNITAG);

// Writes - require authentication and admin role; every change is audited
router.use(protect);
router.use(authorize('admin'));
router.use(auditTrail('nitags', NITAG));

router.post('/bulk-delete', bulkDeleteFor('nitags'));
router.route('/').post(coerceStringBody, requireFields('country'), createNITAG);
router.route('/:id').put(coerceStringBody, updateNITAG).delete(deleteNITAG);

module.exports = router;
