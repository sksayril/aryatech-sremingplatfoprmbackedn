/**
 * AWS S3 Setup and Upload Middleware
 * Handles file uploads to S3 using multer memory storage
 */

const { PutObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const s3Client = require('../config/aws.config'); // Use the configured S3 client from aws.config.js

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'elboz';
const REGION = process.env.AWS_REGION || 'us-east-1';

// Multer memory storage configuration
const storage = multer.memoryStorage();

/**
 * Get S3 URL - handles different region formats and custom endpoints
 */
const getS3Url = (key) => {
  const cleanKey = key.startsWith('/') ? key.substring(1) : key;
  
  // If a custom endpoint is provided, use it
  if (process.env.AWS_S3_ENDPOINT) {
    const endpoint = process.env.AWS_S3_ENDPOINT.replace(/\/$/, ''); // Remove trailing slash
    // Check if forcePathStyle is enabled
    if (process.env.AWS_S3_FORCE_PATH_STYLE === 'true') {
      return `${endpoint}/${BUCKET_NAME}/${cleanKey}`;
    } else {
      // Virtual-hosted style
      return `${endpoint}/${BUCKET_NAME}/${cleanKey}`;
    }
  }
  
  // Use the proper S3 URL format based on region
  if (REGION === 'us-east-1') {
    return `https://${BUCKET_NAME}.s3.amazonaws.com/${cleanKey}`;
  } else {
    return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${cleanKey}`;
  }
};

/**
 * Upload file to S3 with progress tracking
 * @param {Object} file - File object from multer (req.file or req.files[0])
 * @param {String} folder - S3 folder path (e.g., 'thumbnails', 'movies', 'subtitles')
 * @param {Function} progressCallback - Optional callback for progress updates (progress: 0-100)
 * @returns {Promise<Object>} - { url, key, location, path }
 */
const uploadFileToS3 = async (file, folder = 'uploads', progressCallback = null) => {
  try {
    if (!file || !file.buffer) {
      throw new Error('File buffer is required');
    }

    const key = `${folder}/${Date.now()}-${file.originalname}`;
    const fileSize = file.buffer.length;
    
    // For files larger than 100MB, use multipart upload for progress tracking
    const MULTIPART_THRESHOLD = 100 * 1024 * 1024; // 100MB
    
    if (fileSize > MULTIPART_THRESHOLD && progressCallback) {
      return await uploadMultipart(file, key, progressCallback);
    }
    
    // For smaller files, use simple upload
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    // Track progress for simple uploads
    if (progressCallback) {
      await progressCallback(0);
      await progressCallback(50);
    }

    const response = await s3Client.send(command);
    
    if (progressCallback) {
      await progressCallback(100);
    }
    
    // Use the Location from response if available, otherwise construct URL
    let url;
    if (response.Location) {
      url = response.Location;
    } else {
      url = getS3Url(key);
    }
    
    return {
      url,
      key,
      location: url,
      path: key,
    };
  } catch (error) {
    let errorMessage = `S3 upload failed: ${error.message}`;
    
    // Try to extract the correct endpoint from AWS error message
    // AWS error format: "The bucket you are attempting to access must be addressed using the specified endpoint. Please send all future requests to this endpoint: s3.region.amazonaws.com"
    if (error.message && error.message.includes('endpoint')) {
      // Try multiple patterns to extract endpoint
      let endpointMatch = error.message.match(/endpoint: ([\w\d\.-]+\.amazonaws\.com)/i);
      if (!endpointMatch) {
        endpointMatch = error.message.match(/to this endpoint[:\s]+([\w\d\.-]+\.amazonaws\.com)/i);
      }
      if (!endpointMatch) {
        endpointMatch = error.message.match(/(s3[\w\d\.-]*\.amazonaws\.com)/i);
      }
      
      if (endpointMatch && endpointMatch[1]) {
        const endpointHost = endpointMatch[1];
        const correctEndpoint = endpointHost.startsWith('http') ? endpointHost : `https://${endpointHost}`;
        errorMessage = `S3 upload failed: The bucket you are attempting to access must be addressed using the specified endpoint.\n\n`;
        errorMessage += `✅ FOUND ENDPOINT IN ERROR: ${endpointHost}\n\n`;
        errorMessage += `🔧 SOLUTION: Add this to your .env file:\n`;
        errorMessage += `AWS_S3_ENDPOINT=${correctEndpoint}\n\n`;
        errorMessage += `Then restart your server.`;
        
        // Also log it to console for easier debugging
        console.error(`\n❌ S3 Endpoint Error Detected!`);
        console.error(`📍 AWS requires endpoint: ${correctEndpoint}`);
        console.error(`📝 Add to .env: AWS_S3_ENDPOINT=${correctEndpoint}\n`);
      } else {
        // Log the full error for debugging
        console.error('Full AWS Error:', JSON.stringify(error, null, 2));
        console.error('Error message:', error.message);
        console.error('Error code:', error.$metadata?.httpStatusCode || error.Code);
        
        errorMessage += `\n\nTroubleshooting:\n`;
        errorMessage += `1. Verify AWS_REGION in .env matches your bucket's region\n`;
        errorMessage += `2. Check AWS_S3_BUCKET name is correct\n`;
        errorMessage += `3. Ensure AWS credentials have S3 access permissions\n`;
        errorMessage += `4. Check AWS Console for your bucket's region\n`;
        errorMessage += `5. Add AWS_S3_ENDPOINT to .env based on your bucket region:\n`;
        errorMessage += `   - us-east-1: AWS_S3_ENDPOINT=https://s3.amazonaws.com\n`;
        errorMessage += `   - us-west-1: AWS_S3_ENDPOINT=https://s3.us-west-1.amazonaws.com\n`;
        errorMessage += `   - us-west-2: AWS_S3_ENDPOINT=https://s3.us-west-2.amazonaws.com\n`;
        errorMessage += `   - eu-west-1: AWS_S3_ENDPOINT=https://s3.eu-west-1.amazonaws.com\n`;
        errorMessage += `   - etc. (replace with your actual region)\n`;
      }
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Multipart upload for large files with progress tracking
 */
const uploadMultipart = async (file, key, progressCallback) => {
  const fileBuffer = file.buffer;
  const fileSize = fileBuffer.length;
  const partSize = 5 * 1024 * 1024; // 5MB per part
  const totalParts = Math.ceil(fileSize / partSize);
  
  let uploadId;
  const parts = [];
  
  try {
    // Step 1: Initialize multipart upload
    const createCommand = new CreateMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: file.mimetype,
    });
    
    const createResponse = await s3Client.send(createCommand);
    uploadId = createResponse.UploadId;
    
    await progressCallback(5); // 5% - initialization complete
    
    // Step 2: Upload parts
    for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
      const start = (partNumber - 1) * partSize;
      const end = Math.min(start + partSize, fileSize);
      const partBuffer = fileBuffer.slice(start, end);
      
      const uploadPartCommand = new UploadPartCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        PartNumber: partNumber,
        UploadId: uploadId,
        Body: partBuffer,
      });
      
      const uploadPartResponse = await s3Client.send(uploadPartCommand);
      
      parts.push({
        ETag: uploadPartResponse.ETag,
        PartNumber: partNumber,
      });
      
      // Calculate progress: 5% (init) + 90% (upload) + 5% (complete)
      const uploadProgress = 5 + Math.floor((partNumber / totalParts) * 90);
      await progressCallback(uploadProgress);
    }
    
    // Step 3: Complete multipart upload
    const completeCommand = new CompleteMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts,
      },
    });
    
    const completeResponse = await s3Client.send(completeCommand);
    await progressCallback(100);
    
    // Use the Location from response if available, otherwise construct URL
    let url;
    if (completeResponse.Location) {
      url = completeResponse.Location;
    } else {
      url = getS3Url(key);
    }
    
    return {
      url,
      key,
      location: url,
      path: key,
    };
  } catch (error) {
    // Abort multipart upload on error
    if (uploadId) {
      try {
        const abortCommand = new AbortMultipartUploadCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          UploadId: uploadId,
        });
        await s3Client.send(abortCommand);
      } catch (abortError) {
        console.error('Failed to abort multipart upload:', abortError);
      }
    }
    throw error;
  }
};

/**
 * Multer upload instance
 */
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB max file size
  },
});

/**
 * Multer upload for images only
 */
const uploadImage = multer({
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
 * Multer upload for videos only
 */
const uploadVideo = multer({
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
 * Multer upload for subtitles only
 */
const uploadSubtitle = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['text/vtt', 'application/x-subrip', 'text/plain'];
    const isSubtitleByExtension = file.originalname.endsWith('.srt') || file.originalname.endsWith('.vtt');
    
    if (allowedTypes.includes(file.mimetype) || isSubtitleByExtension) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only SRT/VTT files are allowed.'));
    }
  },
});

/**
 * Multer upload for mixed files (images, videos, subtitles)
 */
const uploadMixed = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB
  },
  fileFilter: (req, file, cb) => {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    const allowedSubtitleTypes = ['text/vtt', 'application/x-subrip', 'text/plain'];
    const isSubtitleByExtension = file.originalname.endsWith('.srt') || file.originalname.endsWith('.vtt');
    
    if (
      allowedImageTypes.includes(file.mimetype) || 
      allowedVideoTypes.includes(file.mimetype) ||
      allowedSubtitleTypes.includes(file.mimetype) ||
      isSubtitleByExtension
    ) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Only image, video, and subtitle files are allowed. Received: ${file.mimetype || 'unknown'}`));
    }
  },
});

module.exports = {
  upload,
  uploadImage,
  uploadVideo,
  uploadSubtitle,
  uploadMixed,
  uploadFileToS3,
  s3Client,
  BUCKET_NAME,
  REGION,
};

