const User = require('../../models/user.model');
const Role = require('../../models/role.model');
const jwt = require('jsonwebtoken');
const Referral = require('../../models/referral.model');
const { USER_ROLES } = require('../../config/constants');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured. Please set JWT_SECRET in your .env file.');
  }
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

/**
 * Sign up
 */
exports.signUp = async (req, res) => {
  try {
    const { Email, Password, Name, ReferralCode } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ Email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    // Check referral code if provided
    let referredBy = null;
    if (ReferralCode) {
      const referrer = await User.findOne({ ReferralCode });
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    // Create user
    const user = await User.create({
      Email,
      Password,
      Name,
      ReferredBy: referredBy,
    });

    // Create referral record if referred
    if (referredBy) {
      await Referral.create({
        Referrer: referredBy,
        ReferredUser: user._id,
        ReferralCode,
        Status: 'pending',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        user: {
          _id: user._id,
          Email: user.Email,
          Name: user.Name,
          Role: user.Role,
          ReferralCode: user.ReferralCode,
        },
        token,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create user',
      error: error.message,
    });
  }
};

/**
 * Sign in
 */
exports.signIn = async (req, res) => {
  try {
    const { Email, Password } = req.body;

    // Find user
    const user = await User.findOne({ Email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(Password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user is active
    if (!user.IsActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Update last login
    user.LastLogin = new Date();
    await user.save();

    // Populate roles if sub-admin
    if (user.IsSubAdmin || user.Role === USER_ROLES.SUB_ADMIN) {
      await user.populate('Roles', 'Name Slug Permissions');
    }

    // Generate token
    const token = generateToken(user._id);

    // Build user response
    const userResponse = {
      _id: user._id,
      Email: user.Email,
      Name: user.Name,
      Role: user.Role,
      ReferralCode: user.ReferralCode,
      ReferralEarnings: user.ReferralEarnings,
    };

    // Add roles and permissions for sub-admins
    if (user.IsSubAdmin || user.Role === USER_ROLES.SUB_ADMIN) {
      userResponse.IsSubAdmin = true;
      userResponse.Roles = user.Roles || [];
      userResponse.Permissions = getPermissionsFromRoles(user.Roles);
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to login',
      error: error.message,
    });
  }
};

/**
 * Get current user profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-Password');

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message,
    });
  }
};

/**
 * Update profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const { Name, ProfilePicture } = req.body;
    if (Name) user.Name = Name;
    if (ProfilePicture) user.ProfilePicture = ProfilePicture;

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

/**
 * Sub-admin login (returns roles and permissions)
 */
exports.subAdminLogin = async (req, res) => {
  try {
    const { Email, Password } = req.body;

    // Find user
    const user = await User.findOne({ Email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user is sub-admin
    if (!user.IsSubAdmin && user.Role !== USER_ROLES.SUB_ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Sub-admin account required.',
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(Password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if user is active
    if (!user.IsActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated',
      });
    }

    // Update last login
    user.LastLogin = new Date();
    await user.save();

    // Populate roles
    await user.populate('Roles', 'Name Slug Permissions Description');

    // Generate token
    const token = generateToken(user._id);

    // Get permissions from roles
    const permissions = getPermissionsFromRoles(user.Roles);

    res.json({
      success: true,
      message: 'Sub-admin login successful',
      data: {
        user: {
          _id: user._id,
          Email: user.Email,
          Name: user.Name,
          Role: user.Role,
          IsSubAdmin: true,
          Roles: user.Roles || [],
          Permissions: permissions,
          IsActive: user.IsActive,
        },
        token,
        access: {
          roles: user.Roles.map((role) => ({
            _id: role._id,
            Name: role.Name,
            Slug: role.Slug,
            Description: role.Description,
          })),
          permissions: permissions,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to login',
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

/**
 * Change password
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password
    user.Password = newPassword;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to change password',
      error: error.message,
    });
  }
};

