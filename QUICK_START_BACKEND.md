# Quick Start - Backend

## 1️⃣ Install Dependencies
```bash
npm install
```

## 2️⃣ Verify .env Configuration
Your database is pre-configured in `.env`:
```
DATABASE_URL=postgresql://oasis:H5m3zZheus4iDA5RxS6HeCcDC8DwCBgV@dpg-d95i9fpoagis738st8p0-a.oregon-postgres.render.com/ehsdb_o0dm
PORT=5000
```

## 3️⃣ Start the Backend Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

You should see:
```
Connected to PostgreSQL database: [timestamp]
Database tables initialized successfully
EHS Suite Backend is running on http://localhost:5000
```

## 4️⃣ Open Your Application
- Frontend: `http://localhost:5000` (static files served from root)
- API Health Check: `http://localhost:5000/api/health`

## 5️⃣ Test the System

### Register a new user:
Go to `http://localhost:5000/signup.html` and create an account

### Login:
Use your new credentials to login

### View Dashboard:
After login, you'll see the EHS dashboard with data management

## API Documentation
See `BACKEND_SETUP.md` for complete API endpoint documentation

## If Backend Fails to Connect
The frontend has a **fallback demo mode**:
- Email: `demo@ehssuite.com`
- Password: `Demo@123456`

## Next Steps
- Customize database schema in `server.js` (lines 44-70)
- Add more API endpoints as needed
- Deploy to Render.com or your preferred host
- Update JWT_SECRET in production

---
📖 Full documentation: **BACKEND_SETUP.md**
