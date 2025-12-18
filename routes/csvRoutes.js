const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  importVaccines,
  exportVaccines,
  importLicensingDates,
  exportLicensingDates,
  importProductProfiles,
  exportProductProfiles,
  importManufacturers,
  exportManufacturers,
  importManufacturerProducts,
  exportManufacturerProducts,
  importManufacturerSources,
  exportManufacturerSources,
  importPathogens,
  exportPathogens,
  importManufacturerCandidates,
  exportManufacturerCandidates,
  importNITAGs,
  exportNITAGs,
  importLicensers,
  exportLicensers,
} = require('../controllers/csvController');
const { protect, authorize } = require('../middleware/auth');

// Configure multer for memory storage
const upload = multer({ storage: multer.memoryStorage() });

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

// Import routes
router.post('/import/vaccines', upload.single('file'), importVaccines);
router.post('/import/licensing-dates', upload.single('file'), importLicensingDates);
router.post('/import/product-profiles', upload.single('file'), importProductProfiles);
router.post('/import/manufacturers', upload.single('file'), importManufacturers);
router.post('/import/manufacturer-products', upload.single('file'), importManufacturerProducts);
router.post('/import/manufacturer-sources', upload.single('file'), importManufacturerSources);
router.post('/import/pathogens', upload.single('file'), importPathogens);
router.post('/import/manufacturer-candidates', upload.single('file'), importManufacturerCandidates);
router.post('/import/nitags', upload.single('file'), importNITAGs);
router.post('/import/licensers', upload.single('file'), importLicensers);

// Export routes
router.get('/export/vaccines', exportVaccines);
router.get('/export/licensing-dates', exportLicensingDates);
router.get('/export/product-profiles', exportProductProfiles);
router.get('/export/manufacturers', exportManufacturers);
router.get('/export/manufacturer-products', exportManufacturerProducts);
router.get('/export/manufacturer-sources', exportManufacturerSources);
router.get('/export/pathogens', exportPathogens);
router.get('/export/manufacturer-candidates', exportManufacturerCandidates);
router.get('/export/nitags', exportNITAGs);
router.get('/export/licensers', exportLicensers);

module.exports = router;

