/**
 * Video Conversion Service
 * Uses FFmpeg to convert videos to different qualities
 * Requires FFmpeg to be installed on the system
 */

const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const { Readable } = require('stream');
const https = require('https');
const http = require('http');

/**
 * Download video from URL to buffer
 */
const downloadVideo = (url) => {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download video: ${response.statusCode}`));
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    }).on('error', reject);
  });
};

/**
 * Get video metadata (dimensions, aspect ratio)
 * @param {String} videoPath - Path to video file
 * @returns {Promise<Object>} - Video metadata
 */
const getVideoMetadata = (videoPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        return reject(new Error(`Failed to get video metadata: ${err.message}`));
      }
      
      const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
      if (!videoStream) {
        return reject(new Error('No video stream found'));
      }
      
      resolve({
        width: videoStream.width,
        height: videoStream.height,
        aspectRatio: videoStream.width / videoStream.height,
        duration: metadata.format.duration,
      });
    });
  });
};

/**
 * Calculate new dimensions maintaining aspect ratio
 * @param {Number} originalWidth - Original video width
 * @param {Number} originalHeight - Original video height
 * @param {Number} maxWidth - Maximum width constraint
 * @param {Number} maxHeight - Maximum height constraint
 * @returns {Object} - New width and height
 */
const calculateDimensions = (originalWidth, originalHeight, maxWidth, maxHeight) => {
  const aspectRatio = originalWidth / originalHeight;
  let newWidth = originalWidth;
  let newHeight = originalHeight;
  
  // If video is larger than max dimensions, scale down proportionally
  if (originalWidth > maxWidth || originalHeight > maxHeight) {
    // Calculate scale factor based on width constraint
    const widthScale = maxWidth / originalWidth;
    // Calculate scale factor based on height constraint
    const heightScale = maxHeight / originalHeight;
    
    // Use the smaller scale to ensure both dimensions fit
    const scale = Math.min(widthScale, heightScale);
    
    newWidth = Math.round(originalWidth * scale);
    newHeight = Math.round(originalHeight * scale);
    
    // Ensure dimensions are even (required for H.264)
    newWidth = newWidth % 2 === 0 ? newWidth : newWidth - 1;
    newHeight = newHeight % 2 === 0 ? newHeight : newHeight - 1;
  }
  
  return { width: newWidth, height: newHeight };
};

/**
 * Convert video buffer to different quality while maintaining aspect ratio
 * @param {Buffer} videoBuffer - Original video buffer
 * @param {String} quality - Target quality: '480p', '720p', '1080p'
 * @returns {Promise<Buffer>} - Converted video buffer
 */
const convertVideoBuffer = async (videoBuffer, quality) => {
  return new Promise(async (resolve, reject) => {
    const tempInputPath = path.join(__dirname, '../temp', `input-${Date.now()}-${Math.random().toString(36).substring(7)}.mp4`);
    const tempOutputPath = path.join(__dirname, '../temp', `output-${Date.now()}-${quality}-${Math.random().toString(36).substring(7)}.mp4`);

    // Ensure temp directory exists
    const tempDir = path.dirname(tempInputPath);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
      // Write input buffer to temp file
      fs.writeFileSync(tempInputPath, videoBuffer);

      // Get original video metadata to preserve aspect ratio
      const metadata = await getVideoMetadata(tempInputPath);
      console.log(`[Video Conversion] Original video: ${metadata.width}x${metadata.height} (aspect ratio: ${metadata.aspectRatio.toFixed(2)})`);

      // Get max dimensions for target quality
      const maxDimensions = getQualitySettings(quality);
      
      // Calculate new dimensions maintaining aspect ratio
      const newDimensions = calculateDimensions(
        metadata.width,
        metadata.height,
        maxDimensions.MaxWidth,
        maxDimensions.MaxHeight
      );
      
      console.log(`[Video Conversion] Converting to ${quality}: ${newDimensions.width}x${newDimensions.height} (maintaining aspect ratio)`);
      
      const command = ffmpeg(tempInputPath)
        .videoCodec('libx264')
        .audioCodec('aac')
        .size(`${newDimensions.width}x${newDimensions.height}`)
        .videoBitrate(maxDimensions.Bitrate)
        .outputOptions([
          '-preset medium',
          '-crf 23',
          '-movflags +faststart',
        ])
        .on('start', (commandLine) => {
          console.log(`[Video Conversion] Starting conversion to ${quality}: ${commandLine}`);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`[Video Conversion] ${quality} progress: ${Math.round(progress.percent)}%`);
          }
        })
        .on('end', () => {
          try {
            const convertedBuffer = fs.readFileSync(tempOutputPath);
            
            // Clean up temp files
            fs.unlinkSync(tempInputPath);
            fs.unlinkSync(tempOutputPath);
            
            resolve(convertedBuffer);
          } catch (error) {
            // Clean up temp files even on error
            try {
              if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
              if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
            } catch (cleanupError) {
              console.error('Error cleaning up temp files:', cleanupError);
            }
            reject(error);
          }
        })
        .on('error', (error) => {
          // Clean up temp files on error
          try {
            if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
            if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
          } catch (cleanupError) {
            console.error('Error cleaning up temp files:', cleanupError);
          }
          reject(new Error(`Video conversion failed: ${error.message}`));
        })
        .save(tempOutputPath);
    } catch (error) {
      // Clean up temp files on error
      try {
        if (fs.existsSync(tempInputPath)) fs.unlinkSync(tempInputPath);
        if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
      } catch (cleanupError) {
        console.error('Error cleaning up temp files:', cleanupError);
      }
      reject(error);
    }
  });
};

/**
 * Convert video from URL or buffer to multiple qualities
 * @param {String|Buffer} source - Source video URL or buffer
 * @param {Array} qualities - Array of qualities to convert to: ['480p', '720p']
 * @returns {Promise<Object>} - Object with quality as key and buffer as value
 */
const convertVideo = async (source, qualities = ['480p', '720p']) => {
  try {
    let videoBuffer;
    
    // If source is a URL, download it
    if (typeof source === 'string' && (source.startsWith('http://') || source.startsWith('https://'))) {
      console.log(`[Video Conversion] Downloading video from URL: ${source}`);
      videoBuffer = await downloadVideo(source);
    } else if (Buffer.isBuffer(source)) {
      videoBuffer = source;
    } else {
      throw new Error('Source must be a URL string or Buffer');
    }

    console.log(`[Video Conversion] Video buffer size: ${(videoBuffer.length / (1024 * 1024)).toFixed(2)} MB`);
    console.log(`[Video Conversion] Converting to qualities: ${qualities.join(', ')}`);

    // Convert to each quality
    const convertedVideos = {};
    
    for (const quality of qualities) {
      try {
        console.log(`[Video Conversion] Converting to ${quality}...`);
        const convertedBuffer = await convertVideoBuffer(videoBuffer, quality);
        convertedVideos[quality] = convertedBuffer;
        console.log(`[Video Conversion] ✅ ${quality} conversion complete (${(convertedBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);
      } catch (error) {
        console.error(`[Video Conversion] ❌ Failed to convert to ${quality}:`, error.message);
        // Continue with other qualities even if one fails
      }
    }

    return convertedVideos;
  } catch (error) {
    throw new Error(`Video conversion failed: ${error.message}`);
  }
};

/**
 * Queue video for conversion (for backward compatibility)
 */
const queueVideoConversion = async (sourceVideoUrl, movieId, qualities = ['480p', '720p']) => {
  try {
    console.log(`[Video Conversion] Queueing video conversion for movie ${movieId}`);
    console.log(`[Video Conversion] Source: ${sourceVideoUrl}`);
    console.log(`[Video Conversion] Qualities: ${qualities.join(', ')}`);
    
    return {
      jobId: `job-${Date.now()}`,
      status: 'queued',
      qualities,
    };
  } catch (error) {
    throw new Error(`Failed to queue video conversion: ${error.message}`);
  }
};

/**
 * Get conversion status
 */
const getConversionStatus = async (jobId) => {
  // In production, check actual conversion service status
  return {
    jobId,
    status: 'completed', // pending, processing, completed, failed
    progress: 100,
    outputs: [],
  };
};

/**
 * Get quality settings for conversion
 * Returns max dimensions (not fixed) to maintain aspect ratio
 */
const getQualitySettings = (quality) => {
  const settings = {
    '480p': {
      MaxWidth: 854,  // Maximum width constraint
      MaxHeight: 480, // Maximum height constraint
      Bitrate: '1000k', // 1 Mbps
    },
    '720p': {
      MaxWidth: 1280,  // Maximum width constraint
      MaxHeight: 720,  // Maximum height constraint
      Bitrate: '2500k', // 2.5 Mbps
    },
    '1080p': {
      MaxWidth: 1920,  // Maximum width constraint
      MaxHeight: 1080, // Maximum height constraint
      Bitrate: '5000k', // 5 Mbps
    },
  };
  return settings[quality] || settings['720p'];
};

module.exports = {
  convertVideo,
  convertVideoBuffer,
  queueVideoConversion,
  getConversionStatus,
  getQualitySettings,
};

