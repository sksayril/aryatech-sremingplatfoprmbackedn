const User = require('../../models/user.model');
const Role = require('../../models/role.model');
const { USER_ROLES } = require('../../config/constants');

/**
 * Create a new sub-admin (Main Admin Only)
 */
exports.createSubAdmin = async (req, res) => {
  try {
    // Only main admin can create sub-admins
    if (!req.user.IsMainAdmin && req.user.Role !== USER_ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only main admin can create sub-admins',
      });
    }

    const { Email, Password, Name, Roles } = req.body;

    // Validate required fields
    if (!Email || !Password || !Name) {
      return res.status(400).json({
        success: false,
        message: 'Email, Password, and Name are required',
      });
    }

    // Validate password strength
    if (Password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ Email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
      });
    }

    // Validate roles if provided
    if (Roles && Array.isArray(Roles) && Roles.length > 0) {
      const validRoles = await Role.find({ _id: { $in: Roles }, IsActive: true });
      if (validRoles.length !== Roles.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more roles are invalid or inactive',
        });
      }
    }

    // Create sub-admin user
    const subAdmin = await User.create({
      Email,
      Password, // Will be stored in plain text via pre-save hook
      Name,
      Role: USER_ROLES.SUB_ADMIN,
      IsSubAdmin: true,
      IsMainAdmin: false,
      Roles: Roles || [],
      IsActive: true,
      CreatedBy: req.user._id,
    });

    // Populate roles for response
    await subAdmin.populate('Roles', 'Name Slug Permissions');

    res.status(201).json({
      success: true,
      message: 'Sub-admin created successfully',
      data: {
        _id: subAdmin._id,
        Email: subAdmin.Email,
        Name: subAdmin.Name,
        Role: subAdmin.Role,
        IsSubAdmin: subAdmin.IsSubAdmin,
        PlainPassword: subAdmin.PlainPassword, // Return plain text password
        Roles: subAdmin.Roles,
        Permissions: getPermissionsFromRoles(subAdmin.Roles),
        IsActive: subAdmin.IsActive,
        CreatedBy: subAdmin.CreatedBy,
        createdAt: subAdmin.createdAt,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create sub-admin',
      error: error.message,
    });
  }
};

/**
 * Get all sub-admins (Main Admin Only)
 */
exports.getAllSubAdmins = async (req, res) => {
  try {
    // Only main admin can view all sub-admins
    if (!req.user.IsMainAdmin && req.user.Role !== USER_ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only main admin can view sub-admins',
      });
    }

    const { page = 1, limit = 20, search } = req.query;

    const query = {
      Role: USER_ROLES.SUB_ADMIN,
      IsSubAdmin: true,
    };

    if (search) {
      query.$or = [
        { Email: { $regex: search, $options: 'i' } },
        { Name: { $regex: search, $options: 'i' } },
      ];
    }

    const subAdmins = await User.find(query)
      .populate('Roles', 'Name Slug Permissions')
      .populate('CreatedBy', 'Name Email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Include plain text passwords for main admin
    const subAdminsWithPasswords = subAdmins.map((subAdmin) => {
      const subAdminObj = subAdmin.toObject();
      subAdminObj.PlainPassword = subAdmin.PlainPassword; // Include plain text password
      subAdminObj.Permissions = getPermissionsFromRoles(subAdmin.Roles);
      return subAdminObj;
    });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: subAdminsWithPasswords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sub-admins',
      error: error.message,
    });
  }
};

/**
 * Get sub-admin by ID (Main Admin Only - with password)
 */
exports.getSubAdminById = async (req, res) => {
  try {
    // Only main admin can view sub-admin details
    if (!req.user.IsMainAdmin && req.user.Role !== USER_ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only main admin can view sub-admin details',
      });
    }

    const subAdmin = await User.findOne({
      _id: req.params.id,
      Role: USER_ROLES.SUB_ADMIN,
      IsSubAdmin: true,
    })
      .populate('Roles', 'Name Slug Permissions')
      .populate('CreatedBy', 'Name Email');

    if (!subAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Sub-admin not found',
      });
    }

    const subAdminObj = subAdmin.toObject();
    subAdminObj.PlainPassword = subAdmin.PlainPassword; // Include plain text password
    subAdminObj.Permissions = getPermissionsFromRoles(subAdmin.Roles);

    res.json({
      success: true,
      data: subAdminObj,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sub-admin',
      error: error.message,
    });
  }
};

/**
 * Get sub-admin details with comprehensive statistics (Main Admin or Sub-Admin themselves)
 */
exports.getSubAdminDetails = async (req, res) => {
  try {
    // If route is /me/details, use current user's ID, otherwise use params
    const subAdminId = req.params.id === 'me' ? req.user._id : (req.params.id || req.user._id);

    // Check if user is main admin or the sub-admin themselves
    const isMainAdmin = req.user.IsMainAdmin || req.user.Role === USER_ROLES.ADMIN;
    const isSelf = req.user._id.toString() === subAdminId.toString();

    if (!isMainAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only main admin or the sub-admin themselves can view details.',
      });
    }

    const subAdmin = await User.findOne({
      _id: subAdminId,
      Role: USER_ROLES.SUB_ADMIN,
      IsSubAdmin: true,
    })
      .populate('Roles', 'Name Slug Description Permissions')
      .populate('CreatedBy', 'Name Email');

    if (!subAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Sub-admin not found',
      });
    }

    const permissions = getPermissionsFromRoles(subAdmin.Roles);
    const subAdminIdObj = subAdmin._id;

    // Import models
    const Movie = require('../../models/movie.model');
    const Contact = require('../../models/contact.model');
    const Ad = require('../../models/ad.model');
    const Category = require('../../models/category.model');
    const Channel = require('../../models/channel.model');
    const Actor = require('../../models/actor.model');

    // Initialize statistics object
    const statistics = {
      totalTasks: 0,
      byPermission: {},
    };

    // Count tasks based on permissions
    const permissionStats = {};

    // Movie permissions
    if (permissions.includes('movie:create') || permissions.includes('movies:create')) {
      const moviesCreated = await Movie.countDocuments({ CreatedBy: subAdminIdObj });
      permissionStats.movies = {
        created: moviesCreated,
        permission: 'movie:create',
      };
      statistics.totalTasks += moviesCreated;
    }
    if (permissions.includes('movie:read') || permissions.includes('movies:view')) {
      const moviesViewed = await Movie.countDocuments();
      if (!permissionStats.movies) permissionStats.movies = {};
      permissionStats.movies.viewed = moviesViewed;
    }

    // Contact permissions
    if (permissions.includes('contact:update') || permissions.includes('contact:read')) {
      const contactsReachedOut = await Contact.countDocuments({ ReachedOutBy: subAdminIdObj });
      const contactsWithNotes = await Contact.countDocuments({
        'AdminNotes.CreatedBy': subAdminIdObj,
      });
      permissionStats.contacts = {
        reachedOut: contactsReachedOut,
        notesAdded: contactsWithNotes,
        permission: 'contact:update',
      };
      statistics.totalTasks += contactsReachedOut + contactsWithNotes;
    }
    if (permissions.includes('contact:read')) {
      const totalContacts = await Contact.countDocuments();
      if (!permissionStats.contacts) permissionStats.contacts = {};
      permissionStats.contacts.total = totalContacts;
    }

    // Ad permissions
    if (permissions.includes('ad:create') || permissions.includes('ads:create')) {
      const adsCreated = await Ad.countDocuments({ CreatedBy: subAdminIdObj });
      permissionStats.ads = {
        created: adsCreated,
        permission: 'ad:create',
      };
      statistics.totalTasks += adsCreated;
    }
    if (permissions.includes('ad:read') || permissions.includes('ads:view')) {
      const adsViewed = await Ad.countDocuments();
      if (!permissionStats.ads) permissionStats.ads = {};
      permissionStats.ads.viewed = adsViewed;
    }

    // Category permissions
    if (permissions.includes('category:create') || permissions.includes('categories:create')) {
      const categoriesCreated = await Category.countDocuments({ CreatedBy: subAdminIdObj });
      permissionStats.categories = {
        created: categoriesCreated,
        permission: 'category:create',
      };
      statistics.totalTasks += categoriesCreated;
    }

    // Channel permissions (Note: Channel model doesn't have CreatedBy, so we'll track by updatedAt if available)
    if (permissions.includes('channel:create') || permissions.includes('channels:create')) {
      // Since Channel model doesn't track CreatedBy, we'll count total if they have permission
      const totalChannels = await Channel.countDocuments();
      permissionStats.channels = {
        total: totalChannels,
        permission: 'channel:create',
        note: 'Channel model does not track creator',
      };
    }

    // Actor permissions (Note: Actor model doesn't have CreatedBy, so we'll track by updatedAt if available)
    if (permissions.includes('actor:create') || permissions.includes('actors:create')) {
      // Since Actor model doesn't track CreatedBy, we'll count total if they have permission
      const totalActors = await Actor.countDocuments();
      permissionStats.actors = {
        total: totalActors,
        permission: 'actor:create',
        note: 'Actor model does not track creator',
      };
    }

    // Dashboard permissions
    if (permissions.includes('dashboard:read') || permissions.includes('dashboard:view')) {
      permissionStats.dashboard = {
        accessed: true,
        permission: 'dashboard:read',
      };
    }

    // Upload queue permissions
    if (permissions.includes('upload_queue:read') || permissions.includes('upload-queue:view')) {
      const UploadQueue = require('../../models/uploadQueue.model');
      const queuesManaged = await UploadQueue.countDocuments({ CreatedBy: subAdminIdObj });
      permissionStats.uploadQueue = {
        managed: queuesManaged,
        permission: 'upload_queue:read',
      };
      statistics.totalTasks += queuesManaged;
    }

    statistics.byPermission = permissionStats;

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = {
      movies: await Movie.countDocuments({
        CreatedBy: subAdminIdObj,
        createdAt: { $gte: thirtyDaysAgo },
      }),
      contacts: await Contact.countDocuments({
        ReachedOutBy: subAdminIdObj,
        ReachedOutAt: { $gte: thirtyDaysAgo },
      }),
      ads: await Ad.countDocuments({
        CreatedBy: subAdminIdObj,
        createdAt: { $gte: thirtyDaysAgo },
      }),
    };

    // Build response
    const subAdminObj = subAdmin.toObject();
    const responseData = {
      _id: subAdminObj._id,
      Name: subAdminObj.Name,
      Email: subAdminObj.Email,
      Role: subAdminObj.Role,
      IsSubAdmin: subAdminObj.IsSubAdmin,
      IsActive: subAdminObj.IsActive,
      Roles: subAdminObj.Roles,
      Permissions: permissions,
      CreatedBy: subAdminObj.CreatedBy,
      LastLogin: subAdminObj.LastLogin,
      createdAt: subAdminObj.createdAt,
      updatedAt: subAdminObj.updatedAt,
      statistics: {
        ...statistics,
        recentActivity,
        last30Days: {
          total: recentActivity.movies + recentActivity.contacts + recentActivity.ads,
          breakdown: recentActivity,
        },
      },
    };

    // Include password only for main admin
    if (isMainAdmin) {
      responseData.PlainPassword = subAdmin.PlainPassword;
    }

    res.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sub-admin details',
      error: error.message,
    });
  }
};

/**
 * Update sub-admin (Main Admin Only)
 */
exports.updateSubAdmin = async (req, res) => {
  try {
    // Only main admin can update sub-admins
    if (!req.user.IsMainAdmin && req.user.Role !== USER_ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only main admin can update sub-admins',
      });
    }

    const { Name, Email, IsActive, Password } = req.body;
    const { id } = req.params;

    const subAdmin = await User.findOne({
      _id: id,
      Role: USER_ROLES.SUB_ADMIN,
      IsSubAdmin: true,
    });

    if (!subAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Sub-admin not found',
      });
    }

    // Check if email is being changed and if it's already taken
    if (Email && Email !== subAdmin.Email) {
      const emailExists = await User.findOne({ Email, _id: { $ne: id } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }
      subAdmin.Email = Email;
    }

    if (Name) subAdmin.Name = Name;
    if (IsActive !== undefined) subAdmin.IsActive = IsActive;

    // Update password if provided
    if (Password) {
      if (Password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long',
        });
      }
      subAdmin.Password = Password; // Will be stored in plain text via pre-save hook
    }

    await subAdmin.save();
    await subAdmin.populate('Roles', 'Name Slug Permissions');

    const subAdminObj = subAdmin.toObject();
    subAdminObj.PlainPassword = subAdmin.PlainPassword; // Include plain text password
    subAdminObj.Permissions = getPermissionsFromRoles(subAdmin.Roles);

    res.json({
      success: true,
      message: 'Sub-admin updated successfully',
      data: subAdminObj,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update sub-admin',
      error: error.message,
    });
  }
};

/**
 * Assign roles to sub-admin (Main Admin Only)
 */
exports.assignRoles = async (req, res) => {
  try {
    // Only main admin can assign roles
    if (!req.user.IsMainAdmin && req.user.Role !== USER_ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only main admin can assign roles',
      });
    }

    const { Roles } = req.body;
    const { id } = req.params;

    if (!Roles || !Array.isArray(Roles)) {
      return res.status(400).json({
        success: false,
        message: 'Roles must be an array of role IDs',
      });
    }

    const subAdmin = await User.findOne({
      _id: id,
      Role: USER_ROLES.SUB_ADMIN,
      IsSubAdmin: true,
    });

    if (!subAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Sub-admin not found',
      });
    }

    // Validate roles
    const validRoles = await Role.find({ _id: { $in: Roles }, IsActive: true });
    if (validRoles.length !== Roles.length) {
      return res.status(400).json({
        success: false,
        message: 'One or more roles are invalid or inactive',
      });
    }

    subAdmin.Roles = Roles;
    await subAdmin.save();
    await subAdmin.populate('Roles', 'Name Slug Permissions');

    const subAdminObj = subAdmin.toObject();
    subAdminObj.PlainPassword = subAdmin.PlainPassword; // Include plain text password
    subAdminObj.Permissions = getPermissionsFromRoles(subAdmin.Roles);

    res.json({
      success: true,
      message: 'Roles assigned successfully',
      data: subAdminObj,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to assign roles',
      error: error.message,
    });
  }
};

/**
 * Delete sub-admin (Main Admin Only)
 */
exports.deleteSubAdmin = async (req, res) => {
  try {
    // Only main admin can delete sub-admins
    if (!req.user.IsMainAdmin && req.user.Role !== USER_ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Only main admin can delete sub-admins',
      });
    }

    const { id } = req.params;

    const subAdmin = await User.findOneAndDelete({
      _id: id,
      Role: USER_ROLES.SUB_ADMIN,
      IsSubAdmin: true,
    });

    if (!subAdmin) {
      return res.status(404).json({
        success: false,
        message: 'Sub-admin not found',
      });
    }

    res.json({
      success: true,
      message: 'Sub-admin deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete sub-admin',
      error: error.message,
    });
  }
};

/**
 * Helper function to extract permissions from roles
 */
function getPermissionsFromRoles(roles) {
  if (!roles || !Array.isArray(roles)) return [];
  
  const permissions = new Set();
  roles.forEach((role) => {
    if (role.Permissions && Array.isArray(role.Permissions)) {
      role.Permissions.forEach((permission) => {
        permissions.add(permission);
      });
    }
  });
  
  return Array.from(permissions);
}


