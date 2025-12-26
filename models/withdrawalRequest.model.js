const mongoose = require('mongoose');

const withdrawalRequestSchema = new mongoose.Schema(
  {
    User: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    Amount: {
      type: Number,
      required: true,
      min: 1,
    },
    PaymentMethod: {
      type: String,
      enum: ['upi', 'bank'],
      required: true,
    },
    // UPI Details
    UPIId: {
      type: String,
      trim: true,
    },
    // Bank Details
    BankName: {
      type: String,
      trim: true,
    },
    AccountNumber: {
      type: String,
      trim: true,
    },
    IFSCode: {
      type: String,
      trim: true,
      uppercase: true,
    },
    AccountHolderName: {
      type: String,
      trim: true,
    },
    BankBranch: {
      type: String,
      trim: true,
    },
    Status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'paid', 'failed'],
      default: 'pending',
    },
    AdminNotes: {
      type: String,
      trim: true,
    },
    ProcessedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    ProcessedAt: {
      type: Date,
    },
    TransactionId: {
      type: String,
      trim: true,
    },
    RejectionReason: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
withdrawalRequestSchema.index({ User: 1, createdAt: -1 });
withdrawalRequestSchema.index({ Status: 1, createdAt: -1 });
withdrawalRequestSchema.index({ ProcessedBy: 1 });

module.exports = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);

