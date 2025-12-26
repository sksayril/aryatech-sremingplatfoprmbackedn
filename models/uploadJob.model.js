const mongoose = require('mongoose');

const uploadJobSchema = new mongoose.Schema(
  {
    Movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
    },
    User: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    FileType: {
      type: String,
      enum: ['video', 'thumbnail', 'poster', 'subtitle'],
      required: true,
    },
    FileName: {
      type: String,
      required: true,
    },
    FileBuffer: {
      type: Buffer,
      required: true,
    },
    FileSize: {
      type: Number,
      required: true,
    },
    MimeType: {
      type: String,
      required: true,
    },
    Folder: {
      type: String,
      required: true,
    },
    Status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    Progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    UploadedSize: {
      type: Number,
      default: 0,
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
    Metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    StartedAt: {
      type: Date,
    },
    CompletedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
uploadJobSchema.index({ Movie: 1, Status: 1 });
uploadJobSchema.index({ Status: 1, createdAt: 1 });
uploadJobSchema.index({ User: 1 });
uploadJobSchema.index({ FileType: 1, Status: 1 }); // For filtering by file type and status
uploadJobSchema.index({ Status: 1, FileType: 1, createdAt: -1 }); // For common query patterns
uploadJobSchema.index({ createdAt: -1 }); // For default sorting

module.exports = mongoose.model('UploadJob', uploadJobSchema);

