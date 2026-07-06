# EHS Suite Backend - Separate Render Deployment

## 🎯 Deployment Overview

This guide walks you through deploying the Node.js/Express backend as a **standalone Render service**.

---

## 📋 Pre-Deployment Checklist

✅ Backend is in `/backend` directory  
✅ `render.yaml` configured at repo root  
✅ Health check endpoint exists at `/api/health`  
✅ All environment variables defined  
✅ Code pushed to GitHub `pod-login` branch  

---

## 🚀 Step-by-Step Deployment

### **Step 1: Sign In to Render**

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Sign in with your Render account
3. Click **"New +"** in the top right

### **Step 2: Create Web Service**

1. Select **"Web Service"** from the dropdown
2. Choose **"Deploy an existing repo"**
3. Search for: `EHS-Development`
4. Click **"Connect"** next to your repo

### **Step 3: Configure Service**

Fill in the service configuration:

| Field | Value |
|-------|-------|
| **Service Name** | `ehs-suite-backend` |
| **Branch** | `pod-login` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` (Upgrading to `Starter` recommended for production) |

### **Step 4: Add Environment Variables**

Scroll to **Environment** section and click **"Add Environment Variable"**

Add **each** of these variables:

#### Public Variables (Non-sensitive)
```
KEY: NODE_ENV
VALUE: production

KEY: AWS_REGION
VALUE: us-east-1

KEY: AWS_S3_BUCKET
VALUE: oasis-ehs-bucket

KEY: AWS_S3_URL
VALUE: https://oasis-ehs-bucket.s3.amazonaws.com
```

#### Secret Variables (Copy from your .env)
```
KEY: DATABASE_URL
VALUE: postgresql://oasis:H5m3zZheus4iDA5RxS6HeCcDC8DwCBgV@dpg-d95i9fpoagis738st8p0-a.oregon-postgres.render.com/ehsdb_o0dm

KEY: JWT_SECRET
VALUE: [Generate a secure random string - min 32 characters]
Example: d7f9k2m4p8q1w3e5r7t9y2u4i6o8p0a2

KEY: AWS_ACCESS_KEY_ID
VALUE: [Your AWS Access Key ID]

KEY: AWS_SECRET_ACCESS_KEY
VALUE: [Your AWS Secret Access Key]

KEY: PORT
VALUE: 5000
```

### **Step 5: Deploy**

1. Click **"Create Web Service"**
2. Wait for deployment (2-5 minutes)
3. Look for ✅ "Render is live" message
4. Your backend URL will appear (e.g., `https://ehs-suite-backend.onrender.com`)

---

## ✅ Verify Deployment

### **Test Health Endpoint**

Open in browser or curl:
```bash
curl https://ehs-suite-backend.onrender.com/api/health
```

Expected response:
```json
{
  "status": "Server is running",
  "timestamp": "2026-07-06T12:34:56.789Z"
}
```

### **Test Login Endpoint**

```bash
curl -X POST https://ehs-suite-backend.onrender.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 📊 Monitoring & Logs

1. **View Logs**: Render Dashboard → Select Service → **"Logs"** tab
2. **Monitor Performance**: Click **"Metrics"** to see CPU, Memory, Network
3. **Set Up Alerts**: Dashboard → **"Settings"** → **"Notifications"**

---

## 🔄 Auto-Deployments

Enable automatic redeployment on GitHub pushes:

1. Dashboard → Your Service → **"Settings"**
2. Scroll to **"Auto-Deploy"**
3. Select: **"Yes"** to auto-deploy on new commits to `pod-login` branch

---

## 🌐 Update Frontend API Base URL

Once deployed, update your frontend to use the Render URL:

**Current (localhost):**
```javascript
const API_URL = 'http://localhost:5000';
```

**Updated (Render production):**
```javascript
const API_URL = 'https://ehs-suite-backend.onrender.com';
```

Update this in:
- `frontend/script.js` (login endpoint)
- `frontend/signup.js` (register endpoint)
- `frontend/uploads.js` (file operations)
- `frontend/forgot-password.js` (password reset)
- `frontend/dashboard.js` (if API calls exist)

---

## 🛑 Troubleshooting

### **Deployment Fails**

**Check:**
1. GitHub branch `pod-login` exists
2. `backend/package.json` is valid
3. All environment variables are set
4. No circular dependencies

**View logs**: Render Dashboard → **"Logs"** tab

### **Database Connection Error**

**Verify:**
1. DATABASE_URL is exactly correct
2. Render PostgreSQL instance is running
3. Connection string has correct credentials
4. SSL is enabled (our database requires it)

### **AWS S3 Upload Fails**

**Check:**
1. AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY are correct
2. S3 bucket policy allows public uploads
3. AWS credentials have s3:* permissions

### **Service Keeps Restarting**

Likely causes:
- Missing environment variable
- Database unreachable
- Port conflict (shouldn't happen)
- Node process crashing

**Solution**: Check logs for error details

---

## 💡 Production Tips

1. **Upgrade Instance**: Free tier restarts after 15 mins of inactivity. Use **Starter** for always-on
2. **Monitor Costs**: AWS S3 uploads and database queries count toward billing
3. **Rotate Secrets**: Change JWT_SECRET and AWS credentials monthly
4. **Enable CI/CD**: Auto-deploy on merge to `pod-login`
5. **Set Up Email Alerts**: For deployment failures

---

## 📝 Your Backend URLs

Once deployed:

```
Health Check: https://ehs-suite-backend.onrender.com/api/health
Login:        https://ehs-suite-backend.onrender.com/api/login
Register:     https://ehs-suite-backend.onrender.com/api/register
Uploads:      https://ehs-suite-backend.onrender.com/api/files/upload
Get Files:    https://ehs-suite-backend.onrender.com/api/files
```

---

## 🔗 Next Steps

1. ✅ Deploy backend to Render (this guide)
2. ⬜ Update frontend API URLs to Render backend
3. ⬜ Deploy frontend to Vercel/Netlify
4. ⬜ Test end-to-end integration
5. ⬜ Set up monitoring alerts
