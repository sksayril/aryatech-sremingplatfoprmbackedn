const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../../middleware/auth.middleware');
const movieController = require('../../controllers/public/movie.controller');

// Get all movies
router.get('/all', movieController.getAllMovies);

// Get trending movies
router.get('/trending', movieController.getTrendingMovies);

// Get new movies
router.get('/new', movieController.getNewMovies);

// Get featured movies
router.get('/featured', movieController.getFeaturedMovies);

// Get all categories
router.get('/categories', movieController.getAllCategories);

// Get all subcategories
router.get('/subcategories', movieController.getAllSubCategories);

// Get subcategories with videos by category (must come before /category/:slug)
router.get('/categories/:categorySlug/subcategories', movieController.getSubCategoriesWithVideos);

// Get all videos under main category (must come before /category/:slug)
router.get('/category/:slug/videos', movieController.getAllVideosByCategory);

// Get movies by category
router.get('/category/:slug', movieController.getMoviesByCategory);

// Get movies by subcategory
router.get('/subcategory/:slug', movieController.getMoviesBySubCategory);

// Search movies
router.get('/search', movieController.searchMovies);

// Get all channels
router.get('/channels', movieController.getAllChannels);

// Get movie by ID (must come before /:slug)
router.get('/id/:id', optionalAuth, movieController.getMovieById);

// Get similar movies (must come before /:slug)
router.get('/similar/:id', movieController.getSimilarMovies);

// Get related videos (must come before /:slug)
router.get('/related/:id', movieController.getRelatedVideos);

// Get movie by slug (must be last as it's the catch-all dynamic route)
router.get('/:slug', optionalAuth, movieController.getMovieBySlug);

module.exports = router;

