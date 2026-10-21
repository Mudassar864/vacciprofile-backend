const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { heavyLimiter } = require('../middleware/rateLimits');
const { getChatConfig, rag } = require('../controllers/chatController');

router.use(protect);
router.use(authorize('admin'));

router.get('/config', getChatConfig);
router.post('/rag', heavyLimiter, rag);

module.exports = router;
