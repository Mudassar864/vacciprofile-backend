const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { getChatConfig, rag } = require('../controllers/chatController');

router.use(protect);
router.use(authorize('admin'));

router.get('/config', getChatConfig);
router.post('/rag', rag);

module.exports = router;
