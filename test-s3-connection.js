#!/usr/bin/env node

const path = require('path');

// Add backend node_modules to path
const backendNodeModules = path.join(__dirname, 'backend', 'node_modules');
module.paths.push(backendNodeModules);

require('dotenv').config({ path: path.join(__dirname, 'backend', '.env') });

const { S3Client, ListBucketsCommand, HeadBucketCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const S3_BUCKET = process.env.AWS_S3_BUCKET;

async function testS3Connection() {
  try {
    console.log('🔍 Testing AWS S3 Connection...\n');
    console.log(`Region: ${process.env.AWS_REGION}`);
    console.log(`Bucket: ${S3_BUCKET}`);
    console.log(`Access Key ID: ${process.env.AWS_ACCESS_KEY_ID?.substring(0, 10)}...`);
    console.log('');

    // Test 1: List buckets (verifies credentials are valid)
    console.log('✓ Test 1: Verifying AWS credentials...');
    try {
      const listResult = await s3Client.send(new ListBucketsCommand({}));
      console.log(`  ✓ Credentials valid. Found ${listResult.Buckets.length} bucket(s)`);
      console.log(`  Buckets: ${listResult.Buckets.map(b => b.Name).join(', ')}`);
    } catch (err) {
      console.error(`  ✗ Failed to list buckets:`, err.message);
      return;
    }

    console.log('');

    // Test 2: Head bucket (verifies bucket access)
    console.log(`✓ Test 2: Checking access to bucket "${S3_BUCKET}"...`);
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: S3_BUCKET }));
      console.log(`  ✓ Bucket accessible and owned by you`);
    } catch (err) {
      if (err.$metadata?.httpStatusCode === 404) {
        console.error(`  ✗ Bucket not found: ${S3_BUCKET}`);
      } else if (err.$metadata?.httpStatusCode === 403) {
        console.error(`  ✗ Access denied to bucket: ${S3_BUCKET}`);
      } else {
        console.error(`  ✗ Error accessing bucket:`, err.message);
      }
      return;
    }

    console.log('');

    // Test 3: Test write permission with a small test file
    console.log('✓ Test 3: Testing write permission...');
    try {
      const testKey = `test/${Date.now()}-connection-test.txt`;
      const testContent = 'S3 connection test successful!';
      
      await s3Client.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: testKey,
        Body: testContent,
        ContentType: 'text/plain'
      }));
      
      console.log(`  ✓ Successfully uploaded test file to: ${testKey}`);
      console.log(`  File URL: https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${testKey}`);
    } catch (err) {
      console.error(`  ✗ Failed to upload test file:`, err.message);
      return;
    }

    console.log('');
    console.log('✅ ALL TESTS PASSED - S3 CONNECTION SUCCESSFUL');
    console.log('');
    console.log('Backend file upload will now use S3 for storage when:');
    console.log(`  - AWS_S3_BUCKET is set to "${S3_BUCKET}"`);
    console.log(`  - AWS credentials are configured`);
    console.log(`  - /api/files/upload endpoint receives file uploads`);

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

testS3Connection();
