# API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

Admin endpoints require both authentication and admin role.

---

## Authentication Endpoints

### Sign Up
```http
POST /api/auth/signup
Content-Type: application/json

{
  "Email": "user@example.com",
  "Password": "password123",
  "Name": "John Doe",
  "ReferralCode": "REF123456" // Optional
}
```

### Sign In
```http
POST /api/auth/signin
Content-Type: application/json

{
  "Email": "user@example.com",
  "Password": "password123"
}
```

### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Update Profile
```http
PUT /api/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "Name": "Updated Name",
  "ProfilePicture": "https://..."
}
```

### Change Password
```http
PUT /api/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

---

## Admin Endpoints

### Ads Management

#### Create Ad
```http
POST /api/admin/ads
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

Name: "Summer Sale Ad"
Type: "banner-top"
ClickUrl: "https://example.com"
Image: <file> // Optional
Video: <file> // Optional
Position: "top"
StartDate: "2024-01-01"
EndDate: "2024-12-31"
TargetCountries: ["US", "CA"]
Priority: 10
```

#### Get All Ads
```http
GET /api/admin/ads?type=banner-top&isActive=true&page=1&limit=20
Authorization: Bearer <admin-token>
```

#### Get Ad by ID
```http
GET /api/admin/ads/:id
Authorization: Bearer <admin-token>
```

#### Update Ad
```http
PUT /api/admin/ads/:id
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

IsActive: false
```

#### Delete Ad
```http
DELETE /api/admin/ads/:id
Authorization: Bearer <admin-token>
```

#### Toggle Ad Status
```http
PATCH /api/admin/ads/:id/toggle-status
Authorization: Bearer <admin-token>
```

#### Get Ad Analytics
```http
GET /api/admin/ads/analytics/:id
Authorization: Bearer <admin-token>
```

### Movie Management

#### Create Movie
```http
POST /api/admin/movies
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

Title: "The Movie Title"
Description: "Movie description"
Category: "<category-id>"
SubCategory: "<subcategory-id>" // Optional
Channel: "<channel-id>" // Optional
MetaTitle: "SEO Title"
MetaDescription: "SEO Description"
MetaKeywords: ["keyword1", "keyword2"]
AgeRestriction: "PG-13"
Genre: ["Action", "Drama"]
Cast: ["Actor 1", "Actor 2"]
Director: "Director Name"
Year: 2024
ReleaseDate: "2024-01-01"
thumbnail: <file>
poster: <file>
```

#### Get All Movies
```http
GET /api/admin/movies?status=active&category=<id>&isTrending=true&page=1&limit=20
Authorization: Bearer <admin-token>
```

#### Get Movie by ID
```http
GET /api/admin/movies/:id
Authorization: Bearer <admin-token>
```

#### Update Movie
```http
PUT /api/admin/movies/:id
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

Title: "Updated Title"
```

#### Delete Movie
```http
DELETE /api/admin/movies/:id
Authorization: Bearer <admin-token>
```

#### Upload Video Quality
```http
POST /api/admin/movies/:id/video
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

video: <file>
quality: "1080p"
```

#### Upload Subtitle
```http
POST /api/admin/movies/:id/subtitle
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

subtitle: <file>
language: "English"
languageCode: "en"
```

#### Toggle Trending
```http
PATCH /api/admin/movies/:id/toggle-trending
Authorization: Bearer <admin-token>
```

#### Toggle Featured
```http
PATCH /api/admin/movies/:id/toggle-featured
Authorization: Bearer <admin-token>
```

#### DMCA Takedown
```http
PATCH /api/admin/movies/:id/dmca-takedown
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "reason": "Copyright violation"
}
```

#### Update Country Block
```http
PATCH /api/admin/movies/:id/country-block
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "countries": ["CN", "RU"],
  "action": "block" // or "unblock"
}
```

#### Update Age Restriction
```http
PATCH /api/admin/movies/:id/age-restriction
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "ageRestriction": "R"
}
```

### Category Management

#### Create Category
```http
POST /api/admin/categories
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

Name: "Action"
Description: "Action movies"
image: <file>
SortOrder: 1
```

#### Get All Categories
```http
GET /api/admin/categories?isActive=true
Authorization: Bearer <admin-token>
```

#### Get Category by ID
```http
GET /api/admin/categories/:id
Authorization: Bearer <admin-token>
```

#### Update Category
```http
PUT /api/admin/categories/:id
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data

Name: "Updated Name"
```

#### Delete Category
```http
DELETE /api/admin/categories/:id
Authorization: Bearer <admin-token>
```

### Channel Management

Similar endpoints as Categories:
- `POST /api/admin/channels`
- `GET /api/admin/channels`
- `GET /api/admin/channels/:id`
- `PUT /api/admin/channels/:id`
- `DELETE /api/admin/channels/:id`

### SubCategory Management

Similar endpoints as Categories:
- `POST /api/admin/subcategories`
- `GET /api/admin/subcategories?category=<id>`
- `GET /api/admin/subcategories/:id`
- `PUT /api/admin/subcategories/:id`
- `DELETE /api/admin/subcategories/:id`

### SEO Management

#### Update Movie SEO
```http
PUT /api/admin/seo/movie/:id
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "metaTitle": "SEO Title",
  "metaDescription": "SEO Description",
  "metaKeywords": ["keyword1", "keyword2"],
  "customSlug": "custom-url-slug"
}
```

#### Generate Sitemap
```http
POST /api/admin/seo/sitemap/generate
Authorization: Bearer <admin-token>
```

#### Get SEO Analytics
```http
GET /api/admin/seo/analytics
Authorization: Bearer <admin-token>
```

### Referral Management

#### Get All Referrals
```http
GET /api/admin/referrals?status=completed&page=1&limit=20
Authorization: Bearer <admin-token>
```

#### Get Referral Statistics
```http
GET /api/admin/referrals/stats
Authorization: Bearer <admin-token>
```

#### Update Referral Earnings
```http
PATCH /api/admin/referrals/:id/earnings
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "earnings": 100,
  "status": "completed"
}
```

---

## Public Endpoints

### Movies

#### Get Trending Movies
```http
GET /api/movies/trending?limit=20
```

#### Get Featured Movies
```http
GET /api/movies/featured?limit=20
```

#### Get Movies by Category
```http
GET /api/movies/category/:slug?page=1&limit=20
```

#### Search Movies
```http
GET /api/movies/search?q=action&page=1&limit=20
```

#### Get Movie by Slug
```http
GET /api/movies/:slug
X-Country-Code: US // Optional header
```

#### Get All Categories
```http
GET /api/movies/categories
```

#### Get All Channels
```http
GET /api/movies/channels
```

### Ads

#### Get Ads by Type
```http
GET /api/ads/type/:type?categoryId=<id>&movieId=<id>
X-Country-Code: US // Optional header

// Types: pre-roll, mid-roll, banner-top, banner-bottom, native, popup, interstitial
```

#### Track Ad Click
```http
POST /api/ads/:id/click
```

---

## User Endpoints (Authenticated)

### Watch History

#### Update Watch History
```http
POST /api/user/watch-history
Authorization: Bearer <token>
Content-Type: application/json

{
  "movieId": "<movie-id>",
  "watchedDuration": 3600, // seconds
  "quality": "1080p"
}
```

#### Get Watch History
```http
GET /api/user/watch-history?page=1&limit=20
Authorization: Bearer <token>
```

#### Clear Watch History
```http
DELETE /api/user/watch-history
Authorization: Bearer <token>
```

#### Remove from Watch History
```http
DELETE /api/user/watch-history/:id
Authorization: Bearer <token>
```

### Favorites

#### Add to Favorites
```http
POST /api/user/favorites
Authorization: Bearer <token>
Content-Type: application/json

{
  "movieId": "<movie-id>"
}
```

#### Get Favorites
```http
GET /api/user/favorites?page=1&limit=20
Authorization: Bearer <token>
```

#### Check if Favorited
```http
GET /api/user/favorites/check/:movieId
Authorization: Bearer <token>
```

#### Remove from Favorites
```http
DELETE /api/user/favorites/:movieId
Authorization: Bearer <token>
```

### Referrals

#### Get Referral Info
```http
GET /api/user/referrals/info
Authorization: Bearer <token>
```

#### Get Referral List
```http
GET /api/user/referrals/list?page=1&limit=20
Authorization: Bearer <token>
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## Ad Types

- `pre-roll`: Video ads before movie starts
- `mid-roll`: Video ads during movie
- `banner-top`: Banner ads at top of page
- `banner-bottom`: Banner ads at bottom of page
- `native`: Native ads between movie lists
- `popup`: Popup ads
- `interstitial`: Full-screen interstitial ads

## Movie Qualities

- `480p`: Standard definition
- `720p`: High definition
- `1080p`: Full high definition

## Movie Status

- `active`: Movie is active and visible
- `inactive`: Movie is inactive
- `blocked`: Movie is blocked
- `dmca`: Movie has DMCA takedown

## Age Restrictions

- `G`: General audience
- `PG`: Parental guidance suggested
- `PG-13`: Parents strongly cautioned
- `R`: Restricted
- `NC-17`: Adults only

