const Ad = require('../../models/ad.model');
const { AD_TYPES, S3_BUCKETS } = require('../../config/constants');
const { uploadToS3 } = require('../../services/s3.service');

/**
 * Create a new ad
 */
exports.createAd = async (req, res) => {
  try {
    const adData = {
      ...req.body,
      CreatedBy: req.user._id,
    };

    // Handle file uploads to S3 if present
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        const uploadResult = await uploadToS3(req.files.image[0], S3_BUCKETS.ADS);
        adData.ImageUrl = uploadResult.url;
      }
      if (req.files.video && req.files.video[0]) {
        const uploadResult = await uploadToS3(req.files.video[0], S3_BUCKETS.ADS);
        adData.VideoUrl = uploadResult.url;
      }
    }

    const ad = await Ad.create(adData);

    res.status(201).json({
      success: true,
      message: 'Ad created successfully',
      data: ad,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create ad',
      error: error.message,
    });
  }
};

/**
 * Get all ads with filters
 */
exports.getAllAds = async (req, res) => {
  try {
    const { type, isActive, page = 1, limit = 20 } = req.query;
    const query = {};

    if (type) query.Type = type;
    if (isActive !== undefined) query.IsActive = isActive === 'true';

    const ads = await Ad.find(query)
      .populate('TargetCategories', 'Name Slug')
      .populate('TargetMovies', 'Title Slug')
      .populate('CreatedBy', 'Name Email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Ad.countDocuments(query);

    res.json({
      success: true,
      data: ads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ads',
      error: error.message,
    });
  }
};

/**
 * Get single ad by ID
 */
exports.getAdById = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id)
      .populate('TargetCategories', 'Name Slug')
      .populate('TargetMovies', 'Title Slug')
      .populate('CreatedBy', 'Name Email');

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found',
      });
    }

    res.json({
      success: true,
      data: ad,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ad',
      error: error.message,
    });
  }
};

/**
 * Update ad
 */
exports.updateAd = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found',
      });
    }

    // Handle file uploads to S3 if present
    if (req.files) {
      if (req.files.image && req.files.image[0]) {
        const uploadResult = await uploadToS3(req.files.image[0], S3_BUCKETS.ADS);
        req.body.ImageUrl = uploadResult.url;
      }
      if (req.files.video && req.files.video[0]) {
        const uploadResult = await uploadToS3(req.files.video[0], S3_BUCKETS.ADS);
        req.body.VideoUrl = uploadResult.url;
      }
    }

    Object.assign(ad, req.body);
    await ad.save();

    res.json({
      success: true,
      message: 'Ad updated successfully',
      data: ad,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update ad',
      error: error.message,
    });
  }
};

/**
 * Delete ad
 */
exports.deleteAd = async (req, res) => {
  try {
    const ad = await Ad.findByIdAndDelete(req.params.id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found',
      });
    }

    res.json({
      success: true,
      message: 'Ad deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete ad',
      error: error.message,
    });
  }
};

/**
 * Toggle ad active status
 */
exports.toggleAdStatus = async (req, res) => {
  try {
    const ad = await Ad.findById(req.params.id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found',
      });
    }

    ad.IsActive = !ad.IsActive;
    await ad.save();

    res.json({
      success: true,
      message: `Ad ${ad.IsActive ? 'activated' : 'deactivated'} successfully`,
      data: ad,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to toggle ad status',
      error: error.message,
    });
  }
};

/**
 * Get ad analytics
 */
exports.getAdAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const ad = await Ad.findById(id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found',
      });
    }

    const analytics = {
      impressions: ad.Impressions,
      clicks: ad.Clicks,
      clickThroughRate: ad.Impressions > 0 ? ((ad.Clicks / ad.Impressions) * 100).toFixed(2) : 0,
      ad: {
        id: ad._id,
        name: ad.Name,
        type: ad.Type,
      },
    };

    res.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch ad analytics',
      error: error.message,
    });
  }
};

