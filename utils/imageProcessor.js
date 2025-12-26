/**
 * Image Processing Utility
 * Compresses and resizes images before uploading to S3
 * Uses Jimp - pure JavaScript image processing library
 */

const Jimp = require('jimp');

/**
 * Compress and resize image
 * @param {Buffer} imageBuffer - Original image buffer
 * @param {Object} options - Processing options
 * @param {Number} options.maxWidth - Maximum width (default: 800)
 * @param {Number} options.maxHeight - Maximum height (default: 800)
 * @param {Number} options.quality - JPEG quality 1-100 (default: 80)
 * @param {String} options.format - Output format: 'jpeg', 'png' (default: 'jpeg')
 * @returns {Promise<Buffer>} - Compressed image buffer
 */
const compressImage = async (imageBuffer, options = {}) => {
  try {
    const {
      maxWidth = 800,
      maxHeight = 800,
      quality = 80,
      format = 'jpeg',
    } = options;

    // Load image from buffer
    const image = await Jimp.read(imageBuffer);

    // Get current dimensions
    const currentWidth = image.bitmap.width;
    const currentHeight = image.bitmap.height;

    // Calculate new dimensions maintaining aspect ratio
    let newWidth = currentWidth;
    let newHeight = currentHeight;

    if (currentWidth > maxWidth || currentHeight > maxHeight) {
      const aspectRatio = currentWidth / currentHeight;
      
      if (currentWidth > currentHeight) {
        // Landscape orientation
        newWidth = Math.min(currentWidth, maxWidth);
        newHeight = Math.round(newWidth / aspectRatio);
        
        // If height still exceeds max, adjust
        if (newHeight > maxHeight) {
          newHeight = maxHeight;
          newWidth = Math.round(newHeight * aspectRatio);
        }
      } else {
        // Portrait or square orientation
        newHeight = Math.min(currentHeight, maxHeight);
        newWidth = Math.round(newHeight * aspectRatio);
        
        // If width still exceeds max, adjust
        if (newWidth > maxWidth) {
          newWidth = maxWidth;
          newHeight = Math.round(newWidth / aspectRatio);
        }
      }
    }

    // Resize image
    if (newWidth !== currentWidth || newHeight !== currentHeight) {
      image.resize(newWidth, newHeight);
    }

    // Get buffer based on format
    let compressedBuffer;
    if (format === 'png') {
      compressedBuffer = await image.getBufferAsync(Jimp.MIME_PNG);
    } else {
      // Default to JPEG - Jimp quality uses 0-100 scale
      compressedBuffer = await image.quality(Math.round(quality)).getBufferAsync(Jimp.MIME_JPEG);
    }

    return compressedBuffer;
  } catch (error) {
    throw new Error(`Image compression failed: ${error.message}`);
  }
};

/**
 * Process actor image - optimized for profile pictures
 * @param {Buffer} imageBuffer - Original image buffer
 * @returns {Promise<Buffer>} - Compressed image buffer
 */
const processActorImage = async (imageBuffer) => {
  return await compressImage(imageBuffer, {
    maxWidth: 500,
    maxHeight: 500,
    quality: 75,
    format: 'jpeg',
  });
};

/**
 * Process thumbnail/poster image
 * @param {Buffer} imageBuffer - Original image buffer
 * @returns {Promise<Buffer>} - Compressed image buffer
 */
const processThumbnailImage = async (imageBuffer) => {
  return await compressImage(imageBuffer, {
    maxWidth: 800,
    maxHeight: 1200,
    quality: 80,
    format: 'jpeg',
  });
};

module.exports = {
  compressImage,
  processActorImage,
  processThumbnailImage,
};

