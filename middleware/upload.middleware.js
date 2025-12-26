const multer = require('multer');
const { S3_BUCKETS } = require('../config/constants');
const { uploadFileToS3 } = require('./aws.setup'); // Import S3 upload function

// Use memory storage - files will be uploaded to S3 in controllers
const storage = multer.memoryStorage();

/**
 * Upload configuration for movies
 */
const movieUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  },
});

/**
 * Upload configuration for subtitles
 */
const subtitleUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/vtt', 'application/x-subrip', 'text/plain'];
    if (allowedTypes.includes(file.mimetype) || file.originalname.endsWith('.srt') || file.originalname.endsWith('.vtt')) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only SRT/VTT files are allowed.'));
    }
  },
});

/**
 * Upload configuration for banners/thumbnails
 */
const imageUpload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only image files are allowed.'));
    }
  },
});

/**
 * Upload configuration for ad media
 */
const adMediaUpload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

/**
 * Combined upload configuration for movie uploads (images + videos + subtitles)
 * Accepts images (thumbnail, poster), videos, and subtitles
 */
const movieWithImagesUpload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB (for videos)
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const allowedSubtitleTypes = ['text/vtt', 'application/x-subrip', 'text/plain'];
    
    // Check file extension for subtitles (some browsers don't send correct MIME type)
    const isSubtitleByExtension = file.originalname.endsWith('.srt') || file.originalname.endsWith('.vtt');
    
    // Check if it's an image, video, or subtitle
    if (
      allowedImageTypes.includes(file.mimetype) || 
      allowedVideoTypes.includes(file.mimetype) ||
      allowedSubtitleTypes.includes(file.mimetype) ||
      isSubtitleByExtension
    ) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only image (JPEG, PNG, WebP, GIF), video (MP4, WebM, QuickTime), and subtitle (SRT, VTT) files are allowed. Received: ${file.mimetype || 'unknown'}`));
    }
  },
});

module.exports = {
  movieUpload,
  subtitleUpload,
  imageUpload,
  adMediaUpload,
  movieWithImagesUpload,
};

