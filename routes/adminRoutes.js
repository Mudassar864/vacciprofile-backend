const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getStats,
  globalSearch,
  getOptions,
  getActivity,
  getIntegrity,
} = require('../controllers/adminController');

// CMS support endpoints — admin only, never publicly cached.
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getStats);
router.get('/search', globalSearch);
router.get('/options/:resource', getOptions);
router.get('/activity', getActivity);
router.get('/integrity', getIntegrity);

module.exports = router;
