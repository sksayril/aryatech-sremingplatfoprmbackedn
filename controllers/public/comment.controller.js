const Comment = require('../../models/comment.model');
const Movie = require('../../models/movie.model');

/**
 * Add comment to movie
 */
exports.addComment = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { Comment: commentText, parentCommentId } = req.body;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    let comment;
    if (parentCommentId) {
      // Reply to existing comment
      const parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({
          success: false,
          message: 'Parent comment not found',
        });
      }

      parentComment.Replies.push({
        User: req.user._id,
        Comment: commentText,
      });

      await parentComment.save();
      comment = parentComment;
    } else {
      // New comment
      comment = await Comment.create({
        Movie: movieId,
        User: req.user._id,
        Comment: commentText,
      });

      // Update movie comment count
      movie.Comments += 1;
      await movie.save();
    }

    await comment.populate('User', 'Name Email ProfilePicture');
    if (comment.Replies && comment.Replies.length > 0) {
      await Comment.populate(comment.Replies, { path: 'User', select: 'Name Email ProfilePicture' });
    }

    res.status(201).json({
      success: true,
      message: 'Comment added successfully',
      data: comment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message,
    });
  }
};

/**
 * Get comments for movie
 */
exports.getMovieComments = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const comments = await Comment.find({
      Movie: movieId,
      IsActive: true,
    })
      .populate('User', 'Name Email ProfilePicture')
      .populate('Replies.User', 'Name Email ProfilePicture')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Comment.countDocuments({
      Movie: movieId,
      IsActive: true,
    });

    res.json({
      success: true,
      data: comments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: error.message,
    });
  }
};

/**
 * Like/Unlike comment
 */
exports.toggleCommentLike = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { replyIndex } = req.query; // For liking replies

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found',
      });
    }

    if (replyIndex !== undefined) {
      // Like/unlike reply
      const reply = comment.Replies[replyIndex];
      if (!reply) {
        return res.status(404).json({
          success: false,
          message: 'Reply not found',
        });
      }

      const likedIndex = reply.LikedBy.indexOf(req.user._id);
      if (likedIndex > -1) {
        reply.LikedBy.splice(likedIndex, 1);
        reply.Likes -= 1;
      } else {
        reply.LikedBy.push(req.user._id);
        reply.Likes += 1;
      }
    } else {
      // Like/unlike main comment
      const likedIndex = comment.LikedBy.indexOf(req.user._id);
      if (likedIndex > -1) {
        comment.LikedBy.splice(likedIndex, 1);
        comment.Likes -= 1;
      } else {
        comment.LikedBy.push(req.user._id);
        comment.Likes += 1;
      }
    }

    await comment.save();

    res.json({
      success: true,
      message: 'Comment like toggled',
      data: comment,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to toggle comment like',
      error: error.message,
    });
  }
};

/**
 * Get top comments (most liked)
 */
exports.getTopComments = async (req, res) => {
  try {
    const { movieId } = req.params;
    const { limit = 10 } = req.query;

    const comments = await Comment.find({
      Movie: movieId,
      IsActive: true,
    })
      .populate('User', 'Name Email ProfilePicture')
      .populate('Replies.User', 'Name Email ProfilePicture')
      .sort({ Likes: -1, createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch top comments',
      error: error.message,
    });
  }
};

