const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../../middleware/auth.middleware');
const userController = require('../../controllers/admin/user.controller');

// All routes require admin authentication
router.use(authenticate, isAdmin);

// Create admin user
router.post('/create-admin', userController.createAdmin);

// Get all admins
router.get('/admins', userController.getAllAdmins);

// Get admin by ID
router.get('/admins/:id', userController.getAdminById);

// Update admin
router.put('/admins/:id', userController.updateAdmin);

// Delete admin
router.delete('/admins/:id', userController.deleteAdmin);

// Change admin password
router.patch('/admins/:id/change-password', userController.changeAdminPassword);

// Toggle admin status
router.patch('/admins/:id/toggle-status', userController.toggleAdminStatus);

module.exports = router;


