# Quick S3 Setup Guide

## 🚀 Get Started with AWS S3 File Uploads in 5 Minutes

### Step 1: Create AWS IAM User (5 min)
1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam)
2. Create User → `ehs-suite-app`
3. Attach: `AmazonS3FullAccess`
4. Create access key → Save credentials

### Step 2: Create S3 Bucket (2 min)
1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com)
2. Create Bucket → e.g., `ehs-suite-files-2026`
3. Region: `us-east-1` (or your choice)
4. Block public access → Uncheck public ACLs
5. Create bucket

### Step 3: Add Bucket Policy (2 min)
Go to Bucket → Permissions → Bucket Policy → Add:

```json
{
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": "*",
        "Action": "s3:GetObject",
        "Resource": "arn:aws:s3:::your-bucket-name/*"
    }]
}
```

### Step 4: Update Backend Config (1 min)

Edit `.env`:
```
AWS_ACCESS_KEY_ID=YOUR_KEY_ID
AWS_SECRET_ACCESS_KEY=YOUR_SECRET_KEY
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-bucket-name
AWS_S3_URL=https://your-bucket-name.s3.amazonaws.com
```

### Step 5: Restart Backend
```bash
npm start
```

✅ **Done!** Your S3 integration is ready.

## 📁 Using File Manager

1. Login to dashboard
2. Click **File Manager** in sidebar
3. Upload files by dragging or clicking
4. View, copy links, or delete files
5. Pre-signed URLs expire in 1 hour

## 🔗 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/files/upload` | POST | Upload file |
| `/api/files` | GET | List user files |
| `/api/files/:id` | DELETE | Delete file |
| `/api/files/:id/presigned-url` | GET | Generate share link |

## 📝 File Upload Types

- **Document** - Reports, PDFs, Word docs
- **Image** - Photos, screenshots
- **Report** - EHS reports
- **Compliance** - Compliance documents
- **Other** - Miscellaneous files

## 🔐 Security

- Files encrypted at rest in S3
- Pre-signed URLs expire (default 1 hour)
- User can only access own files
- S3 path: `ehs/{user-id}/{timestamp}-{filename}`

## 💾 Storage Costs

- **50GB**: ~$1.15/month
- **100GB**: ~$2.30/month
- **500GB**: ~$11.50/month
- Plus: $0.09/GB for data transfer (first 1GB free/month)

## 🆘 Troubleshooting

**Q: "S3 not configured" error**
- Check .env has AWS credentials
- Restart backend: `npm start`

**Q: Upload succeeds but file not visible**
- Check bucket policy is set
- Verify bucket name in .env

**Q: Pre-signed link shows 403 error**
- Link may have expired (generate new one)
- Check bucket policy allows `s3:GetObject`

**Q: Need to change bucket?**
- Update `AWS_S3_BUCKET` in .env
- Restart backend

---

📖 Full guide: [AWS_S3_SETUP.md](AWS_S3_SETUP.md)
