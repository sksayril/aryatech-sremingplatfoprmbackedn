/**
 * Upload Queue Service
 * Manages video upload jobs in a queue for background processing
 */

require('dotenv').config();

const UploadJob = require('../models/uploadJob.model');
const { uploadFileToS3 } = require('../middleware/aws.setup'); // Primary S3 upload method using multer memory storage
const { S3_BUCKETS } = require('../config/constants');
const Movie = require('../models/movie.model');

/**
 * Add upload job to queue
 */
const queueUpload = async (jobData) => {
  try {
    const job = await UploadJob.create({
      Movie: jobData.movieId,
      User: jobData.userId,
      FileType: jobData.fileType, // 'video', 'thumbnail', 'poster', 'subtitle'
      FileName: jobData.fileName,
      FileBuffer: jobData.fileBuffer,
      FileSize: jobData.fileSize,
      MimeType: jobData.mimeType,
      Folder: jobData.folder,
      Status: 'pending',
      Progress: 0,
      Metadata: jobData.metadata || {}, // Additional data like quality, language, etc.
    });

    return job;
  } catch (error) {
    throw new Error(`Failed to queue upload: ${error.message}`);
  }
};

/**
 * Process a single upload job
 */
const processUploadJob = async (jobId) => {
  try {
    const job = await UploadJob.findById(jobId);
    
    if (!job) {
      throw new Error('Upload job not found');
    }

    if (job.Status !== 'pending') {
      throw new Error(`Job is not pending. Current status: ${job.Status}`);
    }

    // Update status to processing
    job.Status = 'processing';
    job.StartedAt = new Date();
    await job.save();

    // Create file object from buffer
    const file = {
      buffer: job.FileBuffer,
      originalname: job.FileName,
      mimetype: job.MimeType,
      size: job.FileSize,
    };

    // Progress callback - refresh job from DB to avoid stale data
    const progressCallback = async (progress) => {
      try {
        const updatedJob = await UploadJob.findById(jobId);
        if (updatedJob) {
          updatedJob.Progress = progress;
          updatedJob.UploadedSize = Math.floor((progress / 100) * updatedJob.FileSize);
          await updatedJob.save();
          console.log(`[Upload Queue] Job ${jobId} progress: ${progress}% (${updatedJob.UploadedSize}/${updatedJob.FileSize} bytes)`);
        }
      } catch (err) {
        console.error(`[Upload Queue] Error updating progress for job ${jobId}:`, err.message);
      }
    };

    // Upload to S3 using uploadFileToS3 from aws.setup (multer memory storage)
    const uploadResult = await uploadFileToS3(file, job.Folder, progressCallback);

    // Update job with results
    job.Status = 'completed';
    job.Progress = 100;
    job.UploadedSize = job.FileSize;
    job.S3Key = uploadResult.key;
    job.S3Url = uploadResult.url;
    job.CompletedAt = new Date();
    await job.save();

    // Update movie record with uploaded file URL
    await updateMovieWithUploadResult(job, uploadResult);

    // If this is an original video, automatically convert and upload other qualities
    if (job.FileType === 'video' && job.Metadata?.isOriginal) {
      const sourceQuality = job.Metadata.quality || '1080p';
      let qualitiesToConvert = [];
      
      if (sourceQuality === '1080p') {
        qualitiesToConvert = ['720p', '480p'];
      } else if (sourceQuality === '720p') {
        qualitiesToConvert = ['480p'];
      }

      if (qualitiesToConvert.length > 0) {
        console.log(`[Upload Queue] Auto-converting video to qualities: ${qualitiesToConvert.join(', ')}`);
        
        try {
          // Convert video using the uploaded video buffer
          const { convertVideo } = require('./videoConversion.service');
          const convertedVideos = await convertVideo(job.FileBuffer, qualitiesToConvert);

          // Upload each converted quality
          for (const [quality, convertedBuffer] of Object.entries(convertedVideos)) {
            try {
              const convertedFile = {
                buffer: convertedBuffer,
                originalname: `${job.FileName.split('.')[0]}-${quality}.mp4`,
                mimetype: 'video/mp4',
                size: convertedBuffer.length,
              };

              // Create upload job for converted video
              const conversionJob = await queueUpload({
                movieId: job.Movie,
                userId: job.User,
                fileType: 'video',
                fileName: convertedFile.originalname,
                fileBuffer: convertedBuffer,
                fileSize: convertedBuffer.length,
                mimeType: 'video/mp4',
                folder: S3_BUCKETS.MOVIES,
                metadata: {
                  quality: quality,
                  isOriginal: false,
                },
              });

              console.log(`[Upload Queue] Queued ${quality} conversion upload job: ${conversionJob._id}`);
            } catch (conversionError) {
              console.error(`[Upload Queue] Failed to queue ${quality} upload:`, conversionError.message);
            }
          }
        } catch (conversionError) {
          console.error(`[Upload Queue] Video conversion failed:`, conversionError.message);
          // Don't fail the original upload if conversion fails
        }
      }
    }

    return {
      success: true,
      job,
      uploadResult,
    };
  } catch (error) {
    // Mark job as failed
    const job = await UploadJob.findById(jobId);
    if (job) {
      job.Status = 'failed';
      job.Error = error.message;
      job.CompletedAt = new Date();
      await job.save();
    }
    throw error;
  }
};

/**
 * Update movie record with upload result
 */
const updateMovieWithUploadResult = async (job, uploadResult) => {
  try {
    const movie = await Movie.findById(job.Movie);
    if (!movie) return;

    switch (job.FileType) {
      case 'thumbnail':
        movie.Thumbnail = uploadResult.url;
        break;
      case 'poster':
        movie.Poster = uploadResult.url;
        break;
      case 'video':
        const quality = job.Metadata?.quality || '720p';
        const videoEntry = {
          Quality: quality,
          Url: uploadResult.url,
          FileSize: job.FileSize,
          IsOriginal: job.Metadata?.isOriginal || false,
        };
        
        // Check if this quality already exists
        const existingIndex = movie.Videos.findIndex(v => v.Quality === quality);
        if (existingIndex >= 0) {
          movie.Videos[existingIndex] = videoEntry;
        } else {
          movie.Videos.push(videoEntry);
        }
        break;
      case 'subtitle':
        const subtitleEntry = {
          Language: job.Metadata?.language || 'English',
          LanguageCode: job.Metadata?.languageCode || 'en',
          Url: uploadResult.url,
        };
        movie.Subtitles.push(subtitleEntry);
        break;
    }

    await movie.save();
  } catch (error) {
    console.error('Failed to update movie with upload result:', error);
  }
};

/**
 * Get upload progress for a movie
 */
const getMovieUploadProgress = async (movieId) => {
  try {
    // Validate movie ID
    if (!movieId) {
      throw new Error('Movie ID is required');
    }

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(movieId)) {
      throw new Error('Invalid movie ID format');
    }

    const jobs = await UploadJob.find({ Movie: movieId })
      .sort({ createdAt: 1 });

    if (jobs.length === 0) {
      return {
        movieId,
        overallProgress: 0,
        status: 'no-jobs',
        jobs: [],
      };
    }

    const overallProgress = jobs.reduce((sum, job) => sum + job.Progress, 0) / jobs.length;
    const allCompleted = jobs.every(job => job.Status === 'completed');
    const anyFailed = jobs.some(job => job.Status === 'failed');
    const anyProcessing = jobs.some(job => job.Status === 'processing');

    let status = 'pending';
    if (allCompleted) {
      status = 'completed';
    } else if (anyFailed) {
      status = 'failed';
    } else if (anyProcessing) {
      status = 'processing';
    }

    return {
      movieId,
      overallProgress: Math.round(overallProgress),
      status,
      totalJobs: jobs.length,
      completedJobs: jobs.filter(j => j.Status === 'completed').length,
      failedJobs: jobs.filter(j => j.Status === 'failed').length,
      jobs: jobs.map(job => ({
        _id: job._id,
        fileType: job.FileType,
        fileName: job.FileName,
        progress: job.Progress,
        status: job.Status,
        uploadedSize: job.UploadedSize,
        totalSize: job.FileSize,
        error: job.Error,
        s3Url: job.S3Url,
      })),
    };
  } catch (error) {
    throw new Error(`Failed to get upload progress: ${error.message}`);
  }
};

/**
 * Get all pending jobs
 */
const getPendingJobs = async (limit = 10) => {
  try {
    const jobs = await UploadJob.find({ Status: 'pending' })
      .sort({ createdAt: 1 })
      .limit(limit);
    return jobs;
  } catch (error) {
    throw new Error(`Failed to get pending jobs: ${error.message}`);
  }
};

/**
 * Retry failed job
 */
const retryJob = async (jobId) => {
  try {
    const job = await UploadJob.findById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    if (job.Status !== 'failed') {
      throw new Error('Can only retry failed jobs');
    }

    // Reset job status
    job.Status = 'pending';
    job.Progress = 0;
    job.UploadedSize = 0;
    job.Error = null;
    job.StartedAt = null;
    job.CompletedAt = null;
    await job.save();

    return job;
  } catch (error) {
    throw new Error(`Failed to retry job: ${error.message}`);
  }
};

module.exports = {
  queueUpload,
  processUploadJob,
  getMovieUploadProgress,
  getPendingJobs,
  retryJob,
};

