require('dotenv').config();
require('./utilities/database');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

// Import routes
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth.routes');

// Admin routes
const adminAdRouter = require('./routes/admin/ad.routes');
const adminMovieRouter = require('./routes/admin/movie.routes');
const adminCategoryRouter = require('./routes/admin/category.routes');
const adminChannelRouter = require('./routes/admin/channel.routes');
const adminSubCategoryRouter = require('./routes/admin/subcategory.routes');
const adminSubSubCategoryRouter = require('./routes/admin/subsubcategory.routes');
const adminSEORouter = require('./routes/admin/seo.routes');
const adminReferralRouter = require('./routes/admin/referral.routes');
const adminUserRouter = require('./routes/admin/user.routes');
const adminWorkerRouter = require('./routes/admin/worker.routes');
const adminUploadQueueRouter = require('./routes/admin/uploadQueue.routes');
const adminActorRouter = require('./routes/admin/actor.routes');
const adminDashboardRouter = require('./routes/admin/dashboard.routes');
const adminSubAdminRouter = require('./routes/admin/subAdmin.routes');
const adminRoleRouter = require('./routes/admin/role.routes');
const adminContactRouter = require('./routes/admin/contact.routes');
const adminWithdrawalRouter = require('./routes/admin/withdrawal.routes');

// Public routes
const publicMovieRouter = require('./routes/public/movie.routes');
const publicAdRouter = require('./routes/public/ad.routes');
const publicContactRouter = require('./routes/public/contact.routes');

// User routes (authenticated)
const userWatchHistoryRouter = require('./routes/user/watchHistory.routes');
const userFavoriteRouter = require('./routes/user/favorite.routes');
const userReferralRouter = require('./routes/user/referral.routes');
const userWithdrawalRouter = require('./routes/user/withdrawal.routes');

// Error handlers
const { errorHandler, notFound } = require('./middleware/errorHandler.middleware');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

// Body parsing middleware
app.use(logger('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/', indexRouter);
app.use('/api/auth', authRouter);

// Admin routes
app.use('/api/admin/ads', adminAdRouter);
app.use('/api/admin/movies', adminMovieRouter);
app.use('/api/admin/categories', adminCategoryRouter);
app.use('/api/admin/channels', adminChannelRouter);
app.use('/api/admin/subcategories', adminSubCategoryRouter);
app.use('/api/admin/subsubcategories', adminSubSubCategoryRouter);
app.use('/api/admin/seo', adminSEORouter);
app.use('/api/admin/referrals', adminReferralRouter);
app.use('/api/admin/users', adminUserRouter);
app.use('/api/admin/worker', adminWorkerRouter);
app.use('/api/admin/upload-queues', adminUploadQueueRouter);
app.use('/api/admin/actors', adminActorRouter);
app.use('/api/admin/dashboard', adminDashboardRouter);
app.use('/api/admin/sub-admins', adminSubAdminRouter);
app.use('/api/admin/roles', adminRoleRouter);
app.use('/api/admin/contacts', adminContactRouter);
app.use('/api/admin/withdrawals', adminWithdrawalRouter);

// Public routes
app.use('/api/movies', publicMovieRouter);
app.use('/api/ads', publicAdRouter);
app.use('/api/contacts', publicContactRouter);
app.use('/api/comments', require('./routes/public/comment.routes'));

// User routes (authenticated)
app.use('/api/user/watch-history', userWatchHistoryRouter);
app.use('/api/user/favorites', userFavoriteRouter);
app.use('/api/user/referrals', userReferralRouter);
app.use('/api/user/withdrawals', userWithdrawalRouter);
app.use('/api/user/movies', require('./routes/user/movieLike.routes'));

// Error handling middleware (must be last)
app.use(notFound);
app.use(errorHandler);

// Start upload worker in background (enabled by default in development and production)
// Set ENABLE_UPLOAD_WORKER=false to disable
if (process.env.ENABLE_UPLOAD_WORKER !== 'false') {
  try {
    const { startWorker } = require('./workers/uploadWorker');
    const workerInterval = parseInt(process.env.UPLOAD_WORKER_INTERVAL) || 5000; // Default 5 seconds
    startWorker(workerInterval);
    console.log(`✅ Upload worker started (checking every ${workerInterval}ms)`);
  } catch (error) {
    console.error('❌ Failed to start upload worker:', error.message);
    console.log('💡 Uploads will be queued but not processed. Run worker separately: npm run worker');
  }
}

module.exports = app;
