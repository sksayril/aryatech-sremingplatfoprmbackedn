const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema(
  {
    Email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    Password: {
      type: String,
      required: true,
      minlength: 6,
    },
    Name: {
      type: String,
      trim: true,
    },
    Role: {
      type: String,
      enum: [USER_ROLES.ADMIN, USER_ROLES.SUB_ADMIN, USER_ROLES.USER],
      default: USER_ROLES.USER,
    },
    IsSubAdmin: {
      type: Boolean,
      default: false,
    },
    IsMainAdmin: {
      type: Boolean,
      default: false,
    },
    Roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role',
      },
    ],
    PlainPassword: {
      type: String,
      // Only used for sub-admins - stored in plain text as requested
    },
    ReferralCode: {
      type: String,
      unique: true,
      sparse: true,
    },
    ReferredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    ReferralEarnings: {
      type: Number,
      default: 0,
    },
    Coins: {
      type: Number,
      default: 0,
      min: 0,
    },
    CreatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    IsActive: {
      type: Boolean,
      default: true,
    },
    LastLogin: {
      type: Date,
    },
    ProfilePicture: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving (skip for sub-admins - store in PlainPassword instead)
userSchema.pre('save', async function (next) {
  if (!this.isModified('Password')) return next();
  
  // For sub-admins, store password in plain text and also hash it for comparison
  if (this.IsSubAdmin || this.Role === USER_ROLES.SUB_ADMIN) {
    this.PlainPassword = this.Password; // Store plain text password
    this.Password = await bcrypt.hash(this.Password, 10); // Also hash for comparison
  } else {
    // For regular users and main admin, only hash
    this.Password = await bcrypt.hash(this.Password, 10);
  }
  next();
});

// Generate referral code
userSchema.pre('save', async function (next) {
  if (!this.ReferralCode) {
    this.ReferralCode = `REF${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  // For sub-admins, also check plain text password
  if (this.IsSubAdmin || this.Role === USER_ROLES.SUB_ADMIN) {
    if (this.PlainPassword === candidatePassword) {
      return true;
    }
  }
  // For all users, check hashed password
  return await bcrypt.compare(candidatePassword, this.Password);
};

module.exports = mongoose.model('User', userSchema);
