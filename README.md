# Movie Streaming API with Ads Management

A comprehensive backend API for a movie streaming platform with advanced ads management, content management, SEO optimization, and user engagement features.

## Features

### 🎯 Ad Types Control
- Pre-roll ads (before video starts)
- Mid-roll ads (during movie)
- Banner ads (top/bottom)
- Native ads (between movie list)
- Popup/Interstitial ads

### 🎬 Movie & Content Management
- Movie upload with multiple quality support (480p/720p/1080p)
- Subtitle upload (multiple languages)
- Movie categories, channels, and subcategories
- Trending and Featured sections
- Movie deletion and management

### 🔍 SEO & Traffic Control
- Movie title SEO optimization
- Meta title & description management
- Custom URL (slug) generation
- Auto-generated sitemap
- Google Discover optimization ready
- Google Analytics integration ready

### 🛡️ Copyright & Safety Control
- DMCA takedown functionality
- Content disable option
- Country block system
- Age restriction control

### 🚀 Promotion & Growth Tools
- Referral system (users can earn)
- Direct brand ads management
- App install promotion banners
- In-site banner promotions

## Tech Stack

- **Node.js** with Express.js
- **MongoDB** with Mongoose
- **AWS S3** for file storage
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Multer** for file uploads

## Project Structure

```
basic-apiBuilding/
├── config/              # Configuration files
│   ├── aws.config.js    # AWS S3 configuration
│   └── constants.js     # Application constants
├── controllers/         # Business logic controllers
│   ├── admin/          # Admin controllers
│   ├── auth/           # Authentication controllers
│   ├── public/         # Public route controllers
│   └── user/           # User controllers
├── middleware/          # Express middleware
│   ├── auth.middleware.js
│   ├── errorHandler.middleware.js
│   └── upload.middleware.js
├── models/              # MongoDB models
│   ├── user.model.js
│   ├── movie.model.js
│   ├── ad.model.js
│   ├── category.model.js
│   ├── channel.model.js
│   ├── subcategory.model.js
│   ├── referral.model.js
│   ├── watchHistory.model.js
│   └── favorite.model.js
├── routes/              # API routes
│   ├── admin/         # Admin routes
│   ├── public/        # Public routes
│   └── user/          # User routes
├── scripts/            # Utility scripts
│   └── seed.js        # Admin seed script
├── services/           # Service layer
│   └── s3.service.js  # AWS S3 service
├── utilities/          # Utility functions
│   └── database.js    # Database connection
└── app.js              # Express app configuration
```

## Installation

1. Clone the repository
```bash
git clone <repository-url>
cd basic-apiBuilding
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Create the first admin user
```bash
npm run seed
```

5. Start the server
```bash
npm start
# or for development
npm run dev
```

## Environment Variables

See `.env.example` for all required environment variables:

- `DATABASE_URL` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_S3_BUCKET` - S3 bucket name
- `AWS_REGION` - AWS region
- `ADMIN_EMAIL` - Initial admin email (optional, defaults to admin@example.com)
- `ADMIN_PASSWORD` - Initial admin password (optional, defaults to Admin@123456)
- `ADMIN_NAME` - Initial admin name (optional, defaults to Super Admin)

## Creating Admin Users

### Method 1: Using Seed Script (First Admin)

Run the seed script to create the first admin:

```bash
npm run seed
```

The script will:
- Check if an admin already exists
- Create the first admin if none exists
- Display admin credentials
- Exit if admin already exists

### Method 2: Using API (Additional Admins)

After logging in as an admin, create additional admins using the API:

```bash
POST /api/admin/users/create-admin
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "Email": "newadmin@example.com",
  "Password": "SecurePassword123",
  "Name": "New Admin"
}
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update profile (protected)
- `PUT /api/auth/change-password` - Change password (protected)

### Admin Routes (Require Admin Role)

#### Admin User Management
- `POST /api/admin/users/create-admin` - Create admin user
- `GET /api/admin/users/admins` - Get all admins
- `GET /api/admin/users/admins/:id` - Get admin by ID
- `PUT /api/admin/users/admins/:id` - Update admin
- `DELETE /api/admin/users/admins/:id` - Delete admin
- `PATCH /api/admin/users/admins/:id/change-password` - Change admin password
- `PATCH /api/admin/users/admins/:id/toggle-status` - Toggle admin status

#### Ads Management
- `POST /api/admin/ads` - Create ad
- `GET /api/admin/ads` - Get all ads
- `GET /api/admin/ads/:id` - Get ad by ID
- `PUT /api/admin/ads/:id` - Update ad
- `DELETE /api/admin/ads/:id` - Delete ad
- `PATCH /api/admin/ads/:id/toggle-status` - Toggle ad status
- `GET /api/admin/ads/analytics/:id` - Get ad analytics

#### Movie Management
- `POST /api/admin/movies` - Create movie
- `GET /api/admin/movies` - Get all movies
- `GET /api/admin/movies/:id` - Get movie by ID
- `PUT /api/admin/movies/:id` - Update movie
- `DELETE /api/admin/movies/:id` - Delete movie
- `PATCH /api/admin/movies/:id/toggle-trending` - Toggle trending
- `PATCH /api/admin/movies/:id/toggle-featured` - Toggle featured
- `PATCH /api/admin/movies/:id/dmca-takedown` - DMCA takedown
- `PATCH /api/admin/movies/:id/country-block` - Update country block
- `PATCH /api/admin/movies/:id/age-restriction` - Update age restriction
- `POST /api/admin/movies/:id/video` - Upload video quality
- `POST /api/admin/movies/:id/subtitle` - Upload subtitle

#### Categories, Channels, SubCategories
- Similar CRUD operations for categories, channels, and subcategories

#### SEO Management
- `PUT /api/admin/seo/movie/:id` - Update movie SEO
- `POST /api/admin/seo/sitemap/generate` - Generate sitemap
- `GET /api/admin/seo/analytics` - Get SEO analytics

#### Referral Management
- `GET /api/admin/referrals` - Get all referrals
- `GET /api/admin/referrals/stats` - Get referral statistics
- `PATCH /api/admin/referrals/:id/earnings` - Update referral earnings

### Public Routes

#### Movies
- `GET /api/movies/trending` - Get trending movies
- `GET /api/movies/featured` - Get featured movies
- `GET /api/movies/category/:slug` - Get movies by category
- `GET /api/movies/search?q=query` - Search movies
- `GET /api/movies/:slug` - Get movie by slug
- `GET /api/movies/categories` - Get all categories
- `GET /api/movies/channels` - Get all channels

#### Ads
- `GET /api/ads/type/:type` - Get ads by type
- `POST /api/ads/:id/click` - Track ad click

### User Routes (Require Authentication)

#### Watch History
- `POST /api/user/watch-history` - Update watch history
- `GET /api/user/watch-history` - Get watch history
- `DELETE /api/user/watch-history` - Clear watch history
- `DELETE /api/user/watch-history/:id` - Remove from watch history

#### Favorites
- `POST /api/user/favorites` - Add to favorites
- `GET /api/user/favorites` - Get favorites
- `GET /api/user/favorites/check/:movieId` - Check if favorited
- `DELETE /api/user/favorites/:movieId` - Remove from favorites

#### Referrals
- `GET /api/user/referrals/info` - Get referral info
- `GET /api/user/referrals/list` - Get referral list

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Admin endpoints require both authentication and admin role.

## File Uploads

File uploads are handled via AWS S3. Supported file types:

- **Movies**: MP4, WebM, QuickTime
- **Subtitles**: SRT, VTT
- **Images**: JPEG, PNG, WebP, GIF

## Response Format

All API responses follow this format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

## Security Features

- Password hashing with bcryptjs
- JWT-based authentication
- Role-based access control (Admin/User)
- Input validation
- Helmet.js for security headers
- CORS configuration
- Country-based content blocking
- Age restriction controls
- Admin user management with safety checks

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support, email support@example.com or create an issue in the repository.
