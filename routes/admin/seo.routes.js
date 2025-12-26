const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../../middleware/auth.middleware');
const seoController = require('../../controllers/admin/seo.controller');

// All routes require admin authentication
router.use(authenticate, isAdmin);

// Update movie SEO
router.put('/movie/:id', seoController.updateMovieSEO);

// Generate sitemap
router.post('/sitemap/generate', seoController.generateSitemap);

// Get SEO analytics
router.get('/analytics', seoController.getSEOAnalytics);

module.exports = router;

