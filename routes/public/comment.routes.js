const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../../middleware/auth.middleware');
const commentController = require('../../controllers/public/comment.controller');

// Get movie comments (public)
router.get('/movie/:movieId', optionalAuth, commentController.getMovieComments);

// Get top comments (public)
router.get('/movie/:movieId/top', optionalAuth, commentController.getTopComments);

// Add comment (authenticated)
router.post('/movie/:movieId', authenticate, commentController.addComment);

// Like/Unlike comment (authenticated)
router.patch('/:commentId/like', authenticate, commentController.toggleCommentLike);

module.exports = router;

