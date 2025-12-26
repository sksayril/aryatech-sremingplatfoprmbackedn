const express = require('express');
const router = express.Router();

/**
 * Health check endpoint
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

/**
 * API info endpoint
 */
router.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Movie Streaming API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      admin: {
        ads: '/api/admin/ads',
        movies: '/api/admin/movies',
        categories: '/api/admin/categories',
        channels: '/api/admin/channels',
        subcategories: '/api/admin/subcategories',
        seo: '/api/admin/seo',
        referrals: '/api/admin/referrals',
      },
      public: {
        movies: '/api/movies',
        ads: '/api/ads',
      },
      user: {
        watchHistory: '/api/user/watch-history',
        favorites: '/api/user/favorites',
        referrals: '/api/user/referrals',
      },
    },
  });
});

module.exports = router;
