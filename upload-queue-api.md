# Upload Queue Management API Documentation

## Overview

This document describes the Admin APIs for managing upload queues. Upload queues are background jobs that handle file uploads (videos, thumbnails, posters, subtitles) to S3 storage.

**Base URL:** `/api/admin/upload-queues`

**Authentication:** All endpoints require admin authentication via JWT token.

---

## Table of Contents

1. [Get All Upload Queues](#1-get-all-upload-queues)
2. [Get Pending Upload Queues](#2-get-pending-upload-queues)
3. [Search Upload Queues by Movie Title](#3-search-upload-queues-by-movie-title)
4. [Get Upload Queue Details by ID](#4-get-upload-queue-details-by-id)
5. [Delete Upload Queue](#5-delete-upload-queue)

---

## 1. Get All Upload Queues

Get a paginated list of all upload queues with optional filters.

**Performance Note:** By default, statistics are not included in the response for faster performance. Set `includeStats=true` only when you need statistics. This can significantly improve response time, especially with large datasets.

### Endpoint

```
GET /api/admin/upload-queues
```

### Headers

```
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `status` | string | No | - | Filter by status: `pending`, `processing`, `completed`, `failed` |
| `fileType` | string | No | - | Filter by file type: `video`, `thumbnail`, `poster`, `subtitle` |
| `movieId` | string | No | - | Filter by movie ID |
| `search` | string | No | - | Search by movie title or slug |
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page |
| `sortBy` | string | No | `createdAt` | Sort field |
| `sortOrder` | string | No | `desc` | Sort order: `asc` or `desc` |
| `includeStats` | string | No | `false` | Include statistics in response: `true` or `false` (set to `false` for faster response) |

### Example Request

```bash
curl -X GET "https://api.example.com/api/admin/upload-queues?status=pending&fileType=video&page=1&limit=10" \
  -H "Authorization: Bearer your-admin-jwt-token" \
  -H "Content-Type: application/json"
```

### Example Response

```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "_id": "6947d0ca8669cd8b61acff61",
        "movie": {
          "_id": "6947cf59cb43ba2846c1aa8a",
          "title": "Avengers: Endgame",
          "slug": "avengers-endgame",
          "thumbnail": "https://s3.amazonaws.com/bucket/thumbnails/thumb.jpg"
        },
        "user": {
          "_id": "6947cf59cb43ba2846c1aa8b",
          "name": "Admin User",
          "email": "admin@example.com"
        },
        "fileType": "video",
        "fileName": "grok-video-f6e3d4c1-bac7-47ad-b2c4-6f3e37fd63cb.mp4",
        "fileSize": 3349881,
        "progress": 50,
        "status": "processing",
        "uploadedSize": 1674940,
        "s3Url": "https://s3.amazonaws.com/bucket/movies/video.mp4",
        "errorMessage": null,
        "retries": 0,
        "maxRetries": 3,
        "createdAt": "2025-12-21T10:49:57.691Z",
        "updatedAt": "2025-12-21T10:50:01.700Z",
        "startedAt": "2025-12-21T10:49:58.000Z",
        "completedAt": null
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    },
    "statistics": {
      "pending": 10,
      "processing": 5,
      "completed": 30,
      "failed": 5,
      "retrying": 0
    }
  }
}
```

### Response Fields

#### Job Object

| Field | Type | Description |
|-------|------|-------------|
| `_id` | string | Upload queue job ID |
| `movie` | object | Movie information (null if movie deleted) |
| `movie._id` | string | Movie ID |
| `movie.title` | string | Movie title |
| `movie.slug` | string | Movie slug |
| `movie.thumbnail` | string | Movie thumbnail URL |
| `user` | object | User who created the upload |
| `user._id` | string | User ID |
| `user.name` | string | User name |
| `user.email` | string | User email |
| `fileType` | string | File type: `video`, `thumbnail`, `poster`, `subtitle` |
| `fileName` | string | Original file name |
| `fileSize` | number | File size in bytes |
| `progress` | number | Upload progress (0-100) |
| `status` | string | Job status: `pending`, `processing`, `completed`, `failed` |
| `uploadedSize` | number | Bytes uploaded so far |
| `s3Url` | string | S3 URL (if completed) |
| `errorMessage` | string | Error message (if failed) |
| `retries` | number | Number of retry attempts |
| `maxRetries` | number | Maximum retry attempts |
| `createdAt` | string | Creation timestamp (ISO 8601) |
| `updatedAt` | string | Last update timestamp (ISO 8601) |
| `startedAt` | string | Processing start timestamp (ISO 8601) |
| `completedAt` | string | Completion timestamp (ISO 8601) |

#### Statistics Object

| Field | Type | Description |
|-------|------|-------------|
| `pending` | number | Count of pending jobs |
| `processing` | number | Count of processing jobs |
| `completed` | number | Count of completed jobs |
| `failed` | number | Count of failed jobs |
| `retrying` | number | Count of retrying jobs |

### Error Responses

#### 401 Unauthorized

```json
{
  "success": false,
  "message": "Unauthorized access"
}
```

#### 500 Internal Server Error

```json
{
  "success": false,
  "message": "Failed to fetch upload queues",
  "error": "Error message"
}
```

---

## 2. Get Pending Upload Queues

Get a list of all pending upload queues (oldest first).

### Endpoint

```
GET /api/admin/upload-queues/pending
```

### Headers

```
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `fileType` | string | No | - | Filter by file type: `video`, `thumbnail`, `poster`, `subtitle` |
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page |

### Example Request

```bash
curl -X GET "https://api.example.com/api/admin/upload-queues/pending?fileType=video&page=1&limit=20" \
  -H "Authorization: Bearer your-admin-jwt-token" \
  -H "Content-Type: application/json"
```

### Example Response

```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "_id": "6947d0ca8669cd8b61acff61",
        "movie": {
          "_id": "6947cf59cb43ba2846c1aa8a",
          "title": "Avengers: Endgame",
          "slug": "avengers-endgame",
          "thumbnail": "https://s3.amazonaws.com/bucket/thumbnails/thumb.jpg"
        },
        "user": {
          "_id": "6947cf59cb43ba2846c1aa8b",
          "name": "Admin User",
          "email": "admin@example.com"
        },
        "fileType": "video",
        "fileName": "grok-video-f6e3d4c1-bac7-47ad-b2c4-6f3e37fd63cb.mp4",
        "fileSize": 3349881,
        "progress": 0,
        "status": "pending",
        "createdAt": "2025-12-21T10:49:57.691Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "pages": 1
    }
  }
}
```

### Error Responses

Same as [Get All Upload Queues](#1-get-all-upload-queues).

---

## 3. Search Upload Queues by Movie Title

Search for upload queues by movie title or slug.

### Endpoint

```
GET /api/admin/upload-queues/search
```

### Headers

```
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `title` | string | **Yes** | - | Movie title or slug to search |
| `status` | string | No | - | Filter by status: `pending`, `processing`, `completed`, `failed` |
| `fileType` | string | No | - | Filter by file type: `video`, `thumbnail`, `poster`, `subtitle` |
| `page` | number | No | 1 | Page number |
| `limit` | number | No | 20 | Items per page |

### Example Request

```bash
curl -X GET "https://api.example.com/api/admin/upload-queues/search?title=avengers&status=pending" \
  -H "Authorization: Bearer your-admin-jwt-token" \
  -H "Content-Type: application/json"
```

### Example Response

```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "_id": "6947d0ca8669cd8b61acff61",
        "movie": {
          "_id": "6947cf59cb43ba2846c1aa8a",
          "title": "Avengers: Endgame",
          "slug": "avengers-endgame",
          "thumbnail": "https://s3.amazonaws.com/bucket/thumbnails/thumb.jpg"
        },
        "user": {
          "_id": "6947cf59cb43ba2846c1aa8b",
          "name": "Admin User",
          "email": "admin@example.com"
        },
        "fileType": "video",
        "fileName": "grok-video-f6e3d4c1-bac7-47ad-b2c4-6f3e37fd63cb.mp4",
        "fileSize": 3349881,
        "progress": 0,
        "status": "pending",
        "uploadedSize": 0,
        "s3Url": null,
        "errorMessage": null,
        "createdAt": "2025-12-21T10:49:57.691Z"
      }
    ],
    "matchedMovies": [
      {
        "_id": "6947cf59cb43ba2846c1aa8a",
        "title": "Avengers: Endgame",
        "slug": "avengers-endgame"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1,
      "pages": 1
    }
  }
}
```

### Response Fields

#### Additional Fields

| Field | Type | Description |
|-------|------|-------------|
| `matchedMovies` | array | List of movies that matched the search query |

### Error Responses

#### 400 Bad Request (Missing Title)

```json
{
  "success": false,
  "message": "Movie title is required"
}
```

---

## 4. Get Upload Queue Details by ID

Get detailed information about a specific upload queue.

### Endpoint

```
GET /api/admin/upload-queues/:id
```

### Headers

```
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | **Yes** | Upload queue job ID |

### Example Request

```bash
curl -X GET "https://api.example.com/api/admin/upload-queues/6947d0ca8669cd8b61acff61" \
  -H "Authorization: Bearer your-admin-jwt-token" \
  -H "Content-Type: application/json"
```

### Example Response

```json
{
  "success": true,
  "data": {
    "_id": "6947d0ca8669cd8b61acff61",
    "movie": {
      "_id": "6947cf59cb43ba2846c1aa8a",
      "title": "Avengers: Endgame",
      "slug": "avengers-endgame",
      "description": "Movie description here...",
      "thumbnail": "https://s3.amazonaws.com/bucket/thumbnails/thumb.jpg",
      "poster": "https://s3.amazonaws.com/bucket/posters/poster.jpg",
      "category": "Action",
      "subCategory": "Superhero"
    },
    "user": {
      "_id": "6947cf59cb43ba2846c1aa8b",
      "name": "Admin User",
      "email": "admin@example.com",
      "profilePicture": "https://s3.amazonaws.com/bucket/profiles/profile.jpg"
    },
    "fileType": "video",
    "fileName": "grok-video-f6e3d4c1-bac7-47ad-b2c4-6f3e37fd63cb.mp4",
    "fileSize": 3349881,
    "mimeType": "video/mp4",
    "folder": "movies",
    "progress": 50,
    "status": "processing",
    "uploadedSize": 1674940,
    "s3Key": "movies/1734774597613-grok-video-f6e3d4c1-bac7-47ad-b2c4-6f3e37fd63cb.mp4",
    "s3Url": "https://s3.amazonaws.com/bucket/movies/video.mp4",
    "errorMessage": null,
    "metadata": {
      "quality": "1080p",
      "isOriginal": true
    },
    "retries": 0,
    "maxRetries": 3,
    "createdAt": "2025-12-21T10:49:57.691Z",
    "updatedAt": "2025-12-21T10:50:01.700Z",
    "startedAt": "2025-12-21T10:49:58.000Z",
    "completedAt": null
  }
}
```

### Response Fields

#### Additional Detailed Fields

| Field | Type | Description |
|-------|------|-------------|
| `mimeType` | string | MIME type of the file |
| `folder` | string | S3 folder path |
| `s3Key` | string | S3 object key |
| `metadata` | object | Additional metadata (quality, language, etc.) |

### Error Responses

#### 400 Bad Request (Invalid ID)

```json
{
  "success": false,
  "message": "Invalid queue ID"
}
```

#### 404 Not Found

```json
{
  "success": false,
  "message": "Upload queue not found"
}
```

---

## 5. Delete Upload Queue

Delete a failed or completed upload queue. Cannot delete pending or processing jobs.

### Endpoint

```
DELETE /api/admin/upload-queues/:id
```

### Headers

```
Authorization: Bearer <admin-jwt-token>
Content-Type: application/json
```

### URL Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | **Yes** | Upload queue job ID |

### Example Request

```bash
curl -X DELETE "https://api.example.com/api/admin/upload-queues/6947d0ca8669cd8b61acff61" \
  -H "Authorization: Bearer your-admin-jwt-token" \
  -H "Content-Type: application/json"
```

### Example Response

```json
{
  "success": true,
  "message": "Upload queue deleted successfully"
}
```

### Error Responses

#### 400 Bad Request (Invalid ID)

```json
{
  "success": false,
  "message": "Invalid queue ID"
}
```

#### 400 Bad Request (Cannot Delete)

```json
{
  "success": false,
  "message": "Cannot delete processing or pending jobs"
}
```

#### 404 Not Found

```json
{
  "success": false,
  "message": "Upload queue not found"
}
```

---

## Status Values

| Status | Description |
|--------|-------------|
| `pending` | Job is queued and waiting to be processed |
| `processing` | Job is currently being processed |
| `completed` | Job completed successfully |
| `failed` | Job failed (check `errorMessage` for details) |
| `retrying` | Job is being retried after a failure |

## File Type Values

| File Type | Description |
|-----------|-------------|
| `video` | Video file (MP4, WebM, etc.) |
| `thumbnail` | Thumbnail image |
| `poster` | Poster image |
| `subtitle` | Subtitle file (SRT, VTT) |

---

## JavaScript Examples

### Get All Pending Video Uploads

```javascript
const response = await fetch('https://api.example.com/api/admin/upload-queues?status=pending&fileType=video', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Pending video uploads:', data.data.jobs);
console.log('Statistics:', data.data.statistics);
```

### Search by Movie Title

```javascript
const searchTitle = 'avengers';
const response = await fetch(`https://api.example.com/api/admin/upload-queues/search?title=${encodeURIComponent(searchTitle)}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Matched movies:', data.data.matchedMovies);
console.log('Upload queues:', data.data.jobs);
```

### Get Queue Details

```javascript
const queueId = '6947d0ca8669cd8b61acff61';
const response = await fetch(`https://api.example.com/api/admin/upload-queues/${queueId}`, {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Queue details:', data.data);
console.log('Progress:', data.data.progress + '%');
console.log('Status:', data.data.status);
```

### Delete Failed Queue

```javascript
const queueId = '6947d0ca8669cd8b61acff61';
const response = await fetch(`https://api.example.com/api/admin/upload-queues/${queueId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
if (data.success) {
  console.log('Queue deleted successfully');
}
```

---

## Notes

1. **Authentication**: All endpoints require admin authentication. Include the JWT token in the `Authorization` header.

2. **Pagination**: All list endpoints support pagination. Use `page` and `limit` query parameters.

3. **Filtering**: Multiple filters can be combined. For example: `?status=failed&fileType=video&page=1`.

4. **Search**: The search endpoint performs case-insensitive partial matching on movie titles and slugs.

5. **Deletion**: Only failed or completed jobs can be deleted. Pending or processing jobs cannot be deleted to prevent data corruption.

6. **Real-time Updates**: Use polling to check queue status. The `progress` field updates in real-time during upload.

7. **Error Handling**: Always check the `errorMessage` field for failed jobs to understand why the upload failed.

---

## Related APIs

- [Movie Upload API](../movies.md#create-movie-with-upload-progress) - Create movies and queue uploads
- [Get Upload Progress](../movies.md#get-upload-progress) - Get upload progress for a movie
- [Worker Management API](../admin-api.md#worker-management) - Manage upload worker

