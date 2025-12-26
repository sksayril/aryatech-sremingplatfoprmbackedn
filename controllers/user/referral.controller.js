const User = require('../../models/user.model');
const Referral = require('../../models/referral.model');

/**
 * Get user's referral code and stats
 */
exports.getReferralInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('ReferralCode ReferralEarnings');

    const referralStats = await Referral.aggregate([
      { $match: { Referrer: req.user._id } },
      {
        $group: {
          _id: '$Status',
          count: { $sum: 1 },
          totalEarnings: { $sum: '$Earnings' },
        },
      },
    ]);

    const totalReferrals = await Referral.countDocuments({ Referrer: req.user._id });
    const completedReferrals = await Referral.countDocuments({
      Referrer: req.user._id,
      Status: 'completed',
    });

    res.json({
      success: true,
      data: {
        referralCode: user.ReferralCode,
        totalEarnings: user.ReferralEarnings,
        totalReferrals,
        completedReferrals,
        pendingReferrals: totalReferrals - completedReferrals,
        stats: referralStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch referral info',
      error: error.message,
    });
  }
};

/**
 * Get user's referral list
 */
exports.getReferralList = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const referrals = await Referral.find({ Referrer: req.user._id })
      .populate('ReferredUser', 'Name Email createdAt')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Referral.countDocuments({ Referrer: req.user._id });

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
      message: 'Failed to fetch referral list',
      error: error.message,
    });
  }
};

