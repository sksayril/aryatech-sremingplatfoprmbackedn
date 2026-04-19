/**
 * Movie Upload Queue Controller
 * Handles queuing videos for background upload
 */

const Movie = require('../../models/movie.model');
const { queueUpload, getMovieUploadProgress, retryJob } = require('../../services/uploadQueue.service');
const { S3_BUCKETS, MOVIE_UPLOAD_LIMITS } = require('../../config/constants');
const {
  normalizeMovieUploadBody,
  assertSubCategoryMatchesCategory,
} = require('../../utils/parseMovieUploadBody');

/**
 * Create movie and queue files for background upload
 */
exports.createMovieAndQueueUploads = async (req, res) => {
  try {
    const movieData = {
      ...normalizeMovieUploadBody(req.body),
      CreatedBy: req.user._id,
    };

    await assertSubCategoryMatchesCategory(movieData.Category, movieData.SubCategory);

    if (!movieData.Title || !String(movieData.Title).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Title is required.',
        uploadLimits: MOVIE_UPLOAD_LIMITS,
      });
    }
    if (!movieData.Category) {
      return res.status(400).json({
        success: false,
        message: 'Main category is required (field: Category, or alias mainCategory / categoryId).',
        uploadLimits: MOVIE_UPLOAD_LIMITS,
      });
    }
    if (req.files && req.files.video && req.files.video[0] && !(req.files.thumbnail && req.files.thumbnail[0])) {
      return res.status(400).json({
        success: false,
        message: 'Thumbnail is required when uploading a video file.',
        uploadLimits: MOVIE_UPLOAD_LIMITS,
      });
    }

    // Create movie first (without file URLs)
    const movie = await Movie.create(movieData);

    const queuedJobs = [];

    // Queue thumbnail upload
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      const file = req.files.thumbnail[0];
      const job = await queueUpload({
        movieId: movie._id,
        userId: req.user._id,
        fileType: 'thumbnail',
        fileName: file.originalname,
        fileBuffer: file.buffer,
        fileSize: file.size,
        mimeType: file.mimetype,
        folder: S3_BUCKETS.THUMBNAILS,
      });
      queuedJobs.push(job);
    }

    // Queue poster upload
    if (req.files && req.files.poster && req.files.poster[0]) {
      const file = req.files.poster[0];
      const job = await queueUpload({
        movieId: movie._id,
        userId: req.user._id,
        fileType: 'poster',
        fileName: file.originalname,
        fileBuffer: file.buffer,
        fileSize: file.size,
        mimeType: file.mimetype,
        folder: S3_BUCKETS.THUMBNAILS,
      });
      queuedJobs.push(job);
    }

    // Queue video upload
    if (req.files && req.files.video && req.files.video[0]) {
      const file = req.files.video[0];
      const sourceQuality = req.body.sourceQuality || '1080p';
      const job = await queueUpload({
        movieId: movie._id,
        userId: req.user._id,
        fileType: 'video',
        fileName: file.originalname,
        fileBuffer: file.buffer,
        fileSize: file.size,
        mimeType: file.mimetype,
        folder: S3_BUCKETS.MOVIES,
        metadata: {
          quality: sourceQuality,
          isOriginal: true,
        },
      });
      queuedJobs.push(job);
    }

    // Queue subtitle uploads
    if (req.files && req.files.subtitle && req.files.subtitle.length > 0) {
      const subtitles = Array.isArray(req.files.subtitle) ? req.files.subtitle : [req.files.subtitle];
      
      for (let i = 0; i < subtitles.length; i++) {
        const file = subtitles[i];
        const job = await queueUpload({
          movieId: movie._id,
          userId: req.user._id,
          fileType: 'subtitle',
          fileName: file.originalname,
          fileBuffer: file.buffer,
          fileSize: file.size,
          mimeType: file.mimetype,
          folder: S3_BUCKETS.SUBTITLES,
          metadata: {
            language: req.body.subtitleLanguages?.[i] || req.body[`subtitleLanguages[${i}]`] || 'English',
            languageCode: req.body.subtitleLanguageCodes?.[i] || req.body[`subtitleLanguageCodes[${i}]`] || 'en',
          },
        });
        queuedJobs.push(job);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Movie created and files queued for upload',
      data: {
        movie: {
          _id: movie._id,
          Title: movie.Title,
          Slug: movie.Slug,
        },
        queuedJobs: queuedJobs.length,
        jobs: queuedJobs.map(job => ({
          _id: job._id,
          fileType: job.FileType,
          fileName: job.FileName,
          status: job.Status,
        })),
        uploadProgressUrl: `/api/admin/movies/${movie._id}/upload-progress`,
        uploadLimits: MOVIE_UPLOAD_LIMITS,
      },
    });
  } catch (error) {
    const status = error.statusCode && Number.isInteger(error.statusCode) ? error.statusCode : 400;
    res.status(status).json({
      success: false,
      message: 'Failed to create movie and queue uploads',
      error: error.message,
      uploadLimits: MOVIE_UPLOAD_LIMITS,
    });
  }
};

/**
 * Get upload progress for a movie
 */
exports.getMovieUploadProgress = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate movie ID
    if (!id || id === 'null' || id === 'undefined') {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID provided',
      });
    }

    // Check if ID is a valid MongoDB ObjectId format
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid movie ID format',
      });
    }

    const movie = await Movie.findById(id);
    if (!movie) {
      return res.status(404).json({
        success: false,
        message: 'Movie not found',
      });
    }

    const progress = await getMovieUploadProgress(id);

    res.json({
      success: true,
      data: {
        ...progress,
        uploadLimits: MOVIE_UPLOAD_LIMITS,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get upload progress',
      error: error.message,
      uploadLimits: MOVIE_UPLOAD_LIMITS,
    });
  }
};

/**
 * Retry failed upload job
 */
exports.retryUploadJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await retryJob(jobId);

    res.json({
      success: true,
      message: 'Job queued for retry',
      data: {
        _id: job._id,
        status: job.Status,
        fileType: job.FileType,
        fileName: job.FileName,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to retry job',
      error: error.message,
    });
  }
};

