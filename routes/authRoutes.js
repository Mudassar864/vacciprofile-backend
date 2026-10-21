const express = require('express');
const router = express.Router();
const { login, getMe, updateMe, changeMyPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimits');

router.post('/login', loginLimiter, login);
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/password', protect, loginLimiter, changeMyPassword);

module.exports = router;
