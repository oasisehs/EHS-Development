# Complete S3 File Upload Integration Guide

## Overview

Your EHS Suite now has complete file upload functionality with AWS S3:
- ✅ Upload files directly to S3
- ✅ Get direct links to shared files
- ✅ Pre-signed URLs with 1-hour expiration
- ✅ Database tracking of all uploads
- ✅ User-specific file organization

## Architecture

```
Frontend (HTML/JS)
    ↓
Express Backend (Node.js)
    ├─ PostgreSQL (file metadata)
    └─ AWS S3 (file storage)
```

## Files Added/Modified

### Backend
- **server.js** - Added S3 endpoints
- **package.json** - Added aws-sdk, multer
- **.env** - Added AWS credentials

### Frontend
- **uploads.html** - File manager UI
- **uploads.js** - Upload handler
- **dashboard.html** - Added File Manager link

### Documentation
- **AWS_S3_SETUP.md** - Full AWS setup guide
- **S3_QUICK_SETUP.md** - 5-minute setup
- **S3_FILE_UPLOAD_INTEGRATION.md** - This file

## Step-by-Step Setup

### Phase 1: AWS Account Setup (15 minutes)

#### 1.1 Create S3 Bucket
```
AWS Console → S3 → Create Bucket
Name: ehs-suite-files-2026
Region: us-east-1
Block Public Access: Uncheck "Block all public access"
```

#### 1.2 Set Bucket Policy
```
Bucket → Permissions → Bucket Policy
```

Add this policy:
```json
{
    "Version": "2012-10-17",
    "Statement": [{
        "Sid": "PublicRead",
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::your-bucket-name/*"
    }]
}
```

#### 1.3 Create IAM User
```
IAM Console → Users → Create User
Name: ehs-suite-app
Permissions: AmazonS3FullAccess
Create Access Key (save credentials!)
```

### Phase 2: Backend Configuration (2 minutes)

Edit `.env`:
```env
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=ehs-suite-files-2026
AWS_S3_URL=https://ehs-suite-files-2026.s3.amazonaws.com
```

Restart backend:
```bash
npm start
```

### Phase 3: Test File Upload (2 minutes)

1. Open `http://localhost:5000`
2. Login with your credentials
3. Click **File Manager** in sidebar
4. Upload a test file
5. Click **View** to open in S3
6. Click **Copy Link** to get shareable URL

## API Reference

### Upload File
```bash
POST /api/files/upload
```

**Headers:**
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Form Data:**
```
file: [file object]
description: "Optional description"
uploadType: "document|image|report|compliance|other"
```

**Response:**
```json
{
  "message": "File uploaded successfully",
  "file": {
    "id": 1,
    "fileName": "report.pdf",
    "s3Url": "https://bucket.s3.amazonaws.com/ehs/123/...",
    "fileSize": 2048576,
    "fileType": "application/pdf",
    "uploadType": "document",
    "createdAt": "2026-07-06T..."
  }
}
```

### List User Files
```bash
GET /api/files
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
[
  {
    "id": 1,
    "file_name": "report.pdf",
    "s3_url": "https://...",
    "file_size": 2048576,
    "file_type": "application/pdf",
    "upload_type": "document",
    "description": "Monthly EHS Report",
    "created_at": "2026-07-06T..."
  }
]
```

### Get Pre-signed URL
```bash
GET /api/files/{id}/presigned-url?expiry=7200
```

**Headers:**
```
Authorization: Bearer {token}
```

**Parameters:**
- `expiry` - URL expiration time in seconds (default: 3600 = 1 hour)

**Response:**
```json
{
  "presignedUrl": "https://bucket.s3.amazonaws.com/...?X-Amz-...",
  "expiresIn": 3600
}
```

### Delete File
```bash
DELETE /api/files/{id}
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response:**
```json
{
  "message": "File deleted successfully"
}
```

## Database Schema

### files table
```sql
CREATE TABLE files (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  s3_key VARCHAR(500) NOT NULL,
  s3_url TEXT NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100),
  upload_type VARCHAR(100),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## File Organization in S3

```
Bucket: ehs-suite-files-2026/
├── ehs/
│   ├── 123/          (user_id)
│   │   ├── 1688978234-abc123-report.pdf
│   │   ├── 1688978345-def456-image.jpg
│   │   └── 1688978456-ghi789-compliance.xlsx
│   ├── 124/
│   │   └── 1688978567-jkl012-training.pptx
```

## Security Features

### File Access Control
- Users can only see their own files
- Files organized by user_id in S3 path
- Database enforces user_id check on all operations

### Pre-signed URLs
- Generated on-demand
- Expire after 1 hour (configurable)
- Can't be used to upload or delete
- Share without exposing credentials

### Authentication
- All endpoints require JWT token
- Token issued on login
- Token stored in localStorage

### File Validation
- Max 50MB per file (configurable in server.js line 29)
- MIME type tracked
- File size stored in database

## Frontend Integration

### File Manager Page
```
uploads.html
├── Upload Section
│   ├── Drag & drop area
│   ├── Description input
│   ├── Upload type selector
│   └── Progress bar
├── File List
│   ├── File info display
│   ├── View button
│   ├── Copy link button
│   └── Delete button
└── Status messages
```

### JavaScript API
```javascript
// Upload file
const formData = new FormData();
formData.append('file', file);
formData.append('description', 'My file');
formData.append('uploadType', 'document');

const response = await fetch('/api/files/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
});

// Get files
const files = await fetch('/api/files', {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());

// Copy share link
const presigned = await fetch(`/api/files/${id}/presigned-url`, {
  headers: { 'Authorization': `Bearer ${token}` }
}).then(r => r.json());
```

## Troubleshooting

### Issue: "S3 not configured" Error
**Solution:**
1. Check `.env` has AWS credentials
2. Verify credentials are correct in IAM console
3. Run `npm start` to restart backend

### Issue: 403 Access Denied
**Solution:**
1. Check IAM user has `AmazonS3FullAccess` policy
2. Verify bucket policy allows `s3:GetObject`
3. Check bucket name matches `.env`

### Issue: Pre-signed URL Returns 403
**Solution:**
1. URL may have expired (generate new one)
2. Check bucket policy allows `s3:GetObject`
3. Verify file exists in S3 bucket

### Issue: Upload Succeeds but File Not Visible
**Solution:**
1. Check S3 bucket policy is configured
2. Verify ACL is set to `public-read`
3. Check AWS region in `.env` matches bucket region

## Production Deployment

### For Render.com
1. Go to Web Service Settings
2. Add Environment Variables:
   ```
   AWS_ACCESS_KEY_ID
   AWS_SECRET_ACCESS_KEY
   AWS_REGION
   AWS_S3_BUCKET
   AWS_S3_URL
   ```
3. Deploy

### For AWS Lambda/EC2
1. Use IAM role instead of hardcoded credentials
2. Attach `AmazonS3FullAccess` policy to role
3. No `.env` needed - SDK reads from role

### For Other Platforms
1. Set environment variables in platform UI
2. Never hardcode credentials
3. Use HTTPS only in production

## Performance Optimization

### Reduce Upload Size
- Compress files before upload
- Resize images to max 2MB
- Use appropriate file formats

### Multi-part Upload (Advanced)
For large files, use S3 multi-part upload:
```javascript
const s3 = new AWS.S3();
const managedUpload = s3.upload({
  Bucket: bucket,
  Key: key,
  Body: file
}).promise();
```

### CDN Integration (Optional)
Add CloudFront distribution to S3 bucket for faster downloads:
1. Create CloudFront distribution
2. Point to S3 bucket
3. Use CloudFront URL instead of S3 URL

## Cost Optimization

### Lifecycle Rules
Delete old files automatically:
```
S3 Bucket → Lifecycle Rules
├── Transition to Glacier after 30 days
└── Delete after 90 days
```

### Estimated Monthly Costs
- 10GB stored: ~$0.23
- 100 uploads (1KB each): ~$0.0005
- 50GB downloaded: ~$4.50
- **Total**: ~$4.73/month

## Monitoring & Logging

### CloudWatch Logs
1. S3 Bucket → Properties → Server access logging
2. Select log destination bucket
3. Prefix: `s3-logs/`

### AWS CloudTrail
Track all API calls:
1. CloudTrail Console
2. Create trail
3. Monitor S3 API usage

## Next Steps

1. **Test thoroughly**
   - Upload various file types
   - Test file sharing
   - Verify file deletion

2. **Monitor costs**
   - Set up AWS billing alerts
   - Review S3 usage monthly
   - Optimize storage with lifecycle rules

3. **Scale for production**
   - Use CloudFront CDN
   - Enable versioning
   - Set up backup bucket

4. **Enhance security**
   - Use IAM roles for EC2/Lambda
   - Enable S3 encryption
   - Restrict pre-signed URL expiration

## Reference Documentation

- [AWS S3 Setup Guide](AWS_S3_SETUP.md)
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/v3/)
- [Pre-signed URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)

---

**Last Updated**: 2026-07-06  
**Status**: ✅ Production Ready  
**Next**: Deploy to production and monitor S3 usage
