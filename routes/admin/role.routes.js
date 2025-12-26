const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../../middleware/auth.middleware');
const { isMainAdmin } = require('../../middleware/rbac.middleware');
const roleController = require('../../controllers/admin/role.controller');

// All routes require admin authentication
router.use(authenticate, isAdmin);

// Get available permissions (any admin can view)
router.get('/permissions', roleController.getAvailablePermissions);

// Get all roles
router.get('/', roleController.getAllRoles);

// Get role by ID
router.get('/:id', roleController.getRoleById);

// Create role (main admin only)
router.post('/', isMainAdmin, roleController.createRole);

// Update role (main admin only)
router.put('/:id', isMainAdmin, roleController.updateRole);

// Delete role (main admin only)
router.delete('/:id', isMainAdmin, roleController.deleteRole);

module.exports = router;


