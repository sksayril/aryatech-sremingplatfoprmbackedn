const Movie = require('../../models/movie.model');
const Category = require('../../models/category.model');
const SubCategory = require('../../models/subcategory.model');
const Channel = require('../../models/channel.model');
const { MOVIE_STATUS, MOVIE_QUALITIES, S3_BUCKETS } = require('../../config/constants');
const { deleteFromS3, extractKeyFromUrl } = require('../../services/s3.service');

/**
 * Create a new movie
 */
exports.createMovie = async (req, res) => {
  try {
    const movieData = {
      ...req.body,
      CreatedBy: req.user._id,
    };

    // Handle file uploads to S3
    if (req.files) {
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        const uploadResult = await uploadFileToS3(req.files.thumbnail[0], S3_BUCKETS.THUMBNAILS);
        movieData.Thumbnail = uploadResult.url;
      }
      if (req.files.poster && req.files.poster[0]) {
        const uploadResult = await uploadFileToS3(req.files.poster[0], S3_BUCKETS.THUMBNAILS);
        movieData.Poster = uploadResult.url;
      }
      if (req.files.video) {
        // Handle multiple quality videos
        const videos = Array.isArray(req.files.video) ? req.files.video : [req.files.video];
        movieData.Videos = await Promise.all(
          videos.map(async (file, index) => {
            const uploadResult = await uploadFileToS3(file, S3_BUCKETS.MOVIES);
            return {
              Quality: req.body.qualities?.[index] || MOVIE_QUALITIES.QUALITY_720P,
              Url: uploadResult.url,
              FileSize: file.size,
            };
          })
        );
      }
      if (req.files.subtitle) {
        const subtitles = Array.isArray(req.files.subtitle) ? req.files.subtitle : [req.files.subtitle];
        movieData.Subtitles = await Promise.all(
          subtitles.map(async (file, index) => {
            const uploadResult = await uploadFileToS3(file, S3_BUCKETS.SUBTITLES);
            return {
              Language: req.body.subtitleLanguages?.[index] || 'English',
              LanguageCode: req.body.subtitleLanguageCodes?.[index] || 'en',
              Url: uploadResult.url,
            };
          })
        );
      }
    }

    // Parse JSON fields if they're strings
    if (typeof movieData.MetaKeywords === 'string') {
      movieData.MetaKeywords = JSON.parse(movieData.MetaKeywords);
    }
    if (typeof movieData.BlockedCountries === 'string') {
      movieData.BlockedCountries = JSON.parse(movieData.BlockedCountries);
    }
    if (typeof movieData.Genre === 'string') {
      movieData.Genre = JSON.parse(movieData.Genre);
    }
    // Handle Cast - can be array of actor IDs (JSON string) or comma-separated string
    if (movieData.Cast) {
      if (typeof movieData.Cast === 'string') {
        try {
          movieData.Cast = JSON.parse(movieData.Cast);
        } catch (e) {
          // If not JSON, treat as comma-separated string
          movieData.Cast = movieData.Cast.split(',').map(id => id.trim()).filter(id => id);
        }
      }
      // Ensure Cast is an array
      if (!Array.isArray(movieData.Cast)) {
        movieData.Cast = [movieData.Cast];
      }
    }

    const movie = await Movie.create(movieData);

    res.status(201).json({
      success: true,
      message: 'Movie created successfully',
      data: movie,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create movie',
      error: error.message,
    });
  }
};

/**
 * Get all movies with filters
 */
exports.getAllMovies = async (req, res) => {
  try {
    const {
      status,
      category,
      isTrending,
      isFeatured,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = {};

    if (status) query.Status = status;
    if (category) query.Category = category;
    if (isTrending !== undefined) query.IsTrending = isTrending === 'true';
    if (isFeatured !== undefined) query.IsFeatured = isFeatured === 'true';
    if (search) {
      query.$or = [
        { Title: { $regex: search, $options: 'i' } },
        { Description: { $regex: search, $options: 'i' } },
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const movies = await Movie.find(query)
      .populate('Category', 'Name Slug Image Description')
      .populate('SubCategory', 'Name Slug Description')
      .populate('SubSubCategory', 'Name Slug Description')
      .populate('Channel', 'Name Slug Logo Description IsActive')
      .populate('Cast', 'Name Slug Image Description DateOfBirth Nationality')
      .populate('CreatedBy', 'Name Email')
      .sort(sort)
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
 * Get single movie by ID
 */
exports.getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id)
      .populate('Category', 'Name Slug Image Description')
      .populate('SubCategory', 'Name Slug Description')
      .populate('SubSubCategory', 'Name Slug Description')
      .populate('Channel', 'Name Slug Logo Description IsActive')
      .populate('Cast', 'Name Slug Image Description DateOfBirth Nationality')
      .populate('CreatedBy', 'Name Email');

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    res.json({
      success: true,
      data: movie,
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
 * Update movie
 */
exports.updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    // Handle file uploads to S3
    if (req.files) {
      if (req.files.thumbnail && req.files.thumbnail[0]) {
        // Delete old thumbnail if exists
        if (movie.Thumbnail) {
          const key = extractKeyFromUrl(movie.Thumbnail);
          if (key) await deleteFromS3(key);
        }
        const uploadResult = await uploadFileToS3(req.files.thumbnail[0], S3_BUCKETS.THUMBNAILS);
        req.body.Thumbnail = uploadResult.url;
      }
      if (req.files.poster && req.files.poster[0]) {
        if (movie.Poster) {
          const key = extractKeyFromUrl(movie.Poster);
          if (key) await deleteFromS3(key);
        }
        const uploadResult = await uploadFileToS3(req.files.poster[0], S3_BUCKETS.THUMBNAILS);
        req.body.Poster = uploadResult.url;
      }
    }

    // Parse JSON fields if they're strings
    if (req.body.MetaKeywords && typeof req.body.MetaKeywords === 'string') {
      req.body.MetaKeywords = JSON.parse(req.body.MetaKeywords);
    }
    if (req.body.BlockedCountries && typeof req.body.BlockedCountries === 'string') {
      req.body.BlockedCountries = JSON.parse(req.body.BlockedCountries);
    }
    if (req.body.Genre && typeof req.body.Genre === 'string') {
      req.body.Genre = JSON.parse(req.body.Genre);
    }
    if (req.body.Cast && typeof req.body.Cast === 'string') {
      req.body.Cast = JSON.parse(req.body.Cast);
    }

    Object.assign(movie, req.body);
    await movie.save();

    res.json({
      success: true,
      message: 'Movie updated successfully',
      data: movie,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update movie',
      error: error.message,
    });
  }
};

/**
 * Delete movie
 */
exports.deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    // Delete associated files from S3
    if (movie.Thumbnail) {
      const key = extractKeyFromUrl(movie.Thumbnail);
      if (key) await deleteFromS3(key);
    }
    if (movie.Poster) {
      const key = extractKeyFromUrl(movie.Poster);
      if (key) await deleteFromS3(key);
    }
    if (movie.Videos && movie.Videos.length > 0) {
      for (const video of movie.Videos) {
        const key = extractKeyFromUrl(video.Url);
        if (key) await deleteFromS3(key);
      }
    }
    if (movie.Subtitles && movie.Subtitles.length > 0) {
      for (const subtitle of movie.Subtitles) {
        const key = extractKeyFromUrl(subtitle.Url);
        if (key) await deleteFromS3(key);
      }
    }

    await Movie.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Movie deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete movie',
      error: error.message,
    });
  }
};

/**
 * Toggle trending status
 */
exports.toggleTrending = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    movie.IsTrending = !movie.IsTrending;
    await movie.save();

    res.json({
      success: true,
      message: `Movie ${movie.IsTrending ? 'added to' : 'removed from'} trending`,
      data: movie,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle trending status',
      error: error.message,
    });
  }
};

/**
 * Toggle featured status
 */
exports.toggleFeatured = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    movie.IsFeatured = !movie.IsFeatured;
    await movie.save();

    res.json({
      success: true,
      message: `Movie ${movie.IsFeatured ? 'added to' : 'removed from'} featured`,
      data: movie,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle featured status',
      error: error.message,
    });
  }
};

/**
 * DMCA Takedown
 */
exports.dmcaTakedown = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    movie.Status = MOVIE_STATUS.DMCA;
    movie.IsDMCA = true;
    movie.DMCAReason = req.body.reason || 'DMCA takedown request';

    await movie.save();

    res.json({
      success: true,
      message: 'DMCA takedown applied successfully',
      data: movie,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to apply DMCA takedown',
      error: error.message,
    });
  }
};

/**
 * Block/Unblock countries
 */
exports.updateCountryBlock = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    const { countries, action } = req.body; // action: 'block' or 'unblock'

    if (action === 'block') {
      movie.BlockedCountries = [...new Set([...movie.BlockedCountries, ...countries])];
    } else if (action === 'unblock') {
      movie.BlockedCountries = movie.BlockedCountries.filter(
        (country) => !countries.includes(country)
      );
    }

    await movie.save();

    res.json({
      success: true,
      message: `Countries ${action}ed successfully`,
      data: movie,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update country block',
      error: error.message,
    });
  }
};

/**
 * Update age restriction
 */
exports.updateAgeRestriction = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    movie.AgeRestriction = req.body.ageRestriction;
    await movie.save();

    res.json({
      success: true,
      message: 'Age restriction updated successfully',
      data: movie,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update age restriction',
      error: error.message,
    });
  }
};

