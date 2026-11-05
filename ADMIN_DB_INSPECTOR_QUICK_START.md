# Admin Database Inspector - Quick Start Guide

## 🚀 Quick Links
- **Production URL:** https://ehs-development.onrender.com/admin-db-inspect.html
- **Local URL:** http://localhost:3000/admin-db-inspect.html (if running locally)
- **Guide:** See `ADMIN_DB_INSPECTOR_GUIDE.md` for full documentation

---

## ✅ What You Can Do

### 1. View Database Info
- See connection details (host, port, database name)
- List all tables with row counts
- Check database status

### 2. Inspect Tables
- View table schema (columns, types, constraints)
- Browse table data with pagination
- See row counts and column info

### 3. Run Queries
- Execute SELECT queries on any table
- View results in formatted table
- Export data by copying query results

### 4. Seed Demo Data
- Populate database with 4 demo users
- Create sample departments, employees, courses, assets
- One-click setup for testing

---

## 📊 Demo User Credentials (After Seeding)

| Email | Password | Role |
|-------|----------|------|
| admin@ehssuite.com | demo123456 | admin |
| manager@ehssuite.com | demo123456 | manager |
| employee@ehssuite.com | demo123456 | employee |
| safety@ehssuite.com | demo123456 | safety |

---

## 🎯 Step-by-Step: First Time Setup

### Step 1: Access Database Inspector
1. Log in to EHSSuite as admin
2. Go to **Portal Settings** → **🔍 Database Inspector**

### Step 2: Verify Connection
- Should see ✅ **Connected** badge
- Connection info shows database details

### Step 3: Seed Database (If Needed)
1. Click **🌱 Seed** button
2. Confirm the action
3. Wait for seeding to complete
4. Success message appears

### Step 4: View Data
1. Click on **users** table in left sidebar
2. See 4 demo users
3. Click on **departments** to see other data

---

## 🔍 Quick Queries

### Find All Users
```sql
SELECT id, email, full_name, status FROM users ORDER BY id;
```

### Find Employees by Department
```sql
SELECT e.first_name, e.last_name, e.job_title, d.name
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
ORDER BY d.name, e.last_name;
```

### Check Incidents by Severity
```sql
SELECT severity, COUNT(*) as count
FROM incidents
GROUP BY severity
ORDER BY severity;
```

### List Training Courses
```sql
SELECT id, name, description, duration_hours FROM courses;
```

### Find Active Users
```sql
SELECT id, email, full_name, created_at FROM users WHERE status = 'active';
```

---

## ⚠️ Important Notes

❌ **Cannot Do:**
- Modify data (INSERT, UPDATE, DELETE)
- Drop tables (DROP, TRUNCATE)
- Change schema (ALTER)
- Only **SELECT** queries allowed

✅ **Can Do:**
- View any table data
- Run complex SELECT queries
- Join multiple tables
- Seed demo data
- Paginate through results

---

## 🐛 Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| "Not authenticated" | Log in as admin user first |
| "Database not ready" | Refresh page, wait for connection |
| Tables not loading | Check browser console (F12) for errors |
| Seed fails: "Demo data already seeded" | Data already exists, skip seeding |
| Query returns error | Only SELECT queries allowed |

---

## 📝 Tables in Database

### Core Tables
- **users** - System users and login accounts
- **roles** - User roles (admin, manager, employee, safety)
- **user_roles** - User to role assignments

### HR & Employees
- **employees** - Employee profiles and details
- **departments** - Company departments
- **jobs** - Job titles and descriptions

### EHS & Compliance
- **incidents** - Safety incidents and reports
- **compliance_templates** - Compliance checklists
- **audit_logs** - System activity log

### Assets & Resources
- **assets** - Equipment, PPE, vehicles
- **courses** - Training courses
- **kpi_definitions** - KPI metrics

### Files & Storage
- **files** - File uploads and documents
- **file_types** - File type definitions

---

## 🔐 Security Reminders

- ⚠️ Only admin users can access this tool
- ⚠️ Don't share database credentials publicly
- ⚠️ Be careful when running queries - read-only but powerful
- ⚠️ Audit logs track all database access
- ⚠️ In production, restrict access to authorized personnel only

---

## 📞 Need Help?

1. **Check Full Guide:** `ADMIN_DB_INSPECTOR_GUIDE.md`
2. **Check Backend Logs:** Render dashboard > Logs
3. **Check Browser Console:** Press F12, look for errors
4. **Contact Admin:** Report issues to development team

---

**Version:** 1.0  
**Created:** 2026-11-05  
**Backend Endpoints:** `/api/admin/db/*`  
**Frontend File:** `admin-db-inspect.html` + `admin-db-inspect.js`
