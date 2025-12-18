const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  changePassword,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Validation rules
const userValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['admin', 'user'])
    .withMessage('Role must be either admin or user'),
];

const updateUserValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .optional()
    .isIn(['admin', 'user'])
    .withMessage('Role must be either admin or user'),
  body('isActive')
    .optional()
    .custom((value) => {
      // Accept boolean, string boolean, or number
      if (typeof value === 'boolean') return true;
      if (typeof value === 'string' && (value === 'true' || value === 'false')) return true;
      if (typeof value === 'number' && (value === 0 || value === 1)) return true;
      throw new Error('isActive must be a boolean value');
    }),
];

const changePasswordValidation = [
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
];

// All routes require authentication and admin role
router.use(protect);
router.use(authorize('admin'));

router.route('/').get(getUsers).post(userValidation, createUser);
router
  .route('/:id')
  .get(getUser)
  .put(updateUserValidation, updateUser)
  .delete(deleteUser);
router
  .route('/:id/password')
  .put(changePasswordValidation, changePassword);

module.exports = router;

