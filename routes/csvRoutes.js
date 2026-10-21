const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  importVaccines,
  exportVaccines,
  importLicensingAuthorities,
  exportLicensingAuthorities,
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

const { auditTrail } = require('../middleware/audit');

const MAX_CSV_MB = Math.max(1, Number(process.env.CSV_MAX_FILE_MB || 25));

// Memory storage is fine for CSVs, but cap the size so one upload cannot exhaust RAM.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_CSV_MB * 1024 * 1024, files: 1 },
  fileFilter(req, file, cb) {
    const name = String(file.originalname || '').toLowerCase();
    const okType = /csv|text\/plain|application\/vnd\.ms-excel|octet-stream/.test(file.mimetype || '');
    if (name.endsWith('.csv') || okType) return cb(null, true);
    const error = new Error('Only .csv files can be imported');
    error.statusCode = 400;
    cb(error);
  },
});

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));
// "/import/vaccines" is logged against the "vaccines" resource
router.use(auditTrail((req) => req.path.split('/').filter(Boolean)[1] || 'csv'));

// Import routes
router.post('/import/vaccines', upload.single('file'), importVaccines);
router.post('/import/licensing-authorities', upload.single('file'), importLicensingAuthorities);
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
router.get('/export/licensing-authorities', exportLicensingAuthorities);
router.get('/export/product-profiles', exportProductProfiles);
router.get('/export/manufacturers', exportManufacturers);
router.get('/export/manufacturer-products', exportManufacturerProducts);
router.get('/export/manufacturer-sources', exportManufacturerSources);
router.get('/export/pathogens', exportPathogens);
router.get('/export/manufacturer-candidates', exportManufacturerCandidates);
router.get('/export/nitags', exportNITAGs);
router.get('/export/licensers', exportLicensers);

module.exports = router;

