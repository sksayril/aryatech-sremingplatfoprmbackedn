/**
 * Test S3 Connection Script
 * Helps diagnose S3 configuration issues
 */

require('dotenv').config();
const { S3Client, ListBucketsCommand, GetBucketLocationCommand } = require('@aws-sdk/client-s3');

const region = process.env.AWS_REGION || 'us-east-1';
const bucketName = process.env.AWS_S3_BUCKET || 'elboz';

// Debug: Show all AWS-related env vars
console.log('\n🔍 Environment Variables Check:');
console.log(`  AWS_REGION: ${process.env.AWS_REGION || 'NOT SET'}`);
console.log(`  AWS_S3_BUCKET: ${process.env.AWS_S3_BUCKET || 'NOT SET'}`);
console.log(`  S3_BUCKET_NAME: ${process.env.S3_BUCKET_NAME || 'NOT SET'}`);
console.log(`  Using bucket: ${bucketName || 'NOT SET'}\n`);

console.log('\n🔍 Testing S3 Connection...\n');
console.log('Configuration:');
console.log(`  Region: ${region}`);
console.log(`  Bucket: ${bucketName || 'NOT SET'}`);
console.log(`  Access Key ID: ${process.env.AWS_ACCESS_KEY_ID ? process.env.AWS_ACCESS_KEY_ID.substring(0, 10) + '...' : 'NOT SET'}`);
console.log(`  Secret Key: ${process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET'}`);
console.log(`  Endpoint: ${process.env.AWS_S3_ENDPOINT || 'Auto-detect'}`);
console.log(`  Force Path Style: ${process.env.AWS_S3_FORCE_PATH_STYLE || 'false'}\n`);

// Build S3 client configuration
const s3Config = {
  region: region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
};

if (process.env.AWS_S3_ENDPOINT) {
  s3Config.endpoint = process.env.AWS_S3_ENDPOINT;
  if (s3Config.endpoint.endsWith('/')) {
    s3Config.endpoint = s3Config.endpoint.slice(0, -1);
  }
}

if (process.env.AWS_S3_FORCE_PATH_STYLE === 'true') {
  s3Config.forcePathStyle = true;
}

const s3Client = new S3Client(s3Config);

async function testConnection() {
  try {
    // Test 1: List buckets (tests credentials)
    console.log('📋 Test 1: Listing buckets (testing credentials)...');
    const listCommand = new ListBucketsCommand({});
    const listResponse = await s3Client.send(listCommand);
    console.log('✅ Credentials are valid!');
    console.log(`   Found ${listResponse.Buckets?.length || 0} bucket(s)\n`);

    // Test 2: Get bucket location (tests bucket access and region)
    if (bucketName) {
      console.log(`📦 Test 2: Getting location for bucket "${bucketName}"...`);
      try {
        const locationCommand = new GetBucketLocationCommand({
          Bucket: bucketName,
        });
        const locationResponse = await s3Client.send(locationCommand);
        const bucketRegion = locationResponse.LocationConstraint || 'us-east-1';
        console.log(`✅ Bucket exists and is accessible!`);
        console.log(`   Bucket Region: ${bucketRegion}`);
        
        if (bucketRegion !== region && bucketRegion !== '') {
          console.log(`\n⚠️  WARNING: Region mismatch detected!`);
          console.log(`   Configured region: ${region}`);
          console.log(`   Actual bucket region: ${bucketRegion}`);
          console.log(`\n   💡 SOLUTION: Update your .env file:`);
          console.log(`   AWS_REGION=${bucketRegion}`);
          
          // Suggest endpoint based on region
          if (bucketRegion === 'us-east-1') {
            console.log(`   AWS_S3_ENDPOINT=https://s3.amazonaws.com`);
          } else {
            console.log(`   AWS_S3_ENDPOINT=https://s3.${bucketRegion}.amazonaws.com`);
          }
        } else {
          console.log(`   ✅ Region matches configuration`);
        }
      } catch (error) {
        console.log(`❌ Error accessing bucket: ${error.message}`);
        if (error.message.includes('endpoint')) {
          console.log(`\n   This is an endpoint error. The error message should contain the correct endpoint.`);
          console.log(`   Full error: ${error.message}`);
        }
        throw error;
      }
    } else {
      console.log('⚠️  Skipping bucket location test (AWS_S3_BUCKET not set)');
      console.log('\n   💡 Add to .env:');
      console.log('   AWS_S3_BUCKET=your-bucket-name');
    }

    // Final recommendations
    console.log('\n📝 Configuration Summary:');
    console.log(`   ✅ Region: ${region}`);
    console.log(`   ${bucketName ? '✅' : '❌'} Bucket: ${bucketName || 'NOT SET'}`);
    console.log(`   ${process.env.AWS_S3_ENDPOINT ? '✅' : '⚠️ '} Endpoint: ${process.env.AWS_S3_ENDPOINT || 'NOT SET (Auto-detect)'}`);
    
    if (!process.env.AWS_S3_ENDPOINT && region !== 'us-east-1') {
      console.log(`\n   🔧 REQUIRED: Add this to your .env file to fix upload errors:`);
      console.log(`   AWS_S3_ENDPOINT=https://s3.${region}.amazonaws.com`);
    }
    
    console.log('\n✅ All tests passed! Your S3 configuration is correct.\n');
    
    if (!process.env.AWS_S3_ENDPOINT && region !== 'us-east-1') {
      console.log('⚠️  WARNING: You may experience upload errors without AWS_S3_ENDPOINT set.');
      console.log('   Please add the endpoint to your .env file and restart the server.\n');
    }
  } catch (error) {
    console.log('\n❌ Connection test failed!\n');
    console.log('Error details:');
    console.log(`  Message: ${error.message}`);
    console.log(`  Code: ${error.Code || error.name || 'N/A'}`);
    console.log(`  Status Code: ${error.$metadata?.httpStatusCode || 'N/A'}`);
    
    if (error.message && error.message.includes('endpoint')) {
      console.log('\n🔧 Endpoint Error Detected!');
      console.log('\n   The error message should contain the correct endpoint.');
      console.log(`   Full error message: ${error.message}`);
      
      // Try to extract endpoint
      const endpointPatterns = [
        /endpoint[:\s]+([\w\d\.-]+\.amazonaws\.com)/i,
        /to this endpoint[:\s]+([\w\d\.-]+\.amazonaws\.com)/i,
        /([\w\d\.-]+\.amazonaws\.com)/i,
      ];
      
      for (const pattern of endpointPatterns) {
        const match = error.message.match(pattern);
        if (match && match[1]) {
          const endpoint = match[1].startsWith('http') ? match[1] : `https://${match[1]}`;
          console.log(`\n   ✅ Found endpoint in error: ${endpoint}`);
          console.log(`\n   💡 SOLUTION: Add this to your .env file:`);
          console.log(`   AWS_S3_ENDPOINT=${endpoint}`);
          console.log(`\n   Then restart your server.`);
          break;
        }
      }
      
      if (!error.message.match(/amazonaws\.com/i)) {
        console.log('\n   ⚠️  Could not extract endpoint from error message.');
        console.log('   Please check your AWS Console for the bucket region and set:');
        console.log('   AWS_REGION=<your-bucket-region>');
        console.log('   AWS_S3_ENDPOINT=https://s3.<your-bucket-region>.amazonaws.com');
      }
    }
    
    console.log('\n');
    process.exit(1);
  }
}

testConnection();

