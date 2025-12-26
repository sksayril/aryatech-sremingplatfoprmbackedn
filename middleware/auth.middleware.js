const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { USER_ROLES } = require('../config/constants');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-Password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found. Token invalid.',
      });
    }

    // Populate roles for sub-admins
    if (user.IsSubAdmin || user.Role === USER_ROLES.SUB_ADMIN) {
      await user.populate('Roles', 'Name Slug Permissions');
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
      error: error.message,
    });
  }
};

/**
 * Check if user is admin (main admin or sub-admin)
 */
const isAdmin = (req, res, next) => {
  if (req.user && (
    req.user.Role === USER_ROLES.ADMIN || 
    req.user.Role === USER_ROLES.SUB_ADMIN ||
    req.user.IsSubAdmin ||
    req.user.IsMainAdmin
  )) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Admin privileges required.',
  });
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-Password');
      if (user) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  authenticate,
  isAdmin,
  optionalAuth,
};

