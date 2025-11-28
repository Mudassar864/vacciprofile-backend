const express = require('express');
const router = express.Router();
const vaccineController = require('../controllers/vaccineController');

router.get('/', vaccineController.getAllVaccines);
router.get('/by-pathogen/:pathogenId', vaccineController.getVaccinesByPathogen);
router.get('/by-manufacturer/:manufacturerId', vaccineController.getVaccinesByManufacturer);
router.get('/:id', vaccineController.getVaccineById);
router.post('/', vaccineController.createVaccine);
router.post('/bulk', vaccineController.bulkInsertVaccines);
router.put('/:id', vaccineController.updateVaccine);
router.delete('/:id', vaccineController.deleteVaccine);

module.exports = router;