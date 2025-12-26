const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const movieLikeController = require('../../controllers/user/movieLike.controller');

// All routes require authentication
router.use(authenticate);

// Toggle movie like
router.patch('/:movieId/like', movieLikeController.toggleMovieLike);

// Check if movie is liked
router.get('/:movieId/like', movieLikeController.checkMovieLike);

module.exports = router;

