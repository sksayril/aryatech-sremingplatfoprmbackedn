const { S3Client } = require('@aws-sdk/client-s3');

const region = process.env.AWS_REGION || 'us-east-1';

// Build S3 client configuration
const s3Config = {
  region: region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

// Add custom endpoint if provided (for S3-compatible services or specific AWS regions)
if (process.env.AWS_S3_ENDPOINT) {
  s3Config.endpoint = process.env.AWS_S3_ENDPOINT;
  // Remove trailing slash if present
  if (s3Config.endpoint.endsWith('/')) {
    s3Config.endpoint = s3Config.endpoint.slice(0, -1);
  }
  console.log(`✅ Using custom S3 endpoint: ${s3Config.endpoint}`);
}

// For buckets that require path-style access (usually for S3-compatible services)
if (process.env.AWS_S3_FORCE_PATH_STYLE === 'true') {
  s3Config.forcePathStyle = true;
  console.log(`✅ Using path-style S3 access`);
}

const s3Client = new S3Client(s3Config);

// Log configuration on startup
console.log(`📦 S3 Client configured:`);
console.log(`   Region: ${region}`);
console.log(`   Bucket: ${process.env.AWS_S3_BUCKET || 'NOT SET'}`);
console.log(`   Endpoint: ${s3Config.endpoint || 'Auto-detect (AWS SDK default)'}`);
console.log(`   Force Path Style: ${s3Config.forcePathStyle || false}`);

module.exports = s3Client;

