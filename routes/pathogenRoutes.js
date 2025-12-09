const express = require('express');
const router = express.Router();
const pathogenController = require('../controllers/pathogenController');

router.get('/', pathogenController.getAllPathogens);
router.get('/export/csv', pathogenController.exportPathogensCsv);
router.get('/:id', pathogenController.getPathogenById);
router.post('/', pathogenController.createPathogen);
router.post('/bulk', pathogenController.bulkInsertPathogens);
router.put('/:id', pathogenController.updatePathogen);
router.delete('/:id', pathogenController.deletePathogen);

module.exports = router;