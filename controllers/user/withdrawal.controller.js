const WithdrawalRequest = require('../../models/withdrawalRequest.model');
const User = require('../../models/user.model');

/**
 * Create withdrawal request
 */
exports.createWithdrawalRequest = async (req, res) => {
  try {
    const { Amount, PaymentMethod, UPIId, BankName, AccountNumber, IFSCode, AccountHolderName, BankBranch } = req.body;

    // Validate required fields
    if (!Amount || !PaymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'Amount and PaymentMethod are required',
      });
    }

    // Validate amount
    if (Amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0',
      });
    }

    // Get user with current coins
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user has enough coins
    if (user.Coins < Amount) {
      return res.status(400).json({
        success: false,
        message: `Insufficient coins. You have ${user.Coins} coins, but requested ${Amount}`,
        availableCoins: user.Coins,
      });
    }

    // Validate payment method specific fields
    if (PaymentMethod === 'upi') {
      if (!UPIId) {
        return res.status(400).json({
          success: false,
          message: 'UPI ID is required for UPI payment method',
        });
      }
    } else if (PaymentMethod === 'bank') {
      if (!BankName || !AccountNumber || !IFSCode || !AccountHolderName) {
        return res.status(400).json({
          success: false,
          message: 'BankName, AccountNumber, IFSCode, and AccountHolderName are required for bank transfer',
        });
      }
    }

    // Check for pending requests
    const pendingRequest = await WithdrawalRequest.findOne({
      User: req.user._id,
      Status: 'pending',
    });

    if (pendingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending withdrawal request. Please wait for it to be processed.',
        pendingRequest: {
          _id: pendingRequest._id,
          Amount: pendingRequest.Amount,
          Status: pendingRequest.Status,
          createdAt: pendingRequest.createdAt,
        },
      });
    }

    // Create withdrawal request
    const withdrawalRequest = await WithdrawalRequest.create({
      User: req.user._id,
      Amount,
      PaymentMethod,
      UPIId: PaymentMethod === 'upi' ? UPIId : undefined,
      BankName: PaymentMethod === 'bank' ? BankName : undefined,
      AccountNumber: PaymentMethod === 'bank' ? AccountNumber : undefined,
      IFSCode: PaymentMethod === 'bank' ? IFSCode : undefined,
      AccountHolderName: PaymentMethod === 'bank' ? AccountHolderName : undefined,
      BankBranch: PaymentMethod === 'bank' ? BankBranch : undefined,
      Status: 'pending',
    });

    // Deduct coins from user (they will be refunded if request is rejected)
    user.Coins -= Amount;
    await user.save();

    await withdrawalRequest.populate('User', 'Name Email');

    res.status(201).json({
      success: true,
      message: 'Withdrawal request created successfully. Your coins have been deducted and will be refunded if the request is rejected.',
      data: {
        _id: withdrawalRequest._id,
        Amount: withdrawalRequest.Amount,
        PaymentMethod: withdrawalRequest.PaymentMethod,
        Status: withdrawalRequest.Status,
        UPIId: withdrawalRequest.UPIId,
        AccountNumber: withdrawalRequest.AccountNumber ? `****${withdrawalRequest.AccountNumber.slice(-4)}` : undefined,
        createdAt: withdrawalRequest.createdAt,
        updatedCoins: user.Coins,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create withdrawal request',
      error: error.message,
    });
  }
};

/**
 * Get user's withdrawal requests
 */
exports.getMyWithdrawalRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;

    const query = { User: req.user._id };
    if (status) {
      query.Status = status;
    }

    const requests = await WithdrawalRequest.find(query)
      .populate('ProcessedBy', 'Name Email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await WithdrawalRequest.countDocuments(query);

    // Mask sensitive information
    const maskedRequests = requests.map((request) => {
      const requestObj = request.toObject();
      if (requestObj.AccountNumber) {
        requestObj.AccountNumber = `****${requestObj.AccountNumber.slice(-4)}`;
      }
      return requestObj;
    });

    res.json({
      success: true,
      data: maskedRequests,
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
 * Get withdrawal request by ID (user's own request)
 */
exports.getWithdrawalRequestById = async (req, res) => {
  try {
    const request = await WithdrawalRequest.findOne({
      _id: req.params.id,
      User: req.user._id,
    }).populate('ProcessedBy', 'Name Email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal request not found',
      });
    }

    const requestObj = request.toObject();
    // Mask sensitive information
    if (requestObj.AccountNumber) {
      requestObj.AccountNumber = `****${requestObj.AccountNumber.slice(-4)}`;
    }

    res.json({
      success: true,
      data: requestObj,
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
 * Cancel pending withdrawal request
 */
exports.cancelWithdrawalRequest = async (req, res) => {
  try {
    const request = await WithdrawalRequest.findOne({
      _id: req.params.id,
      User: req.user._id,
      Status: 'pending',
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Pending withdrawal request not found',
      });
    }

    // Refund coins to user
    const user = await User.findById(req.user._id);
    user.Coins += request.Amount;
    await user.save();

    // Update request status
    request.Status = 'rejected';
    request.RejectionReason = 'Cancelled by user';
    await request.save();

    res.json({
      success: true,
      message: 'Withdrawal request cancelled successfully. Coins have been refunded.',
      data: {
        _id: request._id,
        Status: request.Status,
        refundedCoins: request.Amount,
        updatedCoins: user.Coins,
      },
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to cancel withdrawal request',
      error: error.message,
    });
  }
};

