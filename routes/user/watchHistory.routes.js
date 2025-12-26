const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const watchHistoryController = require('../../controllers/user/watchHistory.controller');

// All routes require authentication
router.use(authenticate);

// Update watch history
router.post('/', watchHistoryController.updateWatchHistory);

// Get watch history
router.get('/', watchHistoryController.getWatchHistory);

// Clear watch history
router.delete('/', watchHistoryController.clearWatchHistory);

// Remove from watch history
router.delete('/:id', watchHistoryController.removeFromWatchHistory);

module.exports = router;

