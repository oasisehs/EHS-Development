# AWS S3 Integration Guide

## Overview
The EHS Suite now supports file uploads directly to AWS S3 with secure access links.

## Step 1: Create AWS Account & S3 Bucket

### 1.1 Create S3 Bucket
1. Go to [AWS Console](https://aws.amazon.com)
2. Search for **S3** → Click "Create bucket"
3. **Bucket name**: Enter a unique name (e.g., `ehs-suite-files-2026`)
4. **Region**: Select your region (e.g., `us-east-1`)
5. **Block Public Access settings**: 
   - ✅ Uncheck "Block public ACLs"
   - ✅ Uncheck "Ignore public ACLs"
   - Keep others checked
6. Click **Create bucket**

### 1.2 Create Bucket Policy
1. Go to S3 bucket → **Permissions** tab
2. Click **Bucket Policy**
3. Paste this policy (replace `your-bucket-name`):

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicRead",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

4. Click **Save**

## Step 2: Create IAM User for Your Application

### 2.1 Create IAM User
1. Go to [IAM Console](https://console.aws.amazon.com/iam)
2. Click **Users** → **Create user**
3. **User name**: `ehs-suite-app`
4. Click **Next**

### 2.2 Attach S3 Permissions
1. Click **Add permissions** → **Attach policies directly**
2. Search for: `AmazonS3FullAccess`
3. ✅ Select **AmazonS3FullAccess**
4. Click **Next** → **Create user**

### 2.3 Generate Access Keys
1. Click on the created user `ehs-suite-app`
2. Go to **Security credentials** tab
3. Click **Create access key**
4. Choose: **Application running outside AWS**
5. Click **Next** → **Create access key**
6. **Save your credentials**:
   - Access Key ID
   - Secret Access Key

⚠️ **IMPORTANT**: Save these securely! You won't be able to see them again.

## Step 3: Update Backend Configuration

### 3.1 Edit `.env` File
```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
AWS_S3_URL=https://your-bucket-name.s3.amazonaws.com
```

Replace:
- `your_access_key_id_here` - From IAM User
- `your_secret_access_key_here` - From IAM User
- `your-bucket-name` - Your S3 bucket name
- `us-east-1` - Your region (if different)

### 3.2 Restart Backend Server
```bash
npm start
```

## Step 4: Test File Upload

### 4.1 Using the Frontend
1. Open `http://localhost:5000/uploads.html`
2. Login with your credentials
3. Click **Upload Files**
4. Select a file and click **Upload Selected File**
5. Your file will be uploaded to S3

### 4.2 Verify in AWS Console
1. Go to S3 bucket
2. Navigate to: `ehs/` → `{user-id}/`
3. You should see your uploaded files

### 4.3 Share Files
1. In File Manager, click **Copy Link**
2. This generates a pre-signed URL that expires in 1 hour
3. Share the link with others

## File Upload Endpoints

### Upload File
```bash
POST /api/files/upload
```
**Headers**: `Authorization: Bearer {token}`
**Body**: Form data with:
- `file` - File to upload
- `description` - Optional description
- `uploadType` - document, image, report, compliance, other

**Response**:
```json
{
  "message": "File uploaded successfully",
  "file": {
    "id": 1,
    "fileName": "report.pdf",
    "s3Url": "https://bucket.s3.amazonaws.com/...",
    "fileSize": 1024000,
    "fileType": "application/pdf",
    "createdAt": "2026-07-06T..."
  }
}
```

### Get User's Files
```bash
GET /api/files
```
**Headers**: `Authorization: Bearer {token}`

### Delete File
```bash
DELETE /api/files/{id}
```
**Headers**: `Authorization: Bearer {token}`

### Generate Pre-signed URL
```bash
GET /api/files/{id}/presigned-url?expiry=3600
```
**Headers**: `Authorization: Bearer {token}`

Pre-signed URLs are secure links that expire after the specified time (default 1 hour).

## Database Schema

### files table
```sql
- id: SERIAL PRIMARY KEY
- user_id: INTEGER (FOREIGN KEY to users)
- file_name: VARCHAR(255)
- s3_key: VARCHAR(500) - Path in S3
- s3_url: TEXT - Direct S3 URL
- file_size: INTEGER - Size in bytes
- file_type: VARCHAR(100) - MIME type
- upload_type: VARCHAR(100) - document, image, report, compliance, other
- description: TEXT - Optional description
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## Security Best Practices

### 1. Access Control
- IAM user has only S3 permissions
- Pre-signed URLs expire (default 1 hour)
- Files are organized by user ID

### 2. File Size Limits
- Maximum 50MB per file
- Configurable in `server.js` line 29

### 3. Secret Management
- `.env` file is in `.gitignore`
- Never commit credentials to GitHub
- Use different credentials for production

### 4. HTTPS in Production
- Always use HTTPS for file uploads
- Pre-signed URLs work with HTTPS

## Troubleshooting

### "S3 not configured" Error
- Check `.env` file has AWS credentials
- Verify credentials are correct in IAM console
- Restart backend server

### "Access Denied" Error
- Check IAM user has `AmazonS3FullAccess` policy
- Verify bucket policy allows public read access
- Check bucket name in `.env` matches actual bucket

### "File not found" in Frontend
- Check S3 bucket policy is configured
- Verify ACL is set to public-read
- Check S3 URL in `.env` is correct

### Pre-signed URL Not Working
- Check URL hasn't expired (default 1 hour)
- Verify bucket name in configuration
- Ensure file exists in S3

## Production Deployment

### For Render.com:
1. Go to Web Service settings
2. Add environment variables:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
   - `AWS_REGION`
   - `AWS_S3_BUCKET`
   - `AWS_S3_URL`

3. Deploy changes

### For Other Platforms:
- Set environment variables in your hosting platform
- Never hardcode credentials
- Use IAM roles if available (e.g., EC2, Lambda)

## Cost Estimation

AWS S3 Pricing (approximate):
- Storage: $0.023 per GB/month
- Upload: Free
- Download: $0.09 per GB (first 1GB free/month)
- Requests: ~$0.005 per 1000 requests

**Example**: 100 users storing 100MB each = 10GB
- Monthly cost: ~$0.50 (storage) + data transfer costs

## Additional Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)
- [Pre-signed URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/PresignedUrlUploadObject.html)
- [Bucket Policies](https://docs.aws.amazon.com/AmazonS3/latest/userguide/bucket-policies.html)

---

**Last Updated**: 2026-07-06
**Integration**: AWS SDK v2
