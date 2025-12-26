const Role = require('../../models/role.model');
const { PERMISSIONS } = require('../../config/constants');

/**
 * Create a new role (Main Admin Only)
 */
exports.createRole = async (req, res) => {
  try {
    const { Name, Description, Permissions } = req.body;

    // Validate required fields
    if (!Name || !Permissions || !Array.isArray(Permissions)) {
      return res.status(400).json({
        success: false,
        message: 'Name and Permissions (array) are required',
      });
    }

    // Validate permissions
    const validPermissions = Object.values(PERMISSIONS);
    const invalidPermissions = Permissions.filter((perm) => !validPermissions.includes(perm));
    if (invalidPermissions.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid permissions: ${invalidPermissions.join(', ')}`,
        validPermissions,
      });
    }

    // Generate slug from name
    let generatedSlug = Name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    // Ensure slug is unique
    let uniqueSlug = generatedSlug;
    let counter = 1;
    let existingRole = await Role.findOne({ Slug: uniqueSlug });
    while (existingRole) {
      uniqueSlug = `${generatedSlug}-${counter}`;
      counter++;
      existingRole = await Role.findOne({ Slug: uniqueSlug });
    }
    generatedSlug = uniqueSlug;

    // Check if role with same name already exists
    const existingRoleByName = await Role.findOne({ 
      Name: { $regex: new RegExp(`^${Name}$`, 'i') }
    });
    if (existingRoleByName) {
      return res.status(400).json({
        success: false,
        message: 'Role with this name already exists',
      });
    }

    // Create role (slug is set explicitly to avoid validation issues)
    const role = await Role.create({
      Name,
      Slug: generatedSlug,
      Description,
      Permissions,
      IsActive: true,
      CreatedBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Role created successfully',
      data: role,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create role',
      error: error.message,
    });
  }
};

/**
 * Get all roles
 */
exports.getAllRoles = async (req, res) => {
  try {
    const { page = 1, limit = 50, search, isActive } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { Name: { $regex: search, $options: 'i' } },
        { Slug: { $regex: search, $options: 'i' } },
      ];
    }
    if (isActive !== undefined) {
      query.IsActive = isActive === 'true';
    }

    const roles = await Role.find(query)
      .populate('CreatedBy', 'Name Email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Role.countDocuments(query);

    res.json({
      success: true,
      data: roles,
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
      message: 'Failed to fetch roles',
      error: error.message,
    });
  }
};

/**
 * Get role by ID
 */
exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findById(req.params.id).populate('CreatedBy', 'Name Email');

    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    res.json({
      success: true,
      data: role,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch role',
      error: error.message,
    });
  }
};

/**
 * Update role
 */
exports.updateRole = async (req, res) => {
  try {
    const { Name, Description, Permissions, IsActive } = req.body;
    const { id } = req.params;

    const role = await Role.findById(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    // Validate permissions if provided
    if (Permissions && Array.isArray(Permissions)) {
      const validPermissions = Object.values(PERMISSIONS);
      const invalidPermissions = Permissions.filter((perm) => !validPermissions.includes(perm));
      if (invalidPermissions.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Invalid permissions: ${invalidPermissions.join(', ')}`,
          validPermissions,
        });
      }
      role.Permissions = Permissions;
    }

    if (Name) role.Name = Name;
    if (Description !== undefined) role.Description = Description;
    if (IsActive !== undefined) role.IsActive = IsActive;

    await role.save();

    res.json({
      success: true,
      message: 'Role updated successfully',
      data: role,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update role',
      error: error.message,
    });
  }
};

/**
 * Delete role
 */
exports.deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await Role.findByIdAndDelete(id);
    if (!role) {
      return res.status(404).json({
        success: false,
        message: 'Role not found',
      });
    }

    res.json({
      success: true,
      message: 'Role deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete role',
      error: error.message,
    });
  }
};

/**
 * Get all available permissions
 */
exports.getAvailablePermissions = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        permissions: PERMISSIONS,
        categories: {
          movies: [
            PERMISSIONS.MOVIES_VIEW,
            PERMISSIONS.MOVIES_CREATE,
            PERMISSIONS.MOVIES_EDIT,
            PERMISSIONS.MOVIES_DELETE,
          ],
          categories: [
            PERMISSIONS.CATEGORIES_VIEW,
            PERMISSIONS.CATEGORIES_CREATE,
            PERMISSIONS.CATEGORIES_EDIT,
            PERMISSIONS.CATEGORIES_DELETE,
          ],
          channels: [
            PERMISSIONS.CHANNELS_VIEW,
            PERMISSIONS.CHANNELS_CREATE,
            PERMISSIONS.CHANNELS_EDIT,
            PERMISSIONS.CHANNELS_DELETE,
          ],
          actors: [
            PERMISSIONS.ACTORS_VIEW,
            PERMISSIONS.ACTORS_CREATE,
            PERMISSIONS.ACTORS_EDIT,
            PERMISSIONS.ACTORS_DELETE,
          ],
          users: [
            PERMISSIONS.USERS_VIEW,
            PERMISSIONS.USERS_EDIT,
            PERMISSIONS.USERS_DELETE,
          ],
          dashboard: [PERMISSIONS.DASHBOARD_VIEW],
          uploadQueue: [
            PERMISSIONS.UPLOAD_QUEUE_VIEW,
            PERMISSIONS.UPLOAD_QUEUE_MANAGE,
          ],
          ads: [
            PERMISSIONS.ADS_VIEW,
            PERMISSIONS.ADS_CREATE,
            PERMISSIONS.ADS_EDIT,
            PERMISSIONS.ADS_DELETE,
          ],
          seo: [
            PERMISSIONS.SEO_VIEW,
            PERMISSIONS.SEO_EDIT,
          ],
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch permissions',
      error: error.message,
    });
  }
};


