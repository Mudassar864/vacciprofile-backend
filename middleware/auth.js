const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  let token;

  const header = req.headers.authorization;
  if (typeof header === 'string' && header.startsWith('Bearer ')) {
    token = header.slice(7).trim();
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message:
        error.name === 'TokenExpiredError'
          ? 'Session expired, please sign in again'
          : 'Not authorized to access this route',
    });
  }

  try {
    req.user = await User.findById(decoded.id).select('-password');
  } catch (error) {
    return next(error);
  }

  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'User not found',
    });
  }

  if (!req.user.isActive) {
    return res.status(401).json({
      success: false,
      message: 'User account is deactivated',
    });
  }

  if (req.user.isTokenRevoked(decoded)) {
    return res.status(401).json({
      success: false,
      message: 'Password was changed, please sign in again',
    });
  }

  next();
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role}' is not authorized to access this route`,
      });
    }
    next();
  };
};
