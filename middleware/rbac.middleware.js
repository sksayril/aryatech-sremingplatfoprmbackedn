const { USER_ROLES, PERMISSIONS } = require('../config/constants');

/**
 * Check if user has required permission(s)
 * Usage: hasPermission('movies:create') or hasPermission(['movies:create', 'movies:edit'])
 */
const hasPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      // Main admin has all permissions
      if (req.user.IsMainAdmin || (req.user.Role === USER_ROLES.ADMIN && !req.user.IsSubAdmin)) {
        return next();
      }

      // Sub-admin must have the required permissions
      if (req.user.IsSubAdmin || req.user.Role === USER_ROLES.SUB_ADMIN) {
        // Populate roles if not already populated
        if (!req.user.Roles || req.user.Roles.length === 0 || typeof req.user.Roles[0] === 'string') {
          await req.user.populate('Roles', 'Permissions');
        }

        // Get all permissions from user's roles
        const userPermissions = new Set();
        if (req.user.Roles && Array.isArray(req.user.Roles)) {
          req.user.Roles.forEach((role) => {
            if (role.Permissions && Array.isArray(role.Permissions)) {
              role.Permissions.forEach((permission) => {
                userPermissions.add(permission);
              });
            }
          });
        }

        // Check if user has required permission(s)
        const requiredPerms = Array.isArray(requiredPermissions) 
          ? requiredPermissions 
          : [requiredPermissions];

        const hasAccess = requiredPerms.some((perm) => userPermissions.has(perm));

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. Insufficient permissions.',
            required: requiredPerms,
            userPermissions: Array.from(userPermissions),
          });
        }

        return next();
      }

      // Regular users don't have admin permissions
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or sub-admin privileges required.',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions',
        error: error.message,
      });
    }
  };
};

/**
 * Check if user has any of the required permissions (OR logic)
 */
const hasAnyPermission = (requiredPermissions) => {
  return hasPermission(requiredPermissions);
};

/**
 * Check if user has all of the required permissions (AND logic)
 */
const hasAllPermissions = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      // Main admin has all permissions
      if (req.user.IsMainAdmin || (req.user.Role === USER_ROLES.ADMIN && !req.user.IsSubAdmin)) {
        return next();
      }

      // Sub-admin must have all required permissions
      if (req.user.IsSubAdmin || req.user.Role === USER_ROLES.SUB_ADMIN) {
        // Populate roles if not already populated
        if (!req.user.Roles || req.user.Roles.length === 0 || typeof req.user.Roles[0] === 'string') {
          await req.user.populate('Roles', 'Permissions');
        }

        // Get all permissions from user's roles
        const userPermissions = new Set();
        if (req.user.Roles && Array.isArray(req.user.Roles)) {
          req.user.Roles.forEach((role) => {
            if (role.Permissions && Array.isArray(role.Permissions)) {
              role.Permissions.forEach((permission) => {
                userPermissions.add(permission);
              });
            }
          });
        }

        // Check if user has ALL required permissions
        const requiredPerms = Array.isArray(requiredPermissions) 
          ? requiredPermissions 
          : [requiredPermissions];

        const hasAccess = requiredPerms.every((perm) => userPermissions.has(perm));

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Access denied. Insufficient permissions.',
            required: requiredPerms,
            userPermissions: Array.from(userPermissions),
          });
        }

        return next();
      }

      // Regular users don't have admin permissions
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin or sub-admin privileges required.',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Error checking permissions',
        error: error.message,
      });
    }
  };
};

/**
 * Check if user is main admin only
 */
const isMainAdmin = (req, res, next) => {
  if (req.user && (req.user.IsMainAdmin || (req.user.Role === USER_ROLES.ADMIN && !req.user.IsSubAdmin))) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Main admin privileges required.',
  });
};

/**
 * Check if user is sub-admin or main admin
 */
const isAdminOrSubAdmin = (req, res, next) => {
  if (req.user && (
    req.user.IsMainAdmin || 
    req.user.Role === USER_ROLES.ADMIN || 
    req.user.IsSubAdmin || 
    req.user.Role === USER_ROLES.SUB_ADMIN
  )) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access denied. Admin or sub-admin privileges required.',
  });
};

module.exports = {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isMainAdmin,
  isAdminOrSubAdmin,
  PERMISSIONS, // Export for convenience
};


