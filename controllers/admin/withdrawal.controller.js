const WithdrawalRequest = require('../../models/withdrawalRequest.model');
const User = require('../../models/user.model');

/**
 * Get all withdrawal requests with filtering
 */
exports.getAllWithdrawalRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, paymentMethod, search } = req.query;

    const query = {};

    // Filter by status
    if (status) {
      query.Status = status;
    }

    // Filter by payment method
    if (paymentMethod) {
      query.PaymentMethod = paymentMethod;
    }

    // Search by user email or name
    if (search) {
      const users = await User.find({
        $or: [
          { Email: { $regex: search, $options: 'i' } },
          { Name: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');

      query.User = { $in: users.map((u) => u._id) };
    }

    const requests = await WithdrawalRequest.find(query)
      .populate('User', 'Name Email Coins')
      .populate('ProcessedBy', 'Name Email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await WithdrawalRequest.countDocuments(query);

    res.json({
      success: true,
      data: requests,
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
      message: 'Failed to fetch withdrawal requests',
      error: error.message,
    });
  }
};

/**
 * Get withdrawal request by ID
 */
exports.getWithdrawalRequestById = async (req, res) => {
  try {
    const request = await WithdrawalRequest.findById(req.params.id)
      .populate('User', 'Name Email Coins')
      .populate('ProcessedBy', 'Name Email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found',
      });
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal request',
      error: error.message,
    });
  }
};

/**
 * Update withdrawal request status
 */
exports.updateWithdrawalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { Status, AdminNotes, TransactionId, RejectionReason } = req.body;

    const request = await WithdrawalRequest.findById(id).populate('User');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found',
      });
    }

    // Validate status
    const validStatuses = ['pending', 'approved', 'rejected', 'paid', 'failed'];
    if (Status && !validStatuses.includes(Status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const oldStatus = request.Status;
    const user = await User.findById(request.User._id);

    // Handle status changes
    if (Status) {
      // If moving from pending to rejected, refund coins
      if (oldStatus === 'pending' && Status === 'rejected') {
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found',
          });
        }
        user.Coins += request.Amount;
        await user.save();
      }

      // If moving from pending/approved to paid, mark as processed
      if (Status === 'paid' || Status === 'failed') {
        request.ProcessedBy = req.user._id;
        request.ProcessedAt = new Date();
      }

      // If rejected, require rejection reason
      if (Status === 'rejected' && !RejectionReason && !request.RejectionReason) {
        return res.status(400).json({
          success: false,
          message: 'RejectionReason is required when rejecting a withdrawal request',
        });
      }

      request.Status = Status;
    }

    if (AdminNotes !== undefined) {
      request.AdminNotes = AdminNotes;
    }

    if (TransactionId) {
      request.TransactionId = TransactionId;
    }

    if (RejectionReason) {
      request.RejectionReason = RejectionReason;
    }

    await request.save();

    await request.populate('User', 'Name Email Coins');
    await request.populate('ProcessedBy', 'Name Email');

    res.json({
      success: true,
      message: `Withdrawal request ${Status || 'updated'} successfully`,
      data: {
        _id: request._id,
        Status: request.Status,
        Amount: request.Amount,
        User: request.User,
        ProcessedBy: request.ProcessedBy,
        ProcessedAt: request.ProcessedAt,
        AdminNotes: request.AdminNotes,
        TransactionId: request.TransactionId,
        RejectionReason: request.RejectionReason,
        coinsRefunded: oldStatus === 'pending' && request.Status === 'rejected' ? request.Amount : 0,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update withdrawal request',
      error: error.message,
    });
  }
};

/**
 * Get withdrawal statistics
 */
exports.getWithdrawalStats = async (req, res) => {
  try {
    const stats = {
      total: await WithdrawalRequest.countDocuments(),
      pending: await WithdrawalRequest.countDocuments({ Status: 'pending' }),
      approved: await WithdrawalRequest.countDocuments({ Status: 'approved' }),
      rejected: await WithdrawalRequest.countDocuments({ Status: 'rejected' }),
      paid: await WithdrawalRequest.countDocuments({ Status: 'paid' }),
      failed: await WithdrawalRequest.countDocuments({ Status: 'failed' }),
      totalAmount: {
        pending: await WithdrawalRequest.aggregate([
          { $match: { Status: 'pending' } },
          { $group: { _id: null, total: { $sum: '$Amount' } } },
        ]),
        approved: await WithdrawalRequest.aggregate([
          { $match: { Status: 'approved' } },
          { $group: { _id: null, total: { $sum: '$Amount' } } },
        ]),
        paid: await WithdrawalRequest.aggregate([
          { $match: { Status: 'paid' } },
          { $group: { _id: null, total: { $sum: '$Amount' } } },
        ]),
      },
      byPaymentMethod: {
        upi: await WithdrawalRequest.countDocuments({ PaymentMethod: 'upi' }),
        bank: await WithdrawalRequest.countDocuments({ PaymentMethod: 'bank' }),
      },
    };

    // Format total amounts
    stats.totalAmount.pending = stats.totalAmount.pending[0]?.total || 0;
    stats.totalAmount.approved = stats.totalAmount.approved[0]?.total || 0;
    stats.totalAmount.paid = stats.totalAmount.paid[0]?.total || 0;

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal statistics',
      error: error.message,
    });
  }
};

