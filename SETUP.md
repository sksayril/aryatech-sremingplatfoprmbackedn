# Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables Setup

Create a `.env` file in the root directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3001

# Database Configuration
DATABASE_URL=mongodb://localhost:27017/movie-streaming

# JWT Configuration (REQUIRED)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-characters
JWT_EXPIRES_IN=30d

# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_S3_BUCKET=your-s3-bucket-name

# Admin Seed Configuration (Optional - for initial admin creation)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@123456
ADMIN_NAME=Super Admin

# Google Analytics (Optional)
GOOGLE_ANALYTICS_ID=UA-XXXXXXXXX-X
```

### 3. Generate JWT Secret

**IMPORTANT:** You must set a secure JWT_SECRET. Here are ways to generate one:

#### Option 1: Using Node.js
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

#### Option 2: Using OpenSSL
```bash
openssl rand -hex 64
```

#### Option 3: Online Generator
Visit: https://www.grc.com/passwords.htm (use 64+ character password)

**Example:**
```env
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2g3h4i5j6k7l8m9n0o1p2q3r4s5t6u7v8w9x0y1z2
```

### 4. Create First Admin User

```bash
npm run seed
```

This will create the first admin user. If you set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME` in `.env`, those will be used. Otherwise, defaults will be used.

### 5. Start the Server

```bash
npm start
# or for development
npm run dev
```

## Common Issues

### Error: "secretOrPrivateKey must have a value"

**Problem:** The `JWT_SECRET` environment variable is not set or is empty.

**Solution:**
1. Make sure you have a `.env` file in the root directory
2. Add `JWT_SECRET` to your `.env` file with a secure random string (minimum 32 characters)
3. Restart your server after adding the variable

**Quick Fix:**
```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Add to .env file
echo "JWT_SECRET=<generated-secret>" >> .env
```

### Error: "Database connection failed"

**Problem:** MongoDB is not running or `DATABASE_URL` is incorrect.

**Solution:**
1. Make sure MongoDB is installed and running
2. Check your `DATABASE_URL` in `.env`
3. For local MongoDB: `mongodb://localhost:27017/movie-streaming`
4. For MongoDB Atlas: Use your connection string from Atlas dashboard

### Error: "AWS credentials not configured"

**Problem:** AWS S3 credentials are missing (only needed for file uploads).

**Solution:**
1. If you're not using file uploads yet, you can skip AWS configuration
2. For production, set up AWS S3 bucket and add credentials to `.env`
3. Make sure your AWS user has S3 read/write permissions

## Environment Variables Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MongoDB connection string | `mongodb://localhost:27017/movie-streaming` |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | `your-secret-key-here` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `JWT_EXPIRES_IN` | JWT token expiration | `30d` |
| `BASE_URL` | Base URL of your API | `http://localhost:3000` |
| `FRONTEND_URL` | Frontend URL for CORS | `*` |
| `ADMIN_EMAIL` | Initial admin email | `admin@example.com` |
| `ADMIN_PASSWORD` | Initial admin password | `Admin@123456` |
| `ADMIN_NAME` | Initial admin name | `Super Admin` |

### AWS S3 Variables (Required for File Uploads)

| Variable | Description |
|----------|-------------|
| `AWS_REGION` | AWS region (e.g., us-east-1) |
| `AWS_ACCESS_KEY_ID` | AWS access key ID |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key |
| `AWS_S3_BUCKET` | S3 bucket name |

## Security Best Practices

1. **Never commit `.env` file to Git**
   - Already included in `.gitignore`
   - Use different secrets for development and production

2. **Use Strong JWT Secret**
   - Minimum 32 characters
   - Use random, unpredictable strings
   - Different secrets for each environment

3. **Change Default Admin Password**
   - After first login, change the default password
   - Use strong passwords (min 12 characters, mixed case, numbers, symbols)

4. **Secure MongoDB**
   - Use authentication in production
   - Restrict network access
   - Use MongoDB Atlas for managed hosting

5. **AWS Security**
   - Use IAM roles with minimal permissions
   - Rotate access keys regularly
   - Never expose credentials in code

## Testing the Setup

### 1. Test Database Connection

The server will automatically connect to MongoDB on startup. Check the console for:
```
Database connected!
```

### 2. Test Admin Login

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "Email": "admin@example.com",
    "Password": "Admin@123456"
  }'
```

You should receive a token in the response.

### 3. Test Admin Endpoint

```bash
# Use the token from step 2
curl -X GET http://localhost:3000/api/admin/movies \
  -H "Authorization: Bearer <your-token>"
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use strong, unique `JWT_SECRET`
3. Use secure MongoDB connection string
4. Configure AWS S3 with proper permissions
5. Set up proper CORS origins
6. Use HTTPS
7. Set up environment variables on your hosting platform
8. Enable MongoDB authentication
9. Use process manager (PM2) for Node.js
10. Set up monitoring and logging

## Need Help?

If you encounter any issues:

1. Check that all required environment variables are set
2. Verify MongoDB is running
3. Check server logs for detailed error messages
4. Ensure all dependencies are installed (`npm install`)
5. Verify file permissions


