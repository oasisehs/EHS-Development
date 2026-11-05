# Admin Database Inspector - Architecture & Flow Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         EHSSuite Frontend                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐    ┌──────────────────────────────────┐  │
│  │   Dashboard      │    │  Admin Database Inspector        │  │
│  │  (index.html)    │───→│  (admin-db-inspect.html)         │  │
│  └──────────────────┘    └──────────────────────────────────┘  │
│                                   │                              │
│                                   │ JavaScript                   │
│                                   │ (admin-db-inspect.js)        │
│                                   ▼                              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Database Inspector UI                                  │  │
│  │  ├─ Table Browser (left sidebar)                        │  │
│  │  ├─ Schema Viewer (middle section)                      │  │
│  │  ├─ Data Table with Pagination                          │  │
│  │  ├─ Query Editor                                        │  │
│  │  └─ Seed Database Button                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           │                                      │
│                           │ HTTP/REST API                        │
│                           │ (Bearer Token Auth)                  │
│                           ▼                                      │
└─────────────────────────────────────────────────────────────────┘
              │
              │ JWT Token Validation
              │ Admin Role Check
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EHSSuite Backend API                         │
│                   (Node.js/Express)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Authentication Middleware                                      │
│  └─ verifyToken()                                               │
│  └─ requireRoles('admin')                                       │
│                                                                  │
│  Database Inspection Routes                                     │
│  ├─ GET /api/admin/db/inspect                                  │
│  │  └─ List all tables                                         │
│  │                                                              │
│  ├─ GET /api/admin/db/schema/:tableName                        │
│  │  └─ Get table columns and constraints                       │
│  │                                                              │
│  ├─ GET /api/admin/db/data/:tableName                          │
│  │  └─ Get paginated table data                                │
│  │                                                              │
│  ├─ POST /api/admin/db/query                                   │
│  │  └─ Execute SELECT queries                                  │
│  │  └─ Safety: Only SELECT allowed                             │
│  │                                                              │
│  └─ POST /api/admin/db/seed                                    │
│     └─ Populate database with demo data                        │
│     └─ Import seed.js functions                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
              │
              │ PostgreSQL Connection
              │ (pg library)
              │ SSL: Render backend
              │
              ▼
┌─────────────────────────────────────────────────────────────────┐
│              Render PostgreSQL Database                          │
│         (dpg-xxx.postgres.render.com:5432)                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Public Schema (public)                                         │
│  ├─ users              ┐                                        │
│  ├─ roles              │ User Management                         │
│  ├─ user_roles         ┘                                        │
│  │                                                              │
│  ├─ employees          ┐                                        │
│  ├─ departments        │ HR & Organization                      │
│  ├─ jobs               ┘                                        │
│  │                                                              │
│  ├─ incidents          ┐                                        │
│  ├─ incident_timeline  │ EHS & Compliance                       │
│  ├─ compliance_...     ┘                                        │
│  │                                                              │
│  ├─ assets             ┐                                        │
│  ├─ courses            │ Resources & Training                   │
│  ├─ kpi_definitions    ┘                                        │
│  │                                                              │
│  ├─ files              ┐                                        │
│  ├─ file_types         │ Files & Storage                        │
│  └─ audit_logs         ┘                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Table Inspection Flow

```
┌──────────────────┐
│  Click on Table  │
│  (e.g., "users")│
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ GET /api/admin/db/schema/:tableName  │
│ GET /api/admin/db/data/:tableName    │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Backend: Query PostgreSQL            │
│ - Get columns from information_schema│
│ - Get row count                      │
│ - Get paginated data (0-50 rows)     │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Format Response as JSON              │
│ {                                    │
│   tableName: "users",                │
│   rowCount: 4,                       │
│   columns: [...],                    │
│   data: [...]                        │
│ }                                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Display in UI                        │
│ - Schema table                       │
│ - Data table                         │
│ - Pagination controls                │
└──────────────────────────────────────┘
```

### 2. Query Execution Flow

```
┌──────────────────────────┐
│  Admin Enters Query      │
│  (SELECT statement)      │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────┐
│  Frontend Validation     │
│  - Trim whitespace       │
│  - Check not empty       │
│  - Prevent code injection│
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ POST /api/admin/db/query             │
│ {                                    │
│   query: "SELECT * FROM users..."    │
│ }                                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Backend: Validate Query              │
│ - Check: Starts with "SELECT"?       │
│ - Check: No UPDATE/DELETE/DROP?      │
│ - Security: Parameterized queries    │
└────────┬─────────────────────────────┘
         │
         ▼
  ┌──YES──┘
  │
  ├─→ ❌ NOT SELECT ──→ Return Error
  │
  └─→ ✅ IS SELECT ──→ Execute Query
         │
         ▼
┌──────────────────────────────────────┐
│ Execute on PostgreSQL Database       │
│ - Run actual SELECT query            │
│ - Get results                        │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Format Response                      │
│ {                                    │
│   success: true,                     │
│   rowCount: 10,                      │
│   data: [...]                        │
│ }                                    │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Display Results in Table             │
│ - Show columns                       │
│ - Show rows                          │
│ - Format values appropriately        │
└──────────────────────────────────────┘
```

### 3. Database Seeding Flow

```
┌──────────────────────┐
│  Click "Seed" Button │
└────────┬─────────────┘
         │
         ▼
┌────────────────────────────┐
│ Confirmation Dialog        │
│ "Seed database with data?" │
└────────┬─────────────────┘
         │
    ┌────┴───────┐
    │             │
   YES            NO
    │             │
    ▼             └──→ Cancel
┌──────────────────────────────────────┐
│ POST /api/admin/db/seed              │
│ (with JWT token & admin role)        │
└────────┬──────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Backend: Check Prerequisites         │
│ - Database connected?                │
│ - Demo users already exist?          │
└────────┬──────────────────────────────┘
         │
    ┌────┴──────────────────────┐
    │                           │
   EXISTS              DOESN'T EXIST
    │                           │
    ▼                           ▼
 ERROR            ┌─────────────────────┐
              │ Load seed.js functions  │
              └────────┬─────────────────┘
                       │
                       ▼
              ┌──────────────────────┐
              │ seedUsers()          │
              │ - Hash passwords     │
              │ - Insert 4 users     │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ seedUserRoles()      │
              │ - Assign roles       │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ seedDepartments()    │
              │ - Create depts       │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ seedEmployees()      │
              │ - Create employees   │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ More seed functions..│
              │ (courses, assets,    │
              │  compliance, KPIs)   │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Seeding Complete!    │
              │ Return demo creds    │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Display Success Msg  │
              │ Show demo users      │
              │ Reload table data    │
              └──────────────────────┘
```

---

## Component Interaction Diagram

```
┌─────────────────────────────────────────────────────────┐
│              Frontend Components                         │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐                                   │
│  │  Header/Status   │◄──── Connection Status Badge      │
│  │  - Title         │                                   │
│  │  - Status        │                                   │
│  └────────┬─────────┘                                   │
│           │                                              │
│  ┌────────▼──────────────┐    ┌──────────────────┐      │
│  │   Sidebar            │    │  Content Area    │      │
│  │ ┌──────────────────┐ │    │ ┌────────────────┐│      │
│  │ │ Connection Info  │ │    │ │ Table Info     ││      │
│  │ │ - Host/Port/DB   │ │    │ │ - Columns      ││      │
│  │ │ - Table Count    │ │    │ │ - Row Count    ││      │
│  │ └──────────────────┘ │    │ └────────────────┘│      │
│  │                      │    │                   │      │
│  │ ┌──────────────────┐ │    │ ┌────────────────┐│      │
│  │ │  Table List      │ │    │ │ Schema Table   ││      │
│  │ │ □ users (4)      │ │◄──┐│ │ (Columns)      ││      │
│  │ │ □ employees (8)  │ │   │ │                ││      │
│  │ │ □ departments (5)│ │   │ │ ┌────────────────┐     │
│  │ │ □ courses (4)    │ │   │ │ │ Data Table      │    │
│  │ └──────────────────┘ │   │ │ │ (Paginated)     │    │
│  │                      │   │ │ └────────────────┘│      │
│  │ ┌──────────────────┐ │   │ │                 │      │
│  │ │  Action Buttons  │ │   │ │ ┌────────────────┐     │
│  │ │ [📝 Query] [🌱] │ │   │ │ │ Pagination     │      │
│  │ │  Seed   Database  │ │   │ │ Prev | 1/5 | Next      │
│  │ └──────────────────┘ │   │ │ └────────────────┘│      │
│  │                      │   │ │                 │      │
│  └──────────────────────┘   │ └────────────────┘│      │
│                              │                   │      │
│                              │ ┌────────────────┐│      │
│                              │ │ Query Editor   ││      │
│                              │ │ (Hidden)       ││      │
│                              │ │ ┌────────────┐ ││      │
│                              │ │ │ textarea   │ ││      │
│                              │ │ │ [Execute]  │ ││      │
│                              │ │ └────────────┘ ││      │
│                              │ └────────────────┘│      │
│                              │                   │      │
│                              └───────────────────┘      │
│                                                          │
└─────────────────────────────────────────────────────────┘
         │                              │
         │ API Calls                    │
         │ (HTTP/REST)                  │
         │                              │
         ▼                              ▼
    ┌─────────────────────────────────────────┐
    │       Backend Route Handlers             │
    ├─────────────────────────────────────────┤
    │ ┌─────────────────────────────────────┐ │
    │ │ Middleware Layer                    │ │
    │ │ - verifyToken()                     │ │
    │ │ - requireRoles('admin')             │ │
    │ │ - Error handling                    │ │
    │ └────────┬────────────────────────────┘ │
    │          │                              │
    │ ┌────────▼────────────────────────────┐ │
    │ │ Route Handlers                      │ │
    │ │ ├─ /db/inspect                      │ │
    │ │ ├─ /db/schema/:tableName            │ │
    │ │ ├─ /db/data/:tableName              │ │
    │ │ ├─ /db/query                        │ │
    │ │ └─ /db/seed                         │ │
    │ └────────┬────────────────────────────┘ │
    │          │                              │
    │ ┌────────▼────────────────────────────┐ │
    │ │ Database Operations                 │ │
    │ │ - Query information_schema          │ │
    │ │ - Query public tables               │ │
    │ │ - Execute user queries              │ │
    │ │ - Run seed functions                │ │
    │ └─────────────────────────────────────┘ │
    │                                          │
    └──────────────────┬─────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────────┐
         │  PostgreSQL Database            │
         │  - information_schema           │
         │  - public schema tables         │
         │  - User data                    │
         └─────────────────────────────────┘
```

---

## Authentication & Authorization Flow

```
┌──────────────────────────┐
│  User Navigates To       │
│  /admin-db-inspect.html  │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Frontend: Check localStorage         │
│ - authToken exists?                  │
│ - Token not empty?                   │
└────────┬─────────────────────────────┘
         │
    ┌────┴──────────┐
    │               │
   YES              NO
    │               │
    │               └──→ Redirect to login (index.html)
    │
    ▼
┌──────────────────────────────────────┐
│ Frontend: Send First API Request     │
│ GET /api/admin/db/inspect            │
│ Headers: {                           │
│   Authorization: "Bearer {token}"    │
│ }                                    │
└────────┬──────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Backend: verifyToken Middleware      │
│ 1. Extract token from header         │
│ 2. Verify signature                  │
│ 3. Decode payload                    │
│ 4. Check expiration                  │
└────────┬──────────────────────────────┘
         │
    ┌────┴──────────────────┐
    │                       │
 VALID                   INVALID
    │                       │
    │                       └──→ Return 401 Unauthorized
    │
    ▼
┌──────────────────────────────────────┐
│ Backend: requireRoles('admin')       │
│ 1. Get user ID from token            │
│ 2. Query roles from database         │
│ 3. Check if admin role exists        │
└────────┬──────────────────────────────┘
         │
    ┌────┴──────────────────┐
    │                       │
  ADMIN                  NOT ADMIN
    │                       │
    │                       └──→ Return 403 Forbidden
    │
    ▼
┌──────────────────────────────────────┐
│ Proceed to Route Handler             │
│ - Execute database inspection        │
│ - Return results                     │
└────────┬──────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Frontend: Receive Response           │
│ 1. Parse JSON                        │
│ 2. Display in UI                     │
│ 3. Handle errors                     │
└──────────────────────────────────────┘
```

---

## Security Layers

```
┌──────────────────────────────────────────────────────────────┐
│                     Layer 1: Transport                        │
│ - HTTPS/SSL encryption (Render backend)                      │
│ - Secure database connection (SSL certificates)              │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│                  Layer 2: Authentication                      │
│ - JWT token validation                                       │
│ - Token expiration check                                     │
│ - User session verification                                  │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│                 Layer 3: Authorization                        │
│ - Role-based access control (RBAC)                           │
│ - Admin role required (@requireRoles('admin'))               │
│ - User role verification from database                       │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│                  Layer 4: Input Validation                    │
│ - Table name sanitization (no special chars)                 │
│ - Query type validation (SELECT only)                        │
│ - Parameter limit enforcement (50-500 rows)                  │
│ - SQL injection prevention (parameterized queries)           │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│                 Layer 5: Database Operations                  │
│ - Read-only operations (SELECT)                              │
│ - No write/delete/modify allowed                             │
│ - Parameterized queries ($1, $2, etc.)                       │
│ - Information schema queries only                            │
└──────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────┐
│                  Layer 6: Audit Logging                       │
│ - Log admin access in audit_logs table                       │
│ - Track queries executed                                     │
│ - Record data access                                         │
│ - Monitor suspicious activity                                │
└──────────────────────────────────────────────────────────────┘
```

---

## Database Query Safety Checks

```
User Input: "SELECT * FROM users;"

         │
         ▼ Frontend Validation
    ┌─────────────────┐
    │ Trim & validate │
    │ - Not empty?    │
    │ - Reasonable?   │
    └────────┬────────┘
             │
             ▼ Send to Backend
    ┌─────────────────────────────────┐
    │ Backend SQL Safety Checks       │
    │                                 │
    │ 1. Extract query parameter:     │
    │    "$1" = "SELECT * FROM users" │
    │                                 │
    │ 2. Check first keyword:         │
    │    query.toUpperCase().starts   │
    │    With('SELECT') ✓             │
    │                                 │
    │ 3. Reject dangerous words:      │
    │    !query.includes('DROP')      │
    │    !query.includes('DELETE')    │
    │    !query.includes('ALTER')     │
    │    !query.includes('UPDATE')    │
    │    ✓ All pass                   │
    │                                 │
    │ 4. Use pool.query() with:       │
    │    - Parameterized values       │
    │    - Never concatenate strings  │
    │    - Let postgres driver handle │
    │      SQL escaping               │
    │                                 │
    └────────┬──────────────────────┘
             │
             ▼ Execute on Database
    ┌─────────────────────────────────┐
    │ PostgreSQL Safe Execution       │
    │                                 │
    │ - Prepared statements           │
    │ - Bound parameters              │
    │ - Connection pool management    │
    │ - Error handling                │
    │                                 │
    └────────┬──────────────────────┘
             │
             ▼ Return Results
    ┌─────────────────────────────────┐
    │ Format & Display                │
    │ - Escape HTML in values         │
    │ - Format dates/numbers          │
    │ - Limit result size             │
    │                                 │
    └─────────────────────────────────┘
```

---

**Version:** 1.0  
**Created:** 2026-11-05  
**Last Updated:** 2026-11-05
