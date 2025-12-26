const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const favoriteController = require('../../controllers/user/favorite.controller');

// All routes require authentication
router.use(authenticate);

// Add to favorites
router.post('/', favoriteController.addToFavorites);

// Get favorites
router.get('/', favoriteController.getFavorites);

// Check if favorited
router.get('/check/:movieId', favoriteController.checkFavorite);

// Remove from favorites
router.delete('/:movieId', favoriteController.removeFromFavorites);

module.exports = router;

