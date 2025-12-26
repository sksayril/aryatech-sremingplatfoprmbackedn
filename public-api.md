# Public Users API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

Most endpoints are public and do not require authentication. Some endpoints support optional authentication for personalized features (watch history, favorites).

For optional authentication, include the JWT token in the Authorization header:
```
Authorization: Bearer <user-jwt-token>
```

---

## 📋 Table of Contents

1. [Categories APIs](#categories-apis)
2. [Subcategories APIs](#subcategories-apis)
3. [Videos/Movies APIs](#videosmovies-apis)
4. [Search APIs](#search-apis)
5. [Trending & New Videos](#trending--new-videos)
6. [Similar Videos](#similar-videos)

---

## 📁 Categories APIs

### 1. Get All Main Categories

Get list of all active main categories.

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
      "SortOrder": 1,
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
      "Name": "Comedy",
      "Slug": "comedy",
      "Description": "Comedy movies",
      "Image": "https://bucket.s3.region.amazonaws.com/thumbnails/comedy.jpg",
      "IsActive": true,
      "SortOrder": 2,
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### 2. Get All Videos Under Main Category

Get all videos/movies under a specific main category with pagination.

**Endpoint:** `GET /api/movies/category/:slug/videos`

**Path Parameters:**
- `slug` (required) - Category slug (e.g., "action", "comedy")

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 30)

**Headers (Optional):**
```
X-Country-Code: US - User's country code for content filtering
```

**Example Request:**
```
GET /api/movies/category/action/videos?page=1&limit=30
X-Country-Code: US
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
      "Title": "Action Movie 1",
      "Slug": "action-movie-1",
      "Description": "A thrilling action movie",
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
      "Year": 2024,
      "Genre": ["Action", "Adventure"],
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 30,
    "total": 150,
    "pages": 5
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

### 3. Get Movies by Category

Get movies filtered by category with pagination.

**Endpoint:** `GET /api/movies/category/:slug`

**Path Parameters:**
- `slug` (required) - Category slug

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 30)

**Headers (Optional):**
```
X-Country-Code: US
```

**Example Request:**
```
GET /api/movies/category/action?page=1&limit=30
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
      "Likes": 450,
      "Rating": 4.2,
      "Category": {
        "Name": "Action",
        "Slug": "action"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 30,
    "total": 50,
    "pages": 2
  }
}
```

---

## 📂 Subcategories APIs

### 1. Get All Subcategories

Get list of all active subcategories. Optionally filter by category.

**Endpoint:** `GET /api/movies/subcategories`

**Query Parameters:**
- `categorySlug` (optional) - Filter by category slug

**Example Request:**
```
GET /api/movies/subcategories?categorySlug=action
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
      "Name": "Superhero",
      "Slug": "superhero",
      "Description": "Superhero movies",
      "Category": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
        "Name": "Action",
        "Slug": "action"
      },
      "IsActive": true,
      "SortOrder": 1,
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

### 2. Get Subcategories with First Video Info

Get subcategories under a category with the first video's thumbnail, title, and likes.

**Endpoint:** `GET /api/movies/categories/:categorySlug/subcategories`

**Path Parameters:**
- `categorySlug` (required) - Category slug

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 30)

**Headers (Optional):**
```
X-Country-Code: US
```

**Example Request:**
```
GET /api/movies/categories/action/subcategories
X-Country-Code: US
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
      "Name": "Superhero",
      "Slug": "superhero",
      "Description": "Superhero movies",
      "firstVideo": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
        "title": "The Amazing Movie",
        "thumbnail": "https://bucket.s3.region.amazonaws.com/thumbnails/thumb.jpg",
        "likes": 500,
        "hasVideo": true
      }
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
      "Name": "Martial Arts",
      "Slug": "martial-arts",
      "Description": "Martial arts movies",
      "firstVideo": null
    }
  ]
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

### 3. Get Videos by Subcategory

Get videos/movies under a specific subcategory with first video thumbnail, title, and likes. Includes pagination.

**Endpoint:** `GET /api/movies/subcategory/:slug`

**Path Parameters:**
- `slug` (required) - Subcategory slug

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 30)

**Headers (Optional):**
```
X-Country-Code: US
```

**Example Request:**
```
GET /api/movies/subcategory/superhero?page=1&limit=30
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
      "Year": 2024,
      "Genre": ["Action", "Adventure"],
      "firstVideo": {
        "quality": "720p",
        "thumbnail": "https://bucket.s3.region.amazonaws.com/thumbnails/thumb.jpg",
        "duration": 7200
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 30,
    "total": 75,
    "pages": 3
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Subcategory not found"
}
```

---

## 🎬 Videos/Movies APIs

### 1. Get All Movies

Get all movies/videos with pagination. Returns all active movies regardless of category, subcategory, or other filters.

**Endpoint:** `GET /api/movies/all`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 30)

**Headers (Optional):**
```
X-Country-Code: US - User's country code for content filtering
```

**Example Request:**
```
GET /api/movies/all?page=1&limit=30
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
      "Videos": [
        {
          "Quality": "480p",
          "Url": "https://bucket.s3.region.amazonaws.com/movies/video480p.mp4",
          "Duration": 7200,
          "FileSize": 1073741824,
          "IsOriginal": false
        },
        {
          "Quality": "720p",
          "Url": "https://bucket.s3.region.amazonaws.com/movies/video720p.mp4",
          "Duration": 7200,
          "FileSize": 2147483648,
          "IsOriginal": false
        },
        {
          "Quality": "1080p",
          "Url": "https://bucket.s3.region.amazonaws.com/movies/video1080p.mp4",
          "Duration": 7200,
          "FileSize": 4294967296,
          "IsOriginal": true
        }
      ],
      "Views": 15000,
      "Likes": 500,
      "Rating": 4.5,
      "Year": 2024,
      "Genre": ["Action", "Adventure"],
      "IsPremium": false,
      "AgeRestriction": "PG-13",
      "Country": "United States",
      "Language": "English",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k7",
      "Title": "Comedy Movie",
      "Slug": "comedy-movie",
      "Description": "A hilarious comedy",
      "Thumbnail": "https://bucket.s3.region.amazonaws.com/thumbnails/comedy.jpg",
      "Category": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k8",
        "Name": "Comedy",
        "Slug": "comedy"
      },
      "Videos": [
        {
          "Quality": "480p",
          "Url": "https://bucket.s3.region.amazonaws.com/movies/comedy480p.mp4",
          "Duration": 5400,
          "FileSize": 805306368,
          "IsOriginal": false
        }
      ],
      "Views": 8000,
      "Likes": 300,
      "Rating": 4.2,
      "Year": 2024,
      "createdAt": "2024-01-14T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 30,
    "total": 500,
    "pages": 17
  }
}
```

---

### 2. Get Video by ID

Get detailed video/movie information by video ID.

**Endpoint:** `GET /api/movies/id/:id`

**Path Parameters:**
- `id` (required) - Movie/Video ID

**Headers (Optional):**
```
Authorization: Bearer <token> - For watch history and favorites
X-Country-Code: US
```

**Example Request:**
```
GET /api/movies/id/65a1b2c3d4e5f6g7h8i9j0k6
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
        "Quality": "480p",
        "Url": "https://bucket.s3.region.amazonaws.com/movies/video480p.mp4",
        "Duration": 7200,
        "FileSize": 1073741824
      },
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
    "SubSubCategory": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
      "Name": "Marvel",
      "Slug": "marvel"
    },
    "Channel": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
      "Name": "Movie Channel",
      "Slug": "movie-channel"
    },
    "Views": 15001,
    "Likes": 500,
    "Comments": 120,
    "Rating": 4.5,
    "AgeRestriction": "PG-13",
    "Year": 2024,
    "ReleaseDate": "2024-01-01T00:00:00.000Z",
    "Genre": ["Action", "Adventure", "Thriller"],
    "Cast": [],
    "Director": "Director Name",
    "Country": "United States",
    "Language": "English",
    "IsPremium": false,
    "Tags": ["action", "superhero"],
    "watchHistory": {
      "watchedDuration": 3600,
      "totalDuration": 7200,
      "lastWatchedAt": "2024-01-14T20:30:00.000Z",
      "isCompleted": false
    },
    "isFavorite": true,
    "isLiked": true,
    "topComments": [
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
        "Replies": [],
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
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

### 3. Get Video by Slug

Get detailed video/movie information by slug.

**Endpoint:** `GET /api/movies/:slug`

**Path Parameters:**
- `slug` (required) - Movie/Video slug

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
    "Videos": [
      {
        "Quality": "720p",
        "Url": "https://bucket.s3.region.amazonaws.com/movies/video720p.mp4",
        "Duration": 7200,
        "FileSize": 2147483648
      }
    ],
    "Category": {
      "Name": "Action",
      "Slug": "action"
    },
    "Views": 15001,
    "Likes": 500,
    "watchHistory": null,
    "isFavorite": false,
    "isLiked": false,
    "topComments": []
  }
}
```

---

## 🔍 Search APIs

### 1. Search Videos by Title

Search videos/movies by title, description, genre, or cast with pagination.

**Endpoint:** `GET /api/movies/search`

**Query Parameters:**
- `q` (required) - Search query
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 30)

**Headers (Optional):**
```
X-Country-Code: US
```

**Example Request:**
```
GET /api/movies/search?q=action&page=1&limit=30
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
      "Description": "An action-packed adventure",
      "Thumbnail": "https://bucket.s3.region.amazonaws.com/thumbnails/thumb.jpg",
      "Views": 8000,
      "Likes": 350,
      "Rating": 4.0,
      "Category": {
        "Name": "Action",
        "Slug": "action"
      },
      "SubCategory": {
        "Name": "Superhero",
        "Slug": "superhero"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 30,
    "total": 25,
    "pages": 1
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

## 🔥 Trending & New Videos

### 1. Get Top Trending Videos

Get list of top trending videos with pagination.

**Endpoint:** `GET /api/movies/trending`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 30)

**Headers (Optional):**
```
X-Country-Code: US
```

**Example Request:**
```
GET /api/movies/trending?page=1&limit=30
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
      "Year": 2024,
      "Genre": ["Action", "Adventure"],
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 30,
    "total": 100,
    "pages": 4
  }
}
```

---

### 2. Get New Videos

Get list of newly added videos with pagination.

**Endpoint:** `GET /api/movies/new`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 30)

**Headers (Optional):**
```
X-Country-Code: US
```

**Example Request:**
```
GET /api/movies/new?page=1&limit=30
X-Country-Code: US
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k7",
      "Title": "New Release Movie",
      "Slug": "new-release-movie",
      "Description": "A brand new movie release",
      "Thumbnail": "https://bucket.s3.region.amazonaws.com/thumbnails/thumb.jpg",
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
      "Views": 100,
      "Likes": 5,
      "Rating": 0,
      "Year": 2024,
      "createdAt": "2024-01-20T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 30,
    "total": 250,
    "pages": 9
  }
}
```

---

### 3. Get Featured Videos

Get list of featured videos with pagination.

**Endpoint:** `GET /api/movies/featured`

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 30)

**Headers (Optional):**
```
X-Country-Code: US
```

**Example Request:**
```
GET /api/movies/featured?page=1&limit=30
X-Country-Code: US
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k8",
      "Title": "Featured Movie",
      "Slug": "featured-movie",
      "Thumbnail": "https://bucket.s3.region.amazonaws.com/thumbnails/thumb.jpg",
      "Views": 20000,
      "Likes": 800,
      "Rating": 4.8,
      "Category": {
        "Name": "Action",
        "Slug": "action"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 30,
    "total": 50,
    "pages": 2
  }
}
```

---

## 🎯 Similar Videos

### 1. Get Similar Category Videos

Get videos from the same category as the specified video with pagination.

**Endpoint:** `GET /api/movies/similar/:id`

**Path Parameters:**
- `id` (required) - Movie/Video ID

**Query Parameters:**
- `page` (optional) - Page number (default: 1)
- `limit` (optional) - Items per page (default: 30)

**Headers (Optional):**
```
X-Country-Code: US
```

**Example Request:**
```
GET /api/movies/similar/65a1b2c3d4e5f6g7h8i9j0k6?page=1&limit=30
X-Country-Code: US
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k9",
      "Title": "Similar Action Movie",
      "Slug": "similar-action-movie",
      "Description": "Another great action movie",
      "Thumbnail": "https://bucket.s3.region.amazonaws.com/thumbnails/thumb.jpg",
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
      "Views": 12000,
      "Likes": 450,
      "Rating": 4.3,
      "Year": 2024,
      "createdAt": "2024-01-14T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 30,
    "total": 45,
    "pages": 2
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Movie not found"
}
```

---

## 📺 Channels APIs

### 1. Get All Channels

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
      "SortOrder": 1,
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

---

## 📄 Pagination

All list endpoints support pagination with the following query parameters:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 30, maximum: 100)

**Pagination Response Format:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 30,
    "total": 150,
    "pages": 5
  }
}
```

---

## ⚠️ Error Responses

All endpoints may return these error responses:

**400 Bad Request:**
```json
{
  "success": false,
  "message": "Validation error",
  "error": "Detailed error message"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Resource not found"
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

## 📝 Notes

1. **Country Filtering**: Use `X-Country-Code` header to filter content based on user's country. Videos blocked in that country will not be returned.

2. **Pagination**: All list endpoints support pagination with 30 items per page by default. You can customize this using the `limit` query parameter.

3. **Watch History**: When authenticated, the video detail endpoints include watch history information showing where the user left off.

4. **Favorites & Likes**: When authenticated, the video detail endpoints include whether the video is in user's favorites and if the user has liked it.

5. **Video URLs**: List endpoints exclude video URLs for performance. Use the detail endpoints (`/id/:id` or `/:slug`) to get full video information.

6. **First Video Info**: Subcategory endpoints include first video thumbnail, title, and likes for quick preview.

7. **Similar Videos**: Similar videos are based on the same category as the requested video.

8. **Search**: Search functionality searches across title, description, genre, and cast fields.

---

## 🔗 Quick Reference

| Endpoint | Method | Description | Pagination |
|----------|--------|-------------|------------|
| `/api/movies/all` | GET | Get all movies | Yes (30/page) |
| `/api/movies/categories` | GET | Get all main categories | No |
| `/api/movies/category/:slug/videos` | GET | Get all videos under category | Yes (30/page) |
| `/api/movies/category/:slug` | GET | Get movies by category | Yes (30/page) |
| `/api/movies/subcategories` | GET | Get all subcategories | No |
| `/api/movies/categories/:categorySlug/subcategories` | GET | Get subcategories with first video | No |
| `/api/movies/subcategory/:slug` | GET | Get videos by subcategory | Yes (30/page) |
| `/api/movies/id/:id` | GET | Get video by ID | No |
| `/api/movies/:slug` | GET | Get video by slug | No |
| `/api/movies/search` | GET | Search videos by title | Yes (30/page) |
| `/api/movies/trending` | GET | Get trending videos | Yes (30/page) |
| `/api/movies/new` | GET | Get new videos | Yes (30/page) |
| `/api/movies/featured` | GET | Get featured videos | Yes (30/page) |
| `/api/movies/similar/:id` | GET | Get similar videos | Yes (30/page) |
| `/api/movies/channels` | GET | Get all channels | No |

---

## 🚀 Example Usage

### Get Categories and Their Videos

```bash
# 1. Get all categories
GET /api/movies/categories

# 2. Get videos under a category
GET /api/movies/category/action/videos?page=1&limit=30

# 3. Get subcategories with first video info
GET /api/movies/categories/action/subcategories

# 4. Get videos by subcategory
GET /api/movies/subcategory/superhero?page=1&limit=30
```

### Search and Browse

```bash
# 1. Get all movies
GET /api/movies/all?page=1&limit=30

# 2. Search videos
GET /api/movies/search?q=action&page=1&limit=30

# 3. Get trending videos
GET /api/movies/trending?page=1&limit=30

# 4. Get new videos
GET /api/movies/new?page=1&limit=30
```

### Get Video Details

```bash
# 1. Get video by ID
GET /api/movies/id/65a1b2c3d4e5f6g7h8i9j0k6

# 2. Get video by slug
GET /api/movies/the-amazing-movie

# 3. Get similar videos
GET /api/movies/similar/65a1b2c3d4e5f6g7h8i9j0k6?page=1&limit=30
```

---

**Last Updated:** 2024-01-20
**API Version:** 1.0.0

