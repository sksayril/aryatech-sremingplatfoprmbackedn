const Actor = require('../../models/actor.model');
const { deleteFromS3, extractKeyFromUrl } = require('../../services/s3.service');
const { uploadFileToS3 } = require('../../middleware/aws.setup');
const { S3_BUCKETS } = require('../../config/constants');
const { processActorImage } = require('../../utils/imageProcessor');

/**
 * Create actor
 */
exports.createActor = async (req, res) => {
  try {
    const actorData = { ...req.body };

    if (req.file) {
      // Compress and resize actor image before uploading
      const compressedBuffer = await processActorImage(req.file.buffer);
      
      // Create a new file object with compressed buffer
      const compressedFile = {
        ...req.file,
        buffer: compressedBuffer,
        size: compressedBuffer.length,
        mimetype: 'image/jpeg', // Compressed images are always JPEG
        originalname: req.file.originalname.replace(/\.[^/.]+$/, '.jpg'), // Change extension to .jpg
      };
      
      const uploadResult = await uploadFileToS3(compressedFile, S3_BUCKETS.THUMBNAILS);
      actorData.Image = uploadResult.url;
    }

    const actor = await Actor.create(actorData);

    res.status(201).json({
      success: true,
      message: 'Actor created successfully',
      data: actor,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create actor',
      error: error.message,
    });
  }
};

/**
 * Get all actors
 */
exports.getAllActors = async (req, res) => {
  try {
    const { 
      isActive, 
      search, 
      page = 1, 
      limit = 20, 
      sortBy = 'SortOrder', 
      sortOrder = 'asc' 
    } = req.query;
    
    const query = {};

    if (isActive !== undefined) {
      query.IsActive = isActive === 'true';
    }

    // Search by name or description
    if (search) {
      query.$or = [
        { Name: { $regex: search, $options: 'i' } },
        { Description: { $regex: search, $options: 'i' } },
        { Slug: { $regex: search, $options: 'i' } },
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const actors = await Actor.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Actor.countDocuments(query);

    res.json({
      success: true,
      data: actors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch actors',
      error: error.message,
    });
  }
};

/**
 * Get actor by ID
 */
exports.getActorById = async (req, res) => {
  try {
    const actor = await Actor.findById(req.params.id);

    if (!actor) {
      return res.status(404).json({
        success: false,
        message: 'Actor not found',
      });
    }

    res.json({
      success: true,
      data: actor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch actor',
      error: error.message,
    });
  }
};

/**
 * Update actor
 */
exports.updateActor = async (req, res) => {
  try {
    const actor = await Actor.findById(req.params.id);

    if (!actor) {
      return res.status(404).json({
        success: false,
        message: 'Actor not found',
      });
    }

    if (req.file) {
      if (actor.Image) {
        // Best-effort cleanup only (do NOT fail update if S3 delete is denied)
        try {
          const key = extractKeyFromUrl(actor.Image);
          if (key) await deleteFromS3(key);
        } catch (e) {
          // ignore (common when IAM has explicit deny on s3:DeleteObject)
        }
      }
      
      // Compress and resize actor image before uploading
      const compressedBuffer = await processActorImage(req.file.buffer);
      
      // Create a new file object with compressed buffer
      const compressedFile = {
        ...req.file,
        buffer: compressedBuffer,
        size: compressedBuffer.length,
        mimetype: 'image/jpeg', // Compressed images are always JPEG
        originalname: req.file.originalname.replace(/\.[^/.]+$/, '.jpg'), // Change extension to .jpg
      };
      
      const uploadResult = await uploadFileToS3(compressedFile, S3_BUCKETS.THUMBNAILS);
      req.body.Image = uploadResult.url;
    }

    Object.assign(actor, req.body);
    await actor.save();

    res.json({
      success: true,
      message: 'Actor updated successfully',
      data: actor,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update actor',
      error: error.message,
    });
  }
};

/**
 * Delete actor
 */
exports.deleteActor = async (req, res) => {
  try {
    const actor = await Actor.findById(req.params.id);

    if (!actor) {
      return res.status(404).json({
        success: false,
        message: 'Actor not found',
      });
    }

    // IMPORTANT:
    // This project may run with IAM policies that explicitly DENY s3:DeleteObject.
    // The requested behavior is to remove the actor (and references) from MongoDB ONLY,
    // and NOT delete any media from S3.
    await Actor.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Actor deleted successfully',
      data: {
        deletedFromDatabase: true,
        deletedFromS3: false,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete actor',
      error: error.message,
    });
  }
};

