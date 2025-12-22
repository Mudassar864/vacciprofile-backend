const express = require('express');
const router = express.Router();
const { getLastUpdate } = require('../controllers/lastUpdateController');

// GET route - public access
router.get('/', getLastUpdate);

module.exports = router;

