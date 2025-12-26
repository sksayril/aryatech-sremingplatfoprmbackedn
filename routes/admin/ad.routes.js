const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../../middleware/auth.middleware');
const { adMediaUpload } = require('../../middleware/upload.middleware');
const adController = require('../../controllers/admin/ad.controller');

// All routes require admin authentication
router.use(authenticate, isAdmin);

// Create ad (with file upload)
router.post(
  '/',
  adMediaUpload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  adController.createAd
);

// Get all ads
router.get('/', adController.getAllAds);

// Get ad analytics
router.get('/analytics/:id', adController.getAdAnalytics);

// Get single ad
router.get('/:id', adController.getAdById);

// Update ad
router.put(
  '/:id',
  adMediaUpload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'video', maxCount: 1 },
  ]),
  adController.updateAd
);

// Toggle ad status
router.patch('/:id/toggle-status', adController.toggleAdStatus);

// Delete ad
router.delete('/:id', adController.deleteAd);

module.exports = router;

