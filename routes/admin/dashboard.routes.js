const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../../middleware/auth.middleware');
const dashboardController = require('../../controllers/admin/dashboard.controller');

// All routes require admin authentication
router.use(authenticate, isAdmin);

/**
 * @route GET /api/admin/dashboard/overview
 * @desc Get dashboard overview statistics
 * @access Private (Admin)
 */
router.get('/overview', dashboardController.getDashboardOverview);

/**
 * @route GET /api/admin/dashboard/views-watchtime
 * @desc Get views vs watch time graph data
 * @access Private (Admin)
 */
router.get('/views-watchtime', dashboardController.getViewsVsWatchTimeGraph);

/**
 * @route GET /api/admin/dashboard/user-growth
 * @desc Get user growth data (daily/weekly)
 * @access Private (Admin)
 */
router.get('/user-growth', dashboardController.getUserGrowth);

/**
 * @route GET /api/admin/dashboard/peak-streaming
 * @desc Get peak streaming time (hour-wise)
 * @access Private (Admin)
 */
router.get('/peak-streaming', dashboardController.getPeakStreamingTime);

module.exports = router;

