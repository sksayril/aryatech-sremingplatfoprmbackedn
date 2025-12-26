const Movie = require('../../models/movie.model');
const Category = require('../../models/category.model');
const SubCategory = require('../../models/subcategory.model');
const SubSubCategory = require('../../models/subsubcategory.model');
const Channel = require('../../models/channel.model');
const WatchHistory = require('../../models/watchHistory.model');
const Favorite = require('../../models/favorite.model');
const Comment = require('../../models/comment.model');
const { MOVIE_STATUS } = require('../../config/constants');

/**
 * Get trending movies
 */
exports.getTrendingMovies = async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const userCountry = req.headers['x-country-code'] || 'US';

    const query = {
      Status: MOVIE_STATUS.ACTIVE,
      IsTrending: true,
      $or: [
        { BlockedCountries: { $nin: [userCountry] } },
        { BlockedCountries: { $exists: false } },
        { BlockedCountries: { $size: 0 } },
      ],
    };

    const movies = await Movie.find(query)
      .populate('Category', 'Name Slug')
      .populate('SubCategory', 'Name Slug')
      .populate('Channel', 'Name Slug')
      .select('-Videos -Subtitles') // Don't send video URLs in list
      .sort({ Views: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Movie.countDocuments(query);

    res.json({
      success: true,
      data: movies,
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
      message: 'Failed to fetch trending movies',
      error: error.message,
    });
  }
};

/**
 * Get featured movies
 */
exports.getFeaturedMovies = async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const userCountry = req.headers['x-country-code'] || 'US';

    const query = {
      Status: MOVIE_STATUS.ACTIVE,
      IsFeatured: true,
      $or: [
        { BlockedCountries: { $nin: [userCountry] } },
        { BlockedCountries: { $exists: false } },
        { BlockedCountries: { $size: 0 } },
      ],
    };

    const movies = await Movie.find(query)
      .populate('Category', 'Name Slug')
      .populate('SubCategory', 'Name Slug')
      .populate('Channel', 'Name Slug')
      .select('-Videos -Subtitles')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Movie.countDocuments(query);

    res.json({
      success: true,
      data: movies,
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
      message: 'Failed to fetch featured movies',
      error: error.message,
    });
  }
};

/**
 * Get movies by category
 */
exports.getMoviesByCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 30 } = req.query;
    const userCountry = req.headers['x-country-code'] || 'US';

    const category = await Category.findOne({ Slug: slug, IsActive: true });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const query = {
      Category: category._id,
      Status: MOVIE_STATUS.ACTIVE,
      $or: [
        { BlockedCountries: { $nin: [userCountry] } },
        { BlockedCountries: { $exists: false } },
        { BlockedCountries: { $size: 0 } },
      ],
    };

    const movies = await Movie.find(query)
      .populate('Category', 'Name Slug')
      .populate('SubCategory', 'Name Slug')
      .populate('Channel', 'Name Slug')
      .select('-Videos -Subtitles')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Movie.countDocuments(query);

    res.json({
      success: true,
      data: movies,
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
      message: 'Failed to fetch movies',
      error: error.message,
    });
  }
};

/**
 * Get movie by slug (public)
 */
exports.getMovieBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const userCountry = req.headers['x-country-code'] || 'US';

    const movie = await Movie.findOne({
      Slug: slug,
      Status: MOVIE_STATUS.ACTIVE,
      $or: [
        { BlockedCountries: { $nin: [userCountry] } },
        { BlockedCountries: { $exists: false } },
        { BlockedCountries: { $size: 0 } },
      ],
    })
      .populate('Category', 'Name Slug')
      .populate('SubCategory', 'Name Slug')
      .populate('SubSubCategory', 'Name Slug')
      .populate('Channel', 'Name Slug');

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found or not available in your country',
      });
    }

    // Increment views
    movie.Views += 1;
    await movie.save();

    // Check if user has watched this before (if authenticated)
    let watchHistory = null;
    let isFavorite = false;
    let isLiked = false;

    if (req.user) {
      watchHistory = await WatchHistory.findOne({
        User: req.user._id,
        Movie: movie._id,
      });
      const favorite = await Favorite.findOne({
        User: req.user._id,
        Movie: movie._id,
      });
      isFavorite = !!favorite;
      isLiked = movie.LikedBy && movie.LikedBy.includes(req.user._id);
    }

    // Get top comments
    const topComments = await Comment.find({
      Movie: movie._id,
      IsActive: true,
    })
      .populate('User', 'Name Email ProfilePicture')
      .populate('Replies.User', 'Name Email ProfilePicture')
      .sort({ Likes: -1, createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        ...movie.toObject(),
        watchHistory: watchHistory
          ? {
              watchedDuration: watchHistory.WatchedDuration,
              totalDuration: watchHistory.TotalDuration,
              lastWatchedAt: watchHistory.LastWatchedAt,
              isCompleted: watchHistory.IsCompleted,
            }
          : null,
        isFavorite,
        isLiked,
        topComments: topComments.map(comment => ({
          _id: comment._id,
          Comment: comment.Comment,
          Likes: comment.Likes,
          User: comment.User,
          Replies: comment.Replies.slice(0, 3), // Top 3 replies
          createdAt: comment.createdAt,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch movie',
      error: error.message,
    });
  }
};

/**
 * Search movies
 */
exports.searchMovies = async (req, res) => {
  try {
    const { q, page = 1, limit = 30 } = req.query;
    const userCountry = req.headers['x-country-code'] || 'US';

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
      });
    }

    const query = {
      Status: MOVIE_STATUS.ACTIVE,
      $and: [
        {
          $or: [
            { Title: { $regex: q, $options: 'i' } },
            { Description: { $regex: q, $options: 'i' } },
            { Genre: { $in: [new RegExp(q, 'i')] } },
            { Cast: { $in: [new RegExp(q, 'i')] } },
          ],
        },
        {
          $or: [
            { BlockedCountries: { $nin: [userCountry] } },
            { BlockedCountries: { $exists: false } },
            { BlockedCountries: { $size: 0 } },
          ],
        },
      ],
    };

    const movies = await Movie.find(query)
      .populate('Category', 'Name Slug')
      .populate('SubCategory', 'Name Slug')
      .populate('Channel', 'Name Slug')
      .select('-Videos -Subtitles')
      .sort({ Views: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Movie.countDocuments(query);

    res.json({
      success: true,
      data: movies,
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
      message: 'Failed to search movies',
      error: error.message,
    });
  }
};

/**
 * Get all categories (public)
 */
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ IsActive: true }).sort({ SortOrder: 1 });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message,
    });
  }
};

/**
 * Get all channels (public)
 */
exports.getAllChannels = async (req, res) => {
  try {
    const channels = await Channel.find({ IsActive: true }).sort({ SortOrder: 1 });

    res.json({
      success: true,
      data: channels,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch channels',
      error: error.message,
    });
  }
};

/**
 * Get all movies (public)
 */
exports.getAllMovies = async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const userCountry = req.headers['x-country-code'] || 'US';

    const query = {
      Status: MOVIE_STATUS.ACTIVE,
      $or: [
        { BlockedCountries: { $nin: [userCountry] } },
        { BlockedCountries: { $exists: false } },
        { BlockedCountries: { $size: 0 } },
      ],
    };

    const movies = await Movie.find(query)
      .populate('Category', 'Name Slug')
      .populate('SubCategory', 'Name Slug')
      .populate('Channel', 'Name Slug')
      .select('-Subtitles')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Movie.countDocuments(query);

    res.json({
      success: true,
      data: movies,
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
      message: 'Failed to fetch movies',
      error: error.message,
    });
  }
};

/**
 * Get movie by ID (public)
 */
exports.getMovieById = async (req, res) => {
  try {
    const { id } = req.params;
    const userCountry = req.headers['x-country-code'] || 'US';

    const movie = await Movie.findOne({
      _id: id,
      Status: MOVIE_STATUS.ACTIVE,
      $or: [
        { BlockedCountries: { $nin: [userCountry] } },
        { BlockedCountries: { $exists: false } },
        { BlockedCountries: { $size: 0 } },
      ],
    })
      .populate('Category', 'Name Slug')
      .populate('SubCategory', 'Name Slug')
      .populate('SubSubCategory', 'Name Slug')
      .populate('Channel', 'Name Slug');

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found or not available in your country',
      });
    }

    // Increment views
    movie.Views += 1;
    await movie.save();

    // Check if user has watched this before (if authenticated)
    let watchHistory = null;
    let isFavorite = false;
    let isLiked = false;

    if (req.user) {
      watchHistory = await WatchHistory.findOne({
        User: req.user._id,
        Movie: movie._id,
      });
      const favorite = await Favorite.findOne({
        User: req.user._id,
        Movie: movie._id,
      });
      isFavorite = !!favorite;
      isLiked = movie.LikedBy && movie.LikedBy.includes(req.user._id);
    }

    // Get top comments
    const topComments = await Comment.find({
      Movie: movie._id,
      IsActive: true,
    })
      .populate('User', 'Name Email ProfilePicture')
      .populate('Replies.User', 'Name Email ProfilePicture')
      .sort({ Likes: -1, createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      data: {
        ...movie.toObject(),
        watchHistory: watchHistory
          ? {
              watchedDuration: watchHistory.WatchedDuration,
              totalDuration: watchHistory.TotalDuration,
              lastWatchedAt: watchHistory.LastWatchedAt,
              isCompleted: watchHistory.IsCompleted,
            }
          : null,
        isFavorite,
        isLiked,
        topComments: topComments.map(comment => ({
          _id: comment._id,
          Comment: comment.Comment,
          Likes: comment.Likes,
          User: comment.User,
          Replies: comment.Replies.slice(0, 3),
          createdAt: comment.createdAt,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch movie',
      error: error.message,
    });
  }
};

/**
 * Get movies by subcategory with first video info
 */
exports.getMoviesBySubCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 30 } = req.query;
    const userCountry = req.headers['x-country-code'] || 'US';

    const subCategory = await SubCategory.findOne({ Slug: slug, IsActive: true });

    if (!subCategory) {
      return res.status(404).json({
        success: false,
        message: 'Subcategory not found',
      });
    }

    const query = {
      SubCategory: subCategory._id,
      Status: MOVIE_STATUS.ACTIVE,
      $or: [
        { BlockedCountries: { $nin: [userCountry] } },
        { BlockedCountries: { $exists: false } },
        { BlockedCountries: { $size: 0 } },
      ],
    };

    const movies = await Movie.find(query)
      .populate('Category', 'Name Slug')
      .populate('SubCategory', 'Name Slug')
      .populate('Channel', 'Name Slug')
      .select('-Subtitles')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Format movies with first video info
    const formattedMovies = movies.map(movie => {
      const movieObj = movie.toObject();
      const firstVideo = movie.Videos && movie.Videos.length > 0 ? movie.Videos[0] : null;
      
      return {
        ...movieObj,
        firstVideo: firstVideo ? {
          quality: firstVideo.Quality,
          thumbnail: movie.Thumbnail,
          duration: firstVideo.Duration,
        } : null,
        Videos: undefined, // Remove full videos array
      };
    });

    const total = await Movie.countDocuments(query);

    res.json({
      success: true,
      data: formattedMovies,
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
      message: 'Failed to fetch movies',
      error: error.message,
    });
  }
};

/**
 * Get subcategories with first video info
 */
exports.getSubCategoriesWithVideos = async (req, res) => {
  try {
    const { categorySlug } = req.params;
    const { page = 1, limit = 30 } = req.query;
    const userCountry = req.headers['x-country-code'] || 'US';

    const category = await Category.findOne({ Slug: categorySlug, IsActive: true });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const subCategories = await SubCategory.find({
      Category: category._id,
      IsActive: true,
    }).sort({ SortOrder: 1 });

    const result = await Promise.all(
      subCategories.map(async (subCat) => {
        const firstMovie = await Movie.findOne({
          SubCategory: subCat._id,
          Status: MOVIE_STATUS.ACTIVE,
          $or: [
            { BlockedCountries: { $nin: [userCountry] } },
            { BlockedCountries: { $exists: false } },
            { BlockedCountries: { $size: 0 } },
          ],
        })
          .select('Title Thumbnail Videos Likes')
          .sort({ createdAt: -1 });

        return {
          _id: subCat._id,
          Name: subCat.Name,
          Slug: subCat.Slug,
          Description: subCat.Description,
          firstVideo: firstMovie
            ? {
                _id: firstMovie._id,
                title: firstMovie.Title,
                thumbnail: firstMovie.Thumbnail,
                likes: firstMovie.Likes || 0,
                hasVideo: firstMovie.Videos && firstMovie.Videos.length > 0,
              }
            : null,
        };
      })
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subcategories',
      error: error.message,
    });
  }
};

/**
 * Get similar movies by category
 */
exports.getSimilarMovies = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 30 } = req.query;
    const userCountry = req.headers['x-country-code'] || 'US';

    const movie = await Movie.findById(id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    const query = {
      _id: { $ne: movie._id },
      Category: movie.Category,
      Status: MOVIE_STATUS.ACTIVE,
      $or: [
        { BlockedCountries: { $nin: [userCountry] } },
        { BlockedCountries: { $exists: false } },
        { BlockedCountries: { $size: 0 } },
      ],
    };

    const similarMovies = await Movie.find(query)
      .populate('Category', 'Name Slug')
      .populate('SubCategory', 'Name Slug')
      .select('-Videos -Subtitles')
      .sort({ Views: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Movie.countDocuments(query);

    res.json({
      success: true,
      data: similarMovies,
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
      message: 'Failed to fetch similar movies',
      error: error.message,
    });
  }
};

/**
 * Get new movies
 */
exports.getNewMovies = async (req, res) => {
  try {
    const { page = 1, limit = 30 } = req.query;
    const userCountry = req.headers['x-country-code'] || 'US';

    const query = {
      Status: MOVIE_STATUS.ACTIVE,
      $or: [
        { BlockedCountries: { $nin: [userCountry] } },
        { BlockedCountries: { $exists: false } },
        { BlockedCountries: { $size: 0 } },
      ],
    };

    const movies = await Movie.find(query)
      .populate('Category', 'Name Slug')
      .populate('SubCategory', 'Name Slug')
      .populate('Channel', 'Name Slug')
      .select('-Videos -Subtitles')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Movie.countDocuments(query);

    res.json({
      success: true,
      data: movies,
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
      message: 'Failed to fetch new movies',
      error: error.message,
    });
  }
};

/**
 * Get all videos under main category
 */
exports.getAllVideosByCategory = async (req, res) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 30 } = req.query;
    const userCountry = req.headers['x-country-code'] || 'US';

    const category = await Category.findOne({ Slug: slug, IsActive: true });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    const query = {
      Category: category._id,
      Status: MOVIE_STATUS.ACTIVE,
      $or: [
        { BlockedCountries: { $nin: [userCountry] } },
        { BlockedCountries: { $exists: false } },
        { BlockedCountries: { $size: 0 } },
      ],
    };

    const movies = await Movie.find(query)
      .populate('Category', 'Name Slug')
      .populate('SubCategory', 'Name Slug')
      .populate('Channel', 'Name Slug')
      .select('-Videos -Subtitles')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Movie.countDocuments(query);

    res.json({
      success: true,
      data: movies,
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
      message: 'Failed to fetch videos',
      error: error.message,
    });
  }
};

/**
 * Get all subcategories
 */
exports.getAllSubCategories = async (req, res) => {
  try {
    const { categorySlug } = req.query;
    let query = { IsActive: true };

    if (categorySlug) {
      const category = await Category.findOne({ Slug: categorySlug, IsActive: true });
      if (category) {
        query.Category = category._id;
      }
    }

    const subCategories = await SubCategory.find(query)
      .populate('Category', 'Name Slug')
      .sort({ SortOrder: 1 });

    res.json({
      success: true,
      data: subCategories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subcategories',
      error: error.message,
    });
  }
};

