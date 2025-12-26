const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const referralController = require('../../controllers/user/referral.controller');

// All routes require authentication
router.use(authenticate);

// Get referral info
router.get('/info', referralController.getReferralInfo);

// Get referral list
router.get('/list', referralController.getReferralList);

module.exports = router;

