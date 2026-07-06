# EHS Suite - Backend Setup Guide

## Overview
The EHS Suite now connects to a **Render PostgreSQL database** with a Node.js/Express backend.

### Database Connection Details
- **Host**: dpg-d95i9fpoagis738st8p0-a.oregon-postgres.render.com
- **Database**: ehsdb_o0dm
- **User**: oasis
- **Port**: 5432 (default)

## Setup Instructions

### 1. Install Node.js Dependencies
```bash
npm install
```

This will install:
- `express` - Web server framework
- `pg` - PostgreSQL client
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable management
- `nodemon` - Auto-reload during development

### 2. Environment Configuration
The `.env` file is already configured with the Render PostgreSQL connection string. If you need to change the API URL or JWT secret:

**Edit `.env`:**
```
DATABASE_URL=postgresql://oasis:H5m3zZheus4iDA5RxS6HeCcDC8DwCBgV@dpg-d95i9fpoagis738st8p0-a.oregon-postgres.render.com/ehsdb_o0dm
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key_change_in_production_12345
```

⚠️ **SECURITY NOTE**: Change the `JWT_SECRET` in production!

### 3. Start the Backend Server

**Option A: Development (with auto-reload)**
```bash
npm run dev
```

**Option B: Production**
```bash
npm start
```

The server will start on `http://localhost:5000`

**Expected Output:**
```
Connected to PostgreSQL database: 2026-07-06T12:00:00.000Z
Database tables initialized successfully
EHS Suite Backend is running on http://localhost:5000
Environment: development
```

### 4. Frontend Configuration
The frontend automatically detects the backend at `http://localhost:5000`. If your backend is on a different URL/port, set it in localStorage:

```javascript
localStorage.setItem('API_URL', 'http://your-backend-url:port');
```

## API Endpoints

### Authentication Endpoints

#### POST /api/register
Register a new user
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "fullName": "John Doe",
  "company": "Acme Corp",
  "department": "Safety",
  "phone": "+1-555-0123"
}
```
**Response**: Returns user data and JWT token

#### POST /api/login
Login user
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```
**Response**: Returns user data and JWT token

#### POST /api/forgot-password
Request password reset
```json
{
  "email": "user@example.com"
}
```
**Response**: Returns reset token (in production, send via email)

#### POST /api/reset-password
Reset password with token
```json
{
  "token": "jwt_reset_token",
  "newPassword": "NewSecurePass456"
}
```

### User Endpoints (Requires JWT Token)

#### GET /api/user/profile
Get current user profile

**Header**: `Authorization: Bearer <jwt_token>`

**Response**:
```json
{
  "id": 1,
  "email": "user@example.com",
  "full_name": "John Doe",
  "company": "Acme Corp",
  "department": "Safety",
  "phone": "+1-555-0123"
}
```

### EHS Records Endpoints (Requires JWT Token)

#### GET /api/ehs-records
Get all EHS records for the user

**Header**: `Authorization: Bearer <jwt_token>`

#### POST /api/ehs-records
Create a new EHS record
```json
{
  "recordType": "incident",
  "title": "Near Miss Report",
  "description": "Details about the incident",
  "severity": "medium",
  "status": "open",
  "dueDate": "2026-07-15"
}
```

#### PUT /api/ehs-records/:id
Update an EHS record (same body as POST)

#### DELETE /api/ehs-records/:id
Delete an EHS record

### Health Check

#### GET /api/health
Check if server is running
```json
{
  "status": "Server is running",
  "timestamp": "2026-07-06T12:00:00.000Z"
}
```

## Database Schema

### users table
```sql
- id: SERIAL PRIMARY KEY
- email: VARCHAR(255) UNIQUE NOT NULL
- password: VARCHAR(255) NOT NULL
- full_name: VARCHAR(255)
- company: VARCHAR(255)
- department: VARCHAR(255)
- phone: VARCHAR(20)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### ehs_records table
```sql
- id: SERIAL PRIMARY KEY
- user_id: INTEGER (FOREIGN KEY)
- record_type: VARCHAR(100)
- title: VARCHAR(255)
- description: TEXT
- severity: VARCHAR(50)
- status: VARCHAR(50)
- due_date: DATE
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## Testing the Connection

### 1. Test Backend is Running
```bash
curl http://localhost:5000/api/health
```

### 2. Test Registration
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123",
    "fullName": "Test User",
    "company": "Test Company"
  }'
```

### 3. Test Login
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123"
  }'
```

### 4. Test Database Connection
Open PostgreSQL client and connect:
```
psql postgresql://oasis:H5m3zZheus4iDA5RxS6HeCcDC8DwCBgV@dpg-d95i9fpoagis738st8p0-a.oregon-postgres.render.com/ehsdb_o0dm
```

List tables:
```sql
\dt
```

## Fallback Mode
If the backend is not available, the frontend has a **fallback demo mode**:
- Email: `demo@ehssuite.com`
- Password: `Demo@123456`

This allows testing without the backend running.

## Deployment Notes

### For Render.com Deployment:
1. Push code to GitHub
2. Create new Web Service on Render
3. Set Environment Variables:
   - `DATABASE_URL` - Already configured
   - `NODE_ENV=production`
   - `JWT_SECRET` - Change to a secure random string
4. Build Command: `npm install`
5. Start Command: `npm start`

### For Other Platforms:
- Ensure Node.js 14+ is installed
- Set all environment variables
- Install dependencies: `npm install`
- Start server: `npm start`

## Troubleshooting

### "Cannot connect to database"
- Check internet connection
- Verify DATABASE_URL is correct
- Ensure Render PostgreSQL is running
- Check firewall settings

### "Port 5000 already in use"
```bash
# Change port in .env or use:
PORT=5001 npm start
```

### "CORS errors on frontend"
- Ensure backend is running
- Check that API_URL in localStorage matches backend URL
- Verify CORS middleware is loaded in server.js

### "JWT token expired"
- Token expires in 24 hours (configurable in server.js)
- User will need to login again
- Reset password token expires in 1 hour

## File Structure
```
EHS/
├── server.js              # Express server & API routes
├── package.json           # Dependencies
├── .env                   # Environment configuration
├── .gitignore            # Git ignore rules
├── index.html            # Login page
├── signup.html           # Registration page
├── forgot-password.html  # Password reset page
├── dashboard.html        # Main dashboard
├── script.js             # Login form handler
├── signup.js             # Registration handler
├── forgot-password.js    # Password reset handler
├── dashboard.js          # Dashboard functionality
├── styles.css            # Login/signup styles
├── dashboard.css         # Dashboard styles
└── BACKEND_SETUP.md      # This file
```

## Additional Resources
- [Express.js Documentation](https://expressjs.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [JSON Web Tokens (JWT)](https://jwt.io)
- [Render.com Docs](https://render.com/docs)

---

**Last Updated**: 2026-07-06
**Backend Version**: 1.0.0
