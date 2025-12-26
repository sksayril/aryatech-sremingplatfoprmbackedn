const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../../middleware/auth.middleware');
const { imageUpload } = require('../../middleware/upload.middleware');
const channelController = require('../../controllers/admin/channel.controller');

// All routes require admin authentication
router.use(authenticate, isAdmin);

// Create channel
router.post('/', imageUpload.single('logo'), channelController.createChannel);

// Get all channels
router.get('/', channelController.getAllChannels);

// Get channel by ID
router.get('/:id', channelController.getChannelById);

// Update channel
router.put('/:id', imageUpload.single('logo'), channelController.updateChannel);

// Delete channel
router.delete('/:id', channelController.deleteChannel);

module.exports = router;

