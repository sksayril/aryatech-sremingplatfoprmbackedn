# User API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

Most user endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <user-jwt-token>
```

---

## 🔐 Authentication APIs

### 1. Sign Up

Create a new user account.

**Endpoint:** `POST /api/auth/signup`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "Email": "user@example.com",
  "Password": "password123",
  "Name": "John Doe",
  "ReferralCode": "REF123456"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "Email": "user@example.com",
      "Name": "John Doe",
      "Role": "user",
      "ReferralCode": "REF789012",
      "ReferralEarnings": 0
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "User already exists"
}
```

---

### 2. Sign In

Login with email and password.

**Endpoint:** `POST /api/auth/signin`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "Email": "user@example.com",
  "Password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "Email": "user@example.com",
      "Name": "John Doe",
      "Role": "user",
      "ReferralCode": "REF789012",
      "ReferralEarnings": 50
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### 3. Get Profile

Get current user's profile information.

**Endpoint:** `GET /api/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "Email": "user@example.com",
    "Name": "John Doe",
    "Role": "user",
    "ReferralCode": "REF789012",
    "ReferralEarnings": 50,
    "IsActive": true,
    "ProfilePicture": "https://example.com/profile.jpg",
    "LastLogin": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 4. Update Profile

Update user profile information.

**Endpoint:** `PUT /api/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Name": "John Updated",
  "ProfilePicture": "https://example.com/new-profile.jpg"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "Name": "John Updated",
    "ProfilePicture": "https://example.com/new-profile.jpg",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### 5. Change Password

Change user password.

**Endpoint:** `PUT /api/auth/change-password`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

---

## 🎬 Public Movie APIs

### 1. Get Trending Movies

Get list of trending movies.

**Endpoint:** `GET /api/movies/trending`

**Query Parameters:**
```
limit: 20 (optional) - Number of movies to return
```

**Headers (Optional):**
```
X-Country-Code: US - User's country code for content filtering
```

**Example Request:**
```
GET /api/movies/trending?limit=20
X-Country-Code: US
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
      "Title": "The Amazing Movie",
      "Slug": "the-amazing-movie",
      "Description": "A thrilling adventure movie",
      "Thumbnail": "https://bucket.s3.region.amazonaws.com/thumbnails/thumb.jpg",
      "Poster": "https://bucket.s3.region.amazonaws.com/thumbnails/poster.jpg",
      "Category": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
        "Name": "Action",
        "Slug": "action"
      },
      "SubCategory": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
        "Name": "Superhero",
        "Slug": "superhero"
      },
      "Channel": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
        "Name": "Movie Channel",
        "Slug": "movie-channel"
      },
      "Views": 15000,
      "Likes": 500,
      "Rating": 4.5,
      "AgeRestriction": "PG-13",
      "Year": 2024,
      "Genre": ["Action", "Adventure"],
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 2. Get Featured Movies

Get list of featured movies.

**Endpoint:** `GET /api/movies/featured`

**Query Parameters:**
```
limit: 20 (optional)
```

**Headers (Optional):**
```
X-Country-Code: US
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
      "Title": "Featured Movie",
      "Slug": "featured-movie",
      "Thumbnail": "https://bucket.s3.region.amazonaws.com/thumbnails/thumb.jpg",
      "Views": 20000,
      "Rating": 4.8,
      "Category": {
        "Name": "Action",
        "Slug": "action"
      }
    }
  ]
}
```

---

### 3. Get Movies by Category

Get movies filtered by category.

**Endpoint:** `GET /api/movies/category/:slug`

**Query Parameters:**
```
page: 1 (optional)
limit: 20 (optional)
```

**Headers (Optional):**
```
X-Country-Code: US
```

**Example Request:**
```
GET /api/movies/category/action?page=1&limit=20
X-Country-Code: US
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
      "Title": "Action Movie",
      "Slug": "action-movie",
      "Thumbnail": "https://bucket.s3.region.amazonaws.com/thumbnails/thumb.jpg",
      "Views": 10000,
      "Rating": 4.2,
      "Category": {
        "Name": "Action",
        "Slug": "action"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Category not found"
}
```

---

### 4. Search Movies

Search movies by title, description, genre, or cast.

**Endpoint:** `GET /api/movies/search`

**Query Parameters:**
```
q: "action" (required) - Search query
page: 1 (optional)
limit: 20 (optional)
```

**Headers (Optional):**
```
X-Country-Code: US
```

**Example Request:**
```
GET /api/movies/search?q=action&page=1&limit=20
X-Country-Code: US
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
      "Title": "Action Hero",
      "Slug": "action-hero",
      "Thumbnail": "https://bucket.s3.region.amazonaws.com/thumbnails/thumb.jpg",
      "Views": 8000,
      "Rating": 4.0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 25,
    "pages": 2
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Search query is required"
}
```

---

### 5. Get Movie by Slug

Get detailed movie information by slug.

**Endpoint:** `GET /api/movies/:slug`

**Headers (Optional):**
```
Authorization: Bearer <token> - For watch history and favorites
X-Country-Code: US
```

**Example Request:**
```
GET /api/movies/the-amazing-movie
Authorization: Bearer <token>
X-Country-Code: US
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
    "Title": "The Amazing Movie",
    "Slug": "the-amazing-movie",
    "Description": "A thrilling adventure movie with amazing visuals",
    "Thumbnail": "https://bucket.s3.region.amazonaws.com/thumbnails/thumb.jpg",
    "Poster": "https://bucket.s3.region.amazonaws.com/thumbnails/poster.jpg",
    "TrailerUrl": "https://youtube.com/watch?v=trailer",
    "Videos": [
      {
        "Quality": "720p",
        "Url": "https://bucket.s3.region.amazonaws.com/movies/video720p.mp4",
        "Duration": 7200,
        "FileSize": 2147483648
      },
      {
        "Quality": "1080p",
        "Url": "https://bucket.s3.region.amazonaws.com/movies/video1080p.mp4",
        "Duration": 7200,
        "FileSize": 4294967296
      }
    ],
    "Subtitles": [
      {
        "Language": "English",
        "LanguageCode": "en",
        "Url": "https://bucket.s3.region.amazonaws.com/subtitles/en.srt"
      },
      {
        "Language": "Spanish",
        "LanguageCode": "es",
        "Url": "https://bucket.s3.region.amazonaws.com/subtitles/es.srt"
      }
    ],
    "Category": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "Name": "Action",
      "Slug": "action"
    },
    "SubCategory": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
      "Name": "Superhero",
      "Slug": "superhero"
    },
    "Channel": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
      "Name": "Movie Channel",
      "Slug": "movie-channel"
    },
    "MetaTitle": "The Amazing Movie - Watch Online",
    "MetaDescription": "Watch The Amazing Movie online",
    "Views": 15000,
    "Likes": 500,
    "Rating": 4.5,
    "AgeRestriction": "PG-13",
    "Year": 2024,
    "ReleaseDate": "2024-01-01T00:00:00.000Z",
    "Genre": ["Action", "Adventure", "Thriller"],
    "Cast": ["Actor One", "Actor Two", "Actor Three"],
    "Director": "Director Name",
    "watchHistory": {
      "watchedDuration": 3600,
      "totalDuration": 7200,
      "lastWatchedAt": "2024-01-14T20:30:00.000Z",
      "isCompleted": false
    },
    "isFavorite": true
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Movie not found or not available in your country"
}
```

---

### 6. Get All Categories

Get list of all active categories.

**Endpoint:** `GET /api/movies/categories`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "Name": "Action",
      "Slug": "action",
      "Description": "Action movies",
      "Image": "https://bucket.s3.region.amazonaws.com/thumbnails/category.jpg",
      "IsActive": true,
      "SortOrder": 1
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
      "Name": "Comedy",
      "Slug": "comedy",
      "Description": "Comedy movies",
      "Image": "https://bucket.s3.region.amazonaws.com/thumbnails/comedy.jpg",
      "IsActive": true,
      "SortOrder": 2
    }
  ]
}
```

---

### 7. Get All Channels

Get list of all active channels.

**Endpoint:** `GET /api/movies/channels`

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
      "Name": "Movie Channel",
      "Slug": "movie-channel",
      "Description": "Premium movie channel",
      "Logo": "https://bucket.s3.region.amazonaws.com/thumbnails/logo.jpg",
      "IsActive": true,
      "SortOrder": 1
    }
  ]
}
```

---

## 📢 Public Ad APIs

### 1. Get Ads by Type

Get ads filtered by type for display.

**Endpoint:** `GET /api/ads/type/:type`

**Query Parameters:**
```
categoryId: "<category-id>" (optional) - Filter by category
movieId: "<movie-id>" (optional) - Filter by movie
```

**Headers (Optional):**
```
X-Country-Code: US
```

**Ad Types:**
- `pre-roll` - Video ads before movie starts
- `mid-roll` - Video ads during movie
- `banner-top` - Banner ads at top
- `banner-bottom` - Banner ads at bottom
- `native` - Native ads between lists
- `popup` - Popup ads
- `interstitial` - Full-screen ads

**Example Request:**
```
GET /api/ads/type/banner-top?categoryId=65a1b2c3d4e5f6g7h8i9j0k3
X-Country-Code: US
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "Name": "Summer Sale Banner",
      "Type": "banner-top",
      "ImageUrl": "https://bucket.s3.region.amazonaws.com/ads/banner.jpg",
      "VideoUrl": null,
      "Title": "Summer Sale",
      "Description": "Get 50% off",
      "ClickUrl": "https://example.com/sale",
      "Position": "top",
      "Width": 728,
      "Height": 90,
      "Priority": 10
    }
  ]
}
```

---

### 2. Track Ad Click

Track when a user clicks on an ad.

**Endpoint:** `POST /api/ads/:id/click`

**Example Request:**
```
POST /api/ads/65a1b2c3d4e5f6g7h8i9j0k1/click
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Click tracked",
  "data": {
    "clickUrl": "https://example.com/sale"
  }
}
```

---

## 👍 Movie Likes APIs

### 1. Like/Unlike Movie

Like or unlike a movie.

**Endpoint:** `PATCH /api/user/movies/:movieId/like`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Movie liked",
  "data": {
    "movieId": "65a1b2c3d4e5f6g7h8i9j0k6",
    "likes": 501,
    "isLiked": true
  }
}
```

---

### 2. Check if Movie is Liked

Check if the current user has liked a movie.

**Endpoint:** `GET /api/user/movies/:movieId/like`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "isLiked": true,
    "likes": 500
  }
}
```

---

## 💬 Comments APIs

### 1. Add Comment to Movie

Add a comment to a movie.

**Endpoint:** `POST /api/comments/movie/:movieId`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Comment": "Great movie! Really enjoyed it."
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k10",
    "Movie": "65a1b2c3d4e5f6g7h8i9j0k6",
    "User": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "Name": "John Doe",
      "Email": "john@example.com",
      "ProfilePicture": "https://example.com/profile.jpg"
    },
    "Comment": "Great movie! Really enjoyed it.",
    "Likes": 0,
    "Replies": [],
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Reply to Comment

Reply to an existing comment.

**Endpoint:** `POST /api/comments/movie/:movieId`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Comment": "I agree with you!",
  "parentCommentId": "65a1b2c3d4e5f6g7h8i9j0k10"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Comment added successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k10",
    "Replies": [
      {
        "User": {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
          "Name": "John Doe",
          "Email": "john@example.com"
        },
        "Comment": "I agree with you!",
        "Likes": 0,
        "createdAt": "2024-01-15T10:35:00.000Z"
      }
    ]
  }
}
```

---

### 3. Get Movie Comments

Get all comments for a movie.

**Endpoint:** `GET /api/comments/movie/:movieId`

**Query Parameters:**
```
page: 1 (optional)
limit: 20 (optional)
sortBy: "createdAt" (optional) - Options: createdAt, Likes
sortOrder: "desc" (optional)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k10",
      "Comment": "Great movie!",
      "Likes": 25,
      "User": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "Name": "John Doe",
        "Email": "john@example.com",
        "ProfilePicture": "https://example.com/profile.jpg"
      },
      "Replies": [
        {
          "Comment": "I agree!",
          "Likes": 5,
          "User": {
            "Name": "Jane Smith",
            "Email": "jane@example.com"
          },
          "createdAt": "2024-01-15T11:00:00.000Z"
        }
      ],
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

---

### 4. Get Top Comments

Get the most liked comments for a movie.

**Endpoint:** `GET /api/comments/movie/:movieId/top`

**Query Parameters:**
```
limit: 10 (optional)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k10",
      "Comment": "Amazing movie! Best of the year!",
      "Likes": 150,
      "User": {
        "Name": "John Doe",
        "ProfilePicture": "https://example.com/profile.jpg"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 5. Like/Unlike Comment

Like or unlike a comment or reply.

**Endpoint:** `PATCH /api/comments/:commentId/like`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
replyIndex: 0 (optional) - Index of reply to like (for liking replies)
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Comment like toggled",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k10",
    "Likes": 26,
    "LikedBy": ["65a1b2c3d4e5f6g7h8i9j0k1"]
  }
}
```

---

## 📺 User Watch History APIs

### 1. Update Watch History

Update or create watch history for a movie.

**Endpoint:** `POST /api/user/watch-history`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "movieId": "65a1b2c3d4e5f6g7h8i9j0k6",
  "watchedDuration": 3600,
  "quality": "1080p"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Watch history updated",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k7",
    "User": "65a1b2c3d4e5f6g7h8i9j0k1",
    "Movie": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
      "Title": "The Amazing Movie",
      "Thumbnail": "https://bucket.s3.region.amazonaws.com/thumbnails/thumb.jpg",
      "Slug": "the-amazing-movie"
    },
    "WatchedDuration": 3600,
    "TotalDuration": 7200,
    "Quality": "1080p",
    "LastWatchedAt": "2024-01-15T10:30:00.000Z",
    "IsCompleted": false
  }
}
```

---

### 2. Get Watch History

Get user's watch history.

**Endpoint:** `GET /api/user/watch-history`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
page: 1 (optional)
limit: 20 (optional)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k7",
      "Movie": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
        "Title": "The Amazing Movie",
        "Thumbnail": "https://bucket.s3.region.amazonaws.com/thumbnails/thumb.jpg",
        "Slug": "the-amazing-movie",
        "Description": "A thrilling adventure movie",
        "Category": {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
          "Name": "Action"
        }
      },
      "WatchedDuration": 3600,
      "TotalDuration": 7200,
      "Quality": "1080p",
      "LastWatchedAt": "2024-01-15T10:30:00.000Z",
      "IsCompleted": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

---

### 3. Clear Watch History

Clear all watch history.

**Endpoint:** `DELETE /api/user/watch-history`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Watch history cleared"
}
```

---

### 4. Remove from Watch History

Remove a specific movie from watch history.

**Endpoint:** `DELETE /api/user/watch-history/:id`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Removed from watch history"
}
```

---

## ⭐ User Favorites APIs

### 1. Add to Favorites

Add a movie to favorites.

**Endpoint:** `POST /api/user/favorites`

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "movieId": "65a1b2c3d4e5f6g7h8i9j0k6"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Added to favorites",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k8",
    "User": "65a1b2c3d4e5f6g7h8i9j0k1",
    "Movie": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
      "Title": "The Amazing Movie",
      "Thumbnail": "https://bucket.s3.region.amazonaws.com/thumbnails/thumb.jpg",
      "Slug": "the-amazing-movie",
      "Description": "A thrilling adventure movie",
      "Category": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
        "Name": "Action"
      }
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Movie already in favorites"
}
```

---

### 2. Get Favorites

Get user's favorite movies.

**Endpoint:** `GET /api/user/favorites`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
page: 1 (optional)
limit: 20 (optional)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k8",
      "Movie": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
        "Title": "The Amazing Movie",
        "Thumbnail": "https://bucket.s3.region.amazonaws.com/thumbnails/thumb.jpg",
        "Slug": "the-amazing-movie",
        "Description": "A thrilling adventure movie",
        "Category": {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
          "Name": "Action"
        },
        "Views": 15000,
        "Rating": 4.5
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "pages": 1
  }
}
```

---

### 3. Check if Favorited

Check if a movie is in user's favorites.

**Endpoint:** `GET /api/user/favorites/check/:movieId`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "isFavorite": true
  }
}
```

---

### 4. Remove from Favorites

Remove a movie from favorites.

**Endpoint:** `DELETE /api/user/favorites/:movieId`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Removed from favorites"
}
```

---

## 🎁 User Referral APIs

### 1. Get Referral Info

Get user's referral code and statistics.

**Endpoint:** `GET /api/user/referrals/info`

**Headers:**
```
Authorization: Bearer <token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "referralCode": "REF789012",
    "totalEarnings": 50,
    "totalReferrals": 5,
    "completedReferrals": 3,
    "pendingReferrals": 2,
    "stats": [
      {
        "_id": "completed",
        "count": 3,
        "totalEarnings": 50
      },
      {
        "_id": "pending",
        "count": 2,
        "totalEarnings": 0
      }
    ]
  }
}
```

---

### 2. Get Referral List

Get list of users referred by current user.

**Endpoint:** `GET /api/user/referrals/list`

**Headers:**
```
Authorization: Bearer <token>
```

**Query Parameters:**
```
page: 1 (optional)
limit: 20 (optional)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k7",
      "ReferredUser": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k9",
        "Name": "Jane Smith",
        "Email": "jane@example.com",
        "createdAt": "2024-01-10T10:00:00.000Z"
      },
      "ReferralCode": "REF789012",
      "Earnings": 20,
      "Status": "completed",
      "createdAt": "2024-01-10T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

---

## Error Responses

All endpoints may return these error responses:

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required. Please login."
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Access denied"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Resource not found"
}
```

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation error",
  "errors": ["Field is required"]
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Detailed error message"
}
```

---

## Notes

1. **Country Filtering**: Use `X-Country-Code` header to filter content based on user's country. Movies blocked in that country will not be returned.

2. **Watch History**: When authenticated, the movie detail endpoint includes watch history information showing where the user left off.

3. **Favorites**: When authenticated, the movie detail endpoint includes whether the movie is in user's favorites.

4. **Pagination**: Most list endpoints support pagination with `page` and `limit` query parameters.

5. **Token Expiration**: JWT tokens expire after 30 days by default. Users need to login again after expiration.

6. **Referral System**: Users can earn rewards when others sign up using their referral code. Earnings are tracked and can be viewed in referral info endpoint.

