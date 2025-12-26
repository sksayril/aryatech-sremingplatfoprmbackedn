const Channel = require('../../models/channel.model');
const { deleteFromS3, extractKeyFromUrl } = require('../../services/s3.service');
const { uploadFileToS3 } = require('../../middleware/aws.setup');
const { S3_BUCKETS } = require('../../config/constants');

/**
 * Create channel
 */
exports.createChannel = async (req, res) => {
  try {
    const channelData = { ...req.body };

    if (req.file) {
      const uploadResult = await uploadFileToS3(req.file, S3_BUCKETS.THUMBNAILS);
      channelData.Logo = uploadResult.url;
    }

    const channel = await Channel.create(channelData);

    res.status(201).json({
      success: true,
      message: 'Channel created successfully',
      data: channel,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create channel',
      error: error.message,
    });
  }
};

/**
 * Get all channels
 */
exports.getAllChannels = async (req, res) => {
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

    // Search by name, description, or slug
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

    const channels = await Channel.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Channel.countDocuments(query);

    res.json({
      success: true,
      data: channels,
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
      message: 'Failed to fetch channels',
      error: error.message,
    });
  }
};

/**
 * Get channel by ID
 */
exports.getChannelById = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    res.json({
      success: true,
      data: channel,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch channel',
      error: error.message,
    });
  }
};

/**
 * Update channel
 */
exports.updateChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    if (req.file) {
      if (channel.Logo) {
        const key = extractKeyFromUrl(channel.Logo);
        if (key) await deleteFromS3(key);
      }
      const uploadResult = await uploadFileToS3(req.file, S3_BUCKETS.THUMBNAILS);
      req.body.Logo = uploadResult.url;
    }

    Object.assign(channel, req.body);
    await channel.save();

    res.json({
      success: true,
      message: 'Channel updated successfully',
      data: channel,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update channel',
      error: error.message,
    });
  }
};

/**
 * Delete channel
 */
exports.deleteChannel = async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: 'Channel not found',
      });
    }

    if (channel.Logo) {
      const key = extractKeyFromUrl(channel.Logo);
      if (key) await deleteFromS3(key);
    }

    await Channel.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Channel deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete channel',
      error: error.message,
    });
  }
};

