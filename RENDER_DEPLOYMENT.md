# Render Backend Deployment Guide

## Quick Deployment Steps

### 1. **Go to Render Dashboard**
- Visit: https://dashboard.render.com
- Sign in with your Render account

### 2. **Create a New Web Service**
- Click **"New +"** → **"Web Service"**
- Select **"Deploy an existing repo"**

### 3. **Connect GitHub Repository**
- Click **"Connect GitHub"**
- Select: `oasisehs/EHS-Development`
- Click **"Connect"**

### 4. **Configure Service**

| Setting | Value |
|---------|-------|
| **Name** | `ehs-suite-backend` |
| **Branch** | `pod-login` |
| **Root Directory** | `backend` |
| **Environment** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free Tier |

### 5. **Set Environment Variables**

In the **Environment** section, add these variables:

#### **Public Variables**
```
NODE_ENV=production
AWS_REGION=us-east-1
AWS_S3_BUCKET=oasis-ehs-bucket
AWS_S3_URL=https://oasis-ehs-bucket.s3.amazonaws.com
```

#### **Sensitive Variables** (Keep Private)
```
DATABASE_URL=postgresql://oasis:H5m3zZheus4iDA5RxS6HeCcDC8DwCBgV@dpg-d95i9fpoagis738st8p0-a.oregon-postgres.render.com/ehsdb_o0dm

JWT_SECRET=your_secure_jwt_secret_min_32_characters_long_here

AWS_ACCESS_KEY_ID=your_actual_aws_access_key_id

AWS_SECRET_ACCESS_KEY=your_actual_aws_secret_access_key
```

### 6. **Click "Create Web Service"**

Render will:
- ✅ Clone your GitHub repo
- ✅ Install npm dependencies
- ✅ Build the application
- ✅ Start Node.js server
- ✅ Assign public URL (e.g., `ehs-suite-backend.onrender.com`)

---

## Monitoring Your Deployment

### **Check Deployment Status**
- Render dashboard shows real-time logs
- Watch for "Render is live" message

### **View Your API**
- Backend URL: `https://ehs-suite-backend.onrender.com`
- Test endpoint: `GET https://ehs-suite-backend.onrender.com/api/health` (add health endpoint)

### **Common Issues**
| Issue | Solution |
|-------|----------|
| Database connection fails | Verify DATABASE_URL is correct |
| AWS upload fails | Check AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY |
| Port issues | Ensure PORT env var is set (defaults to 5000) |
| Module not found | Run `npm install` locally to verify package.json |

---

## Production Optimizations (Optional)

### Add a Health Check Endpoint
Update `backend/server.js` to add:

```javascript
// Health check endpoint for monitoring
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});
```

### Enable Auto-Deploys
In Render dashboard → **Settings** → **Auto-Deploy** → Enable to auto-deploy on GitHub pushes

### Set Up Custom Domain (Optional)
- Render dashboard → **Settings** → **Custom Domain**
- Add your domain (e.g., `api.yourdomain.com`)

---

## Next Steps

1. **Deploy Backend** using the steps above
2. **Get Your Backend URL** from Render (e.g., `https://ehs-suite-backend.onrender.com`)
3. **Update Frontend** API calls to use the Render URL instead of `localhost:5000`
4. **Deploy Frontend** separately to Vercel, Netlify, or Render Static Site

---

## Rollback/Restart

If something goes wrong:
- Click **"Manual Deploy"** to redeploy
- Click **"Restart Instance"** to restart the service
- Check logs in **"Logs"** tab for errors
