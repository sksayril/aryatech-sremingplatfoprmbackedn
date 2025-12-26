const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { hasPermission } = require('../../middleware/rbac.middleware');
const contactController = require('../../controllers/admin/contact.controller');

// All contact management routes require authentication and contact:read permission
router.use(authenticate);

// Get contact statistics (requires contact:read)
router.get('/stats', hasPermission(['contact:read']), contactController.getContactStats);

// Get all contacts (requires contact:read)
router.get('/', hasPermission(['contact:read']), contactController.getAllContacts);

// Get contact by ID (requires contact:read)
router.get('/:id', hasPermission(['contact:read']), contactController.getContactById);

// Update contact status (requires contact:update)
router.patch('/:id/status', hasPermission(['contact:update']), contactController.updateContactStatus);

// Add admin note (requires contact:update)
router.post('/:id/notes', hasPermission(['contact:update']), contactController.addAdminNote);

// Delete contact (requires contact:delete)
router.delete('/:id', hasPermission(['contact:delete']), contactController.deleteContact);

module.exports = router;

