const Referral = require('../../models/referral.model');
const User = require('../../models/user.model');

/**
 * Get all referrals
 */
exports.getAllReferrals = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) query.Status = status;

    const referrals = await Referral.find(query)
      .populate('Referrer', 'Name Email ReferralCode')
      .populate('ReferredUser', 'Name Email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Referral.countDocuments(query);

    res.json({
      success: true,
      data: referrals,
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
      message: 'Failed to fetch referrals',
      error: error.message,
    });
  }
};

/**
 * Update referral earnings
 */
exports.updateReferralEarnings = async (req, res) => {
  try {
    const { id } = req.params;
    const { earnings, status } = req.body;

    const referral = await Referral.findById(id);

    if (!referral) {
      return res.status(404).json({
        success: false,
        message: 'Referral not found',
      });
    }

    if (earnings !== undefined) {
      referral.Earnings = earnings;
    }
    if (status) {
      referral.Status = status;
    }

    await referral.save();

    // Update user's total referral earnings
    if (earnings !== undefined) {
      const user = await User.findById(referral.Referrer);
      if (user) {
        user.ReferralEarnings = await Referral.aggregate([
          { $match: { Referrer: referral.Referrer, Status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$Earnings' } } },
        ]).then((result) => (result[0]?.total || 0));
        await user.save();
      }
    }

    res.json({
      success: true,
      message: 'Referral earnings updated successfully',
      data: referral,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update referral earnings',
      error: error.message,
    });
  }
};

/**
 * Get referral statistics
 */
exports.getReferralStats = async (req, res) => {
  try {
    const totalReferrals = await Referral.countDocuments();
    const completedReferrals = await Referral.countDocuments({ Status: 'completed' });
    const totalEarnings = await Referral.aggregate([
      { $match: { Status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$Earnings' } } },
    ]);

    res.json({
      success: true,
      data: {
        totalReferrals,
        completedReferrals,
        pendingReferrals: totalReferrals - completedReferrals,
        totalEarnings: totalEarnings[0]?.total || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch referral statistics',
      error: error.message,
    });
  }
};

