const Movie = require('../../models/movie.model');
const UploadProgress = require('../../models/uploadProgress.model');
const { S3_BUCKETS, MOVIE_UPLOAD_LIMITS } = require('../../config/constants');
const { uploadFileToS3 } = require('../../middleware/aws.setup'); // Primary S3 upload method using multer memory storage
const {
  normalizeMovieUploadBody,
  assertSubCategoryMatchesCategory,
} = require('../../utils/parseMovieUploadBody');
const crypto = require('crypto');

/**
 * Create movie with upload progress tracking
 */
exports.createMovieWithProgress = async (req, res) => {
  try {
    const uploadId = `upload-${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
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

    // Handle thumbnail upload
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      const thumbnailProgress = await UploadProgress.create({
        User: req.user._id,
        UploadId: `${uploadId}-thumbnail`,
        FileName: req.files.thumbnail[0].originalname,
        FileType: 'thumbnail',
        TotalSize: req.files.thumbnail[0].size,
        Status: 'uploading',
      });

      try {
        const progressCallback = async (progress) => {
          await UploadProgress.findByIdAndUpdate(thumbnailProgress._id, {
            Progress: progress,
            UploadedSize: Math.floor((progress / 100) * req.files.thumbnail[0].size),
            Status: progress === 100 ? 'completed' : 'uploading',
          });
        };

        const uploadResult = await uploadFileToS3(req.files.thumbnail[0], S3_BUCKETS.THUMBNAILS, progressCallback);
        movieData.Thumbnail = uploadResult.url;
        
        await UploadProgress.findByIdAndUpdate(thumbnailProgress._id, {
          Status: 'completed',
          Progress: 100,
          UploadedSize: req.files.thumbnail[0].size,
          S3Key: uploadResult.key,
          S3Url: uploadResult.url,
        });
      } catch (error) {
        await UploadProgress.findByIdAndUpdate(thumbnailProgress._id, {
          Status: 'failed',
          Error: error.message,
        });
        throw error;
      }
    }

    // Handle poster upload
    if (req.files && req.files.poster && req.files.poster[0]) {
      const posterProgress = await UploadProgress.create({
        User: req.user._id,
        UploadId: `${uploadId}-poster`,
        FileName: req.files.poster[0].originalname,
        FileType: 'poster',
        TotalSize: req.files.poster[0].size,
        Status: 'uploading',
      });

      try {
        const progressCallback = async (progress) => {
          await UploadProgress.findByIdAndUpdate(posterProgress._id, {
            Progress: progress,
            UploadedSize: Math.floor((progress / 100) * req.files.poster[0].size),
            Status: progress === 100 ? 'completed' : 'uploading',
          });
        };

        const uploadResult = await uploadFileToS3(req.files.poster[0], S3_BUCKETS.THUMBNAILS, progressCallback);
        movieData.Poster = uploadResult.url;
        
        await UploadProgress.findByIdAndUpdate(posterProgress._id, {
          Status: 'completed',
          Progress: 100,
          UploadedSize: req.files.poster[0].size,
          S3Key: uploadResult.key,
          S3Url: uploadResult.url,
        });
      } catch (error) {
        await UploadProgress.findByIdAndUpdate(posterProgress._id, {
          Status: 'failed',
          Error: error.message,
        });
        throw error;
      }
    }

    // Handle video upload (single file; no server-side transcoding)
    if (req.files && req.files.video && req.files.video[0]) {
      const videoFile = req.files.video[0];
      const videoProgress = await UploadProgress.create({
        User: req.user._id,
        UploadId: `${uploadId}-video`,
        FileName: videoFile.originalname,
        FileType: 'video',
        TotalSize: videoFile.size,
        Status: 'uploading',
      });

      try {
        // Progress callback for video upload
        const progressCallback = async (progress) => {
          await UploadProgress.findByIdAndUpdate(videoProgress._id, {
            Progress: progress,
            UploadedSize: Math.floor((progress / 100) * videoFile.size),
            Status: progress === 100 ? 'processing' : 'uploading',
          });
        };

        // Upload original video with progress tracking
        const uploadResult = await uploadFileToS3(videoFile, S3_BUCKETS.MOVIES, progressCallback);
        
        // Determine quality from file or request
        const sourceQuality = req.body.sourceQuality || '1080p';
        movieData.Videos = [{
          Quality: sourceQuality,
          Url: uploadResult.url,
          FileSize: videoFile.size,
          IsOriginal: true,
        }];

        await UploadProgress.findByIdAndUpdate(videoProgress._id, {
          Status: 'completed',
          Progress: 100,
          UploadedSize: videoFile.size,
          S3Key: uploadResult.key,
          S3Url: uploadResult.url,
        });
      } catch (error) {
        await UploadProgress.findByIdAndUpdate(videoProgress._id, {
          Status: 'failed',
          Error: error.message,
        });
        throw error;
      }
    }

    // Handle subtitle uploads
    if (req.files && req.files.subtitle && req.files.subtitle.length > 0) {
      const subtitles = Array.isArray(req.files.subtitle) ? req.files.subtitle : [req.files.subtitle];
      
      if (!movieData.Subtitles) {
        movieData.Subtitles = [];
      }

      for (let i = 0; i < subtitles.length; i++) {
        const subtitleFile = subtitles[i];
        const subtitleProgress = await UploadProgress.create({
          User: req.user._id,
          UploadId: `${uploadId}-subtitle-${i}`,
          FileName: subtitleFile.originalname,
          FileType: 'subtitle',
          TotalSize: subtitleFile.size,
          Status: 'uploading',
        });

        try {
          const progressCallback = async (progress) => {
            await UploadProgress.findByIdAndUpdate(subtitleProgress._id, {
              Progress: progress,
              UploadedSize: Math.floor((progress / 100) * subtitleFile.size),
              Status: progress === 100 ? 'completed' : 'uploading',
            });
          };

          const uploadResult = await uploadFileToS3(subtitleFile, S3_BUCKETS.SUBTITLES, progressCallback);
          
          movieData.Subtitles.push({
            Language: req.body.subtitleLanguages?.[i] || req.body[`subtitleLanguages[${i}]`] || 'English',
            LanguageCode: req.body.subtitleLanguageCodes?.[i] || req.body[`subtitleLanguageCodes[${i}]`] || 'en',
            Url: uploadResult.url,
          });

          await UploadProgress.findByIdAndUpdate(subtitleProgress._id, {
            Status: 'completed',
            Progress: 100,
            UploadedSize: subtitleFile.size,
            S3Key: uploadResult.key,
            S3Url: uploadResult.url,
          });
        } catch (error) {
          await UploadProgress.findByIdAndUpdate(subtitleProgress._id, {
            Status: 'failed',
            Error: error.message,
          });
          // Don't throw here, continue with other subtitles
          console.error(`Failed to upload subtitle ${i}:`, error.message);
        }
      }
    }

    // Create movie
    const movie = await Movie.create(movieData);

    // Update upload progress with movie ID
    if (req.files && req.files.video) {
      await UploadProgress.updateMany(
        { UploadId: { $regex: `^${uploadId}` } },
        { Movie: movie._id }
      );
    }

    // Mark video upload as completed
    if (req.files && req.files.video) {
      await UploadProgress.findOneAndUpdate(
        { UploadId: `${uploadId}-video` },
        { Status: 'completed', Progress: 100 }
      );
    }

    const movieResponse = movie.toObject();
    movieResponse.uploadId = uploadId;

    res.status(201).json({
      success: true,
      message: 'Movie created successfully',
      data: movieResponse,
      upload: {
        uploadLimits: MOVIE_UPLOAD_LIMITS,
        progressUrl: `/api/admin/movies/upload-progress/${uploadId}`,
      },
    });
  } catch (error) {
    console.error('Error in createMovieWithProgress:', error);
    const status = error.statusCode && Number.isInteger(error.statusCode) ? error.statusCode : 400;
    res.status(status).json({
      success: false,
      message: 'Failed to create movie',
      error: error.message,
      uploadLimits: MOVIE_UPLOAD_LIMITS,
    });
  }
};

/**
 * Get upload progress
 */
exports.getUploadProgress = async (req, res) => {
  try {
    const { uploadId } = req.params;

    const progress = await UploadProgress.find({
      UploadId: { $regex: `^${uploadId}` },
      User: req.user._id,
    }).sort({ createdAt: 1 });

    const overallProgress = progress.length > 0
      ? progress.reduce((sum, p) => sum + p.Progress, 0) / progress.length
      : 0;

    const files = progress.map((p) => ({
      uploadId: p.UploadId,
      fileName: p.FileName,
      fileType: p.FileType,
      progress: p.Progress,
      totalSize: p.TotalSize,
      uploadedSize: p.UploadedSize,
      status: p.Status,
      error: p.Error,
    }));

    res.json({
      success: true,
      data: {
        uploadId,
        overallProgress: Math.round(overallProgress),
        files,
        status: progress.every((p) => p.Status === 'completed')
          ? 'completed'
          : progress.some((p) => p.Status === 'failed')
            ? 'failed'
            : 'processing',
        uploadLimits: MOVIE_UPLOAD_LIMITS,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upload progress',
      error: error.message,
      uploadLimits: MOVIE_UPLOAD_LIMITS,
    });
  }
};

