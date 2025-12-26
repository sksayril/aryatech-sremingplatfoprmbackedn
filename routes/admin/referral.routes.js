const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../../middleware/auth.middleware');
const referralController = require('../../controllers/admin/referral.controller');

// All routes require admin authentication
router.use(authenticate, isAdmin);

// Get all referrals
router.get('/', referralController.getAllReferrals);

// Get referral statistics
router.get('/stats', referralController.getReferralStats);

// Update referral earnings
router.patch('/:id/earnings', referralController.updateReferralEarnings);

module.exports = router;

