const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { handleError } = require('../utils/httpErrors');
const { recordActivity } = require('../middleware/audit');

// Generate JWT Token
const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ id: user._id, v: user.tokenVersion || 0 }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

function formatUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
  };
}

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public (rate limited)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    // Same message for unknown user / wrong password / inactive so accounts cannot be enumerated.
    if (!user || !user.password || !(await user.matchPassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account is deactivated',
      });
    }

    const token = generateToken(user);

    await User.updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } });
    req.user = user;
    recordActivity(req, { action: 'login', entity: 'auth', entityId: user._id.toString(), label: user.email });

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: formatUser(req.user),
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Update own profile (name only — email/role changes go through an admin)
// @route   PUT /api/auth/me
// @access  Private
exports.updateMe = async (req, res) => {
  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (name.length < 2) {
      return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, message: 'Profile updated', user: formatUser(user) });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Change own password (requires the current password)
// @route   PUT /api/auth/password
// @access  Private
exports.changeMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};

    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user || !(await user.matchPassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password must be different from the current password',
      });
    }

    user.password = newPassword;
    await user.save();

    recordActivity(req, {
      action: 'password-change',
      entity: 'users',
      entityId: user._id.toString(),
      label: user.email,
    });

    // Older tokens are now revoked (tokenVersion was bumped); issue a fresh one.
    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      token: generateToken(user),
    });
  } catch (error) {
    handleError(res, error);
  }
};
