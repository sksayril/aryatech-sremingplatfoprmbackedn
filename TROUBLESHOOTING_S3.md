# S3 Upload Troubleshooting Guide

## Error: "The bucket you are attempting to access must be addressed using the specified endpoint"

This error occurs when the AWS region configured doesn't match your S3 bucket's actual region.

### Solution 1: Verify and Update AWS_REGION

1. **Check your bucket's region in AWS Console:**
   - Go to AWS S3 Console
   - Select your bucket
   - Check the "Properties" tab
   - Note the "AWS Region" value

2. **Update your `.env` file:**
   ```env
   AWS_REGION=your-actual-bucket-region
   ```
   
   Common regions:
   - `us-east-1` (N. Virginia)
   - `us-west-2` (Oregon)
   - `eu-west-1` (Ireland)
   - `us-east-1` (Mumbai)
   - etc.

3. **Restart your server** after updating `.env`

### Solution 2: Verify Bucket Name

Ensure your bucket name in `.env` is correct:
```env
AWS_S3_BUCKET=your-exact-bucket-name
```

### Solution 3: Check AWS Credentials

Verify your AWS credentials have proper permissions:
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
```

Required IAM permissions:
- `s3:PutObject`
- `s3:GetObject`
- `s3:DeleteObject`
- `s3:ListBucket`

### Solution 4: Use Custom Endpoint (for S3-compatible services)

If you're using a service like DigitalOcean Spaces, Wasabi, or other S3-compatible storage:

```env
AWS_S3_ENDPOINT=https://your-region.digitaloceanspaces.com
AWS_S3_FORCE_PATH_STYLE=false
AWS_REGION=your-region
```

### Solution 5: Test S3 Connection

You can test your S3 configuration by checking the bucket location:

```bash
aws s3api get-bucket-location --bucket YOUR_BUCKET_NAME --region YOUR_REGION
```

### Common Region Mismatches

| Bucket Region | Correct AWS_REGION Value |
|--------------|-------------------------|
| US East (N. Virginia) | `us-east-1` |
| US West (Oregon) | `us-west-2` |
| EU (Ireland) | `eu-west-1` |
| Asia Pacific (Mumbai) | `us-east-1` |
| Asia Pacific (Singapore) | `ap-southeast-1` |

### Still Having Issues?

1. **Check AWS Console** - Verify bucket exists and is accessible
2. **Check IAM Permissions** - Ensure your AWS user has S3 access
3. **Check Network** - Ensure your server can reach AWS S3
4. **Check Bucket Policy** - Ensure bucket allows uploads from your IP/user

### Example .env Configuration

```env
# Correct configuration example
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=my-movie-bucket

# Optional: For S3-compatible services
# AWS_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com
# AWS_S3_FORCE_PATH_STYLE=false
```

