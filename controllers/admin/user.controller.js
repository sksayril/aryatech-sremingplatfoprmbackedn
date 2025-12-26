const User = require('../../models/user.model');
const { USER_ROLES } = require('../../config/constants');

/**
 * Create a new admin user
 */
exports.createAdmin = async (req, res) => {
  try {
    const { Email, Password, Name } = req.body;

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

    // Create admin user (not main admin - only seed script creates main admin)
    const admin = await User.create({
      Email,
      Password,
      Name,
      Role: USER_ROLES.ADMIN,
      IsMainAdmin: false, // Only seed script creates main admin
      IsSubAdmin: false,
      IsActive: true,
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        _id: admin._id,
        Email: admin.Email,
        Name: admin.Name,
        Role: admin.Role,
        IsActive: admin.IsActive,
        ReferralCode: admin.ReferralCode,
        createdAt: admin.createdAt,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create admin user',
      error: error.message,
    });
  }
};

/**
 * Get all admin users
 */
exports.getAllAdmins = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;

    const query = { Role: USER_ROLES.ADMIN };

    if (search) {
      query.$or = [
        { Email: { $regex: search, $options: 'i' } },
        { Name: { $regex: search, $options: 'i' } },
      ];
    }

    const admins = await User.find(query)
      .select('-Password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: admins,
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
      message: 'Failed to fetch admin users',
      error: error.message,
    });
  }
};

/**
 * Get admin by ID
 */
exports.getAdminById = async (req, res) => {
  try {
    const admin = await User.findOne({
      _id: req.params.id,
      Role: USER_ROLES.ADMIN,
    }).select('-Password');

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found',
      });
    }

    res.json({
      success: true,
      data: admin,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin user',
      error: error.message,
    });
  }
};

/**
 * Update admin user
 */
exports.updateAdmin = async (req, res) => {
  try {
    const { Name, Email, IsActive } = req.body;
    const { id } = req.params;

    // Prevent updating own role
    if (id === req.user._id.toString() && req.body.Role) {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own role',
      });
    }

    const admin = await User.findOne({
      _id: id,
      Role: USER_ROLES.ADMIN,
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found',
      });
    }

    // Check if email is being changed and if it's already taken
    if (Email && Email !== admin.Email) {
      const emailExists = await User.findOne({ Email, _id: { $ne: id } });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }
      admin.Email = Email;
    }

    if (Name) admin.Name = Name;
    if (IsActive !== undefined) admin.IsActive = IsActive;

    await admin.save();

    res.json({
      success: true,
      message: 'Admin user updated successfully',
      data: {
        _id: admin._id,
        Email: admin.Email,
        Name: admin.Name,
        Role: admin.Role,
        IsActive: admin.IsActive,
        updatedAt: admin.updatedAt,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update admin user',
      error: error.message,
    });
  }
};

/**
 * Delete admin user
 */
exports.deleteAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    // Check if this is the last admin
    const adminCount = await User.countDocuments({ Role: USER_ROLES.ADMIN });
    if (adminCount <= 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the last admin user',
      });
    }

    const admin = await User.findOneAndDelete({
      _id: id,
      Role: USER_ROLES.ADMIN,
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found',
      });
    }

    res.json({
      success: true,
      message: 'Admin user deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete admin user',
      error: error.message,
    });
  }
};

/**
 * Change admin password
 */
exports.changeAdminPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const admin = await User.findOne({
      _id: id,
      Role: USER_ROLES.ADMIN,
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found',
      });
    }

    admin.Password = newPassword;
    await admin.save();

    res.json({
      success: true,
      message: 'Admin password changed successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to change admin password',
      error: error.message,
    });
  }
};

/**
 * Toggle admin active status
 */
exports.toggleAdminStatus = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deactivating yourself
    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account',
      });
    }

    const admin = await User.findOne({
      _id: id,
      Role: USER_ROLES.ADMIN,
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin user not found',
      });
    }

    admin.IsActive = !admin.IsActive;
    await admin.save();

    res.json({
      success: true,
      message: `Admin ${admin.IsActive ? 'activated' : 'deactivated'} successfully`,
      data: {
        _id: admin._id,
        Email: admin.Email,
        IsActive: admin.IsActive,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle admin status',
      error: error.message,
    });
  }
};


