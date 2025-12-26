const Movie = require('../../models/movie.model');
const Comment = require('../../models/comment.model');

/**
 * Get movie statistics
 */
exports.getMovieStatistics = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate movie ID
    if (!id || id === 'null' || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID provided',
      });
    }

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID format',
      });
    }

    const movie = await Movie.findById(id).select('Title Slug Views Likes Comments Rating');

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    // Get top comments
    const topComments = await Comment.find({
      Movie: id,
      IsActive: true,
    })
      .populate('User', 'Name Email ProfilePicture')
      .sort({ Likes: -1, createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        movie: {
          _id: movie._id,
          Title: movie.Title,
          Slug: movie.Slug,
        },
        statistics: {
          views: movie.Views,
          likes: movie.Likes,
          comments: movie.Comments,
          averageRating: movie.Rating,
          topComments: topComments.map(comment => ({
            _id: comment._id,
            Comment: comment.Comment,
            Likes: comment.Likes,
            User: comment.User,
            createdAt: comment.createdAt,
          })),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch movie statistics',
      error: error.message,
    });
  }
};

/**
 * Get movie comments (admin view)
 */
exports.getMovieComments = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate movie ID
    if (!id || id === 'null' || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID provided',
      });
    }

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID format',
      });
    }

    const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const comments = await Comment.find({
      Movie: id,
    })
      .populate('User', 'Name Email ProfilePicture')
      .populate('Replies.User', 'Name Email ProfilePicture')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Comment.countDocuments({ Movie: id });

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

