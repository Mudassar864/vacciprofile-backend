const express = require('express');
const router = express.Router();
const nitagController = require('../controllers/nitagController');

router.get('/', nitagController.getAllNitags);
router.get('/:country', nitagController.getNitagByCountry);
router.post('/', nitagController.createNitag);
router.post('/bulk', nitagController.bulkInsertNitags);
router.put('/:country', nitagController.updateNitag);
router.delete('/:country', nitagController.deleteNitag);

module.exports = router;