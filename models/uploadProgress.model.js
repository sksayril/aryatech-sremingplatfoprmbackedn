const mongoose = require('mongoose');

const uploadProgressSchema = new mongoose.Schema(
  {
    Movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
    },
    User: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    UploadId: {
      type: String,
      required: true,
      unique: true,
    },
    FileName: {
      type: String,
      required: true,
    },
    FileType: {
      type: String,
      enum: ['video', 'thumbnail', 'poster', 'subtitle'],
      required: true,
    },
    TotalSize: {
      type: Number,
      required: true,
    },
    UploadedSize: {
      type: Number,
      default: 0,
    },
    Progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    Status: {
      type: String,
      enum: ['pending', 'uploading', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    S3Key: {
      type: String,
    },
    S3Url: {
      type: String,
    },
    Error: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
uploadProgressSchema.index({ User: 1, Status: 1 });
uploadProgressSchema.index({ Movie: 1 });

module.exports = mongoose.model('UploadProgress', uploadProgressSchema);

