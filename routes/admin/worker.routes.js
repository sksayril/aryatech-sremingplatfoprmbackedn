/**
 * Worker Management Routes
 * Admin routes to manage upload worker
 */

const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../../middleware/auth.middleware');
const { processJobsNow } = require('../../workers/uploadWorker');
const UploadJob = require('../../models/uploadJob.model');

// All routes require admin authentication
router.use(authenticate, isAdmin);

/**
 * Manually trigger job processing
 */
router.post('/process-jobs', async (req, res) => {
  try {
    const { count = 10 } = req.body;
    const results = await processJobsNow(count);

    res.json({
      success: true,
      message: `Processed ${results.length} jobs`,
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process jobs',
      error: error.message,
    });
  }
});

/**
 * Get worker status and queue stats
 */
router.get('/status', async (req, res) => {
  try {
    const pending = await UploadJob.countDocuments({ Status: 'pending' });
    const processing = await UploadJob.countDocuments({ Status: 'processing' });
    const completed = await UploadJob.countDocuments({ Status: 'completed' });
    const failed = await UploadJob.countDocuments({ Status: 'failed' });

    res.json({
      success: true,
      data: {
        queue: {
          pending,
          processing,
          completed,
          failed,
          total: pending + processing + completed + failed,
        },
        worker: {
          enabled: process.env.ENABLE_UPLOAD_WORKER !== 'false',
          interval: parseInt(process.env.UPLOAD_WORKER_INTERVAL) || 5000,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get worker status',
      error: error.message,
    });
  }
});

module.exports = router;

