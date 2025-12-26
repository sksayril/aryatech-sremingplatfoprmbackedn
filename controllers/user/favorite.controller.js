const Favorite = require('../../models/favorite.model');
const Movie = require('../../models/movie.model');

/**
 * Add to favorites
 */
exports.addToFavorites = async (req, res) => {
  try {
    const { movieId } = req.body;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    // Check if already favorited
    const existingFavorite = await Favorite.findOne({
      User: req.user._id,
      Movie: movieId,
    });

    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: 'Movie already in favorites',
      });
    }

    const favorite = await Favorite.create({
      User: req.user._id,
      Movie: movieId,
    });

    await favorite.populate('Movie', 'Title Thumbnail Slug Description Category');

    res.status(201).json({
      success: true,
      message: 'Added to favorites',
      data: favorite,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to add to favorites',
      error: error.message,
    });
  }
};

/**
 * Remove from favorites
 */
exports.removeFromFavorites = async (req, res) => {
  try {
    const { movieId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
      User: req.user._id,
      Movie: movieId,
    });

    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found',
      });
    }

    res.json({
      success: true,
      message: 'Removed from favorites',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove from favorites',
      error: error.message,
    });
  }
};

/**
 * Get favorites
 */
exports.getFavorites = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const favorites = await Favorite.find({ User: req.user._id })
      .populate('Movie', 'Title Thumbnail Slug Description Category Views Rating')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Favorite.countDocuments({ User: req.user._id });

    res.json({
      success: true,
      data: favorites,
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
      message: 'Failed to fetch favorites',
      error: error.message,
    });
  }
};

/**
 * Check if movie is favorited
 */
exports.checkFavorite = async (req, res) => {
  try {
    const { movieId } = req.params;

    const favorite = await Favorite.findOne({
      User: req.user._id,
      Movie: movieId,
    });

    res.json({
      success: true,
      data: {
        isFavorite: !!favorite,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check favorite status',
      error: error.message,
    });
  }
};

