const express = require('express');
const router = express.Router();
const manufacturerController = require('../controllers/manufacturerController');

router.get('/', manufacturerController.getAllManufacturers);
router.get('/export/csv', manufacturerController.exportManufacturersCsv);
router.get('/:id', manufacturerController.getManufacturerById);
router.post('/', manufacturerController.createManufacturer);
router.post('/bulk', manufacturerController.bulkInsertManufacturers);
router.put('/:id', manufacturerController.updateManufacturer);
router.delete('/:id', manufacturerController.deleteManufacturer);

module.exports = router;