const express = require('express');
const router = express.Router();
const adController = require('../../controllers/public/ad.controller');

// Get ads by type
router.get('/type/:type', adController.getAdsByType);

// Track ad click
router.post('/:id/click', adController.trackAdClick);

module.exports = router;

