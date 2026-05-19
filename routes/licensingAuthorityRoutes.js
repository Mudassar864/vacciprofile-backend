const express = require('express');
const router = express.Router();
const {
  getLicensingAuthorities,
  getLicensingAuthority,
  getUniqueLicenserNames,
  getVaccinesForAuthority,
  createLicensingAuthority,
  updateLicensingAuthority,
  deleteLicensingAuthority,
} = require('../controllers/licensingAuthorityController');
const { protect, authorize } = require('../middleware/auth');

router.route('/').get(getLicensingAuthorities);
router.route('/stats/unique-licenser-names').get(getUniqueLicenserNames);
router.route('/vaccines-for-authority').get(getVaccinesForAuthority);
router.route('/:id').get(getLicensingAuthority);

router.use(protect);
router.use(authorize('admin'));

router.route('/').post(createLicensingAuthority);
router.route('/:id').put(updateLicensingAuthority).delete(deleteLicensingAuthority);

module.exports = router;
