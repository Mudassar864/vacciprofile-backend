const express = require('express');
const router = express.Router();
const candidateVaccineController = require('../controllers/candidateVaccineController');

router.get('/', candidateVaccineController.getAllCandidateVaccines);
router.get('/:id', candidateVaccineController.getCandidateVaccineById);
router.post('/', candidateVaccineController.createCandidateVaccine);
router.post('/bulk', candidateVaccineController.bulkInsertCandidateVaccines);
router.put('/:id', candidateVaccineController.updateCandidateVaccine);
router.delete('/:id', candidateVaccineController.deleteCandidateVaccine);

module.exports = router;
