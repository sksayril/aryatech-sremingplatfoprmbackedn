/**
 * Upload Queue Management Routes (Admin)
 */

const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../../middleware/auth.middleware');
const validateObjectId = require('../../middleware/validateObjectId.middleware');
const uploadQueueController = require('../../controllers/admin/uploadQueue.controller');

// All routes require admin authentication
router.use(authenticate, isAdmin);

// Get all upload queues with filters
router.get('/', uploadQueueController.getAllUploadQueues);

// Get pending upload queues
router.get('/pending', uploadQueueController.getPendingUploadQueues);

// Get upload queues by movie title (search)
router.get('/search', uploadQueueController.getUploadQueuesByMovieTitle);

// Get upload queue details by ID
router.get('/:id', validateObjectId('id'), uploadQueueController.getUploadQueueById);

// Delete upload queue
router.delete('/:id', validateObjectId('id'), uploadQueueController.deleteUploadQueue);

module.exports = router;

