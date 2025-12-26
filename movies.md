# Movies API Documentation

Complete API documentation for movie management, categories, and user interactions.

---

## 📋 Table of Contents

1. [Admin Movie APIs](#admin-movie-apis)
2. [Admin Category APIs](#admin-category-apis)
3. [Admin SubCategory APIs](#admin-subcategory-apis)
4. [Admin SubSubCategory APIs](#admin-subsubcategory-apis)
5. [Public Movie APIs](#public-movie-apis)
6. [User Movie APIs](#user-movie-apis)
7. [Comments & Likes APIs](#comments--likes-apis)

---

## 🔐 Authentication

All admin endpoints require authentication with admin role:

```
Authorization: Bearer <admin-token>
```

User endpoints require authentication:

```
Authorization: Bearer <user-token>
```

---

## 🎬 Admin Movie APIs

### 1. Create Movie and Queue Files for Background Upload (RECOMMENDED)

Create a new movie and queue all files for background upload. Movie data is saved immediately, and files are uploaded to S3 in the background via worker process.

**Endpoint:** `POST /api/admin/movies/queue-upload`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**

**Required Fields:**
```
Title: "The Amazing Movie"
Category: "65a1b2c3d4e5f6g7h8i9j0k3"
```

**Optional Fields:**
```
Description: "A thrilling adventure movie with amazing visuals"
SubCategory: "65a1b2c3d4e5f6g7h8i9j0k4"
SubSubCategory: "65a1b2c3d4e5f6g7h8i9j0k5"
Channel: "65a1b2c3d4e5f6g7h8i9j0k6" (Channel ID - required if assigning to a channel)
MetaTitle: "The Amazing Movie - Watch Online Free"
MetaDescription: "Watch The Amazing Movie online in HD quality"
MetaKeywords: ["action", "adventure", "thriller"] (JSON array as string)
Tags: ["action", "superhero", "2024"] (JSON array as string)
Genre: ["Action", "Adventure"] (JSON array as string)
Cast: ["65a1b2c3d4e5f6g7h8i9j0k8", "65a1b2c3d4e5f6g7h8i9j0k9"] (JSON array of Actor IDs as string, or comma-separated actor IDs)
Country: "United States" (Country name where the movie was produced)
Language: "English" (Primary language of the movie)
IsPremium: "true" (boolean as string - default: false)
sourceQuality: "1080p" (Quality of uploaded video - will auto-convert to lower qualities)
```

**File Uploads:**
```
thumbnail: <image file> (JPEG, PNG, WebP, GIF - Max 10MB)
poster: <image file> (JPEG, PNG, WebP, GIF - Max 10MB)
video: <video file> (MP4, WebM, QuickTime - Max 5GB per file)
  - Upload ONE high-quality video (1080p recommended)
  - System will AUTOMATICALLY CONVERT to lower qualities and upload them separately to S3
  - If you upload 1080p → Converts to 720p and 480p, uploads both to S3
  - If you upload 720p → Converts to 480p, uploads to S3
  - If you upload 480p → No conversion needed
  - Conversion happens automatically in background after original upload completes
  - All quality versions are stored in the movie's Videos array
subtitle: <subtitle file> (SRT, VTT - Max 10MB)
  - Can upload multiple subtitles for different languages
  - Use subtitleLanguages[] and subtitleLanguageCodes[] arrays
  - Example: subtitleLanguages[0]="English", subtitleLanguageCodes[0]="en"
```

**Auto-Conversion Logic:**
- Upload 1080p → Automatically converts to 720p and 480p, then uploads both converted videos to S3 separately
- Upload 720p → Automatically converts to 480p, then uploads converted video to S3
- Upload 480p → No conversion needed

**Important:** 
- **Aspect ratio is preserved** - The original video's aspect ratio is maintained during conversion. Only the resolution is reduced, not the aspect ratio.
- Video conversion happens automatically in the background after the original video is uploaded to S3.
- The converted videos are processed using FFmpeg and uploaded to S3 as separate files.
- All quality versions are added to the movie's Videos array.
- Conversion time depends on video length and server resources.

**Example cURL Request:**
```bash
curl -X POST http://localhost:3000/api/admin/movies/queue-upload \
  -H "Authorization: Bearer <admin-token>" \
  -F "Title=The Amazing Movie" \
  -F "Description=A thrilling adventure movie with amazing visuals" \
  -F "Category=65a1b2c3d4e5f6g7h8i9j0k3" \
  -F "SubCategory=65a1b2c3d4e5f6g7h8i9j0k4" \
  -F "SubSubCategory=65a1b2c3d4e5f6g7h8i9j0k5" \
  -F "Channel=65a1b2c3d4e5f6g7h8i9j0k6" \
  -F "Cast=[\"65a1b2c3d4e5f6g7h8i9j0k8\", \"65a1b2c3d4e5f6g7h8i9j0k9\"]" \
  -F "Tags=[\"action\", \"superhero\", \"2024\"]" \
  -F "MetaKeywords=[\"action\", \"adventure\"]" \
  -F "Country=United States" \
  -F "Language=English" \
  -F "IsPremium=false" \
  -F "sourceQuality=1080p" \
  -F "thumbnail=@/path/to/thumbnail.jpg" \
  -F "poster=@/path/to/poster.jpg" \
  -F "video=@/path/to/video1080p.mp4"
```

**Example JavaScript/Fetch with Progress Tracking:**
```javascript
// Step 1: Create movie and queue uploads
const formData = new FormData();
formData.append('Title', 'The Amazing Movie');
formData.append('Category', '65a1b2c3d4e5f6g7h8i9j0k3');
formData.append('Channel', '65a1b2c3d4e5f6g7h8i9j0k6'); // Channel ID (optional but recommended)
formData.append('Country', 'United States'); // Country name
formData.append('Language', 'English'); // Primary language
formData.append('video', videoFile);
formData.append('thumbnail', thumbnailFile);
formData.append('poster', posterFile);

const response = await fetch('http://localhost:3000/api/admin/movies/queue-upload', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <admin-token>'
  },
  body: formData
});

const result = await response.json();
const movieId = result.data.movie._id;

// Step 2: Poll for upload progress
const progressInterval = setInterval(async () => {
  const progressRes = await fetch(
    `http://localhost:3000/api/admin/movies/${movieId}/upload-progress`,
    {
      headers: { 'Authorization': 'Bearer <admin-token>' }
    }
  );
  const progressData = await progressRes.json();
  
  console.log(`Overall Progress: ${progressData.data.overallProgress}%`);
  console.log(`Status: ${progressData.data.status}`);
  
  // Show individual file progress
  progressData.data.jobs.forEach(job => {
    const percent = job.progress;
    const uploadedMB = (job.uploadedSize / (1024 * 1024)).toFixed(2);
    const totalMB = (job.totalSize / (1024 * 1024)).toFixed(2);
    console.log(`${job.fileType}: ${percent}% (${uploadedMB}MB / ${totalMB}MB)`);
  });
  
  // Stop polling when complete
  if (progressData.data.status === 'completed') {
    clearInterval(progressInterval);
    console.log('✅ All uploads completed!');
  } else if (progressData.data.status === 'failed') {
    clearInterval(progressInterval);
    console.log('❌ Some uploads failed. Check failed jobs.');
  }
}, 2000); // Poll every 2 seconds
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Movie created and files queued for upload",
  "data": {
    "movie": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
      "Title": "The Amazing Movie",
      "Slug": "the-amazing-movie"
    },
    "queuedJobs": 3,
    "jobs": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k11",
        "fileType": "thumbnail",
        "fileName": "thumbnail.jpg",
        "status": "pending"
      },
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k12",
        "fileType": "poster",
        "fileName": "poster.jpg",
        "status": "pending"
      },
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k13",
        "fileType": "video",
        "fileName": "video1080p.mp4",
        "status": "pending"
      }
    ]
  }
}
```

**Note:** Files are queued for background upload. Use the progress endpoint to track upload status.

---

### 2. Get Upload Progress by Movie ID

Track the progress of all file uploads for a specific movie. Returns overall progress percentage and individual file status.

**Endpoint:** `GET /api/admin/movies/:id/upload-progress`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "movieId": "65a1b2c3d4e5f6g7h8i9j0k6",
    "overallProgress": 65,
    "status": "processing",
    "totalJobs": 3,
    "completedJobs": 1,
    "failedJobs": 0,
    "jobs": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k11",
        "fileType": "thumbnail",
        "fileName": "thumbnail.jpg",
        "progress": 100,
        "status": "completed",
        "uploadedSize": 1048576,
        "totalSize": 1048576,
        "s3Url": "https://bucket.s3.region.amazonaws.com/thumbnails/thumbnail.jpg"
      },
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k12",
        "fileType": "poster",
        "fileName": "poster.jpg",
        "progress": 100,
        "status": "completed",
        "uploadedSize": 2097152,
        "totalSize": 2097152,
        "s3Url": "https://bucket.s3.region.amazonaws.com/thumbnails/poster.jpg"
      },
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k13",
        "fileType": "video",
        "fileName": "video1080p.mp4",
        "progress": 45,
        "status": "processing",
        "uploadedSize": 2147483648,
        "totalSize": 4767483648,
        "s3Url": null
      }
    ]
  }
}
```

**Status Values:**
- `pending` - Job queued, waiting to be processed
- `processing` - Currently uploading to S3
- `completed` - Upload complete, file URL available
- `failed` - Upload failed (can be retried)
- `no-jobs` - No upload jobs found for this movie

**Progress Calculation:**
- `overallProgress`: Average of all file upload progress percentages
- `uploadedSize`: Bytes uploaded so far
- `totalSize`: Total file size in bytes
- `progress`: Percentage (0-100) for individual file

---

### 3. Retry Failed Upload Job

Retry a failed upload job.

**Endpoint:** `POST /api/admin/movies/upload-jobs/:jobId/retry`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Job queued for retry",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k13",
    "status": "pending",
    "fileType": "video",
    "fileName": "video1080p.mp4"
  }
}
```

---

### 4. Create Movie with Immediate Upload (LEGACY)

Create a new movie with immediate file upload (blocks until upload completes). Use `/queue-upload` endpoint instead for better performance.

**Endpoint:** `POST /api/admin/movies/upload`

**Note:** This endpoint uploads files immediately. For large files, use `/queue-upload` instead.

---

### 5. Get Upload Progress by Upload ID (LEGACY)

Track the progress of movie upload using upload ID (for immediate upload endpoint).

**Endpoint:** `GET /api/admin/movies/upload-progress/:uploadId`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "uploadId": "upload-1234567890-abcdef12",
    "overallProgress": 75,
    "status": "processing",
    "files": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k7",
        "UploadId": "upload-1234567890-abcdef12-thumbnail",
        "FileName": "thumbnail.jpg",
        "FileType": "thumbnail",
        "TotalSize": 1048576,
        "UploadedSize": 1048576,
        "Progress": 100,
        "Status": "completed",
        "S3Url": "https://bucket.s3.region.amazonaws.com/thumbnails/thumbnail.jpg"
      }
    ]
  }
}
```

---

### 6. Get All Movies

Retrieve all movies with filtering and pagination.

**Endpoint:** `GET /api/admin/movies`

**Query Parameters:**
```
status: "active" (optional)
category: "<category-id>" (optional)
subCategory: "<subcategory-id>" (optional)
subSubCategory: "<subsubcategory-id>" (optional)
isTrending: "true" (optional)
isFeatured: "true" (optional)
isPremium: "true" (optional)
search: "movie title" (optional)
page: 1 (optional)
limit: 20 (optional)
sortBy: "createdAt" (optional) - Options: createdAt, Views, Likes, Rating
sortOrder: "desc" (optional)
```

**Example Request:**
```
GET /api/admin/movies?status=active&isTrending=true&page=1&limit=20
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
      "Thumbnail": "https://bucket.s3.region.amazonaws.com/thumbnails/thumb.jpg",
      "Status": "active",
      "IsTrending": true,
      "IsFeatured": false,
      "IsPremium": false,
      "Views": 15000,
      "Likes": 500,
      "Comments": 120,
      "Rating": 4.5,
      "Tags": ["action", "superhero"],
      "Country": "United States",
      "Language": "English",
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
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

### 7. Get Movie by ID

Retrieve a specific movie by its ID. Returns complete movie details including populated Category, SubCategory, SubSubCategory, Channel (with Logo), and CreatedBy information.

**Endpoint:** `GET /api/admin/movies/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | **Yes** | Movie ID |

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/admin/movies/65a1b2c3d4e5f6g7h8i9j0k6" \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
    "Title": "The Amazing Movie",
    "Slug": "the-amazing-movie",
    "Description": "A thrilling adventure movie",
    "Thumbnail": "https://bucket.s3.region.amazonaws.com/thumbnails/thumb.jpg",
    "Poster": "https://bucket.s3.region.amazonaws.com/thumbnails/poster.jpg",
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
    "IsPremium": false,
    "Tags": ["action", "superhero", "2024"],
    "Genre": ["Action", "Adventure"],
    "Country": "United States",
    "Language": "English",
    "Views": 15000,
    "Likes": 500,
    "Comments": 120,
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
      "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
      "Name": "HBO",
      "Slug": "hbo",
      "Logo": "https://bucket.s3.region.amazonaws.com/thumbnails/hbo-logo.jpg",
      "Description": "Premium entertainment channel",
      "IsActive": true
    },
    "Cast": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k8",
        "Name": "Tom Hanks",
        "Slug": "tom-hanks",
        "Image": "https://bucket.s3.region.amazonaws.com/thumbnails/tom-hanks.jpg",
        "Description": "Academy Award-winning actor",
        "DateOfBirth": "1956-07-09T00:00:00.000Z",
        "Nationality": "American"
      },
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k9",
        "Name": "Meryl Streep",
        "Slug": "meryl-streep",
        "Image": "https://bucket.s3.region.amazonaws.com/thumbnails/meryl-streep.jpg",
        "Description": "Academy Award-winning actress",
        "DateOfBirth": "1949-06-22T00:00:00.000Z",
        "Nationality": "American"
      }
    ],
    "CreatedBy": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k7",
      "Name": "Admin User",
      "Email": "admin@example.com"
    },
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 8. Update Movie

Update an existing movie.

**Endpoint:** `PUT /api/admin/movies/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

**Request Body:** Same as create movie, all fields optional.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Movie updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
    "Title": "Updated Movie Title",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### 9. Delete Movie

Delete a movie permanently.

**Endpoint:** `DELETE /api/admin/movies/:id`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Movie deleted successfully"
}
```

---

### 10. Get Movie Statistics

Get comprehensive statistics for a movie.

**Endpoint:** `GET /api/admin/movies/:id/statistics`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "movie": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
      "Title": "The Amazing Movie",
      "Slug": "the-amazing-movie"
    },
    "statistics": {
      "views": 15000,
      "likes": 500,
      "comments": 120,
      "averageRating": 4.5,
      "topComments": [
        {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k10",
          "Comment": "Great movie! Best of the year!",
          "Likes": 150,
          "User": {
            "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
            "Name": "John Doe",
            "Email": "john@example.com"
          },
          "createdAt": "2024-01-15T10:30:00.000Z"
        }
      ]
    }
  }
}
```

---

### 11. Get Movie Comments (Admin View)

Get all comments for a movie.

**Endpoint:** `GET /api/admin/movies/:id/comments`

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
      "Comment": "Great movie! Loved it.",
      "Likes": 25,
      "User": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "Name": "John Doe",
        "Email": "john@example.com"
      },
      "Replies": [],
      "IsActive": true,
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

### 12. Toggle Trending

Mark/unmark a movie as trending.

**Endpoint:** `PATCH /api/admin/movies/:id/toggle-trending`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Movie marked as trending",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
    "IsTrending": true
  }
}
```

---

### 13. Toggle Featured

Mark/unmark a movie as featured.

**Endpoint:** `PATCH /api/admin/movies/:id/toggle-featured`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Movie marked as featured",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
    "IsFeatured": true
  }
}
```

---

## 📁 Admin Category APIs

### 1. Create Category

Create a new category.

**Endpoint:** `POST /api/admin/categories`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Name": "Action",
  "Description": "Action movies category",
  "SortOrder": 1
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "Name": "Action",
    "Slug": "action",
    "Description": "Action movies category",
    "IsActive": true,
    "SortOrder": 1,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Get All Categories

Retrieve all categories.

**Endpoint:** `GET /api/admin/categories`

**Query Parameters:**
```
isActive: "true" (optional)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "Name": "Action",
      "Slug": "action",
      "Description": "Action movies category",
      "IsActive": true,
      "SortOrder": 1,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 3. Get Category by ID

Retrieve a specific category by ID.

**Endpoint:** `GET /api/admin/categories/:id`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "Name": "Action",
    "Slug": "action",
    "Description": "Action movies category",
    "IsActive": true,
    "SortOrder": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 4. Update Category

Update an existing category.

**Endpoint:** `PUT /api/admin/categories/:id`

**Request Body:**
```json
{
  "Name": "Updated Action",
  "Description": "Updated description"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "Name": "Updated Action",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### 5. Delete Category

Delete a category permanently.

**Endpoint:** `DELETE /api/admin/categories/:id`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

---

## 📂 Admin SubCategory APIs

### 1. Create SubCategory

Create a new subcategory under a specific category.

**Endpoint:** `POST /api/admin/subcategories`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Name": "Superhero",
  "Category": "65a1b2c3d4e5f6g7h8i9j0k3",
  "Description": "Superhero movies subcategory",
  "SortOrder": 1
}
```

**Required Fields:**
- `Name` (string) - SubCategory name
- `Category` (ObjectId) - Parent category ID

**Optional Fields:**
- `Description` (string) - SubCategory description
- `SortOrder` (number) - Display order (default: 0)
- `IsActive` (boolean) - Active status (default: true)

**Success Response (201):**
```json
{
  "success": true,
  "message": "SubCategory created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
    "Name": "Superhero",
    "Slug": "superhero",
    "Category": "65a1b2c3d4e5f6g7h8i9j0k3",
    "Description": "Superhero movies subcategory",
    "IsActive": true,
    "SortOrder": 1,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Get All SubCategories

Retrieve all subcategories with optional filtering.

**Endpoint:** `GET /api/admin/subcategories`

**Query Parameters:**
```
category: "<category-id>" (optional) - Filter by parent category
isActive: "true" (optional) - Filter by active status
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
      "Category": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
        "Name": "Action",
        "Slug": "action"
      },
      "Description": "Superhero movies subcategory",
      "IsActive": true,
      "SortOrder": 1,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

---

### 3. Get SubCategory by ID

Retrieve a specific subcategory by its ID.

**Endpoint:** `GET /api/admin/subcategories/:id`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
    "Name": "Superhero",
    "Slug": "superhero",
    "Category": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "Name": "Action",
      "Slug": "action"
    },
    "Description": "Superhero movies subcategory",
    "IsActive": true,
    "SortOrder": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 4. Update SubCategory

Update an existing subcategory.

**Endpoint:** `PUT /api/admin/subcategories/:id`

**Request Body:**
```json
{
  "Name": "Updated Superhero",
  "Description": "Updated description",
  "SortOrder": 2
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "SubCategory updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
    "Name": "Updated Superhero",
    "Slug": "updated-superhero",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### 5. Delete SubCategory

Delete a subcategory permanently.

**Endpoint:** `DELETE /api/admin/subcategories/:id`

**Success Response (200):**
```json
{
  "success": true,
  "message": "SubCategory deleted successfully"
}
```

---

## 📂 Admin SubSubCategory APIs

### 1. Create SubSubCategory

Create a new sub-subcategory under a subcategory.

**Endpoint:** `POST /api/admin/subsubcategories`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Name": "Marvel",
  "SubCategory": "65a1b2c3d4e5f6g7h8i9j0k4",
  "Description": "Marvel superhero movies",
  "SortOrder": 1
}
```

**Required Fields:**
- `Name` (string) - SubSubCategory name
- `SubCategory` (ObjectId) - Parent subcategory ID

**Success Response (201):**
```json
{
  "success": true,
  "message": "SubSubCategory created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
    "Name": "Marvel",
    "Slug": "marvel",
    "SubCategory": "65a1b2c3d4e5f6g7h8i9j0k4",
    "Description": "Marvel superhero movies",
    "IsActive": true,
    "SortOrder": 1,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Get All SubSubCategories

**Endpoint:** `GET /api/admin/subsubcategories`

**Query Parameters:**
```
subCategory: "<subcategory-id>" (optional) - Filter by parent subcategory
isActive: "true" (optional)
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
      "Name": "Marvel",
      "Slug": "marvel",
      "SubCategory": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
        "Name": "Superhero",
        "Slug": "superhero"
      },
      "IsActive": true,
      "SortOrder": 1
    }
  ]
}
```

---

### 3. Get SubSubCategory by ID

**Endpoint:** `GET /api/admin/subsubcategories/:id`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
    "Name": "Marvel",
    "Slug": "marvel",
    "SubCategory": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
      "Name": "Superhero",
      "Slug": "superhero"
    },
    "Description": "Marvel superhero movies",
    "IsActive": true,
    "SortOrder": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 4. Update SubSubCategory

**Endpoint:** `PUT /api/admin/subsubcategories/:id`

**Success Response (200):**
```json
{
  "success": true,
  "message": "SubSubCategory updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
    "Name": "Updated Marvel",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### 5. Delete SubSubCategory

**Endpoint:** `DELETE /api/admin/subsubcategories/:id`

**Success Response (200):**
```json
{
  "success": true,
  "message": "SubSubCategory deleted successfully"
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
      "SubSubCategory": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
        "Name": "Marvel",
        "Slug": "marvel"
      },
      "Views": 15000,
      "Likes": 500,
      "Rating": 4.5,
      "IsPremium": false,
      "Tags": ["action", "superhero"],
      "Genre": ["Action", "Adventure"],
      "Country": "United States",
      "Language": "English",
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

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
      "Title": "The Amazing Movie",
      "Slug": "the-amazing-movie",
      "Thumbnail": "https://bucket.s3.region.amazonaws.com/thumbnails/thumb.jpg",
      "Views": 15000,
      "Likes": 500,
      "Rating": 4.5
    }
  ]
}
```

---

### 3. Get Movies by Category

Get movies filtered by category.

**Endpoint:** `GET /api/movies/category/:categorySlug`

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
      "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
      "Title": "The Amazing Movie",
      "Slug": "the-amazing-movie",
      "Thumbnail": "https://bucket.s3.region.amazonaws.com/thumbnails/thumb.jpg",
      "Views": 15000,
      "Likes": 500,
      "Rating": 4.5
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

### 4. Search Movies

Search movies by title, description, or tags.

**Endpoint:** `GET /api/movies/search`

**Query Parameters:**
```
q: "action" (required) - Search query
page: 1 (optional)
limit: 20 (optional)
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

---

### 5. Get Movie by Slug

Get detailed movie information by slug.

**Endpoint:** `GET /api/movies/:slug`

**Headers (Optional):**
```
Authorization: Bearer <token> - For watch history and favorites
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
    "Views": 15000,
    "Likes": 500,
    "Comments": 120,
    "Rating": 4.5,
    "IsPremium": false,
    "Tags": ["action", "superhero", "2024"],
    "Genre": ["Action", "Adventure"],
    "Country": "United States",
    "Language": "English",
    "Cast": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k8",
        "Name": "Tom Hanks",
        "Image": "https://bucket.s3.region.amazonaws.com/thumbnails/tom-hanks.jpg"
      }
    ],
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
        "Comment": "Amazing movie! Best of the year!",
        "Likes": 150,
        "User": {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
          "Name": "John Doe",
          "ProfilePicture": "https://example.com/profile.jpg"
        },
        "Replies": [
          {
            "Comment": "I agree!",
            "Likes": 25,
            "User": {
              "Name": "Jane Smith"
            }
          }
        ],
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 👤 User Movie APIs

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

## 💬 Comments & Likes APIs

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

## 📝 Notes

### Category Hierarchy
- **Category** → Top level (e.g., "Action")
- **SubCategory** → Second level (e.g., "Superhero" under "Action")
- **SubSubCategory** → Third level (e.g., "Marvel" under "Superhero")

### Video Quality Auto-Conversion
- Upload 1080p → Automatically converts to 720p and 480p, then uploads both converted videos to S3 separately
- Upload 720p → Automatically converts to 480p, then uploads converted video to S3
- Upload 480p → No conversion needed

**Technical Details:**
- Uses FFmpeg for video conversion (requires FFmpeg to be installed on the server)
- Conversion happens automatically after original video upload completes
- Each converted quality is uploaded to S3 as a separate file
- All quality versions are added to the movie's Videos array
- **Aspect ratio is preserved** - Original video aspect ratio is maintained during conversion
- Conversion settings (max dimensions, actual dimensions maintain aspect ratio):
  - 480p: Max 854x480, 1 Mbps bitrate
  - 720p: Max 1280x720, 2.5 Mbps bitrate
  - 1080p: Max 1920x1080, 5 Mbps bitrate

### Background Upload System (Queue-Based)

The system supports queue-based background uploads for better performance and scalability:

**How It Works:**
1. **Movie Creation**: Movie data is saved to database immediately
2. **File Queuing**: All files (thumbnail, poster, video, subtitles) are queued for upload
3. **Background Processing**: Worker process picks up jobs and uploads to S3
4. **Progress Tracking**: Real-time progress updates stored in database
5. **Auto-Update**: Movie record automatically updated with file URLs when upload completes

**Worker Configuration:**

Enable the upload worker in `.env`:
```env
ENABLE_UPLOAD_WORKER=true
UPLOAD_WORKER_INTERVAL=5000  # Check every 5 seconds (optional)
```

Or run worker separately:
```bash
npm run worker
```

**Progress Tracking:**

Poll the progress endpoint to get real-time updates:
```
GET /api/admin/movies/:movieId/upload-progress
```

The response includes:
- **Overall progress percentage** - Average of all file uploads
- **Individual file progress** - Progress for each file (thumbnail, poster, video, subtitles)
- **Upload status** - pending, processing, completed, failed
- **Uploaded size vs total size** - Bytes uploaded for each file
- **S3 URLs** - Available when upload completes

**Benefits:**
- ✅ Fast API response - Movie created immediately
- ✅ Non-blocking - Large files don't block the API
- ✅ Scalable - Can run multiple workers
- ✅ Reliable - Jobs stored in database, can retry on failure
- ✅ Real-time progress - Track upload percentage for each file

### Background Upload System

The queue-based upload system processes files in the background:

1. **Movie Creation**: Movie data is saved to database immediately
2. **File Queuing**: All files (thumbnail, poster, video, subtitles) are queued for upload
3. **Background Processing**: Worker process picks up jobs and uploads to S3
4. **Progress Tracking**: Real-time progress updates stored in database
5. **Auto-Update**: Movie record automatically updated with file URLs when upload completes

**Worker Configuration:**

Enable the upload worker in `.env`:
```env
ENABLE_UPLOAD_WORKER=true
UPLOAD_WORKER_INTERVAL=5000  # Check every 5 seconds (optional)
```

Or run worker separately:
```bash
npm run worker
```

**Progress Tracking:**

Poll the progress endpoint to get real-time updates:
```
GET /api/admin/movies/:movieId/upload-progress
```

The response includes:
- Overall progress percentage
- Individual file progress
- Upload status (pending, processing, completed, failed)
- Uploaded size vs total size for each file

### Premium Movies
- Movies marked as `IsPremium: true` may require subscription or payment
- Check user subscription status before allowing access


---

## 🔒 Error Responses

All endpoints may return these common error responses:

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Unauthorized. Please provide a valid token."
}
```

**403 Forbidden:**
```json
{
  "success": false,
  "message": "Forbidden. Admin access required."
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
  "error": "Detailed error message"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details"
}
```

---

## 📚 Related Documentation

- [Admin API Documentation](./admin-api.md) - Complete admin API reference
- [User API Documentation](./user-api.md) - Complete user API reference
- [API Documentation](./API_DOCUMENTATION.md) - General API overview

