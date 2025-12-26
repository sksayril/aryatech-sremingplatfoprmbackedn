const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const s3Client = require('../config/aws.config');

const BUCKET_NAME = process.env.AWS_S3_BUCKET || 'elboz';
const REGION = process.env.AWS_REGION || 'us-east-1';

/**
 * Get S3 URL - handles different region formats
 * AWS S3 URLs vary by region:
 * - us-east-1: bucket.s3.amazonaws.com or bucket.s3.us-east-1.amazonaws.com
 * - Other regions: bucket.s3.region.amazonaws.com
 * - Some regions use s3-region.amazonaws.com format
 */
const getS3Url = (key) => {
  // Remove any leading slashes from key
  const cleanKey = key.startsWith('/') ? key.substring(1) : key;
  
  // Use the proper S3 URL format based on region
  // For us-east-1, AWS accepts both formats, but s3.amazonaws.com is more common
  if (REGION === 'us-east-1') {
    return `https://${BUCKET_NAME}.s3.amazonaws.com/${cleanKey}`;
  } else {
    // For other regions, use s3.region.amazonaws.com format
    return `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${cleanKey}`;
  }
};

/**
 * Upload file to S3 with progress tracking
 */
const uploadToS3 = async (file, folder = 'uploads', progressCallback = null) => {
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
      // Remove ACL as it may cause issues in some regions/buckets
      // ACL: 'public-read',
    });

    // Track progress for simple uploads
    if (progressCallback) {
      // Simulate progress for small files (they upload quickly)
      await progressCallback(0);
      await progressCallback(50);
    }

    let response;
    try {
      response = await s3Client.send(command);
    } catch (error) {
      // If error mentions endpoint, try to extract and use it
      if (error.message && error.message.includes('endpoint')) {
        // Extract endpoint from error message if possible
        const endpointMatch = error.message.match(/endpoint[:\s]+([^\s]+)/i);
        if (endpointMatch && endpointMatch[1]) {
          console.warn(`AWS endpoint issue detected. Error: ${error.message}`);
          console.warn(`Please verify AWS_REGION matches your bucket's region.`);
          console.warn(`Current region: ${REGION}`);
        }
      }
      throw error;
    }
    
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
    // Provide more helpful error message
    let errorMessage = `S3 upload failed: ${error.message}`;
    
    if (error.message && error.message.includes('endpoint')) {
      errorMessage += `\n\nTroubleshooting:\n`;
      errorMessage += `1. Verify AWS_REGION in .env matches your bucket's region\n`;
      errorMessage += `2. Check AWS_S3_BUCKET name is correct\n`;
      errorMessage += `3. Ensure AWS credentials have S3 access permissions\n`;
      errorMessage += `4. If using a custom endpoint, set AWS_S3_ENDPOINT in .env`;
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
      // Remove ACL as it may cause issues in some regions/buckets
      // ACL: 'public-read',
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
 * Delete file from S3
 */
const deleteFromS3 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    throw new Error(`S3 delete failed: ${error.message}`);
  }
};

/**
 * Generate presigned URL for private files
 */
const getPresignedUrl = async (key, expiresIn = 3600) => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    throw new Error(`Presigned URL generation failed: ${error.message}`);
  }
};

/**
 * Extract S3 key from URL
 */
const extractKeyFromUrl = (url) => {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1); // Remove leading slash
  } catch (error) {
    return null;
  }
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  getPresignedUrl,
  extractKeyFromUrl,
};

