const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../../middleware/auth.middleware');
const { hasPermission } = require('../../middleware/rbac.middleware');
const withdrawalController = require('../../controllers/admin/withdrawal.controller');

// All routes require admin authentication
router.use(authenticate, isAdmin);

// Get withdrawal statistics
router.get('/stats', hasPermission(['withdrawal:read']), withdrawalController.getWithdrawalStats);

// Get all withdrawal requests
router.get('/', hasPermission(['withdrawal:read']), withdrawalController.getAllWithdrawalRequests);

// Get withdrawal request by ID
router.get('/:id', hasPermission(['withdrawal:read']), withdrawalController.getWithdrawalRequestById);

// Update withdrawal request status
router.patch('/:id/status', hasPermission(['withdrawal:update']), withdrawalController.updateWithdrawalStatus);

module.exports = router;

