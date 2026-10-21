const User = require('../models/User');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { buildListOptions, paginateQuery } = require('../utils/pagination');
const { handleError } = require('../utils/httpErrors');
const { parseIds } = require('./bulkController');

const USER_SORT_FIELDS = ['name', 'email', 'role', 'isActive', 'createdAt', 'lastLoginAt'];

function formatUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function validationFailed(req, res) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return false;
  const list = errors.array();
  res.status(400).json({
    success: false,
    message: list.map((e) => e.msg).join('; ') || 'Validation error',
    errors: list,
  });
  return true;
}

function invalidId(res, id) {
  if (mongoose.Types.ObjectId.isValid(id)) return false;
  res.status(400).json({ success: false, message: 'Invalid user ID format' });
  return true;
}

/** Number of active admins other than the given user. */
function otherActiveAdmins(userId) {
  return User.countDocuments({ role: 'admin', isActive: true, _id: { $ne: userId } });
}

// @desc    Create new user
// @route   POST /api/users
// @access  Private/Admin
exports.createUser = async (req, res) => {
  try {
    if (validationFailed(req, res)) return;

    const { name, email, password, role } = req.body;
    const normalizedEmail = String(email).toLowerCase().trim();

    // Emails are stored lowercase; checking the raw input let "A@x.com" slip past and hit a 500.
    const userExists = await User.exists({ email: normalizedEmail });
    if (userExists) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password,
      role: role || 'user',
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: formatUser(user),
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Get all users (?search=&role=&status=active|inactive&sort=&page=&limit=)
// @route   GET /api/users
// @access  Private/Admin
exports.getUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role === 'admin' || req.query.role === 'user') filter.role = req.query.role;
    if (req.query.status === 'active') filter.isActive = true;
    if (req.query.status === 'inactive') filter.isActive = false;

    const { filter: finalFilter, sort, pagination } = buildListOptions(req.query, {
      searchFields: ['name', 'email'],
      sortFields: USER_SORT_FIELDS,
      defaultSort: { createdAt: -1 },
      filter,
    });

    const { docs, total, pagination: paginationMeta } = await paginateQuery(
      User,
      finalFilter,
      sort,
      pagination,
      { select: '-password' }
    );

    const formattedUsers = docs.map(formatUser);
    const payload = {
      success: true,
      count: pagination.enabled ? total : formattedUsers.length,
      users: formattedUsers,
    };
    if (paginationMeta) payload.pagination = paginationMeta;

    res.status(200).json(payload);
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private/Admin
exports.getUser = async (req, res) => {
  try {
    if (invalidId(res, req.params.id)) return;

    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({ success: true, user: formatUser(user) });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
exports.updateUser = async (req, res) => {
  try {
    if (validationFailed(req, res)) return;
    if (invalidId(res, req.params.id)) return;

    const { name, email, role, isActive } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (email !== undefined) updateData.email = String(email).toLowerCase().trim();
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) {
      updateData.isActive =
        typeof isActive === 'string' ? isActive === 'true' || isActive === '1' : Boolean(isActive);
    }

    if (updateData.email && updateData.email !== user.email) {
      const emailExists = await User.exists({ email: updateData.email, _id: { $ne: user._id } });
      if (emailExists) {
        return res.status(409).json({ success: false, message: 'Email already in use' });
      }
    }

    const isSelf = user._id.equals(req.user._id);
    const losesAdmin =
      user.role === 'admin' &&
      ((updateData.role && updateData.role !== 'admin') || updateData.isActive === false);

    if (isSelf && losesAdmin) {
      return res.status(400).json({
        success: false,
        message: 'You cannot remove your own admin access or deactivate yourself',
      });
    }
    if (losesAdmin && (await otherActiveAdmins(user._id)) === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one active admin is required',
      });
    }

    const updated = await User.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      user: formatUser(updated),
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Change user password (admin reset)
// @route   PUT /api/users/:id/password
// @access  Private/Admin
exports.changePassword = async (req, res) => {
  try {
    if (validationFailed(req, res)) return;
    if (invalidId(res, req.params.id)) return;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // The pre-save hook hashes it and stamps passwordChangedAt (revoking existing sessions).
    user.password = req.body.password;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      user: formatUser(user),
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
exports.deleteUser = async (req, res) => {
  try {
    if (invalidId(res, req.params.id)) return;

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user._id.equals(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    if (user.role === 'admin' && user.isActive && (await otherActiveAdmins(user._id)) === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one active admin is required',
      });
    }

    await User.deleteOne({ _id: user._id });

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      user: formatUser(user),
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Delete several users (never the caller, never the last active admin)
// @route   POST /api/users/bulk-delete
// @access  Private/Admin
exports.bulkDeleteUsers = async (req, res) => {
  try {
    const ids = parseIds(req.body).filter((id) => id !== req.user._id.toString());
    if (ids.length === 0) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own account' });
    }

    const [targets, activeAdmins] = await Promise.all([
      User.find({ _id: { $in: ids } }).select('role isActive').lean(),
      User.countDocuments({ role: 'admin', isActive: true }),
    ]);
    const removingActiveAdmins = targets.filter((u) => u.role === 'admin' && u.isActive).length;
    if (removingActiveAdmins > 0 && activeAdmins - removingActiveAdmins < 1) {
      return res.status(400).json({ success: false, message: 'At least one active admin is required' });
    }

    const result = await User.deleteMany({ _id: { $in: targets.map((u) => u._id) } });

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} user${result.deletedCount === 1 ? '' : 's'}`,
      deleted: result.deletedCount,
      count: result.deletedCount,
    });
  } catch (error) {
    handleError(res, error);
  }
};
