const Movie = require('../../models/movie.model');

/**
 * Like/Unlike movie
 */
exports.toggleMovieLike = async (req, res) => {
  try {
    const { movieId } = req.params;

    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    const likedIndex = movie.LikedBy.indexOf(req.user._id);
    if (likedIndex > -1) {
      // Unlike
      movie.LikedBy.splice(likedIndex, 1);
      movie.Likes -= 1;
    } else {
      // Like
      movie.LikedBy.push(req.user._id);
      movie.Likes += 1;
    }

    await movie.save();

    res.json({
      success: true,
      message: likedIndex > -1 ? 'Movie unliked' : 'Movie liked',
      data: {
        movieId: movie._id,
        likes: movie.Likes,
        isLiked: likedIndex === -1,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to toggle movie like',
      error: error.message,
    });
  }
};

/**
 * Check if movie is liked
 */
exports.checkMovieLike = async (req, res) => {
  try {
    const { movieId } = req.params;

    const movie = await Movie.findById(movieId).select('LikedBy');
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    const isLiked = movie.LikedBy.includes(req.user._id);

    res.json({
      success: true,
      data: {
        isLiked,
        likes: movie.LikedBy.length,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to check movie like',
      error: error.message,
    });
  }
};

