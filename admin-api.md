# Admin API Documentation
POST /api/admin/users/create-admin
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "Email": "admin@example.com",
  "Password": "Admin@123456",
  "Name": "New Admin"
}
## Base URL
```
http://localhost:3000/api/admin
```

## Authentication

All admin endpoints require authentication with admin role. Include the JWT token in the Authorization header:

```
Authorization: Bearer <admin-jwt-token>
```

### Admin Types

- **Main Admin** - Full access to all features, can create roles and sub-admins
  - Created by seed script (first admin is automatically main admin)
  - Can create, update, and delete roles
  - Can create, update, and delete sub-admins
  - Can view sub-admin passwords (stored in plain text)
- **Sub-Admin** - Limited access based on assigned roles and permissions
  - Created by main admin only
  - Access is restricted based on assigned roles
  - Passwords are stored in plain text (visible to main admin)
- **Regular Admin** - Standard admin access (created via admin panel, not main admin)

**Note:** The first admin created by the seed script is automatically set as the main admin (`IsMainAdmin: true`).

---

## 🔐 Admin Authentication APIs

### 1. Admin Login

Login as an admin user to get access token for admin endpoints.

**Endpoint:** `POST /api/auth/signin`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "Email": "admin@example.com",
  "Password": "Admin@123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "Email": "admin@example.com",
      "Name": "Super Admin",
      "Role": "admin",
      "ReferralCode": "REF123456",
      "ReferralEarnings": 0
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NWExYjJjM2Q0ZTVmNmc3aDhqOWowazIiLCJpYXQiOjE3MDUzMjE4MDAsImV4cCI6MTcwODkxMzgwMH0..."
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

**Error Response (403):**
```json
{
  "success": false,
  "message": "Account is deactivated"
}
```

**Note:** After successful login, use the `token` from the response in the `Authorization` header for all subsequent admin API requests.

**Example Usage:**
```bash
# Step 1: Login
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "Email": "admin@example.com",
    "Password": "Admin@123456"
  }'

# Step 2: Use the token from response
curl -X GET http://localhost:3000/api/admin/movies \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 2. Get Admin Profile

Get current admin user's profile information.

**Endpoint:** `GET /api/auth/profile`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "Email": "admin@example.com",
    "Name": "Super Admin",
    "Role": "admin",
    "ReferralCode": "REF123456",
    "ReferralEarnings": 0,
    "IsActive": true,
    "ProfilePicture": null,
    "LastLogin": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 3. Update Admin Profile

Update admin profile information.

**Endpoint:** `PUT /api/auth/profile`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Name": "Updated Admin Name",
  "ProfilePicture": "https://example.com/profile.jpg"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "Name": "Updated Admin Name",
    "ProfilePicture": "https://example.com/profile.jpg",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### 4. Change Admin Password

Change password for the current admin user.

**Endpoint:** `PUT /api/auth/change-password`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "currentPassword": "OldPassword123",
  "newPassword": "NewSecurePassword456"
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

## 🎯 Ads Management APIs

### 1. Create Ad

Create a new advertisement with media files.

**Endpoint:** `POST /api/admin/ads`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
Name: "Summer Sale Banner"
Type: "banner-top"
ClickUrl: "https://example.com/sale"
Title: "Summer Sale"
Description: "Get 50% off on all items"
Position: "top"
Width: 728
Height: 90
StartDate: "2024-01-01T00:00:00Z"
EndDate: "2024-12-31T23:59:59Z"
TargetCountries: ["US", "CA", "UK"]
Priority: 10
AdvertiserName: "Brand Name"
AdvertiserEmail: "advertiser@example.com"
image: <file> (optional)
video: <file> (optional)
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Ad created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "Name": "Summer Sale Banner",
    "Type": "banner-top",
    "ImageUrl": "https://bucket.s3.region.amazonaws.com/ads/1234567890-banner.jpg",
    "VideoUrl": null,
    "ClickUrl": "https://example.com/sale",
    "Position": "top",
    "Width": 728,
    "Height": 90,
    "IsActive": true,
    "StartDate": "2024-01-01T00:00:00.000Z",
    "EndDate": "2024-12-31T23:59:59.000Z",
    "TargetCountries": ["US", "CA", "UK"],
    "Priority": 10,
    "Impressions": 0,
    "Clicks": 0,
    "CreatedBy": "65a1b2c3d4e5f6g7h8i9j0k2",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Failed to create ad",
  "error": "Type is required"
}
```

---

### 2. Get All Ads

Retrieve all ads with filtering and pagination.

**Endpoint:** `GET /api/admin/ads`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
```
type: "banner-top" (optional) - Filter by ad type
isActive: "true" (optional) - Filter by active status
page: 1 (optional) - Page number
limit: 20 (optional) - Items per page
```

**Example Request:**
```
GET /api/admin/ads?type=banner-top&isActive=true&page=1&limit=20
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
      "ClickUrl": "https://example.com/sale",
      "IsActive": true,
      "Impressions": 1500,
      "Clicks": 45,
      "TargetCategories": [
        {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
          "Name": "Action",
          "Slug": "action"
        }
      ],
      "CreatedBy": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "Name": "Admin User",
        "Email": "admin@example.com"
      },
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

### 3. Get Ad by ID

Retrieve a specific ad by its ID.

**Endpoint:** `GET /api/admin/ads/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "Name": "Summer Sale Banner",
    "Type": "banner-top",
    "ImageUrl": "https://bucket.s3.region.amazonaws.com/ads/banner.jpg",
    "ClickUrl": "https://example.com/sale",
    "Position": "top",
    "Width": 728,
    "Height": 90,
    "IsActive": true,
    "StartDate": "2024-01-01T00:00:00.000Z",
    "EndDate": "2024-12-31T23:59:59.000Z",
    "TargetCategories": [],
    "TargetMovies": [],
    "TargetCountries": ["US", "CA", "UK"],
    "Priority": 10,
    "Impressions": 1500,
    "Clicks": 45,
    "AdvertiserName": "Brand Name",
    "AdvertiserEmail": "advertiser@example.com",
    "CreatedBy": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "Name": "Admin User",
      "Email": "admin@example.com"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Ad not found"
}
```

---

### 4. Update Ad

Update an existing ad.

**Endpoint:** `PUT /api/admin/ads/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
Name: "Updated Ad Name"
IsActive: false
image: <file> (optional)
video: <file> (optional)
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Ad updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "Name": "Updated Ad Name",
    "IsActive": false,
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### 5. Delete Ad

Delete an ad permanently.

**Endpoint:** `DELETE /api/admin/ads/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Ad deleted successfully"
}
```

---

### 6. Toggle Ad Status

Activate or deactivate an ad.

**Endpoint:** `PATCH /api/admin/ads/:id/toggle-status`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Ad activated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
    "IsActive": true
  }
}
```

---

### 7. Get Ad Analytics

Get analytics data for a specific ad.

**Endpoint:** `GET /api/admin/ads/analytics/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "impressions": 1500,
    "clicks": 45,
    "clickThroughRate": "3.00",
    "ad": {
      "id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "name": "Summer Sale Banner",
      "type": "banner-top"
    }
  }
}
```

---

## 🎬 Movie Management APIs

### 1. Create Movie with Upload Progress (Enhanced)

Create a new movie with automatic video conversion, upload progress tracking, and all metadata.

**Endpoint:** `POST /api/admin/movies/upload`

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
Description: "A thrilling adventure movie"
SubCategory: "65a1b2c3d4e5f6g7h8i9j0k4"
SubSubCategory: "65a1b2c3d4e5f6g7h8i9j0k5"
Channel: "65a1b2c3d4e5f6g7h8i9j0k6"
MetaTitle: "The Amazing Movie - Watch Online"
MetaDescription: "Watch The Amazing Movie online in HD quality"
MetaKeywords: ["action", "adventure", "thriller"] (JSON array as string)
Tags: ["action", "superhero", "2024"] (JSON array as string)
AgeRestriction: "PG-13" (G, PG, PG-13, R, NC-17)
Genre: ["Action", "Adventure"] (JSON array as string)
Cast: ["Actor One", "Actor Two"] (JSON array as string)
Director: "Director Name"
Year: 2024
ReleaseDate: "2024-01-01"
BlockedCountries: ["CN", "RU"] (JSON array as string)
TrailerUrl: "https://youtube.com/watch?v=trailer"
IsPremium: "true" (boolean as string - default: false)
sourceQuality: "1080p" (Quality of uploaded video - will auto-convert to lower qualities)
```

**File Uploads:**
```
thumbnail: <image file> (JPEG, PNG, WebP, GIF - Max 10MB)
poster: <image file> (JPEG, PNG, WebP, GIF - Max 10MB)
video: <video file> (MP4, WebM, QuickTime - Max 5GB per file)
  - Upload ONE high-quality video (1080p recommended)
  - System will AUTO-CONVERT to 480p and 720p
  - If you upload 720p, it will convert to 480p
  - If you upload 1080p, it will convert to 480p and 720p
  - Conversion happens in background after upload
subtitle: <subtitle file> (SRT, VTT - Max 10MB)
  - Can upload multiple subtitles for different languages
  - Use subtitleLanguages[] and subtitleLanguageCodes[] arrays
  - Example: subtitleLanguages[0]="English", subtitleLanguageCodes[0]="en"
```

**Auto-Conversion Logic:**
- Upload 1080p → Auto-converts to 720p and 480p
- Upload 720p → Auto-converts to 480p
- Upload 480p → No conversion needed

**Example cURL Request:**
```bash
curl -X POST http://localhost:3000/api/admin/movies/upload \
  -H "Authorization: Bearer <admin-token>" \
  -F "Title=The Amazing Movie" \
  -F "Description=A thrilling adventure movie with amazing visuals" \
  -F "Category=65a1b2c3d4e5f6g7h8i9j0k3" \
  -F "SubCategory=65a1b2c3d4e5f6g7h8i9j0k4" \
  -F "SubSubCategory=65a1b2c3d4e5f6g7h8i9j0k5" \
  -F "Channel=65a1b2c3d4e5f6g7h8i9j0k6" \
  -F "MetaTitle=The Amazing Movie - Watch Online Free" \
  -F "MetaDescription=Watch The Amazing Movie online in HD quality" \
  -F "MetaKeywords=[\"action\", \"adventure\", \"thriller\"]" \
  -F "Tags=[\"action\", \"superhero\", \"2024\", \"blockbuster\"]" \
  -F "AgeRestriction=PG-13" \
  -F "Year=2024" \
  -F "ReleaseDate=2024-01-01" \
  -F "Genre=[\"Action\", \"Adventure\", \"Thriller\"]" \
  -F "Cast=[\"Actor One\", \"Actor Two\", \"Actor Three\"]" \
  -F "Director=Director Name" \
  -F "TrailerUrl=https://youtube.com/watch?v=trailer" \
  -F "IsPremium=false" \
  -F "sourceQuality=1080p" \
  -F "thumbnail=@/path/to/thumbnail.jpg" \
  -F "poster=@/path/to/poster.jpg" \
  -F "video=@/path/to/video1080p.mp4" \
  -F "subtitle=@/path/to/english.srt" \
  -F "subtitleLanguages[0]=English" \
  -F "subtitleLanguageCodes[0]=en"
```

**Note:** When you upload a 1080p video, the system will automatically queue conversion jobs for 720p and 480p. The conversion happens in the background.

**Example JavaScript/FormData with Progress Tracking:**
```javascript
const formData = new FormData();
formData.append('Title', 'The Amazing Movie');
formData.append('Description', 'A thrilling adventure movie');
formData.append('Category', '65a1b2c3d4e5f6g7h8i9j0k3');
formData.append('SubCategory', '65a1b2c3d4e5f6g7h8i9j0k4');
formData.append('SubSubCategory', '65a1b2c3d4e5f6g7h8i9j0k5');
formData.append('Tags', JSON.stringify(['action', 'superhero', '2024']));
formData.append('MetaKeywords', JSON.stringify(['action', 'adventure']));
formData.append('IsPremium', 'false');
formData.append('sourceQuality', '1080p');
formData.append('thumbnail', thumbnailFile);
formData.append('poster', posterFile);
formData.append('video', video1080pFile); // Upload high quality, auto-converts

const xhr = new XMLHttpRequest();

// Track upload progress
xhr.upload.addEventListener('progress', (e) => {
  if (e.lengthComputable) {
    const percentComplete = (e.loaded / e.total) * 100;
    console.log(`Upload progress: ${percentComplete.toFixed(2)}%`);
    // Update your UI progress bar here
  }
});

xhr.addEventListener('load', () => {
  if (xhr.status === 201) {
    const response = JSON.parse(xhr.responseText);
    const uploadId = response.data.uploadId;
    
    // Poll for upload progress
    const progressInterval = setInterval(async () => {
      const progressRes = await fetch(
        `http://localhost:3000/api/admin/movies/upload-progress/${uploadId}`,
        {
          headers: { 'Authorization': 'Bearer <admin-token>' }
        }
      );
      const progressData = await progressRes.json();
      
      console.log(`Overall progress: ${progressData.data.overallProgress}%`);
      
      if (progressData.data.status === 'completed') {
        clearInterval(progressInterval);
        console.log('Upload completed!');
      }
    }, 2000); // Poll every 2 seconds
  }
});

xhr.open('POST', 'http://localhost:3000/api/admin/movies/upload');
xhr.setRequestHeader('Authorization', 'Bearer <admin-token>');
xhr.send(formData);
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Movie created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
    "Title": "The Amazing Movie",
    "Slug": "the-amazing-movie",
    "Description": "A thrilling adventure movie with amazing visuals",
    "Thumbnail": "https://bucket.s3.region.amazonaws.com/thumbnails/1234567890-thumb.jpg",
    "Poster": "https://bucket.s3.region.amazonaws.com/thumbnails/1234567890-poster.jpg",
    "Category": "65a1b2c3d4e5f6g7h8i9j0k3",
    "SubCategory": "65a1b2c3d4e5f6g7h8i9j0k4",
    "SubSubCategory": "65a1b2c3d4e5f6g7h8i9j0k5",
    "Channel": "65a1b2c3d4e5f6g7h8i9j0k6",
    "Status": "active",
    "IsTrending": false,
    "IsFeatured": false,
    "IsPremium": false,
    "Tags": ["action", "superhero", "2024", "blockbuster"],
    "MetaTitle": "The Amazing Movie - Watch Online Free",
    "MetaDescription": "Watch The Amazing Movie online in HD quality",
    "MetaKeywords": ["action", "adventure", "thriller"],
    "AgeRestriction": "PG-13",
    "BlockedCountries": ["CN", "RU"],
    "Views": 0,
    "Likes": 0,
    "Comments": 0,
    "Rating": 0,
    "Videos": [
      {
        "Quality": "1080p",
        "Url": "https://bucket.s3.region.amazonaws.com/movies/video1080p.mp4",
        "FileSize": 4294967296,
        "IsOriginal": true
      }
    ],
    "PendingQualities": ["480p", "720p"],
    "ConversionJobId": "job-1234567890",
    "Subtitles": [],
    "CreatedBy": "65a1b2c3d4e5f6g7h8i9j0k2",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "uploadId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Note:** The `uploadId` is returned for tracking upload progress. Use it with the upload progress endpoint.

---

### 2. Get All Movies

Retrieve all movies with filtering and pagination.

**Endpoint:** `GET /api/admin/movies`

**Query Parameters:**
```
status: "active" (optional)
category: "<category-id>" (optional)
isTrending: "true" (optional)
isFeatured: "true" (optional)
search: "movie title" (optional)
page: 1 (optional)
limit: 20 (optional)
sortBy: "createdAt" (optional)
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
      "Views": 15000,
      "Likes": 500,
      "Comments": 120,
      "Rating": 4.5,
      "IsPremium": false,
      "Tags": ["action", "superhero"],
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
      "CreatedBy": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "Name": "Admin User",
        "Email": "admin@example.com"
      },
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

---

### 3. Get Movie by ID

Retrieve a specific movie by its ID.

**Endpoint:** `GET /api/admin/movies/:id`

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
    "Views": 15000,
    "Likes": 500,
    "Comments": 120,
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
    "Status": "active",
    "Views": 15000,
    "Rating": 4.5
  }
}
```

---

### 4. Update Movie

Update an existing movie.

**Endpoint:** `PUT /api/admin/movies/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
Title: "Updated Movie Title"
Description: "Updated description"
thumbnail: <file> (optional)
poster: <file> (optional)
```

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

### 5. Delete Movie

Delete a movie permanently (also deletes associated files from S3).

**Endpoint:** `DELETE /api/admin/movies/:id`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Movie deleted successfully"
}
```

---

### 6. Upload Video Quality

Upload a video file for a specific quality.

**Endpoint:** `POST /api/admin/movies/:id/video`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
video: <file>
quality: "1080p"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Video uploaded",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
    "Videos": [
      {
        "Quality": "1080p",
        "Url": "https://bucket.s3.region.amazonaws.com/movies/video1080p.mp4",
        "FileSize": 4294967296
      }
    ]
  }
}
```

---

### 7. Upload Subtitle

Upload a subtitle file for an existing movie.

**Endpoint:** `POST /api/admin/movies/:id/subtitle`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
subtitle: <subtitle file> (Required)
  - Supported formats: SRT, VTT
  - Max file size: 10MB
language: "French" (Required)
  - Language name: English, Spanish, French, etc.
languageCode: "fr" (Required)
  - ISO 639-1 language code: en, es, fr, de, etc.
```

**Example cURL Request:**
```bash
curl -X POST http://localhost:3000/api/admin/movies/65a1b2c3d4e5f6g7h8i9j0k6/subtitle \
  -H "Authorization: Bearer <admin-token>" \
  -F "subtitle=@/path/to/french.srt" \
  -F "language=French" \
  -F "languageCode=fr"
```

**Example JavaScript/FormData:**
```javascript
const formData = new FormData();
formData.append('subtitle', subtitleFile);
formData.append('language', 'French');
formData.append('languageCode', 'fr');

fetch('http://localhost:3000/api/admin/movies/65a1b2c3d4e5f6g7h8i9j0k6/subtitle', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <admin-token>'
  },
  body: formData
});
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Subtitle uploaded",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
    "Title": "The Amazing Movie",
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
      },
      {
        "Language": "French",
        "LanguageCode": "fr",
        "Url": "https://bucket.s3.region.amazonaws.com/subtitles/fr.srt"
      }
    ],
    "updatedAt": "2024-01-15T11:30:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "No subtitle file provided"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Movie not found"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Invalid file type. Only SRT/VTT files are allowed."
}
```

---

### 7.1. Upload Multiple Videos at Once

You can upload multiple video qualities in a single request when creating a movie. Use array notation in form data:

**Example:**
```
video: <file> (video720p.mp4)
qualities[0]: "720p"
video: <file> (video1080p.mp4)
qualities[1]: "1080p"
video: <file> (video480p.mp4)
qualities[2]: "480p"
```

**Note:** All videos will be uploaded to S3 and added to the movie's Videos array.

---

### 7.2. Upload Multiple Subtitles at Once

You can upload multiple subtitle files in a single request when creating a movie:

**Example:**
```
subtitle: <file> (english.srt)
subtitleLanguages[0]: "English"
subtitleLanguageCodes[0]: "en"
subtitle: <file> (spanish.srt)
subtitleLanguages[1]: "Spanish"
subtitleLanguageCodes[1]: "es"
subtitle: <file> (french.srt)
subtitleLanguages[2]: "French"
subtitleLanguageCodes[2]: "fr"
```

---

### 7.3. File Upload Specifications

**Thumbnail/Poster Images:**
- **Formats:** JPEG, PNG, WebP, GIF
- **Max Size:** 10MB per file
- **Recommended:** 1920x1080 for poster, 640x360 for thumbnail
- **Field Names:** `thumbnail`, `poster`

**Video Files:**
- **Formats:** MP4, WebM, QuickTime (MOV)
- **Max Size:** 5GB per file
- **Recommended Qualities:** 480p, 720p, 1080p
- **Field Name:** `video` (can be multiple)
- **Quality Field:** `qualities[]` (array index matching video order)

**Subtitle Files:**
- **Formats:** SRT, VTT
- **Max Size:** 10MB per file
- **Field Name:** `subtitle` (can be multiple)
- **Language Fields:** `subtitleLanguages[]`, `subtitleLanguageCodes[]` (arrays matching subtitle order)

---

### 7.4. Complete Movie Upload Example

**Full Example with All Files:**

```bash
curl -X POST http://localhost:3000/api/admin/movies \
  -H "Authorization: Bearer <admin-token>" \
  -F "Title=The Amazing Movie" \
  -F "Description=A thrilling adventure movie with amazing visuals" \
  -F "Category=65a1b2c3d4e5f6g7h8i9j0k3" \
  -F "SubCategory=65a1b2c3d4e5f6g7h8i9j0k4" \
  -F "Channel=65a1b2c3d4e5f6g7h8i9j0k5" \
  -F "MetaTitle=The Amazing Movie - Watch Online Free" \
  -F "MetaDescription=Watch The Amazing Movie online in HD quality" \
  -F "MetaKeywords=[\"action\", \"adventure\", \"thriller\"]" \
  -F "AgeRestriction=PG-13" \
  -F "Year=2024" \
  -F "ReleaseDate=2024-01-01" \
  -F "Genre=[\"Action\", \"Adventure\", \"Thriller\"]" \
  -F "Cast=[\"Actor One\", \"Actor Two\", \"Actor Three\"]" \
  -F "Director=Director Name" \
  -F "TrailerUrl=https://youtube.com/watch?v=trailer" \
  -F "BlockedCountries=[\"CN\", \"RU\"]" \
  -F "thumbnail=@/path/to/thumbnail.jpg" \
  -F "poster=@/path/to/poster.jpg" \
  -F "video=@/path/to/video480p.mp4" \
  -F "qualities[0]=480p" \
  -F "video=@/path/to/video720p.mp4" \
  -F "qualities[1]=720p" \
  -F "video=@/path/to/video1080p.mp4" \
  -F "qualities[2]=1080p" \
  -F "subtitle=@/path/to/english.srt" \
  -F "subtitleLanguages[0]=English" \
  -F "subtitleLanguageCodes[0]=en" \
  -F "subtitle=@/path/to/spanish.srt" \
  -F "subtitleLanguages[1]=Spanish" \
  -F "subtitleLanguageCodes[1]=es" \
  -F "subtitle=@/path/to/french.srt" \
  -F "subtitleLanguages[2]=French" \
  -F "subtitleLanguageCodes[2]=fr"
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Movie created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
    "Title": "The Amazing Movie",
    "Slug": "the-amazing-movie",
    "Description": "A thrilling adventure movie with amazing visuals",
    "Thumbnail": "https://bucket.s3.region.amazonaws.com/thumbnails/1234567890-thumbnail.jpg",
    "Poster": "https://bucket.s3.region.amazonaws.com/thumbnails/1234567890-poster.jpg",
    "TrailerUrl": "https://youtube.com/watch?v=trailer",
    "Videos": [
      {
        "Quality": "480p",
        "Url": "https://bucket.s3.region.amazonaws.com/movies/1234567890-video480p.mp4",
        "FileSize": 1073741824,
        "Duration": null
      },
      {
        "Quality": "720p",
        "Url": "https://bucket.s3.region.amazonaws.com/movies/1234567891-video720p.mp4",
        "FileSize": 2147483648,
        "Duration": null
      },
      {
        "Quality": "1080p",
        "Url": "https://bucket.s3.region.amazonaws.com/movies/1234567892-video1080p.mp4",
        "FileSize": 4294967296,
        "Duration": null
      }
    ],
    "Subtitles": [
      {
        "Language": "English",
        "LanguageCode": "en",
        "Url": "https://bucket.s3.region.amazonaws.com/subtitles/1234567893-english.srt"
      },
      {
        "Language": "Spanish",
        "LanguageCode": "es",
        "Url": "https://bucket.s3.region.amazonaws.com/subtitles/1234567894-spanish.srt"
      },
      {
        "Language": "French",
        "LanguageCode": "fr",
        "Url": "https://bucket.s3.region.amazonaws.com/subtitles/1234567895-french.srt"
      }
    ],
    "Category": "65a1b2c3d4e5f6g7h8i9j0k3",
    "SubCategory": "65a1b2c3d4e5f6g7h8i9j0k4",
    "Channel": "65a1b2c3d4e5f6g7h8i9j0k5",
    "MetaTitle": "The Amazing Movie - Watch Online Free",
    "MetaDescription": "Watch The Amazing Movie online in HD quality",
    "MetaKeywords": ["action", "adventure", "thriller"],
    "Status": "active",
    "IsTrending": false,
    "IsFeatured": false,
    "AgeRestriction": "PG-13",
    "BlockedCountries": ["CN", "RU"],
    "Views": 0,
    "Likes": 0,
    "Rating": 0,
    "Year": 2024,
    "ReleaseDate": "2024-01-01T00:00:00.000Z",
    "Genre": ["Action", "Adventure", "Thriller"],
    "Cast": ["Actor One", "Actor Two", "Actor Three"],
    "Director": "Director Name",
    "CreatedBy": "65a1b2c3d4e5f6g7h8i9j0k2",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 8. Toggle Trending Status

Add or remove movie from trending section.

**Endpoint:** `PATCH /api/admin/movies/:id/toggle-trending`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Movie added to trending",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
    "IsTrending": true
  }
}
```

---

### 9. Toggle Featured Status

Add or remove movie from featured section.

**Endpoint:** `PATCH /api/admin/movies/:id/toggle-featured`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Movie added to featured",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
    "IsFeatured": true
  }
}
```

---

### 10. DMCA Takedown

Apply DMCA takedown to a movie.

**Endpoint:** `PATCH /api/admin/movies/:id/dmca-takedown`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "reason": "Copyright violation reported by content owner"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "DMCA takedown applied successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
    "Status": "dmca",
    "IsDMCA": true,
    "DMCAReason": "Copyright violation reported by content owner"
  }
}
```

---

### 11. Update Country Block

Block or unblock countries for a movie.

**Endpoint:** `PATCH /api/admin/movies/:id/country-block`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "countries": ["CN", "RU"],
  "action": "block"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Countries blocked successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
    "BlockedCountries": ["CN", "RU"]
  }
}
```

---

### 12. Update Age Restriction

Update age restriction for a movie.

**Endpoint:** `PATCH /api/admin/movies/:id/age-restriction`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "ageRestriction": "R"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Age restriction updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
    "AgeRestriction": "R"
  }
}
```

---

## 📁 Category Management APIs

### 1. Create Category

**Endpoint:** `POST /api/admin/categories`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**
```
Name: "Action"
Description: "Action movies category"
SortOrder: 1
image: <file> (optional)
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
    "Image": "https://bucket.s3.region.amazonaws.com/thumbnails/category.jpg",
    "IsActive": true,
    "SortOrder": 1,
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Get All Categories

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
      "Image": "https://bucket.s3.region.amazonaws.com/thumbnails/category.jpg",
      "IsActive": true,
      "SortOrder": 1
    }
  ]
}
```

---

### 3. Get Category by ID

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
    "Image": "https://bucket.s3.region.amazonaws.com/thumbnails/category.jpg",
    "IsActive": true,
    "SortOrder": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 4. Update Category

**Endpoint:** `PUT /api/admin/categories/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "Name": "Updated Category Name",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### 5. Delete Category

**Endpoint:** `DELETE /api/admin/categories/:id`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```

---

## 📺 Channel Management APIs

### 1. Create Channel

Create a new channel with logo upload.

**Endpoint:** `POST /api/admin/channels`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**

**Required Fields:**
```
Name: "HBO"
```

**Optional Fields:**
```
Description: "Premium entertainment channel"
SortOrder: 1
IsActive: true
logo: <image-file> (JPEG, PNG, WebP, GIF)
```

**Example Request:**
```bash
curl -X POST "https://api.example.com/api/admin/channels" \
  -H "Authorization: Bearer your-admin-jwt-token" \
  -F "Name=HBO" \
  -F "Description=Premium entertainment channel" \
  -F "SortOrder=1" \
  -F "IsActive=true" \
  -F "logo=@/path/to/logo.jpg"
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Channel created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
    "Name": "HBO",
    "Slug": "hbo",
    "Description": "Premium entertainment channel",
    "Logo": "https://s3.amazonaws.com/bucket/thumbnails/logo.jpg",
    "IsActive": true,
    "SortOrder": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Failed to create channel",
  "error": "Channel name is required"
}
```

---

### 2. Get All Channels

Get a paginated list of all channels with optional filters.

**Endpoint:** `GET /api/admin/channels`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `isActive` | boolean | No | - | Filter by active status (`true`/`false`) |
| `search` | string | No | - | Search by channel name, description, or slug |
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page |
| `sortBy` | string | No | `SortOrder` | Sort field (`SortOrder`, `Name`, `createdAt`) |
| `sortOrder` | string | No | `asc` | Sort order (`asc`/`desc`) |

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/admin/channels?isActive=true&page=1&limit=20&search=hbo" \
  -H "Authorization: Bearer your-admin-jwt-token" \
  -H "Content-Type: application/json"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
      "Name": "HBO",
      "Slug": "hbo",
      "Description": "Premium entertainment channel",
      "Logo": "https://s3.amazonaws.com/bucket/thumbnails/logo.jpg",
      "IsActive": true,
      "SortOrder": 1,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k7",
      "Name": "Netflix",
      "Slug": "netflix",
      "Description": "Streaming entertainment",
      "Logo": "https://s3.amazonaws.com/bucket/thumbnails/netflix-logo.jpg",
      "IsActive": true,
      "SortOrder": 2,
      "createdAt": "2024-01-15T10:35:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 10,
    "pages": 1
  }
}
```

---

### 3. Get Channel by ID

Get detailed information about a specific channel.

**Endpoint:** `GET /api/admin/channels/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | **Yes** | Channel ID |

**Example Request:**
```bash
curl -X GET "https://api.example.com/api/admin/channels/65a1b2c3d4e5f6g7h8i9j0k6" \
  -H "Authorization: Bearer your-admin-jwt-token" \
  -H "Content-Type: application/json"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
    "Name": "HBO",
    "Slug": "hbo",
    "Description": "Premium entertainment channel",
    "Logo": "https://s3.amazonaws.com/bucket/thumbnails/logo.jpg",
    "IsActive": true,
    "SortOrder": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Channel not found"
}
```

---

### 4. Update Channel

Update channel information and/or logo.

**Endpoint:** `PUT /api/admin/channels/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | **Yes** | Channel ID |

**Request Body (Form Data):**

**Optional Fields:**
```
Name: "Updated Channel Name"
Description: "Updated description"
SortOrder: 2
IsActive: false
logo: <image-file> (JPEG, PNG, WebP, GIF)
```

**Example Request:**
```bash
curl -X PUT "https://api.example.com/api/admin/channels/65a1b2c3d4e5f6g7h8i9j0k6" \
  -H "Authorization: Bearer your-admin-jwt-token" \
  -F "Name=HBO Max" \
  -F "Description=Updated description" \
  -F "IsActive=true" \
  -F "logo=@/path/to/new-logo.jpg"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Channel updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
    "Name": "HBO Max",
    "Slug": "hbo-max",
    "Description": "Updated description",
    "Logo": "https://s3.amazonaws.com/bucket/thumbnails/new-logo.jpg",
    "IsActive": true,
    "SortOrder": 1,
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Note:** If a new logo is uploaded, the old logo will be automatically deleted from S3.

---

### 5. Delete Channel

Delete a channel. This will also delete the channel's logo from S3.

**Endpoint:** `DELETE /api/admin/channels/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**URL Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | **Yes** | Channel ID |

**Example Request:**
```bash
curl -X DELETE "https://api.example.com/api/admin/channels/65a1b2c3d4e5f6g7h8i9j0k6" \
  -H "Authorization: Bearer your-admin-jwt-token" \
  -H "Content-Type: application/json"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Channel deleted successfully"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Channel not found"
}
```

**Note:** Deleting a channel will not delete movies associated with it. The `Channel` field in movies will remain but the channel reference will be invalid.

---

### Channel Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Name` | string | **Yes** | Channel name |
| `Slug` | string | Auto-generated | URL-friendly channel identifier (auto-generated from name) |
| `Description` | string | No | Channel description |
| `Logo` | string | No | Channel logo URL (uploaded to S3) |
| `IsActive` | boolean | No | Whether channel is active (default: `true`) |
| `SortOrder` | number | No | Display order (default: `0`) |

---

### JavaScript Examples

#### Create Channel with Logo

```javascript
const formData = new FormData();
formData.append('Name', 'HBO');
formData.append('Description', 'Premium entertainment channel');
formData.append('SortOrder', '1');
formData.append('IsActive', 'true');
formData.append('logo', logoFile); // File object

const response = await fetch('https://api.example.com/api/admin/channels', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  },
  body: formData
});

const data = await response.json();
console.log('Channel created:', data.data);
```

#### Get All Active Channels

```javascript
const response = await fetch('https://api.example.com/api/admin/channels?isActive=true&page=1&limit=20', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Channels:', data.data);
console.log('Total:', data.pagination.total);
```

#### Search Channels

```javascript
const searchTerm = 'hbo';
const response = await fetch(`https://api.example.com/api/admin/channels?search=${encodeURIComponent(searchTerm)}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Search results:', data.data);
```

#### Update Channel Logo

```javascript
const formData = new FormData();
formData.append('Name', 'HBO Max');
formData.append('logo', newLogoFile);

const response = await fetch(`https://api.example.com/api/admin/channels/${channelId}`, {
  method: 'PUT',
  headers: {
    'Authorization': `Bearer ${adminToken}`
  },
  body: formData
});

const data = await response.json();
console.log('Channel updated:', data.data);
```

---

## 📂 SubCategory Management APIs

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

**Example cURL Request:**
```bash
curl -X POST http://localhost:3000/api/admin/subcategories \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "Name": "Superhero",
    "Category": "65a1b2c3d4e5f6g7h8i9j0k3",
    "Description": "Superhero movies subcategory",
    "SortOrder": 1
  }'
```

**Example JavaScript/Fetch:**
```javascript
fetch('http://localhost:3000/api/admin/subcategories', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer <admin-token>',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    Name: 'Superhero',
    Category: '65a1b2c3d4e5f6g7h8i9j0k3',
    Description: 'Superhero movies subcategory',
    SortOrder: 1
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

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
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Failed to create subcategory",
  "error": "Category is required"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Failed to create subcategory",
  "error": "Name is required"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Failed to create subcategory",
  "error": "Category not found"
}
```

---

### 2. Get All SubCategories

Retrieve all subcategories with optional filtering.

**Endpoint:** `GET /api/admin/subcategories`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
```
category: "<category-id>" (optional) - Filter by parent category
isActive: "true" (optional) - Filter by active status
```

**Example Request:**
```
GET /api/admin/subcategories?category=65a1b2c3d4e5f6g7h8i9j0k3&isActive=true
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
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
      "Name": "Martial Arts",
      "Slug": "martial-arts",
      "Category": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
        "Name": "Action",
        "Slug": "action"
      },
      "Description": "Martial arts movies",
      "IsActive": true,
      "SortOrder": 2,
      "createdAt": "2024-01-15T10:35:00.000Z"
    }
  ]
}
```

---

### 3. Get SubCategory by ID

Retrieve a specific subcategory by its ID.

**Endpoint:** `GET /api/admin/subcategories/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
```

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

**Error Response (404):**
```json
{
  "success": false,
  "message": "SubCategory not found"
}
```

---

### 4. Update SubCategory

Update an existing subcategory.

**Endpoint:** `PUT /api/admin/subcategories/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Name": "Updated Superhero",
  "Description": "Updated description",
  "SortOrder": 2,
  "IsActive": true
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
    "Description": "Updated description",
    "SortOrder": 2,
    "IsActive": true,
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "SubCategory not found"
}
```

---

### 5. Delete SubCategory

Delete a subcategory permanently.

**Endpoint:** `DELETE /api/admin/subcategories/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "SubCategory deleted successfully"
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "SubCategory not found"
}
```

---

### Notes

- **Slug Generation:** The slug is automatically generated from the Name field (lowercase, spaces replaced with hyphens)
- **Category Relationship:** Each subcategory must belong to a parent category
- **Sort Order:** Lower numbers appear first when listing subcategories
- **Active Status:** Inactive subcategories won't appear in public API responses

---

## 🔍 SEO Management APIs

### 1. Update Movie SEO

**Endpoint:** `PUT /api/admin/seo/movie/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "metaTitle": "The Amazing Movie - Watch Online Free",
  "metaDescription": "Watch The Amazing Movie online in HD quality. Free streaming available.",
  "metaKeywords": ["action", "adventure", "thriller", "movie"],
  "customSlug": "amazing-movie-2024"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "SEO updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k6",
    "MetaTitle": "The Amazing Movie - Watch Online Free",
    "MetaDescription": "Watch The Amazing Movie online in HD quality. Free streaming available.",
    "MetaKeywords": ["action", "adventure", "thriller", "movie"],
    "Slug": "amazing-movie-2024"
  }
}
```

---

### 2. Generate Sitemap

**Endpoint:** `POST /api/admin/seo/sitemap/generate`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Sitemap generated successfully",
  "data": {
    "url": "https://yourdomain.com/sitemap.xml",
    "totalUrls": 250
  }
}
```

---

### 3. Get SEO Analytics

**Endpoint:** `GET /api/admin/seo/analytics`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalMovies": 150,
    "moviesWithSEO": 120,
    "moviesWithoutSEO": 30,
    "seoCoverage": "80.00"
  }
}
```

---

## 🎁 Referral Management APIs

### 1. Get All Referrals

**Endpoint:** `GET /api/admin/referrals`

**Query Parameters:**
```
status: "completed" (optional) - Filter by status (pending, completed, cancelled)
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
      "Referrer": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k8",
        "Name": "John Doe",
        "Email": "john@example.com",
        "ReferralCode": "REF123456"
      },
      "ReferredUser": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k9",
        "Name": "Jane Smith",
        "Email": "jane@example.com"
      },
      "ReferralCode": "REF123456",
      "Earnings": 50,
      "Status": "completed",
      "createdAt": "2024-01-10T10:30:00.000Z"
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

### 2. Get Referral Statistics

**Endpoint:** `GET /api/admin/referrals/stats`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "totalReferrals": 100,
    "completedReferrals": 75,
    "pendingReferrals": 20,
    "totalEarnings": 5000
  }
}
```

---

### 3. Update Referral Earnings

**Endpoint:** `PATCH /api/admin/referrals/:id/earnings`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "earnings": 100,
  "status": "completed"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Referral earnings updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k7",
    "Earnings": 100,
    "Status": "completed"
  }
}
```

---

## 👥 Admin User Management APIs

### 1. Create Admin User

Create a new admin user. Only existing admins can create other admins.

**Endpoint:** `POST /api/admin/users/create-admin`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Email": "newadmin@example.com",
  "Password": "SecurePassword123",
  "Name": "New Admin"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Admin user created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k10",
    "Email": "newadmin@example.com",
    "Name": "New Admin",
    "Role": "admin",
    "IsActive": true,
    "ReferralCode": "REF789012",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Email, Password, and Name are required"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "User with this email already exists"
}
```

---

### 2. Get All Admins

Retrieve all admin users with pagination.

**Endpoint:** `GET /api/admin/users/admins`

**Query Parameters:**
```
page: 1 (optional)
limit: 20 (optional)
search: "admin" (optional) - Search by email or name
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "Email": "admin@example.com",
      "Name": "Super Admin",
      "Role": "admin",
      "IsActive": true,
      "ReferralCode": "REF123456",
      "LastLogin": "2024-01-15T10:00:00.000Z",
      "createdAt": "2024-01-01T10:00:00.000Z"
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

### 3. Get Admin by ID

Retrieve a specific admin user by ID.

**Endpoint:** `GET /api/admin/users/admins/:id`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "Email": "admin@example.com",
    "Name": "Super Admin",
    "Role": "admin",
    "IsActive": true,
    "ReferralCode": "REF123456",
    "ReferralEarnings": 0,
    "LastLogin": "2024-01-15T10:00:00.000Z",
    "ProfilePicture": null,
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### 4. Update Admin User

Update admin user information.

**Endpoint:** `PUT /api/admin/users/admins/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Name": "Updated Admin Name",
  "Email": "updated@example.com",
  "IsActive": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Admin user updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "Email": "updated@example.com",
    "Name": "Updated Admin Name",
    "Role": "admin",
    "IsActive": true,
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "You cannot change your own role"
}
```

---

### 5. Delete Admin User

Delete an admin user. Cannot delete yourself or the last admin.

**Endpoint:** `DELETE /api/admin/users/admins/:id`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Admin user deleted successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "You cannot delete your own account"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Cannot delete the last admin user"
}
```

---

### 6. Change Admin Password

Change password for an admin user.

**Endpoint:** `PATCH /api/admin/users/admins/:id/change-password`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "newPassword": "NewSecurePassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Admin password changed successfully"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Password must be at least 6 characters long"
}
```

---

### 7. Toggle Admin Status

Activate or deactivate an admin user. Cannot deactivate yourself.

**Endpoint:** `PATCH /api/admin/users/admins/:id/toggle-status`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Admin activated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
    "Email": "admin@example.com",
    "IsActive": true
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "You cannot deactivate your own account"
}
```

---

## 👥 Sub-Admin Management APIs (Main Admin Only)

Sub-admins are users with limited admin privileges based on assigned roles. Only the main admin can create, manage, and assign roles to sub-admins. Sub-admin passwords are stored in plain text so the main admin can view them.

### Main Admin Workflow

The main admin can:
1. **Create Roles** - Define custom roles with specific permissions
2. **Get All Roles** - View all available roles in the system
3. **Create Sub-Admins** - Create sub-admin users and assign roles to them

**Typical Workflow:**
1. Main admin creates a role (e.g., "Movie Manager") with specific permissions
2. Main admin views all roles to see what's available
3. Main admin creates a sub-admin user
4. Main admin assigns the role(s) to the sub-admin
5. Sub-admin can now login and access features based on assigned permissions

### 1. Sub-Admin Login

Login as a sub-admin to get access token and role-based permissions.

**Endpoint:** `POST /api/auth/sub-admin/login`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "Email": "subadmin@example.com",
  "Password": "SubAdmin@123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Sub-admin login successful",
  "data": {
    "user": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "Email": "subadmin@example.com",
      "Name": "Sub Admin User",
      "Role": "sub-admin",
      "IsSubAdmin": true,
      "Roles": [
        {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
          "Name": "Movie Manager",
          "Slug": "movie-manager",
          "Description": "Can manage movies",
          "Permissions": ["movies:view", "movies:create", "movies:edit"]
        }
      ],
      "Permissions": [
        "movies:view",
        "movies:create",
        "movies:edit",
        "categories:view"
      ],
      "IsActive": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "access": {
      "roles": [
        {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
          "Name": "Movie Manager",
          "Slug": "movie-manager",
          "Description": "Can manage movies"
        }
      ],
      "permissions": [
        "movies:view",
        "movies:create",
        "movies:edit",
        "categories:view"
      ]
    }
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

**Error Response (403):**
```json
{
  "success": false,
  "message": "Access denied. Sub-admin account required."
}
```

---

### 2. Create Sub-Admin (Main Admin Only)

**Main admin can create sub-admins** with optional role assignments. This is one of the key features available only to the main admin.

**Endpoint:** `POST /api/admin/sub-admins`

**Headers:**
```
Authorization: Bearer <main-admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Email": "subadmin@example.com",
  "Password": "SubAdmin@123",
  "Name": "Sub Admin User",
  "Roles": ["65a1b2c3d4e5f6g7h8i9j0k4", "65a1b2c3d4e5f6g7h8i9j0k5"]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Sub-admin created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "Email": "subadmin@example.com",
    "Name": "Sub Admin User",
    "Role": "sub-admin",
    "IsSubAdmin": true,
    "PlainPassword": "SubAdmin@123",
    "Roles": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
        "Name": "Movie Manager",
        "Slug": "movie-manager",
        "Permissions": ["movies:view", "movies:create", "movies:edit"]
      }
    ],
    "Permissions": [
      "movies:view",
      "movies:create",
      "movies:edit"
    ],
    "IsActive": true,
    "CreatedBy": "65a1b2c3d4e5f6g7h8i9j0k2",
    "createdAt": "2025-01-21T10:00:00.000Z"
  }
}
```

**Note:** The `PlainPassword` field is returned so the main admin can view and share the password with the sub-admin.

---

### 3. Get All Sub-Admins (Main Admin Only)

Get a paginated list of all sub-admins with their roles and passwords.

**Endpoint:** `GET /api/admin/sub-admins`

**Headers:**
```
Authorization: Bearer <main-admin-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search by email or name

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
      "Email": "subadmin@example.com",
      "Name": "Sub Admin User",
      "Role": "sub-admin",
      "IsSubAdmin": true,
      "PlainPassword": "SubAdmin@123",
      "Roles": [
        {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
          "Name": "Movie Manager",
          "Slug": "movie-manager",
          "Permissions": ["movies:view", "movies:create", "movies:edit"]
        }
      ],
      "Permissions": ["movies:view", "movies:create", "movies:edit"],
      "IsActive": true,
      "CreatedBy": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "Name": "Main Admin",
        "Email": "admin@example.com"
      },
      "createdAt": "2025-01-21T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

---

### 4. Get Sub-Admin by ID (Main Admin Only)

Get detailed information about a specific sub-admin including password.

**Endpoint:** `GET /api/admin/sub-admins/:id`

**Headers:**
```
Authorization: Bearer <main-admin-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "Email": "subadmin@example.com",
    "Name": "Sub Admin User",
    "Role": "sub-admin",
    "IsSubAdmin": true,
    "PlainPassword": "SubAdmin@123",
    "Roles": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
        "Name": "Movie Manager",
        "Slug": "movie-manager",
        "Permissions": ["movies:view", "movies:create", "movies:edit"]
      }
    ],
    "Permissions": ["movies:view", "movies:create", "movies:edit"],
    "IsActive": true,
    "CreatedBy": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "Name": "Main Admin",
      "Email": "admin@example.com"
    },
    "createdAt": "2025-01-21T10:00:00.000Z",
    "updatedAt": "2025-01-21T10:00:00.000Z"
  }
}
```

---

### 4.1. Get Sub-Admin Details with Statistics (Main Admin or Sub-Admin)

Get comprehensive sub-admin details including task completion statistics based on their permissions. Both main admin and the sub-admin themselves can access this endpoint.

**Endpoint:** `GET /api/admin/sub-admins/:id/details`

**Alternative Endpoint (for sub-admin to get own details):** `GET /api/admin/sub-admins/me/details`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Access Control:**
- **Main Admin**: Can view any sub-admin's details with full statistics
- **Sub-Admin**: Can only view their own details (using `/me/details` or their own ID)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "Name": "Sub Admin User",
    "Email": "subadmin@example.com",
    "Role": "sub-admin",
    "IsSubAdmin": true,
    "IsActive": true,
    "Roles": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
        "Name": "Movie Manager",
        "Slug": "movie-manager",
        "Description": "Can manage movies and categories",
        "Permissions": ["movie:create", "movie:read", "contact:update"]
      }
    ],
    "Permissions": [
      "movie:create",
      "movie:read",
      "contact:update"
    ],
    "CreatedBy": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "Name": "Main Admin",
      "Email": "admin@example.com"
    },
    "LastLogin": "2024-01-15T10:00:00.000Z",
    "createdAt": "2024-01-01T10:00:00.000Z",
    "updatedAt": "2024-01-15T10:00:00.000Z",
    "statistics": {
      "totalTasks": 45,
      "byPermission": {
        "movies": {
          "created": 25,
          "viewed": 150,
          "permission": "movie:create"
        },
        "contacts": {
          "reachedOut": 15,
          "notesAdded": 5,
          "total": 50,
          "permission": "contact:update"
        },
        "ads": {
          "created": 5,
          "viewed": 30,
          "permission": "ad:create"
        },
        "categories": {
          "created": 3,
          "permission": "category:create"
        },
        "channels": {
          "total": 10,
          "permission": "channel:create",
          "note": "Channel model does not track creator"
        },
        "actors": {
          "total": 20,
          "permission": "actor:create",
          "note": "Actor model does not track creator"
        },
        "dashboard": {
          "accessed": true,
          "permission": "dashboard:read"
        },
        "uploadQueue": {
          "managed": 2,
          "permission": "upload_queue:read"
        }
      },
      "recentActivity": {
        "movies": 10,
        "contacts": 5,
        "ads": 2
      },
      "last30Days": {
        "total": 17,
        "breakdown": {
          "movies": 10,
          "contacts": 5,
          "ads": 2
        }
      }
    },
    "PlainPassword": "SubAdmin@123"
  }
}
```

**Note:** The `PlainPassword` field is only included when accessed by the main admin. Sub-admins viewing their own details will not see the password field.

**Statistics Breakdown:**

The statistics object includes:

- **`totalTasks`**: Total number of tasks completed by the sub-admin across all permission areas
- **`byPermission`**: Detailed breakdown by each permission area:
  - **Movies**: Count of movies created (if has `movie:create` permission) and total viewed (if has `movie:read`)
  - **Contacts**: Count of contacts reached out to and notes added (if has `contact:update` permission)
  - **Ads**: Count of ads created (if has `ad:create` permission)
  - **Categories**: Count of categories created (if has `category:create` permission)
  - **Channels/Actors**: Total count (these models don't track creator, so total is shown)
  - **Dashboard**: Whether dashboard access is available (if has `dashboard:read` permission)
  - **Upload Queue**: Count of upload queues managed (if has `upload_queue:read` permission)
- **`recentActivity`**: Activity counts for the last 30 days
- **`last30Days`**: Summary of recent activity with total and breakdown

**Example Usage:**

```bash
# Main admin viewing a sub-admin's details
curl -X GET "http://localhost:3000/api/admin/sub-admins/65a1b2c3d4e5f6g7h8i9j0k3/details" \
  -H "Authorization: Bearer <main-admin-token>"

# Sub-admin viewing their own details
curl -X GET "http://localhost:3000/api/admin/sub-admins/me/details" \
  -H "Authorization: Bearer <sub-admin-token>"
```

---

### 5. Update Sub-Admin (Main Admin Only)

Update sub-admin information including name, email, status, and password.

**Endpoint:** `PUT /api/admin/sub-admins/:id`

**Headers:**
```
Authorization: Bearer <main-admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Name": "Updated Sub Admin Name",
  "Email": "newemail@example.com",
  "IsActive": true,
  "Password": "NewPassword@123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Sub-admin updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "Email": "newemail@example.com",
    "Name": "Updated Sub Admin Name",
    "Role": "sub-admin",
    "IsSubAdmin": true,
    "PlainPassword": "NewPassword@123",
    "Roles": [...],
    "Permissions": [...],
    "IsActive": true,
    "updatedAt": "2025-01-21T11:00:00.000Z"
  }
}
```

---

### 6. Assign Roles to Sub-Admin (Main Admin Only)

Assign or update roles for a sub-admin. This will replace all existing roles.

**Endpoint:** `PATCH /api/admin/sub-admins/:id/assign-roles`

**Headers:**
```
Authorization: Bearer <main-admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Roles": ["65a1b2c3d4e5f6g7h8i9j0k4", "65a1b2c3d4e5f6g7h8i9j0k5"]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Roles assigned successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k3",
    "Email": "subadmin@example.com",
    "Name": "Sub Admin User",
    "Role": "sub-admin",
    "IsSubAdmin": true,
    "PlainPassword": "SubAdmin@123",
    "Roles": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
        "Name": "Movie Manager",
        "Slug": "movie-manager",
        "Permissions": ["movies:view", "movies:create", "movies:edit"]
      },
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k5",
        "Name": "Category Manager",
        "Slug": "category-manager",
        "Permissions": ["categories:view", "categories:create", "categories:edit"]
      }
    ],
    "Permissions": [
      "movies:view",
      "movies:create",
      "movies:edit",
      "categories:view",
      "categories:create",
      "categories:edit"
    ]
  }
}
```

---

### 7. Delete Sub-Admin (Main Admin Only)

Delete a sub-admin user.

**Endpoint:** `DELETE /api/admin/sub-admins/:id`

**Headers:**
```
Authorization: Bearer <main-admin-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Sub-admin deleted successfully"
}
```

---

### Available Permissions

Sub-admins can be assigned the following permissions:

- **Movies:** `movies:view`, `movies:create`, `movies:edit`, `movies:delete`
- **Categories:** `categories:view`, `categories:create`, `categories:edit`, `categories:delete`
- **Channels:** `channels:view`, `channels:create`, `channels:edit`, `channels:delete`
- **Actors:** `actors:view`, `actors:create`, `actors:edit`, `actors:delete`
- **Users:** `users:view`, `users:edit`, `users:delete`
- **Dashboard:** `dashboard:view`
- **Upload Queue:** `upload-queue:view`, `upload-queue:manage`
- **Ads:** `ads:view`, `ads:create`, `ads:edit`, `ads:delete`
- **SEO:** `seo:view`, `seo:edit`

**Note:** Sub-admin management permissions (`sub-admins:view`, `sub-admins:create`, etc.) are reserved for main admin only.

---

## 🎭 Role Management APIs (Main Admin Only)

Roles define sets of permissions that can be assigned to sub-admins. Only the main admin can create, update, and delete roles.

### Main Admin Capabilities

- ✅ **Create Roles** - Define new roles with custom permission sets
- ✅ **Get All Roles** - View all roles in the system (any admin can view, but only main admin can create/update/delete)
- ✅ **Update Roles** - Modify role permissions and details
- ✅ **Delete Roles** - Remove roles from the system
- ✅ **View Available Permissions** - See all permissions organized by category

### 1. Get Available Permissions

Get a list of all available permissions organized by category.

**Endpoint:** `GET /api/admin/roles/permissions`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "permissions": {
      "MOVIES_VIEW": "movies:view",
      "MOVIES_CREATE": "movies:create",
      "MOVIES_EDIT": "movies:edit",
      "MOVIES_DELETE": "movies:delete",
      ...
    },
    "categories": {
      "movies": ["movies:view", "movies:create", "movies:edit", "movies:delete"],
      "categories": ["categories:view", "categories:create", "categories:edit", "categories:delete"],
      ...
    }
  }
}
```

---

### 2. Create Role (Main Admin Only)

**Main admin can create roles** with specific permissions. This allows the main admin to define custom permission sets that can be assigned to sub-admins.

**Endpoint:** `POST /api/admin/roles`

**Headers:**
```
Authorization: Bearer <main-admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Name": "Movie Manager",
  "Description": "Can manage movies and categories",
  "Permissions": [
    "movies:view",
    "movies:create",
    "movies:edit",
    "categories:view"
  ]
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Role created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
    "Name": "Movie Manager",
    "Slug": "movie-manager",
    "Description": "Can manage movies and categories",
    "Permissions": [
      "movies:view",
      "movies:create",
      "movies:edit",
      "categories:view"
    ],
    "IsActive": true,
    "CreatedBy": "65a1b2c3d4e5f6g7h8i9j0k2",
    "createdAt": "2025-01-21T10:00:00.000Z"
  }
}
```

---

### 3. Get All Roles

Get a paginated list of all roles. **Any admin can view roles, but only main admin can create, update, or delete them.**

**Endpoint:** `GET /api/admin/roles`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Note:** This endpoint is accessible to all admins for viewing purposes. Only the main admin can create, update, or delete roles.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)
- `search` (optional): Search by name or slug
- `isActive` (optional): Filter by active status (true/false)

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
      "Name": "Movie Manager",
      "Slug": "movie-manager",
      "Description": "Can manage movies and categories",
      "Permissions": ["movies:view", "movies:create", "movies:edit", "categories:view"],
      "IsActive": true,
      "CreatedBy": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "Name": "Main Admin",
        "Email": "admin@example.com"
      },
      "createdAt": "2025-01-21T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "pages": 1
  }
}
```

---

### 4. Get Role by ID

Get detailed information about a specific role.

**Endpoint:** `GET /api/admin/roles/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
    "Name": "Movie Manager",
    "Slug": "movie-manager",
    "Description": "Can manage movies and categories",
    "Permissions": ["movies:view", "movies:create", "movies:edit", "categories:view"],
    "IsActive": true,
    "CreatedBy": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "Name": "Main Admin",
      "Email": "admin@example.com"
    },
    "createdAt": "2025-01-21T10:00:00.000Z",
    "updatedAt": "2025-01-21T10:00:00.000Z"
  }
}
```

---

### 5. Update Role (Main Admin Only)

Update role information including permissions.

**Endpoint:** `PUT /api/admin/roles/:id`

**Headers:**
```
Authorization: Bearer <main-admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Name": "Updated Movie Manager",
  "Description": "Updated description",
  "Permissions": ["movies:view", "movies:create", "movies:edit", "movies:delete"],
  "IsActive": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Role updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k4",
    "Name": "Updated Movie Manager",
    "Slug": "updated-movie-manager",
    "Description": "Updated description",
    "Permissions": ["movies:view", "movies:create", "movies:edit", "movies:delete"],
    "IsActive": true,
    "updatedAt": "2025-01-21T11:00:00.000Z"
  }
}
```

---

### 6. Delete Role (Main Admin Only)

Delete a role. Note: This will not remove the role from sub-admins who have it assigned. You should update those sub-admins first.

**Endpoint:** `DELETE /api/admin/roles/:id`

**Headers:**
```
Authorization: Bearer <main-admin-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Role deleted successfully"
}
```

---

## 🌱 Seed Script for Initial Admin

### Running the Seed Script

To create the first admin user, run the seed script:

```bash
npm run seed
```

Or directly:

```bash
node scripts/seed.js
```

### Environment Variables for Seed Script

Add these to your `.env` file (optional):

```env
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@123456
ADMIN_NAME=Super Admin
```

If not provided, the script will use default values.

### Seed Script Output

```
✅ Connected to database

✅ Admin user created successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email: admin@example.com
🔑 Password: Admin@123456
👤 Name: Super Admin
🎭 Role: admin
🆔 User ID: 65a1b2c3d4e5f6g7h8i9j0k2
🔐 Referral Code: REF123456
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️  IMPORTANT: Please change the default password after first login!
💡 You can create more admins using the admin panel or API endpoint.
   Endpoint: POST /api/admin/users/create-admin
```

### Notes

- The seed script will only create an admin if one doesn't already exist
- If an admin already exists, it will display a message and exit
- After creating the first admin, use the API endpoint to create additional admins
- Always change the default password after first login

---

## 📊 Movie Statistics & Analytics APIs

### 1. Get Movie Statistics

Get comprehensive statistics for a movie including views, likes, comments, and top comments.

**Endpoint:** `GET /api/admin/movies/:id/statistics`

**Headers:**
```
Authorization: Bearer <admin-token>
```

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
            "Email": "john@example.com",
            "ProfilePicture": "https://example.com/profile.jpg"
          },
          "createdAt": "2024-01-15T10:30:00.000Z"
        }
      ]
    }
  }
}
```

---

### 2. Get Movie Comments (Admin View)

Get all comments for a movie with admin details and moderation options.

**Endpoint:** `GET /api/admin/movies/:id/comments`

**Headers:**
```
Authorization: Bearer <admin-token>
```

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
        "Email": "john@example.com",
        "ProfilePicture": "https://example.com/profile.jpg"
      },
      "Replies": [
        {
          "Comment": "I agree!",
          "Likes": 5,
          "User": {
            "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
            "Name": "Jane Smith",
            "Email": "jane@example.com"
          },
          "createdAt": "2024-01-15T11:00:00.000Z"
        }
      ],
      "IsActive": true,
      "IsEdited": false,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
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

## 💬 Comments & Likes Management APIs

### 1. Get Movie Comments (Admin View)

Get all comments for a movie with admin details.

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

### 2. Get Movie Statistics

Get detailed statistics for a movie including views, likes, comments.

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
          "Comment": "Great movie!",
          "Likes": 25,
          "User": {
            "Name": "John Doe"
          }
        }
      ],
      "viewsByDate": [
        {
          "date": "2024-01-15",
          "views": 500
        }
      ],
      "likesByDate": [
        {
          "date": "2024-01-15",
          "likes": 20
        }
      ]
    }
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
  "message": "Access denied. Admin privileges required."
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

## Ad Types

- `pre-roll` - Video ads before movie starts
- `mid-roll` - Video ads during movie
- `banner-top` - Banner ads at top of page
- `banner-bottom` - Banner ads at bottom of page
- `native` - Native ads between movie lists
- `popup` - Popup ads
- `interstitial` - Full-screen interstitial ads

## Movie Qualities

- `480p` - Standard definition
- `720p` - High definition
- `1080p` - Full high definition

## Movie Status

- `active` - Movie is active and visible
- `inactive` - Movie is inactive
- `blocked` - Movie is blocked
- `dmca` - Movie has DMCA takedown

## 🎭 Actor Management APIs

### 1. Create Actor

Create a new actor with image upload.

**Endpoint:** `POST /api/admin/actors`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**

**Required Fields:**
```
Name: "Tom Hanks"
```

**Optional Fields:**
```
Description: "Academy Award-winning actor"
DateOfBirth: "1956-07-09"
Nationality: "American"
SortOrder: 1
IsActive: true
image: <image-file> (JPEG, PNG, WebP, GIF)
```

**Note:** Actor images are automatically compressed and resized to a maximum of 500x500 pixels with 75% quality before uploading to S3 to optimize storage and loading speed.

**Example Request:**
```bash
curl -X POST "https://api.example.com/api/admin/actors" \
  -H "Authorization: Bearer your-admin-jwt-token" \
  -F "Name=Tom Hanks" \
  -F "Description=Academy Award-winning actor" \
  -F "DateOfBirth=1956-07-09" \
  -F "Nationality=American" \
  -F "IsActive=true" \
  -F "image=@/path/to/actor-image.jpg"
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Actor created successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k8",
    "Name": "Tom Hanks",
    "Slug": "tom-hanks",
    "Description": "Academy Award-winning actor",
    "Image": "https://s3.amazonaws.com/bucket/thumbnails/actor-image.jpg",
    "DateOfBirth": "1956-07-09T00:00:00.000Z",
    "Nationality": "American",
    "IsActive": true,
    "SortOrder": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Get All Actors

Get a paginated list of all actors with optional filters.

**Endpoint:** `GET /api/admin/actors`

**Query Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `isActive` | boolean | No | - | Filter by active status (`true`/`false`) |
| `search` | string | No | - | Search by actor name or description |
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page |
| `sortBy` | string | No | `SortOrder` | Sort field (`SortOrder`, `Name`, `createdAt`) |
| `sortOrder` | string | No | `asc` | Sort order (`asc`/`desc`) |

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k8",
      "Name": "Tom Hanks",
      "Slug": "tom-hanks",
      "Description": "Academy Award-winning actor",
      "Image": "https://s3.amazonaws.com/bucket/thumbnails/tom-hanks.jpg",
      "DateOfBirth": "1956-07-09T00:00:00.000Z",
      "Nationality": "American",
      "IsActive": true,
      "SortOrder": 1,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
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

### 3. Get Actor by ID

Get detailed information about a specific actor.

**Endpoint:** `GET /api/admin/actors/:id`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k8",
    "Name": "Tom Hanks",
    "Slug": "tom-hanks",
    "Description": "Academy Award-winning actor",
    "Image": "https://s3.amazonaws.com/bucket/thumbnails/tom-hanks.jpg",
    "DateOfBirth": "1956-07-09T00:00:00.000Z",
    "Nationality": "American",
    "IsActive": true,
    "SortOrder": 1,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 4. Update Actor

Update actor information and/or image. The image will be automatically compressed and resized to 500x500 pixels with 75% quality before uploading.

**Endpoint:** `PUT /api/admin/actors/:id`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Actor updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k8",
    "Name": "Tom Hanks",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### 5. Delete Actor

Delete an actor. This will also delete the actor's image from S3.

**Endpoint:** `DELETE /api/admin/actors/:id`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Actor deleted successfully"
}
```

---

### Actor Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `Name` | string | **Yes** | Actor name |
| `Slug` | string | Auto-generated | URL-friendly identifier |
| `Description` | string | No | Actor biography/description |
| `Image` | string | No | Actor image URL (uploaded to S3) |
| `DateOfBirth` | date | No | Actor's date of birth |
| `Nationality` | string | No | Actor's nationality |
| `IsActive` | boolean | No | Whether actor is active (default: `true`) |
| `SortOrder` | number | No | Display order (default: `0`) |

---

## Age Restrictions

- `G` - General audience
- `PG` - Parental guidance suggested
- `PG-13` - Parents strongly cautioned
- `R` - Restricted
- `NC-17` - Adults only

---

## 📊 Dashboard & Analytics APIs

### 1. Get Dashboard Overview

Get comprehensive dashboard statistics including views, watch time, active users, server load, and more.

**Endpoint:** `GET /api/admin/dashboard/overview`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "todayViews": 1250,
    "todayWatchTime": 125000,
    "todayWatchTimeFormatted": "34h 43m 20s",
    "activeUsers": 45,
    "liveViewers": 12,
    "monthWatchTime": 2500000,
    "monthWatchTimeFormatted": "694h 26m 40s",
    "avgWatchTimePerUser": 2500,
    "avgWatchTimePerUserFormatted": "41m 40s",
    "bounceRate": 15.5,
    "completionRate": 68.2,
    "serverLoad": {
      "cpuUsage": 0.75,
      "totalMemory": 8589934592,
      "freeMemory": 4294967296,
      "usedMemory": 4294967296,
      "memoryUsagePercent": 50.0,
      "uptime": 86400
    }
  }
}
```

**Fields Description:**
- `todayViews`: Total video views today
- `todayWatchTime`: Total watch time in seconds today
- `todayWatchTimeFormatted`: Human-readable watch time format
- `activeUsers`: Users who watched videos in last 5 minutes
- `liveViewers`: Users currently watching (last 2 minutes)
- `monthWatchTime`: Total watch time in seconds this month
- `monthWatchTimeFormatted`: Human-readable monthly watch time
- `avgWatchTimePerUser`: Average watch time per user today (seconds)
- `avgWatchTimePerUserFormatted`: Human-readable average watch time
- `bounceRate`: Percentage of users who watched less than 10 seconds
- `completionRate`: Percentage of videos watched 90% or more
- `serverLoad`: Server performance metrics
  - `cpuUsage`: 1-minute load average
  - `totalMemory`: Total system memory in bytes
  - `freeMemory`: Free system memory in bytes
  - `usedMemory`: Used system memory in bytes
  - `memoryUsagePercent`: Memory usage percentage
  - `uptime`: System uptime in seconds

---

### 2. Get Views vs Watch Time Graph

Get graph data showing views and watch time over a period.

**Endpoint:** `GET /api/admin/dashboard/views-watchtime`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `period` (optional): Time period - `7d`, `30d`, `90d` (default: `7d`)

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/admin/dashboard/views-watchtime?period=30d" \
  -H "Authorization: Bearer <admin-token>"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2024-01-01",
      "views": 150,
      "watchTime": 12500,
      "watchTimeFormatted": "3h 28m 20s"
    },
    {
      "date": "2024-01-02",
      "views": 200,
      "watchTime": 18000,
      "watchTimeFormatted": "5h 0m 0s"
    }
  ],
  "period": "30d"
}
```

**Fields Description:**
- `date`: Date in YYYY-MM-DD format
- `views`: Number of views on that date
- `watchTime`: Total watch time in seconds
- `watchTimeFormatted`: Human-readable watch time

---

### 3. Get User Growth Data

Get user growth statistics (daily or weekly).

**Endpoint:** `GET /api/admin/dashboard/user-growth`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `type` (optional): Growth type - `daily` or `weekly` (default: `daily`)

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/admin/dashboard/user-growth?type=weekly" \
  -H "Authorization: Bearer <admin-token>"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "period": "2024-W01",
      "newUsers": 50,
      "cumulativeUsers": 50
    },
    {
      "period": "2024-W02",
      "newUsers": 75,
      "cumulativeUsers": 125
    }
  ],
  "type": "weekly"
}
```

**Fields Description:**
- `period`: Date (YYYY-MM-DD) or week (YYYY-W##) format
- `newUsers`: New users registered in that period
- `cumulativeUsers`: Total users up to that period

---

### 4. Get Peak Streaming Time

Get hour-wise streaming statistics to identify peak viewing times.

**Endpoint:** `GET /api/admin/dashboard/peak-streaming`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**
- `days` (optional): Number of days to analyze (default: `7`)

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/admin/dashboard/peak-streaming?days=30" \
  -H "Authorization: Bearer <admin-token>"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "hour": 0,
      "hourLabel": "12:00 AM",
      "views": 50,
      "watchTime": 5000,
      "watchTimeFormatted": "1h 23m 20s",
      "uniqueUsers": 25
    },
    {
      "hour": 1,
      "hourLabel": "1:00 AM",
      "views": 30,
      "watchTime": 3000,
      "watchTimeFormatted": "50m 0s",
      "uniqueUsers": 15
    }
  ],
  "days": 30
}
```

**Fields Description:**
- `hour`: Hour of day (0-23)
- `hourLabel`: Human-readable hour label (e.g., "12:00 AM")
- `views`: Total views during that hour
- `watchTime`: Total watch time in seconds during that hour
- `watchTimeFormatted`: Human-readable watch time
- `uniqueUsers`: Number of unique users who watched during that hour

**Note:** Returns data for all 24 hours, with 0 values for hours with no activity.

---

## 💰 Coin Withdrawal Management APIs

Coin withdrawal management APIs allow admins to manage user withdrawal requests. Sub-admins require appropriate permissions (`withdrawal:read`, `withdrawal:update`) based on their assigned roles.

### Permissions Required

- **`withdrawal:read`** - View withdrawal requests and statistics
- **`withdrawal:update`** - Update withdrawal request status and process payments

### 1. Get All Withdrawal Requests

Get a paginated list of all withdrawal requests with filtering options.

**Endpoint:** `GET /api/admin/withdrawals`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20) |
| `status` | string | No | Filter by status: `pending`, `approved`, `rejected`, `paid`, `failed` |
| `paymentMethod` | string | No | Filter by payment method: `upi`, `bank` |
| `search` | string | No | Search by user email or name |

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/admin/withdrawals?status=pending&page=1&limit=20" \
  -H "Authorization: Bearer <admin-token>"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k13",
      "User": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
        "Name": "John Doe",
        "Email": "john@example.com",
        "Coins": 500
      },
      "Amount": 1000,
      "PaymentMethod": "upi",
      "UPIId": "john@paytm",
      "Status": "pending",
      "AdminNotes": null,
      "ProcessedBy": null,
      "ProcessedAt": null,
      "TransactionId": null,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k14",
      "User": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "Name": "Jane Smith",
        "Email": "jane@example.com",
        "Coins": 200
      },
      "Amount": 500,
      "PaymentMethod": "bank",
      "BankName": "State Bank of India",
      "AccountNumber": "1234567890123456",
      "IFSCode": "SBIN0001234",
      "AccountHolderName": "Jane Smith",
      "BankBranch": "Mumbai Main",
      "Status": "paid",
      "AdminNotes": "Payment processed successfully",
      "ProcessedBy": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "Name": "Admin User",
        "Email": "admin@example.com"
      },
      "ProcessedAt": "2024-01-15T11:00:00.000Z",
      "TransactionId": "TXN123456789",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
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

### 2. Get Withdrawal Request by ID

Get detailed information about a specific withdrawal request.

**Endpoint:** `GET /api/admin/withdrawals/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k13",
    "User": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "Name": "John Doe",
      "Email": "john@example.com",
      "Coins": 500
    },
    "Amount": 1000,
    "PaymentMethod": "upi",
    "UPIId": "john@paytm",
    "Status": "pending",
    "AdminNotes": null,
    "ProcessedBy": null,
    "ProcessedAt": null,
    "TransactionId": null,
    "RejectionReason": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 3. Update Withdrawal Request Status

Update withdrawal request status, add admin notes, and mark payment as successful or failed.

**Endpoint:** `PATCH /api/admin/withdrawals/:id/status`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Status": "paid",
  "AdminNotes": "Payment processed successfully via UPI",
  "TransactionId": "TXN123456789"
}
```

**Fields:**
- `Status` (required): `pending`, `approved`, `rejected`, `paid`, `failed`
- `AdminNotes` (optional): Admin notes about the withdrawal
- `TransactionId` (optional): Transaction ID for payment tracking
- `RejectionReason` (optional): Reason for rejection (required when Status is `rejected`)

**Status Flow:**
- `pending` → `approved` → `paid` (successful flow)
- `pending` → `rejected` (rejected flow - coins refunded)
- `approved` → `paid` (mark as paid)
- `approved` → `failed` (mark as failed)

**Success Response (200):**
```json
{
  "success": true,
  "message": "Withdrawal request paid successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k13",
    "Status": "paid",
    "Amount": 1000,
    "User": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k1",
      "Name": "John Doe",
      "Email": "john@example.com",
      "Coins": 500
    },
    "ProcessedBy": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "Name": "Admin User",
      "Email": "admin@example.com"
    },
    "ProcessedAt": "2024-01-15T11:00:00.000Z",
    "AdminNotes": "Payment processed successfully via UPI",
    "TransactionId": "TXN123456789",
    "coinsRefunded": 0
  }
}
```

**Note:** When a withdrawal request is rejected from `pending` status, coins are automatically refunded to the user's account.

---

### 4. Get Withdrawal Statistics

Get comprehensive statistics about withdrawal requests.

**Endpoint:** `GET /api/admin/withdrawals/stats`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "pending": 25,
    "approved": 30,
    "rejected": 20,
    "paid": 65,
    "failed": 10,
    "totalAmount": {
      "pending": 25000,
      "approved": 30000,
      "paid": 65000
    },
    "byPaymentMethod": {
      "upi": 100,
      "bank": 50
    }
  }
}
```

---

## 👤 User Withdrawal APIs

### 1. Create Withdrawal Request

Create a new withdrawal request. Coins are deducted immediately and will be refunded if the request is rejected.

**Endpoint:** `POST /api/user/withdrawals`

**Headers:**
```
Authorization: Bearer <user-token>
Content-Type: application/json
```

**Request Body (UPI):**
```json
{
  "Amount": 1000,
  "PaymentMethod": "upi",
  "UPIId": "user@paytm"
}
```

**Request Body (Bank Transfer):**
```json
{
  "Amount": 1000,
  "PaymentMethod": "bank",
  "BankName": "State Bank of India",
  "AccountNumber": "1234567890123456",
  "IFSCode": "SBIN0001234",
  "AccountHolderName": "John Doe",
  "BankBranch": "Mumbai Main"
}
```

**Required Fields:**
- `Amount` (number) - Amount of coins to withdraw (must be > 0)
- `PaymentMethod` (string) - `upi` or `bank`

**For UPI:**
- `UPIId` (string) - UPI ID (e.g., `user@paytm`, `user@phonepe`)

**For Bank Transfer:**
- `BankName` (string) - Bank name
- `AccountNumber` (string) - Bank account number
- `IFSCode` (string) - IFSC code
- `AccountHolderName` (string) - Account holder name
- `BankBranch` (string, optional) - Bank branch

**Success Response (201):**
```json
{
  "success": true,
  "message": "Withdrawal request created successfully. Your coins have been deducted and will be refunded if the request is rejected.",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k13",
    "Amount": 1000,
    "PaymentMethod": "upi",
    "Status": "pending",
    "UPIId": "user@paytm",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedCoins": 4000
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Insufficient coins. You have 500 coins, but requested 1000",
  "availableCoins": 500
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "You already have a pending withdrawal request. Please wait for it to be processed.",
  "pendingRequest": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k13",
    "Amount": 500,
    "Status": "pending",
    "createdAt": "2024-01-15T10:00:00.000Z"
  }
}
```

---

### 2. Get My Withdrawal Requests

Get all withdrawal requests for the current user.

**Endpoint:** `GET /api/user/withdrawals`

**Headers:**
```
Authorization: Bearer <user-token>
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k13",
      "Amount": 1000,
      "PaymentMethod": "upi",
      "UPIId": "user@paytm",
      "Status": "paid",
      "AdminNotes": "Payment processed successfully",
      "TransactionId": "TXN123456789",
      "ProcessedBy": {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
        "Name": "Admin User",
        "Email": "admin@example.com"
      },
      "ProcessedAt": "2024-01-15T11:00:00.000Z",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T11:00:00.000Z"
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

**Note:** Account numbers are masked for security (only last 4 digits shown).

---

### 3. Get Withdrawal Request by ID

Get details of a specific withdrawal request (user's own request only).

**Endpoint:** `GET /api/user/withdrawals/:id`

**Headers:**
```
Authorization: Bearer <user-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k13",
    "Amount": 1000,
    "PaymentMethod": "upi",
    "UPIId": "user@paytm",
    "Status": "pending",
    "AdminNotes": null,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 4. Cancel Withdrawal Request

Cancel a pending withdrawal request. Coins will be refunded to the user's account.

**Endpoint:** `DELETE /api/user/withdrawals/:id`

**Headers:**
```
Authorization: Bearer <user-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Withdrawal request cancelled successfully. Coins have been refunded.",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k13",
    "Status": "rejected",
    "refundedCoins": 1000,
    "updatedCoins": 5000
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Pending withdrawal request not found"
}
```

---

### Withdrawal Status Values

- `pending` - Request submitted, awaiting admin review
- `approved` - Request approved by admin, ready for payment
- `rejected` - Request rejected (coins refunded to user)
- `paid` - Payment processed successfully
- `failed` - Payment failed

### Payment Methods

- `upi` - UPI payment (requires UPI ID)
- `bank` - Bank transfer (requires bank details)

---

## Error Responses


## 📧 Contact Management APIs

Contact management APIs allow admins and sub-admins to manage sponsor contact form submissions. Sub-admins require appropriate permissions (`contact:read`, `contact:update`, `contact:delete`) based on their assigned roles.

### Permissions Required

- **`contact:read`** - View contacts and statistics
- **`contact:update`** - Update contact status, add notes, mark as reached out
- **`contact:delete`** - Delete contacts

### 1. Get All Contacts

Get a paginated list of all contacts with filtering options.

**Endpoint:** `GET /api/admin/contacts`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number (default: 1) |
| `limit` | number | No | Items per page (default: 20) |
| `search` | string | No | Search by name, email, company, subject, or message |
| `status` | string | No | Filter by status: `new`, `contacted`, `replied`, `resolved`, `archived` |
| `type` | string | No | Filter by type: `sponsor`, `general`, `support`, `partnership` |
| `isReachedOut` | boolean | No | Filter by reached out status (`true`/`false`) |
| `priority` | string | No | Filter by priority: `low`, `medium`, `high`, `urgent` |

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/admin/contacts?status=new&type=sponsor&page=1&limit=20" \
  -H "Authorization: Bearer <admin-token>"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k11",
      "Name": "John Sponsor",
      "Email": "john@sponsor.com",
      "Phone": "+1234567890",
      "Company": "Sponsor Company Inc.",
      "Subject": "Partnership Inquiry",
      "Message": "We are interested in sponsoring your platform...",
      "Type": "sponsor",
      "Status": "new",
      "IsReachedOut": false,
      "Priority": "high",
      "Source": "website",
      "Notes": null,
      "AdminNotes": [],
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
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

### 2. Get Contact by ID

Get detailed information about a specific contact including all admin notes.

**Endpoint:** `GET /api/admin/contacts/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k11",
    "Name": "John Sponsor",
    "Email": "john@sponsor.com",
    "Phone": "+1234567890",
    "Company": "Sponsor Company Inc.",
    "Subject": "Partnership Inquiry",
    "Message": "We are interested in sponsoring your platform...",
    "Type": "sponsor",
    "Status": "contacted",
    "IsReachedOut": true,
    "ReachedOutAt": "2024-01-15T11:00:00.000Z",
    "ReachedOutBy": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "Name": "Admin User",
      "Email": "admin@example.com"
    },
    "Priority": "high",
    "Source": "website",
    "Notes": "Initial contact made via email",
    "AdminNotes": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k12",
        "Note": "Followed up on partnership proposal",
        "CreatedBy": {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
          "Name": "Admin User",
          "Email": "admin@example.com"
        },
        "createdAt": "2024-01-15T12:00:00.000Z"
      }
    ],
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T12:00:00.000Z"
  }
}
```

---

### 3. Update Contact Status

Update contact status, mark as reached out, add notes, or change priority.

**Endpoint:** `PATCH /api/admin/contacts/:id/status`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Status": "contacted",
  "IsReachedOut": true,
  "Notes": "Initial contact made via email",
  "Priority": "high"
}
```

**Fields:**
- `Status` (optional): `new`, `contacted`, `replied`, `resolved`, `archived`
- `IsReachedOut` (optional): `true` or `false` - When set to `true`, automatically sets `ReachedOutAt` and `ReachedOutBy`
- `Notes` (optional): General notes about the contact
- `Priority` (optional): `low`, `medium`, `high`, `urgent`

**Success Response (200):**
```json
{
  "success": true,
  "message": "Contact updated successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k11",
    "Name": "John Sponsor",
    "Email": "john@sponsor.com",
    "Status": "contacted",
    "IsReachedOut": true,
    "ReachedOutAt": "2024-01-15T11:00:00.000Z",
    "ReachedOutBy": {
      "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
      "Name": "Admin User",
      "Email": "admin@example.com"
    },
    "Notes": "Initial contact made via email",
    "Priority": "high",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

---

### 4. Add Admin Note

Add a note to a contact. Notes are timestamped and linked to the admin who created them.

**Endpoint:** `POST /api/admin/contacts/:id/notes`

**Headers:**
```
Authorization: Bearer <admin-token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "Note": "Followed up on partnership proposal. Waiting for response."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Note added successfully",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k11",
    "AdminNotes": [
      {
        "_id": "65a1b2c3d4e5f6g7h8i9j0k12",
        "Note": "Followed up on partnership proposal. Waiting for response.",
        "CreatedBy": {
          "_id": "65a1b2c3d4e5f6g7h8i9j0k2",
          "Name": "Admin User",
          "Email": "admin@example.com"
        },
        "createdAt": "2024-01-15T12:00:00.000Z"
      }
    ]
  }
}
```

---

### 5. Delete Contact

Delete a contact permanently.

**Endpoint:** `DELETE /api/admin/contacts/:id`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

---

### 6. Get Contact Statistics

Get comprehensive statistics about contacts.

**Endpoint:** `GET /api/admin/contacts/stats`

**Headers:**
```
Authorization: Bearer <admin-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total": 150,
    "new": 25,
    "contacted": 50,
    "replied": 30,
    "resolved": 35,
    "archived": 10,
    "reachedOut": 80,
    "notReachedOut": 70,
    "byType": {
      "sponsor": 100,
      "general": 30,
      "support": 15,
      "partnership": 5
    },
    "byPriority": {
      "low": 20,
      "medium": 80,
      "high": 40,
      "urgent": 10
    }
  }
}
```

---

## 📝 Public Contact Form API

### Submit Contact Form

Submit a contact form (public endpoint, no authentication required). Primarily for sponsors but supports other contact types.

**Endpoint:** `POST /api/contacts/submit`

**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "Name": "John Sponsor",
  "Email": "john@sponsor.com",
  "Phone": "+1234567890",
  "Company": "Sponsor Company Inc.",
  "Subject": "Partnership Inquiry",
  "Message": "We are interested in sponsoring your platform and would like to discuss partnership opportunities.",
  "Type": "sponsor",
  "Source": "website"
}
```

**Required Fields:**
- `Name` (string) - Contact name
- `Email` (string) - Valid email address
- `Message` (string) - Contact message

**Optional Fields:**
- `Phone` (string) - Phone number
- `Company` (string) - Company name
- `Subject` (string) - Subject line
- `Type` (string) - Contact type: `sponsor` (default), `general`, `support`, `partnership`
- `Source` (string) - Source of contact (e.g., `website`, `mobile-app`)

**Success Response (201):**
```json
{
  "success": true,
  "message": "Contact form submitted successfully. We will get back to you soon!",
  "data": {
    "_id": "65a1b2c3d4e5f6g7h8i9j0k11",
    "Name": "John Sponsor",
    "Email": "john@sponsor.com",
    "Status": "new",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Name, Email, and Message are required"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Invalid email format"
}
```

---

### Contact Status Values

- `new` - New contact, not yet reviewed
- `contacted` - Initial contact has been made
- `replied` - Contact has replied
- `resolved` - Contact issue resolved
- `archived` - Contact archived

### Contact Types

- `sponsor` - Sponsor inquiry (default)
- `general` - General inquiry
- `support` - Support request
- `partnership` - Partnership inquiry

### Contact Priority Levels

- `low` - Low priority
- `medium` - Medium priority (default)
- `high` - High priority
- `urgent` - Urgent priority

---

## Error Responses

