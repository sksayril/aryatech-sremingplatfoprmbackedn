const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const withdrawalController = require('../../controllers/user/withdrawal.controller');

// All routes require authentication
router.use(authenticate);

// Create withdrawal request
router.post('/', withdrawalController.createWithdrawalRequest);

// Get user's withdrawal requests
router.get('/', withdrawalController.getMyWithdrawalRequests);

// Get withdrawal request by ID
router.get('/:id', withdrawalController.getWithdrawalRequestById);

// Cancel pending withdrawal request
router.delete('/:id', withdrawalController.cancelWithdrawalRequest);

module.exports = router;

