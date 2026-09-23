const express = require('express');
const router = express.Router();
const {
  getLicensingAuthorities,
  getLicensingAuthority,
  getUniqueLicenserNames,
  getVaccinesForAuthority,
  getCountryCounts,
  createLicensingAuthority,
  updateLicensingAuthority,
  deleteLicensingAuthority,
  migrateSplitFields,
} = require('../controllers/licensingAuthorityController');
const { protect, authorize } = require('../middleware/auth');

router.route('/').get(getLicensingAuthorities);
router.route('/stats/unique-licenser-names').get(getUniqueLicenserNames);
router.route('/vaccines-for-authority').get(getVaccinesForAuthority);
router.route('/country-counts').get(getCountryCounts);
router.route('/:id').get(getLicensingAuthority);

router.post('/migrate-split-fields', protect, authorize('admin'), migrateSplitFields);

router.use(protect);
router.use(authorize('admin'));

router.route('/').post(createLicensingAuthority);
router.route('/:id').put(updateLicensingAuthority).delete(deleteLicensingAuthority);

module.exports = router;
