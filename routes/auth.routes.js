const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth.middleware');
const authController = require('../controllers/auth/auth.controller');

// Public routes
router.post('/signup', authController.signUp);
router.post('/signin', authController.signIn);
router.post('/sub-admin/login', authController.subAdminLogin);

// Protected routes
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.put('/change-password', authenticate, authController.changePassword);

module.exports = router;

