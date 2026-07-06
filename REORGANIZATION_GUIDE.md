# Project Structure - Frontend/Backend Separation

## ✅ Reorganization Complete!

Your EHS Suite project has been reorganized into a proper frontend/backend structure.

### New Directory Layout

```
EHS/
├── backend/                    # Node.js Express backend
│   ├── server.js              # Main API server
│   ├── package.json           # Backend dependencies
│   ├── .env                   # Environment variables
│   └── package-lock.json
│
├── frontend/                  # Frontend static files
│   ├── index.html             # Login page
│   ├── signup.html            # Registration page
│   ├── dashboard.html         # Main dashboard
│   ├── forgot-password.html   # Password reset page
│   ├── uploads.html           # File manager
│   │
│   ├── styles.css             # Global styles
│   ├── dashboard.css          # Dashboard styles
│   │
│   ├── script.js              # Login script
│   ├── signup.js              # Registration script
│   ├── forgot-password.js     # Password reset script
│   ├── dashboard.js           # Dashboard script
│   └── uploads.js             # File upload script
│
├── .gitignore                 # Git ignore rules
├── package.json               # Root package.json (optional)
├── README.md                  # Main documentation
└── [Documentation files]
```

---

## 🚀 Running the Project

### Quick Start
```bash
cd backend
npm install
npm start
```

The server will serve both:
- **Backend API**: http://localhost:5000/api/*
- **Frontend**: http://localhost:5000/

### Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

---

## 📁 File Organization Guide

### Backend (`/backend`)
- **server.js**: Main Express application with all API routes
- **package.json**: Backend dependencies (express, pg, aws-sdk, etc.)
- **.env**: Database and AWS credentials
- Serves frontend files from `../frontend` directory

### Frontend (`/frontend`)
- **HTML Files**: Page templates (login, dashboard, uploads, etc.)
- **CSS Files**: Styling (styles.css, dashboard.css)
- **JS Files**: Client-side logic for each page
- All files are served as static content by Express

---

## 🔄 How It Works

1. **User visits** http://localhost:5000
2. **Express serves** index.html from `/frontend`
3. **JavaScript files** (in /frontend) make API calls to backend
4. **API endpoints** (in /backend/server.js) handle requests
5. **Database operations** use PostgreSQL connection
6. **File uploads** go to AWS S3, metadata saved to PostgreSQL

```
Browser
   ↓
Frontend (HTML/CSS/JS) ← Served by Express
   ↓
API Endpoints ← Backend (server.js)
   ↓
PostgreSQL Database + AWS S3
```

---

## ✨ Key Changes Made

### ✅ File Locations
- Backend files moved to `/backend` folder
- Frontend files moved to `/frontend` folder
- Keeps monorepo structure (single deployment)

### ✅ Updated References
- **server.js**: Changed from `express.static(__dirname)` to `express.static(path.join(__dirname, '../frontend'))`
- This tells Express to serve static files from the frontend folder

### ✅ Environment Variables
- `.env` file remains in `/backend` folder
- Backend reads from `backend/.env` automatically

---

## 🔧 Configuration

### Backend Environment (.env)
Located in `/backend/.env`:
```
DATABASE_URL=postgresql://oasis:...
PORT=5000
JWT_SECRET=your_secret
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=oasis-ehs-bucket
```

### Frontend Configuration
Frontend makes API calls to `/api/*` endpoints (same origin):
- Login: `POST /api/login`
- Register: `POST /api/register`
- Upload: `POST /api/files/upload`
- etc.

---

## 📦 Dependencies

### Backend Dependencies
```json
{
  "express": "^4.18.0",
  "pg": "^8.0.0",
  "bcryptjs": "^2.4.0",
  "jsonwebtoken": "^8.5.0",
  "cors": "^2.8.5",
  "aws-sdk": "^2.1400.0",
  "multer": "^1.4.5",
  "dotenv": "^16.0.0"
}
```

### Frontend Dependencies
None! Frontend is pure HTML/CSS/JavaScript (no build step needed).

---

## 🚀 Deployment Options

### Option 1: Same Server (Current Setup)
```bash
# Production
cd backend
npm install --production
npm start
```
- Single server process
- Express serves both API and frontend
- Great for MVP, single deployment

### Option 2: Separate Frontend Build (Future)
If you want to build frontend with a bundler:
```bash
# In frontend/ folder
npm install
npm run build  # Creates dist/ folder
```

Then update backend to serve `/frontend/dist`:
```javascript
app.use(express.static(path.join(__dirname, '../frontend/dist')));
```

### Option 3: Separate Hosting (Advanced)
- Backend: Deploy to AWS EC2, Heroku, Render
- Frontend: Deploy to Netlify, Vercel, AWS S3+CloudFront
- Update frontend API URLs to point to backend URL

---

## ✅ Verification Checklist

- ✅ Backend files in `/backend`
- ✅ Frontend files in `/frontend`
- ✅ server.js updated to serve `/frontend`
- ✅ Environment variables in `backend/.env`
- ✅ All dependencies installed

---

## 📝 Next Steps

### Immediate
1. Test that backend still works: `cd backend && npm start`
2. Visit http://localhost:5000 to verify frontend loads

### Future Improvements
1. **Add frontend build process** (Webpack, Vite, etc.)
2. **Separate API documentation** (Swagger/OpenAPI)
3. **Add CI/CD pipeline** (GitHub Actions, GitLab CI)
4. **Docker containerization** (Separate images for backend/frontend)
5. **Migrate to AWS SDK v3** (replace deprecated v2)

---

## 🐛 Troubleshooting

### Frontend files not loading
- Check: `app.use(express.static(path.join(__dirname, '../frontend')));` in server.js
- Should be: `/backend/server.js` reads from `../frontend`

### API calls failing
- Ensure backend is running on port 5000
- Check CORS is enabled: `app.use(cors())`
- Verify JWT token is being sent in Authorization header

### S3 uploads not working
- Check `.env` has AWS credentials
- Verify bucket policy is applied: ✅ (Already done)
- Check Block Public Access is disabled: ✅ (Already done)

---

## 📚 Related Documentation

- `QUICK_START.md` - Quick start guide
- `BACKEND_SETUP.md` - Backend setup details
- `S3_SETUP_COMPLETE.md` - AWS S3 integration guide
- `AWS_S3_SETUP.md` - S3 configuration
