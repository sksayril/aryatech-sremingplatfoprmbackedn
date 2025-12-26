module.exports = {
  USER_ROLES: {
    ADMIN: 'admin',
    SUB_ADMIN: 'sub-admin',
    USER: 'user',
  },
  PERMISSIONS: {
    // Movie Management
    MOVIES_VIEW: 'movies:view',
    MOVIES_CREATE: 'movies:create',
    MOVIES_EDIT: 'movies:edit',
    MOVIES_DELETE: 'movies:delete',
    // Category Management
    CATEGORIES_VIEW: 'categories:view',
    CATEGORIES_CREATE: 'categories:create',
    CATEGORIES_EDIT: 'categories:edit',
    CATEGORIES_DELETE: 'categories:delete',
    // Channel Management
    CHANNELS_VIEW: 'channels:view',
    CHANNELS_CREATE: 'channels:create',
    CHANNELS_EDIT: 'channels:edit',
    CHANNELS_DELETE: 'channels:delete',
    // Actor Management
    ACTORS_VIEW: 'actors:view',
    ACTORS_CREATE: 'actors:create',
    ACTORS_EDIT: 'actors:edit',
    ACTORS_DELETE: 'actors:delete',
    // User Management
    USERS_VIEW: 'users:view',
    USERS_EDIT: 'users:edit',
    USERS_DELETE: 'users:delete',
    // Sub-Admin Management (Main Admin Only)
    SUB_ADMINS_VIEW: 'sub-admins:view',
    SUB_ADMINS_CREATE: 'sub-admins:create',
    SUB_ADMINS_EDIT: 'sub-admins:edit',
    SUB_ADMINS_DELETE: 'sub-admins:delete',
    // Dashboard
    DASHBOARD_VIEW: 'dashboard:view',
    // Upload Queue
    UPLOAD_QUEUE_VIEW: 'upload-queue:view',
    UPLOAD_QUEUE_MANAGE: 'upload-queue:manage',
    // Ads Management
    ADS_VIEW: 'ads:view',
    ADS_CREATE: 'ads:create',
    ADS_EDIT: 'ads:edit',
    ADS_DELETE: 'ads:delete',
    // SEO Management
    SEO_VIEW: 'seo:view',
    SEO_EDIT: 'seo:edit',
    // Contact Management
    CONTACT_VIEW: 'contact:read',
    CONTACT_UPDATE: 'contact:update',
    CONTACT_DELETE: 'contact:delete',
    // Withdrawal Management
    WITHDRAWAL_VIEW: 'withdrawal:read',
    WITHDRAWAL_UPDATE: 'withdrawal:update',
  },
  AD_TYPES: {
    PRE_ROLL: 'pre-roll',
    MID_ROLL: 'mid-roll',
    BANNER_TOP: 'banner-top',
    BANNER_BOTTOM: 'banner-bottom',
    NATIVE: 'native',
    POPUP: 'popup',
    INTERSTITIAL: 'interstitial',
  },
  MOVIE_QUALITIES: {
    QUALITY_480P: '480p',
    QUALITY_720P: '720p',
    QUALITY_1080P: '1080p',
  },
  MOVIE_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    BLOCKED: 'blocked',
    DMCA: 'dmca',
  },
  S3_BUCKETS: {
    MOVIES: 'movies',
    SUBTITLES: 'subtitles',
    BANNERS: 'banners',
    ADS: 'ads',
    THUMBNAILS: 'thumbnails',
  },
};

