const Movie = require('../../models/movie.model');
const Category = require('../../models/category.model');
const SubCategory = require('../../models/subcategory.model');
const SubSubCategory = require('../../models/subsubcategory.model');
const Channel = require('../../models/channel.model');
const WatchHistory = require('../../models/watchHistory.model');
const Favorite = require('../../models/favorite.model');
const Comment = require('../../models/comment.model');
const Actor = require('../../models/actor.model');
const mongoose = require('mongoose');
const { MOVIE_STATUS } = require('../../config/constants');

/**
 * Helper function to safely populate Cast field
 * Filters out invalid Cast entries and only populates valid ObjectIds
 */
async function populateCastSafely(movie) {
  if (!movie.Cast || !Array.isArray(movie.Cast) || movie.Cast.length === 0) {
    return [];
  }

  // Filter and convert to valid ObjectIds
  const validCastIds = movie.Cast
    .map(castItem => {
      try {
        // If it's already an ObjectId instance, use it directly
        if (castItem instanceof mongoose.Types.ObjectId) {
          return castItem;
        }
        // If it's an object with _id, use that
        if (castItem && typeof castItem === 'object' && castItem._id) {
          if (castItem._id instanceof mongoose.Types.ObjectId) {
            return castItem._id;
          }
          if (mongoose.Types.ObjectId.isValid(castItem._id)) {
            return new mongoose.Types.ObjectId(castItem._id);
          }
        }
        // If it's a string that looks like an ObjectId, try to convert
        if (typeof castItem === 'string' && mongoose.Types.ObjectId.isValid(castItem)) {
          // Skip if it looks like a malformed string (contains brackets, quotes, etc.)
          if (castItem.includes('[') || castItem.includes("'") || castItem.includes('"')) {
            return null;
          }
          return new mongoose.Types.ObjectId(castItem);
        }
        return null;
      } catch (error) {
        // Skip invalid entries
        return null;
      }
    })
    .filter(id => id !== null);

  // Populate only valid Cast IDs
  if (validCastIds.length === 0) {
    return [];
  }

  try {
    const populatedCast = await Actor.find({
      _id: { $in: validCastIds }
    }).select('Name Slug Image Description DateOfBirth Nationality');

    return populatedCast;
  } catch (error) {
    console.error('Error populating Cast:', error);
    return [];
  }
}

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
      .populate('Channel', 'Name Slug Logo Description IsActive')
      .lean(); // Use lean() to avoid validation issues with invalid Cast data

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found or not available in your country',
      });
    }

    // Increment views (update directly in database to avoid validation issues)
    try {
      await Movie.updateOne(
        { _id: movie._id },
        { $inc: { Views: 1 } }
      );
      movie.Views = (movie.Views || 0) + 1;
    } catch (updateError) {
      // If update fails, we can still return the movie data
      console.warn('Failed to increment views for movie:', movie._id, updateError.message);
    }

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

    // Safely populate Cast to handle invalid data
    const populatedCast = await populateCastSafely(movie);

    res.json({
      success: true,
      data: {
        ...movie, // movie is already a plain object from lean()
        Cast: populatedCast, // Replace with safely populated Cast
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
      .populate('Channel', 'Name Slug Logo Description IsActive')
      .lean(); // Use lean() to avoid validation issues with invalid Cast data

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found or not available in your country',
      });
    }

    // Increment views (update directly in database to avoid validation issues)
    try {
      await Movie.updateOne(
        { _id: movie._id },
        { $inc: { Views: 1 } }
      );
      movie.Views = (movie.Views || 0) + 1;
    } catch (updateError) {
      // If update fails, we can still return the movie data
      console.warn('Failed to increment views for movie:', movie._id, updateError.message);
    }

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

    // Safely populate Cast to handle invalid data
    const populatedCast = await populateCastSafely(movie);

    res.json({
      success: true,
      data: {
        ...movie, // movie is already a plain object from lean()
        Cast: populatedCast, // Replace with safely populated Cast
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
 * Get related videos for a particular video ID
 * Finds videos based on tags, genre, cast, subcategory, and channel
 */
exports.getRelatedVideos = async (req, res) => {
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

    // Build query to find related videos based on multiple criteria
    const relatedConditions = [];

    // Same subcategory
    if (movie.SubCategory) {
      relatedConditions.push({ SubCategory: movie.SubCategory });
    }

    // Common tags (at least one matching tag)
    if (movie.Tags && movie.Tags.length > 0) {
      relatedConditions.push({ Tags: { $in: movie.Tags } });
    }

    // Common genres (at least one matching genre)
    if (movie.Genre && movie.Genre.length > 0) {
      relatedConditions.push({ Genre: { $in: movie.Genre } });
    }

    // Common cast members (at least one matching cast member)
    if (movie.Cast && movie.Cast.length > 0) {
      relatedConditions.push({ Cast: { $in: movie.Cast } });
    }

    // Same channel
    if (movie.Channel) {
      relatedConditions.push({ Channel: movie.Channel });
    }

    // If no related conditions, fall back to same category
    if (relatedConditions.length === 0) {
      relatedConditions.push({ Category: movie.Category });
    }

    const query = {
      _id: { $ne: movie._id },
      Status: MOVIE_STATUS.ACTIVE,
      $and: [
        {
          $or: [
            { BlockedCountries: { $nin: [userCountry] } },
            { BlockedCountries: { $exists: false } },
            { BlockedCountries: { $size: 0 } },
          ],
        },
        {
          $or: relatedConditions,
        },
      ],
    };

    const relatedVideos = await Movie.find(query)
      .populate('Category', 'Name Slug')
      .populate('SubCategory', 'Name Slug')
      .populate('Channel', 'Name Slug Logo')
      .select('-Videos -Subtitles')
      .sort({ Views: -1, Likes: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Movie.countDocuments(query);

    res.json({
      success: true,
      data: relatedVideos,
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
      message: 'Failed to fetch related videos',
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

