const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../../middleware/auth.middleware');
const { isMainAdmin } = require('../../middleware/rbac.middleware');
const subAdminController = require('../../controllers/admin/subAdmin.controller');

// Create sub-admin (Main Admin Only)
router.post('/', authenticate, isAdmin, isMainAdmin, subAdminController.createSubAdmin);

// Get all sub-admins (Main Admin Only)
router.get('/', authenticate, isAdmin, isMainAdmin, subAdminController.getAllSubAdmins);

// Get current sub-admin's own details with statistics (Sub-Admin themselves) - Must be before /:id routes
router.get('/me/details', authenticate, isAdmin, subAdminController.getSubAdminDetails);

// Get sub-admin details with statistics (Main Admin or Sub-Admin themselves)
router.get('/:id/details', authenticate, isAdmin, subAdminController.getSubAdminDetails);

// Get sub-admin by ID (Main Admin Only) - Must be last to avoid conflicts
router.get('/:id', authenticate, isAdmin, isMainAdmin, subAdminController.getSubAdminById);

// Update sub-admin (Main Admin Only)
router.put('/:id', authenticate, isAdmin, isMainAdmin, subAdminController.updateSubAdmin);

// Assign roles to sub-admin (Main Admin Only)
router.patch('/:id/assign-roles', authenticate, isAdmin, isMainAdmin, subAdminController.assignRoles);

// Delete sub-admin (Main Admin Only)
router.delete('/:id', authenticate, isAdmin, isMainAdmin, subAdminController.deleteSubAdmin);

module.exports = router;


