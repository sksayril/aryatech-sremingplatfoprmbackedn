const mongoose = require('mongoose');
const { MOVIE_QUALITIES, MOVIE_STATUS } = require('../config/constants');

const movieSchema = new mongoose.Schema(
  {
    Title: {
      type: String,
      required: true,
      trim: true,
    },
    Slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },
    Description: {
      type: String,
    },
    Thumbnail: {
      type: String,
    },
    Poster: {
      type: String,
    },
    TrailerUrl: {
      type: String,
    },
    // Multiple quality videos
    Videos: [
      {
        Quality: {
          type: String,
          enum: Object.values(MOVIE_QUALITIES),
        },
        Url: {
          type: String,
          required: true,
        },
        Duration: {
          type: Number, // in seconds
        },
        FileSize: {
          type: Number, // in bytes
        },
        IsOriginal: {
          type: Boolean,
          default: false,
        },
      },
    ],
    // Video conversion tracking
    ConversionJobId: {
      type: String,
    },
    PendingQualities: [
      {
        type: String,
        enum: Object.values(MOVIE_QUALITIES),
      },
    ],
    // Subtitles
    Subtitles: [
      {
        Language: {
          type: String,
          required: true,
        },
        LanguageCode: {
          type: String,
          required: true,
        },
        Url: {
          type: String,
          required: true,
        },
      },
    ],
    // Categories
    Category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    SubCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory',
    },
    SubSubCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubSubCategory',
    },
    Channel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Channel',
    },
    // Premium flag
    IsPremium: {
      type: Boolean,
      default: false,
    },
    // Tags
    Tags: [
      {
        type: String,
        trim: true,
      },
    ],
    // SEO Fields
    MetaTitle: {
      type: String,
    },
    MetaDescription: {
      type: String,
    },
    MetaKeywords: [
      {
        type: String,
      },
    ],
    // Status and Control
    Status: {
      type: String,
      enum: Object.values(MOVIE_STATUS),
      default: MOVIE_STATUS.ACTIVE,
    },
    IsTrending: {
      type: Boolean,
      default: false,
    },
    IsFeatured: {
      type: Boolean,
      default: false,
    },
    // Copyright & Safety
    AgeRestriction: {
      type: String,
      enum: ['G', 'PG', 'PG-13', 'R', 'NC-17'],
      default: 'PG',
    },
    BlockedCountries: [
      {
        type: String, // ISO country codes
      },
    ],
    IsDMCA: {
      type: Boolean,
      default: false,
    },
    DMCAReason: {
      type: String,
    },
    // Analytics
    Views: {
      type: Number,
      default: 0,
    },
    Likes: {
      type: Number,
      default: 0,
    },
    LikedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    Comments: {
      type: Number,
      default: 0,
    },
    Rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ReleaseDate: {
      type: Date,
    },
    Year: {
      type: Number,
    },
    Genre: [
      {
        type: String,
      },
    ],
    Cast: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Actor',
      },
    ],
    Director: {
      type: String,
    },
    Country: {
      type: String,
      trim: true,
    },
    Language: {
      type: String,
      trim: true,
    },
    CreatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug before saving
movieSchema.pre('save', function (next) {
  if (this.isModified('Title') && !this.Slug) {
    const slugify = require('slugify');
    this.Slug = slugify(this.Title, { lower: true, strict: true });
  }
  next();
});

// Indexes for better query performance
movieSchema.index({ Category: 1 });
movieSchema.index({ Status: 1 });
movieSchema.index({ IsTrending: 1, IsFeatured: 1 });
movieSchema.index({ Views: -1 });
movieSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Movie', movieSchema);

