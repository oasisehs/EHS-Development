# 🚀 Deploy Node.js Backend to Render - Quick Start

## 📌 What's Ready for Deployment

✅ **Backend Code**: Production-ready Node.js/Express server  
✅ **Configuration**: `render.yaml` defines the deployment  
✅ **Health Endpoint**: `/api/health` for monitoring  
✅ **Environment Variables**: Template provided in `backend/.env.example`  
✅ **GitHub**: Code pushed to `oasisehs/EHS-Development` on `pod-login` branch  

---

## 🎯 Three Simple Steps to Deploy

### **Step 1: Go to Render Dashboard**
```
https://dashboard.render.com
```

### **Step 2: Click "New +" → "Web Service"**
- Select **"Deploy an existing repo"**
- Search for: `EHS-Development`
- Click **"Connect"**

### **Step 3: Configure & Deploy**

| Setting | Enter |
|---------|-------|
| Service Name | `ehs-suite-backend` |
| Branch | `pod-login` |
| Root Directory | `backend` |
| Build Command | `npm install` |
| Start Command | `npm start` |

---

## 🔑 Environment Variables (Required)

Click **"Advanced"** → **"Add Environment Variable"** for each:

### **Non-Sensitive (Public)**
```
NODE_ENV = production
AWS_REGION = us-east-1
AWS_S3_BUCKET = oasis-ehs-bucket
AWS_S3_URL = https://oasis-ehs-bucket.s3.amazonaws.com
PORT = 5000
```

### **Sensitive (Copy from your .env file)**
```
DATABASE_URL = postgresql://oasis:H5m3zZheus4iDA5RxS6HeCcDC8DwCBgV@...

JWT_SECRET = [Generate random 32+ character string]

AWS_ACCESS_KEY_ID = [Your AWS Key ID]

AWS_SECRET_ACCESS_KEY = [Your AWS Secret Key]
```

---

## ✅ Click "Create Web Service"

Render will:
1. Clone your GitHub repo
2. Install dependencies (`npm install`)
3. Start the Node.js server
4. Assign a public URL

**Expected Time**: 2-5 minutes

---

## 🧪 Test Your Deployment

Once deployed, test these endpoints:

### **Health Check** (Should return 200 OK)
```
GET https://ehs-suite-backend.onrender.com/api/health
```

### **Login** (Test with your DB data)
```
POST https://ehs-suite-backend.onrender.com/api/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "yourpassword"
}
```

### **File Upload**
```
POST https://ehs-suite-backend.onrender.com/api/files/upload
Authorization: Bearer [JWT_TOKEN]
```

---

## 📊 Monitor Your Deployment

- **Logs**: Dashboard → Service → "Logs" tab
- **Metrics**: Click "Metrics" for CPU, Memory, Network usage
- **Errors**: Check logs for deployment issues

---

## 🔄 Auto-Deploy on GitHub Push

Enable automatic redeployment:
1. Service → "Settings"
2. Scroll to "Auto-Deploy"
3. Select "Yes"

Now every push to `pod-login` branch auto-deploys!

---

## 🌐 Next: Update Frontend API URLs

Once backend is deployed at (e.g.) `https://ehs-suite-backend.onrender.com`:

Update these files to use the Render URL instead of `localhost:5000`:

**frontend/script.js**
```javascript
const API_URL = 'https://ehs-suite-backend.onrender.com';
```

**frontend/signup.js**
```javascript
const API_URL = 'https://ehs-suite-backend.onrender.com';
```

**frontend/uploads.js**
```javascript
const API_URL = 'https://ehs-suite-backend.onrender.com';
```

**frontend/dashboard.js**
```javascript
const API_URL = 'https://ehs-suite-backend.onrender.com';
```

**frontend/forgot-password.js**
```javascript
const API_URL = 'https://ehs-suite-backend.onrender.com';
```

Then deploy frontend separately to Vercel or Netlify.

---

## 💰 Cost Notes

**Render Free Tier:**
- ✅ Node.js backend: FREE (sleeps after 15 min inactivity)
- ✅ PostgreSQL database: FREE (500MB storage)
- ❌ AWS S3 uploads: Billed by AWS (not Render)

**Upgrade to Starter** ($7/month) for:
- Always-on backend (no sleep)
- Faster deployments
- Priority support

---

## 📝 Documentation

For detailed deployment info, see:
- `RENDER_BACKEND_DEPLOYMENT_GUIDE.md` - Full deployment walkthrough
- `RENDER_DEPLOYMENT.md` - General Render deployment setup
- `backend/.env.example` - Environment variables template

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| Deployment fails | Check GitHub branch is `pod-login` |
| Database won't connect | Verify DATABASE_URL is correct |
| AWS upload fails | Check AWS credentials are valid |
| Service keeps crashing | Check logs for errors, verify all env vars |
| 403 Forbidden on login | Verify JWT_SECRET is set |

---

## 🎉 You're Ready!

Your Node.js backend can now be deployed to Render as a standalone, scalable service. Once deployed:

1. ✅ Backend runs on Render
2. ⬜ Update frontend URLs
3. ⬜ Deploy frontend
4. ⬜ Test end-to-end

Good luck! 🚀
