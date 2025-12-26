const Ad = require('../../models/ad.model');
const { AD_TYPES } = require('../../config/constants');

/**
 * Get ads by type (for display)
 */
exports.getAdsByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { categoryId, movieId } = req.query;
    const userCountry = req.headers['x-country-code'] || 'US';

    if (!Object.values(AD_TYPES).includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ad type',
      });
    }

    const now = new Date();
    const query = {
      Type: type,
      IsActive: true,
      $or: [
        { StartDate: { $exists: false } },
        { StartDate: { $lte: now } },
      ],
      $or: [
        { EndDate: { $exists: false } },
        { EndDate: { $gte: now } },
      ],
      $or: [
        { TargetCountries: { $in: [userCountry] } },
        { TargetCountries: { $exists: false } },
        { TargetCountries: { $size: 0 } },
      ],
    };

    // If category or movie specified, filter by targeting
    if (categoryId) {
      query.$or = [
        { TargetCategories: { $in: [categoryId] } },
        { TargetCategories: { $exists: false } },
        { TargetCategories: { $size: 0 } },
      ];
    }

    if (movieId) {
      query.$or = [
        { TargetMovies: { $in: [movieId] } },
        { TargetMovies: { $exists: false } },
        { TargetMovies: { $size: 0 } },
      ];
    }

    // Get ads sorted by priority
    const ads = await Ad.find(query)
      .sort({ Priority: -1, createdAt: -1 })
      .limit(5); // Limit to prevent too many ads

    // Increment impressions
    for (const ad of ads) {
      ad.Impressions += 1;
      await ad.save();
    }

    res.json({
      success: true,
      data: ads,
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
 * Track ad click
 */
exports.trackAdClick = async (req, res) => {
  try {
    const { id } = req.params;

    const ad = await Ad.findById(id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found',
      });
    }

    ad.Clicks += 1;
    await ad.save();

    res.json({
      success: true,
      message: 'Click tracked',
      data: {
        clickUrl: ad.ClickUrl,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to track click',
      error: error.message,
    });
  }
};

