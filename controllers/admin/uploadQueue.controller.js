/**
 * Upload Queue Management Controller (Admin)
 * Handles admin operations for upload queues
 */

const UploadJob = require('../../models/uploadJob.model');
const Movie = require('../../models/movie.model');
const mongoose = require('mongoose');

/**
 * Get all upload queues with filters
 */
exports.getAllUploadQueues = async (req, res) => {
  try {
    const {
      status,
      fileType,
      movieId,
      search, // Search by movie title
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeStats = 'false', // Make statistics optional for performance
    } = req.query;

    const query = {};

    // Filter by status
    if (status) {
      query.Status = status;
    }

    // Filter by file type
    if (fileType) {
      query.FileType = fileType;
    }

    // Filter by movie ID
    if (movieId) {
      if (!mongoose.Types.ObjectId.isValid(movieId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid movie ID',
        });
      }
      query.Movie = movieId;
    }

    // Search by movie title - optimized using aggregation
    if (search) {
      // Use aggregation pipeline for better performance
      const movieIds = await Movie.aggregate([
        {
          $match: {
            $or: [
              { Title: { $regex: search, $options: 'i' } },
              { Slug: { $regex: search, $options: 'i' } },
            ],
          },
        },
        {
          $project: { _id: 1 },
        },
      ]);

      if (movieIds.length === 0) {
        // No movies found, return empty result
        return res.json({
          success: true,
          data: {
            jobs: [],
            pagination: {
              page: parseInt(page),
              limit: parseInt(limit),
              total: 0,
              pages: 0,
            },
            ...(includeStats === 'true' ? { statistics: { pending: 0, processing: 0, completed: 0, failed: 0, retrying: 0 } } : {}),
          },
        });
      }

      query.Movie = { $in: movieIds.map(m => m._id) };
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute queries in parallel for better performance
    const [jobs, total, stats] = await Promise.all([
      // Main query with lean() for faster results (returns plain objects)
      // Select only needed fields to reduce data transfer
      UploadJob.find(query)
        .select('Movie User FileType FileName FileSize Progress Status UploadedSize S3Url Error ErrorMessage Retries MaxRetries StartedAt CompletedAt createdAt updatedAt')
        .populate('Movie', 'Title Slug Thumbnail')
        .populate('User', 'Name Email')
        .sort(sort)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .lean(), // Use lean() for better performance (returns plain JS objects, not Mongoose documents)
      // Count documents
      UploadJob.countDocuments(query),
      // Statistics (only if requested)
      includeStats === 'true' 
        ? UploadJob.aggregate([
            {
              $group: {
                _id: '$Status',
                count: { $sum: 1 },
              },
            },
          ])
        : Promise.resolve([]),
    ]);

    // Process statistics only if requested
    let statistics = null;
    if (includeStats === 'true') {
      statistics = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0,
        retrying: 0,
      };

      stats.forEach(stat => {
        if (statistics.hasOwnProperty(stat._id)) {
          statistics[stat._id] = stat.count;
        }
      });
    }

    res.json({
      success: true,
      data: {
        jobs: jobs.map(job => ({
          _id: job._id,
          movie: job.Movie ? {
            _id: job.Movie._id,
            title: job.Movie.Title,
            slug: job.Movie.Slug,
            thumbnail: job.Movie.Thumbnail,
          } : null,
          user: job.User ? {
            _id: job.User._id,
            name: job.User.Name,
            email: job.User.Email,
          } : null,
          fileType: job.FileType,
          fileName: job.FileName,
          fileSize: job.FileSize,
          progress: job.Progress,
          status: job.Status,
          uploadedSize: job.UploadedSize,
          s3Url: job.S3Url,
          errorMessage: job.Error || job.ErrorMessage || null,
          retries: job.Retries || 0,
          maxRetries: job.MaxRetries || 3,
          createdAt: job.createdAt,
          updatedAt: job.updatedAt,
          startedAt: job.StartedAt,
          completedAt: job.CompletedAt,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
        ...(statistics !== null ? { statistics } : {}),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upload queues',
      error: error.message,
    });
  }
};

/**
 * Get upload queue details by ID
 */
exports.getUploadQueueById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid queue ID',
      });
    }

    const job = await UploadJob.findById(id)
      .populate('Movie', 'Title Slug Description Thumbnail Poster Category SubCategory')
      .populate('User', 'Name Email ProfilePicture');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Upload queue not found',
      });
    }

    res.json({
      success: true,
      data: {
        _id: job._id,
        movie: job.Movie ? {
          _id: job.Movie._id,
          title: job.Movie.Title,
          slug: job.Movie.Slug,
          description: job.Movie.Description,
          thumbnail: job.Movie.Thumbnail,
          poster: job.Movie.Poster,
          category: job.Movie.Category,
          subCategory: job.Movie.SubCategory,
        } : null,
        user: job.User ? {
          _id: job.User._id,
          name: job.User.Name,
          email: job.User.Email,
          profilePicture: job.User.ProfilePicture,
        } : null,
        fileType: job.FileType,
        fileName: job.FileName,
        fileSize: job.FileSize,
        mimeType: job.MimeType,
        folder: job.Folder,
        progress: job.Progress,
        status: job.Status,
        uploadedSize: job.UploadedSize,
        s3Key: job.S3Key,
        s3Url: job.S3Url,
        errorMessage: job.ErrorMessage,
        metadata: job.Metadata,
        retries: job.Retries,
        maxRetries: job.MaxRetries,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt,
        startedAt: job.StartedAt,
        completedAt: job.CompletedAt,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upload queue details',
      error: error.message,
    });
  }
};

/**
 * Get upload queues by movie title (search)
 */
exports.getUploadQueuesByMovieTitle = async (req, res) => {
  try {
    const { title } = req.query;
    const {
      status,
      fileType,
      page = 1,
      limit = 20,
    } = req.query;

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'Movie title is required',
      });
    }

    // Find movies matching the title
    const movies = await Movie.find({
      $or: [
        { Title: { $regex: title, $options: 'i' } },
        { Slug: { $regex: title, $options: 'i' } },
      ],
    }).select('_id Title Slug');

    if (movies.length === 0) {
      return res.json({
        success: true,
        data: {
          jobs: [],
          movies: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0,
          },
        },
      });
    }

    const movieIds = movies.map(m => m._id);

    const query = {
      Movie: { $in: movieIds },
    };

    if (status) {
      query.Status = status;
    }

    if (fileType) {
      query.FileType = fileType;
    }

    const jobs = await UploadJob.find(query)
      .select('Movie User FileType FileName FileSize Progress Status UploadedSize S3Url Error ErrorMessage createdAt')
      .populate('Movie', 'Title Slug Thumbnail')
      .populate('User', 'Name Email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean(); // Use lean() for better performance

    const total = await UploadJob.countDocuments(query);

    res.json({
      success: true,
      data: {
        jobs: jobs.map(job => ({
          _id: job._id,
          movie: job.Movie ? {
            _id: job.Movie._id,
            title: job.Movie.Title,
            slug: job.Movie.Slug,
            thumbnail: job.Movie.Thumbnail,
          } : null,
          user: job.User ? {
            _id: job.User._id,
            name: job.User.Name,
            email: job.User.Email,
          } : null,
          fileType: job.FileType,
          fileName: job.FileName,
          fileSize: job.FileSize,
          progress: job.Progress,
          status: job.Status,
          uploadedSize: job.UploadedSize,
          s3Url: job.S3Url,
          errorMessage: job.ErrorMessage,
          createdAt: job.createdAt,
        })),
        matchedMovies: movies.map(m => ({
          _id: m._id,
          title: m.Title,
          slug: m.Slug,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to search upload queues by movie title',
      error: error.message,
    });
  }
};

/**
 * Get pending upload queues
 */
exports.getPendingUploadQueues = async (req, res) => {
  try {
    const {
      fileType,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {
      Status: 'pending',
    };

    if (fileType) {
      query.FileType = fileType;
    }

    const jobs = await UploadJob.find(query)
      .select('Movie User FileType FileName FileSize Progress Status UploadedSize createdAt')
      .populate('Movie', 'Title Slug Thumbnail')
      .populate('User', 'Name Email')
      .sort({ createdAt: 1 }) // Oldest first
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean(); // Use lean() for better performance

    const total = await UploadJob.countDocuments(query);

    res.json({
      success: true,
      data: {
        jobs: jobs.map(job => ({
          _id: job._id,
          movie: job.Movie ? {
            _id: job.Movie._id,
            title: job.Movie.Title,
            slug: job.Movie.Slug,
            thumbnail: job.Movie.Thumbnail,
          } : null,
          user: job.User ? {
            _id: job.User._id,
            name: job.User.Name,
            email: job.User.Email,
          } : null,
          fileType: job.FileType,
          fileName: job.FileName,
          fileSize: job.FileSize,
          progress: job.Progress,
          status: job.Status,
          createdAt: job.createdAt,
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending upload queues',
      error: error.message,
    });
  }
};

/**
 * Delete upload queue (admin only)
 */
exports.deleteUploadQueue = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid queue ID',
      });
    }

    const job = await UploadJob.findById(id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Upload queue not found',
      });
    }

    // Only allow deletion of failed or completed jobs
    if (job.Status === 'processing' || job.Status === 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete processing or pending jobs',
      });
    }

    await job.deleteOne();

    res.json({
      success: true,
      message: 'Upload queue deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete upload queue',
      error: error.message,
    });
  }
};

