const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../../middleware/auth.middleware');
const { movieUpload, subtitleUpload, imageUpload, movieWithImagesUpload } = require('../../middleware/upload.middleware');
const validateObjectId = require('../../middleware/validateObjectId.middleware');
const movieController = require('../../controllers/admin/movie.controller');
const movieUploadController = require('../../controllers/admin/movieUpload.controller');
const movieQueueController = require('../../controllers/admin/movieQueue.controller');
const movieStatsController = require('../../controllers/admin/movieStats.controller');

// All routes require admin authentication
router.use(authenticate, isAdmin);

// Create movie and queue files for background upload (RECOMMENDED)
router.post(
  '/queue-upload',
  movieWithImagesUpload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'poster', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'subtitle', maxCount: 10 }, // Allow multiple subtitles
  ]),
  movieQueueController.createMovieAndQueueUploads
);

// Retry failed upload job
router.post('/upload-jobs/:jobId/retry', validateObjectId('jobId'), movieQueueController.retryUploadJob);

// Create movie with upload progress tracking (LEGACY - immediate upload)
router.post(
  '/upload',
  movieWithImagesUpload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'poster', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'subtitle', maxCount: 10 }, // Allow multiple subtitles
  ]),
  movieUploadController.createMovieWithProgress
);

// Get upload progress by upload ID (LEGACY)
router.get('/upload-progress/:uploadId', movieUploadController.getUploadProgress);

// Get upload progress for a movie (queue-based) - MUST be before /:id routes
router.get('/:id/upload-progress', validateObjectId('id'), movieQueueController.getMovieUploadProgress);

// Get movie statistics
router.get('/:id/statistics', validateObjectId('id'), movieStatsController.getMovieStatistics);

// Get movie comments (admin view)
router.get('/:id/comments', validateObjectId('id'), movieStatsController.getMovieComments);

// Create movie (with file uploads) - Legacy endpoint
router.post(
  '/',
  imageUpload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'poster', maxCount: 1 },
  ]),
  movieController.createMovie
);

// Get all movies
router.get('/', movieController.getAllMovies);

// Get single movie
router.get('/:id', validateObjectId('id'), movieController.getMovieById);

// Update movie
router.put(
  '/:id',
  validateObjectId('id'),
  imageUpload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'poster', maxCount: 1 },
  ]),
  movieController.updateMovie
);

// Delete movie
router.delete('/:id', validateObjectId('id'), movieController.deleteMovie);

// Toggle trending
router.patch('/:id/toggle-trending', validateObjectId('id'), movieController.toggleTrending);

// Toggle featured
router.patch('/:id/toggle-featured', validateObjectId('id'), movieController.toggleFeatured);

// DMCA takedown
router.patch('/:id/dmca-takedown', validateObjectId('id'), movieController.dmcaTakedown);

// Update country block
router.patch('/:id/country-block', validateObjectId('id'), movieController.updateCountryBlock);

// Update age restriction
router.patch('/:id/age-restriction', validateObjectId('id'), movieController.updateAgeRestriction);

// Upload video quality
router.post(
  '/:id/video',
  validateObjectId('id'),
  movieUpload.single('video'),
  async (req, res) => {
    try {
      const Movie = require('../../models/movie.model');
      const { uploadToS3 } = require('../../services/s3.service');
      const { S3_BUCKETS } = require('../../config/constants');
      
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No video file provided' });
      }

      const movie = await Movie.findById(req.params.id);
      if (!movie) {
        return res.status(404).json({ success: false, message: 'Movie not found' });
      }

      const uploadResult = await uploadFileToS3(req.file, S3_BUCKETS.MOVIES);
      movie.Videos.push({
        Quality: req.body.quality || '720p',
        Url: uploadResult.url,
        FileSize: req.file.size,
      });
      await movie.save();
      res.json({ success: true, message: 'Video uploaded', data: movie });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

// Upload subtitle
router.post(
  '/:id/subtitle',
  validateObjectId('id'),
  subtitleUpload.single('subtitle'),
  async (req, res) => {
    try {
      const Movie = require('../../models/movie.model');
      const { uploadFileToS3 } = require('../../middleware/aws.setup');
      const { S3_BUCKETS } = require('../../config/constants');
      
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No subtitle file provided' });
      }

      const movie = await Movie.findById(req.params.id);
      if (!movie) {
        return res.status(404).json({ success: false, message: 'Movie not found' });
      }

      const uploadResult = await uploadFileToS3(req.file, S3_BUCKETS.SUBTITLES);
      movie.Subtitles.push({
        Language: req.body.language || 'English',
        LanguageCode: req.body.languageCode || 'en',
        Url: uploadResult.url,
      });
      await movie.save();
      res.json({ success: true, message: 'Subtitle uploaded', data: movie });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

module.exports = router;

