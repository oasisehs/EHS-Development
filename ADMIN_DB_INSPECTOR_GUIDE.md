# Admin Database Inspector - User Guide

## Overview

The Admin Database Inspector is a powerful tool for administrators to view and manage the Render Postgres database in real-time. It provides a user-friendly interface to inspect table schemas, view data, execute queries, and seed the database with demo data.

## Accessing the Database Inspector

### From Admin Settings
1. Log in to EHSSuite with an admin account
2. Navigate to **Portal Settings** (admin-settings.html)
3. Click **🔍 Database Inspector** link in the left sidebar

### Direct URL
```
https://ehs-development.onrender.com/admin-db-inspect.html
```

**Note:** You must be logged in as an admin user. The page will redirect to login if not authenticated.

---

## Features

### 1. Database Connection Status
- **Connection Badge** at the top shows:
  - ✅ **Connected** - Database is reachable
  - ❌ **Disconnected** - Unable to connect to database

- **Connection Info** in the left sidebar shows:
  - Host (database server address)
  - Port (typically 5432 for Postgres)
  - Database name
  - Number of tables

### 2. Table Browser
Left sidebar lists all tables in the database with row counts.

**To view a table:**
1. Click on any table name in the list
2. The table schema and data will load in the main area

### 3. Table Schema Inspection
When a table is selected, you can see:
- **Column Names** - All columns in the table
- **Data Types** - PostgreSQL data types (VARCHAR, INTEGER, TIMESTAMP, etc.)
- **Nullable** - Shows if column allows NULL values
- **Default Values** - Default values assigned by database

Example:
```
Column Name     Data Type    Nullable    Default
id              integer      ✗           nextval('users_id_seq'::regclass)
email           varchar      ✗           -
password_hash   varchar      ✗           -
created_at      timestamp    ✓           CURRENT_TIMESTAMP
```

### 4. Data Viewing
- View actual data from any table with pagination
- Shows up to 50 rows per page (adjustable via query parameter)
- Navigate between pages using **Previous** and **Next** buttons
- Data is color-coded:
  - 🔴 **NULL** values shown in italics
  - 🟢 **Boolean true/false** values highlighted
  - 📊 **JSON objects** shown as formatted strings

### 5. Query Executor
Run custom SQL queries directly on the database.

**To execute a query:**
1. Click the **📝 Query** button
2. Enter your SQL query (SELECT only)
3. Click **Execute**
4. Results appear in a formatted table

**Example queries:**
```sql
-- Count users by role
SELECT roles.name, COUNT(users.id) 
FROM users 
LEFT JOIN user_roles ON users.id = user_roles.user_id 
LEFT JOIN roles ON user_roles.role_id = roles.id 
GROUP BY roles.name;

-- Find recent incidents
SELECT id, title, severity, status, created_at 
FROM incidents 
ORDER BY created_at DESC 
LIMIT 10;

-- List all employees in a department
SELECT e.id, e.first_name, e.last_name, e.job_title, d.name
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
WHERE d.name = 'Safety'
ORDER BY e.last_name;
```

**Security Note:** Only SELECT queries are allowed. INSERT, UPDATE, DELETE, and DROP operations are blocked for safety.

### 6. Database Seeding
Populate the database with demo data in one click.

**To seed the database:**
1. Click the **🌱 Seed** button
2. Confirm the action (you will be asked to confirm)
3. Demo users and test data will be created

**Demo credentials created:**
```
Email: admin@ehssuite.com
Password: demo123456

Email: manager@ehssuite.com
Password: demo123456

Email: employee@ehssuite.com
Password: demo123456

Email: safety@ehssuite.com
Password: demo123456
```

**What gets seeded:**
- 4 demo users with different roles
- 5 departments
- 4 employees with profiles
- 4 training courses
- 3 compliance templates
- 3 assets (equipment, PPE, vehicle)
- 4 KPI definitions

---

## API Endpoints

### Backend API Reference

All endpoints require authentication with admin role.

#### 1. Inspect Database
```http
GET /api/admin/db/inspect
Authorization: Bearer {token}
```

**Response:**
```json
{
  "status": "connected",
  "database": "postgres",
  "tables": ["users", "employees", "departments", ...],
  "connection": {
    "host": "dpg-xxx.postgres.render.com",
    "port": 5432,
    "database": "ehsdb_xxx"
  }
}
```

#### 2. Get Table Schema
```http
GET /api/admin/db/schema/:tableName
Authorization: Bearer {token}
```

**Response:**
```json
{
  "tableName": "users",
  "rowCount": 25,
  "columns": [
    {
      "column_name": "id",
      "data_type": "integer",
      "is_nullable": "NO",
      "column_default": "nextval('users_id_seq'::regclass)"
    },
    ...
  ]
}
```

#### 3. Get Table Data
```http
GET /api/admin/db/data/:tableName?limit=50&offset=0
Authorization: Bearer {token}
```

**Query Parameters:**
- `limit` (default: 50, max: 500) - Number of rows to return
- `offset` (default: 0) - Number of rows to skip for pagination

**Response:**
```json
{
  "tableName": "users",
  "totalCount": 125,
  "limit": 50,
  "offset": 0,
  "data": [
    {
      "id": 1,
      "email": "admin@ehssuite.com",
      "full_name": "Admin User",
      ...
    },
    ...
  ]
}
```

#### 4. Execute Query
```http
POST /api/admin/db/query
Authorization: Bearer {token}
Content-Type: application/json

{
  "query": "SELECT * FROM users LIMIT 10;"
}
```

**Response:**
```json
{
  "success": true,
  "rowCount": 10,
  "data": [...]
}
```

#### 5. Seed Database
```http
POST /api/admin/db/seed
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Database seeded successfully",
  "data": {
    "success": true,
    "users": [
      {"email": "admin@ehssuite.com", "password": "demo123456"},
      ...
    ]
  }
}
```

---

## Common Tasks

### Check if Demo Data Exists
1. Go to Database Inspector
2. Click on **users** table
3. Look for `admin@ehssuite.com` in the data

If you see 4 demo users, seeding is complete.

### Find All Active Employees
1. Click **📝 Query**
2. Execute:
```sql
SELECT first_name, last_name, job_title, email 
FROM employees 
WHERE status = 'active' 
ORDER BY last_name;
```

### Check Compliance Scores
1. Click **📝 Query**
2. Execute:
```sql
SELECT first_name, last_name, compliance_score, created_at 
FROM employees 
WHERE compliance_score IS NOT NULL 
ORDER BY compliance_score DESC;
```

### Find Recent Incidents
1. Click on **incidents** table
2. Review the Schema and Data tabs

### Check Database Size
1. Click **📝 Query**
2. Execute:
```sql
SELECT 
  table_name,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## Troubleshooting

### Issue: "Not authenticated. Redirecting to login..."
- **Solution:** Make sure you're logged in with an admin account
- Log out and log back in
- Check browser console for JWT token errors

### Issue: "Database not ready, status: memory-store"
- **Solution:** The database connection is not initialized
- Wait a few seconds and refresh the page
- Check backend logs for connection errors

### Issue: "Failed to load table schema"
- **Solution:** The table might not exist or requires special permissions
- Try the Query tool to debug
- Check PostgreSQL logs on Render

### Issue: "Only SELECT queries are allowed"
- **Solution:** The query contains UPDATE, DELETE, INSERT, or DROP
- This is a safety feature to prevent accidental data loss
- Contact a database administrator if you need to modify data

### Issue: "Demo data already seeded"
- **Solution:** Database has already been populated with demo users
- Click on the **users** table to verify credentials
- If you need fresh data, contact a database administrator to reset

---

## Security Considerations

⚠️ **Important Security Notes:**

1. **Authentication Required** - Only authenticated admin users can access this tool
2. **Read-Only Queries** - SELECT queries only; modifications blocked
3. **Sensitive Data** - This tool can view all database content including:
   - User emails and password hashes
   - Personal employee information
   - Incident details
   - Compliance data
4. **Audit Trail** - All admin actions are logged (audit_logs table)
5. **Production Caution** - Use this tool carefully in production environments

**Best Practices:**
- Only grant admin access to trusted users
- Review audit logs regularly
- Don't share database credentials
- Don't make backups of sensitive data locally
- Report suspicious database access immediately

---

## Support

For issues or feature requests, contact the development team or check:
- Backend logs on Render dashboard
- PostgreSQL logs
- Browser console for JavaScript errors (F12)

---

**Version:** 1.0
**Last Updated:** 2026-11-05
**Backend API:** `/api/admin/db/*`
**Frontend Path:** `/admin-db-inspect.html`
