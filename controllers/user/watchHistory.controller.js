const WatchHistory = require('../../models/watchHistory.model');
const Movie = require('../../models/movie.model');

/**
 * Add or update watch history
 */
exports.updateWatchHistory = async (req, res) => {
  try {
    const { movieId, watchedDuration, quality } = req.body;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    // Get total duration from video
    const video = movie.Videos.find((v) => v.Quality === quality) || movie.Videos[0];
    const totalDuration = video?.Duration || 0;

    const watchHistory = await WatchHistory.findOneAndUpdate(
      {
        User: req.user._id,
        Movie: movieId,
      },
      {
        User: req.user._id,
        Movie: movieId,
        WatchedDuration: watchedDuration,
        TotalDuration: totalDuration,
        Quality: quality,
        LastWatchedAt: new Date(),
        IsCompleted: watchedDuration >= totalDuration * 0.9, // 90% watched = completed
      },
      {
        upsert: true,
        new: true,
      }
    )
      .populate('Movie', 'Title Thumbnail Slug')
      .populate('User', 'Name Email');

    res.json({
      success: true,
      message: 'Watch history updated',
      data: watchHistory,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update watch history',
      error: error.message,
    });
  }
};

/**
 * Get watch history
 */
exports.getWatchHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const watchHistory = await WatchHistory.find({ User: req.user._id })
      .populate('Movie', 'Title Thumbnail Slug Description Category')
      .sort({ LastWatchedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await WatchHistory.countDocuments({ User: req.user._id });

    res.json({
      success: true,
      data: watchHistory,
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
      message: 'Failed to fetch watch history',
      error: error.message,
    });
  }
};

/**
 * Clear watch history
 */
exports.clearWatchHistory = async (req, res) => {
  try {
    await WatchHistory.deleteMany({ User: req.user._id });

    res.json({
      success: true,
      message: 'Watch history cleared',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to clear watch history',
      error: error.message,
    });
  }
};

/**
 * Remove single item from watch history
 */
exports.removeFromWatchHistory = async (req, res) => {
  try {
    const { id } = req.params;

    await WatchHistory.findOneAndDelete({
      _id: id,
      User: req.user._id,
    });

    res.json({
      success: true,
      message: 'Removed from watch history',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove from watch history',
      error: error.message,
    });
  }
};

