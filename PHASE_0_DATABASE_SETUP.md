# 🚀 PHASE 0: DATABASE FOUNDATION SETUP GUIDE

**Status:** Ready to Execute  
**Timeline:** Week 0 (5 consecutive working days)  
**Team:** 1 DevOps Engineer + 1 Senior Backend Developer  
**Deliverables:** Production-ready database with 42+ tables, Docker environment, CI/CD pipeline  

---

## ✅ Phase 0 Overview

Phase 0 is the foundation phase where we establish the complete development environment and initialize the production-ready database. This phase must be completed before any service development can begin.

### Phase 0 Goals
- ✅ Complete local development environment with Docker Compose
- ✅ Production-grade PostgreSQL database with 42+ tables initialized
- ✅ Redis cache and Kafka message queue operational
- ✅ Database seeding with comprehensive demo data
- ✅ CI/CD pipeline configured and tested
- ✅ Monitoring and logging infrastructure ready

### Phase 0 Success Criteria
- All Docker services start successfully (`docker-compose up` works)
- Database connection pool operational
- Seed script runs successfully, creates demo users and data
- All 42 tables created with correct indexes and relationships
- Health checks passing for all services
- CI/CD pipeline executing on code push

---

## 📋 Phase 0 Breakdown (5 Days)

### **DAY 1-2: ENVIRONMENT SETUP** (8 hours)

#### Morning (4 hours): Install Required Software

**Step 1: Verify Prerequisites** ✅
```powershell
# Windows PowerShell
node --version          # Should be 18+ (Node LTS)
npm --version           # Should be 9+
docker --version        # Should be installed
docker-compose --version  # Should be v2+
```

**Expected Output:**
```
v18.18.0
9.6.7
Docker version 20.10.x
Docker Compose version 2.x.x
```

**Step 2: Install if Missing** 
- Download Node.js 18 LTS from https://nodejs.org
- Download Docker Desktop from https://docker.com/products/docker-desktop
- Install Git from https://git-scm.com

**Step 3: Clone/Navigate to Project**
```bash
cd c:\CODEBASE\EHS
git status  # Verify repo is ready
```

**Step 4: Install Node Dependencies**
```bash
# Install global dependencies for entire monorepo
npm install

# Install backend-specific dependencies
cd backend
npm install
cd ..
```

**Step 5: Create .env File**
```bash
# Copy template to .env
copy .env.example .env

# Edit .env with your settings (default values work for local dev)
# Key settings for local development:
# DB_HOST=localhost
# REDIS_HOST=localhost
# AWS_S3_BUCKET=ehs-documents (for local use with MinIO)
```

#### Afternoon (4 hours): Start Docker Services

**Step 6: Create Database Folder** ✅
```bash
mkdir -p database
# This folder is referenced in docker-compose.yml
```

**Step 7: Start Docker Compose Stack**
```bash
# Start all services in background
docker-compose up -d

# Expected output:
# ✓ postgres (started)
# ✓ redis (started)
# ✓ kafka (started)
# ✓ minio (started)
# ✓ zookeeper (started)
```

**Step 8: Verify Services Running**
```bash
# Check all containers
docker ps

# Expected: 5 containers running
# ehs-postgres    postgres:15
# ehs-redis       redis:7
# ehs-kafka       cp-kafka:7.5.0
# ehs-zookeeper   cp-zookeeper:7.5.0
# ehs-minio       minio/minio
```

**Step 9: Test Database Connection**
```bash
# From Windows command line, test postgres connection
# Option 1: Using psql (if installed)
psql -h localhost -U ehsuser -d ehsdb -c "SELECT NOW();"

# Option 2: Using Node script
node -e "const pg = require('pg'); const pool = new pg.Pool({user:'ehsuser',password:'ehspassword123',host:'localhost',port:5432,database:'ehsdb'}); pool.query('SELECT NOW()', (err,res) => { console.log(err || res.rows[0]); process.exit(); });"
```

**Expected Output:**
```
2026-10-27 15:30:45.123456+00
```

**Day 1-2 Deliverables:**
- ✅ Docker Desktop running with compose
- ✅ All 5 services started and healthy
- ✅ PostgreSQL database accessible
- ✅ Redis, Kafka, MinIO operational
- ✅ .env file created and configured

**Verification Checklist:**
```
☐ Node.js v18+ installed
☐ Docker Desktop running
☐ docker-compose.yml in place
☐ Docker containers running (docker ps shows 5)
☐ Database connection successful
☐ .env file created with correct values
☐ No Docker errors or warnings
```

---

### **DAY 3: PROJECT STRUCTURE & DATABASE INITIALIZATION** (8 hours)

#### Morning (4 hours): Project Structure

**Step 1: Create Project Folder Structure**
```bash
# Already created, verify structure exists:
cd c:\CODEBASE\EHS

# Expected folders:
# backend/
# frontend/
# database/
# .github/
```

**Step 2: Verify Docker init.sql Location**
```bash
# Docker Compose references this file:
# ./database/init.sql:/docker-entrypoint-initdb.d/01-init.sql

# Verify file exists and has content
ls -la database/init.sql
wc -l database/init.sql  # Should be 1000+ lines
```

**Step 3: Backend Project Structure**
```bash
cd backend

# Expected structure:
# backend/
# ├── package.json
# ├── server.js
# ├── seed.js          ← Database seeding script
# ├── .env
# ├── controllers/     ← Service endpoints
# ├── models/          ← Database models
# ├── routes/          ← API routes
# ├── middleware/      ← Auth, logging, etc
# ├── utils/           ← Helper functions
# └── tests/           ← Test files
```

**Step 4: Update .env for Backend**
```bash
# backend/.env should contain:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ehsdb
DB_USER=ehsuser
DB_PASSWORD=ehspassword123
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret_min_32_chars
PORT=5000
```

#### Afternoon (4 hours): Database Initialization

**Step 5: Verify Database Tables Created** ✅

Docker Compose automatically runs `init.sql` on first startup. Verify tables were created:

```bash
# Connect to database
docker exec -it ehs-postgres psql -U ehsuser -d ehsdb -c "\dt"

# Expected output: List of all 42+ tables
# public | audit_logs
# public | assets
# public | assessments
# public | attendence_records
# ...
# (showing 42 rows)
```

**Step 6: Verify Schema Integrity**
```bash
# Check critical tables exist
docker exec -it ehs-postgres psql -U ehsuser -d ehsdb -c "\dt users employees departments"

# Expected output:
#  public | users      | table
#  public | employees  | table
#  public | departments| table
```

**Step 7: Verify Indexes Created**
```bash
# Check indexes (should have 100+)
docker exec -it ehs-postgres psql -U ehsuser -d ehsdb -c "SELECT COUNT(*) FROM pg_indexes;"

# Expected: 100+
```

**Step 8: Verify Views Created**
```bash
# Check views
docker exec -it ehs-postgres psql -U ehsuser -d ehsdb -c "\dv"

# Expected: 4 views
# active_employees
# pending_compliance_records
# expiring_certifications
# open_incidents_summary
```

**Step 9: Verify Roles and Permissions**
```bash
# Check roles table
docker exec -it ehs-postgres psql -U ehsuser -d ehsdb -c "SELECT * FROM roles;"

# Expected output: 4 roles (admin, manager, employee, viewer)
```

**Day 3 Deliverables:**
- ✅ Database fully initialized with 42+ tables
- ✅ Indexes created for performance
- ✅ Views created for reporting
- ✅ Roles table seeded with 4 roles
- ✅ Database integrity verified
- ✅ Backend folder structure ready

**Verification Checklist:**
```
☐ Database init.sql executed successfully
☐ 42+ tables created (verify with \dt)
☐ 100+ indexes exist
☐ 4 views created
☐ 4 roles seeded
☐ No schema errors in docker logs
☐ Connection string works
```

---

### **DAY 4: DATABASE SEEDING** (8 hours)

#### All Day: Populate Database with Demo Data

**Step 1: Understand Seed Script**
```javascript
// backend/seed.js runs these functions:
1. seedUsers()              - Create 4 demo users (admin, manager, employee, safety)
2. seedUserRoles()          - Assign roles to users
3. seedDepartments()        - Create 5 departments
4. seedEmployees()          - Create 4 employees with skills and compliance scores
5. seedCourses()            - Create 4 training courses
6. seedComplianceTemplates()- Create 3 compliance checklists
7. seedAssets()             - Create 3 assets (equipment, PPE, vehicle)
8. seedKPIs()               - Create 4 KPI definitions
```

**Step 2: Navigate to Backend**
```bash
cd backend
ls -la seed.js  # Verify file exists
```

**Step 3: Run Seed Script**
```bash
# Using Node
node seed.js

# Expected output:
# 🚀 Starting EHS Database Seeding...
#
# Database Configuration:
#   Host: localhost
#   Port: 5432
#   Database: ehsdb
#   User: ehsuser
#
# ✅ Database connection successful
#
# 📝 Seeding users...
# ✅ Created user: admin@ehssuite.com (ID: 1)
# ✅ Created user: manager@ehssuite.com (ID: 2)
# ✅ Created user: employee@ehssuite.com (ID: 3)
# ✅ Created user: safety@ehssuite.com (ID: 4)
#
# 📋 Seeding user roles...
# ✅ Assigned admin role to admin@ehssuite.com
# ✅ Assigned manager role to manager@ehssuite.com
# ✅ Assigned employee role to employee@ehssuite.com
# ✅ Assigned manager role to safety@ehssuite.com
#
# ... (continues for other seed functions)
#
# 🎉 Database seeding completed successfully!
#
# 📋 Demo User Credentials:
#   Email: admin@ehssuite.com
#   Password: demo123456
#
# 📋 Other Demo Users:
#   manager@ehssuite.com (Password: demo123456)
#   employee@ehssuite.com (Password: demo123456)
#   safety@ehssuite.com (Password: demo123456)
```

**Step 4: Verify Seed Data**
```bash
# Check users created
docker exec -it ehs-postgres psql -U ehsuser -d ehsdb -c "SELECT email, full_name FROM users ORDER BY created_at;"

# Expected:
# admin@ehssuite.com     | Admin User
# manager@ehssuite.com   | Sarah Manager
# employee@ehssuite.com  | John Employee
# safety@ehssuite.com    | Alice Safety Officer

# Check employees created
docker exec -it ehs-postgres psql -U ehsuser -d ehsdb -c "SELECT first_name, last_name, email FROM employees;"

# Check departments created
docker exec -it ehs-postgres psql -U ehsuser -d ehsdb -c "SELECT name FROM departments;"

# Check courses created
docker exec -it ehs-postgres psql -U ehsuser -d ehsdb -c "SELECT name, category FROM courses;"

# Check assets created
docker exec -it ehs-postgres psql -U ehsuser -d ehsdb -c "SELECT asset_number, name FROM assets;"
```

**Step 5: Verify Demo Credentials Work**

For now, this is just data in the database. In Phase 1, the Auth Service will use these credentials:

```
Demo User:
  Email: admin@ehssuite.com
  Password: demo123456
  Role: admin

Manager User:
  Email: manager@ehssuite.com
  Password: demo123456
  Role: manager

Employee User:
  Email: employee@ehssuite.com
  Password: demo123456
  Role: employee

Safety Officer:
  Email: safety@ehssuite.com
  Password: demo123456
  Role: manager (with safety oversight)
```

**Step 6: Backup Database (Optional)**
```bash
# Create backup of seeded database
docker exec ehs-postgres pg_dump -U ehsuser ehsdb > database-backup-$(date +%Y%m%d).sql

# To restore:
# docker exec -i ehs-postgres psql -U ehsuser ehsdb < database-backup-20261027.sql
```

**Day 4 Deliverables:**
- ✅ 4 demo users created with correct roles
- ✅ 5 departments created
- ✅ 4 employees created with skills and compliance scores
- ✅ 4 training courses created
- ✅ 3 compliance templates created
- ✅ 3 assets created (equipment, PPE, vehicle)
- ✅ 4 KPI definitions created
- ✅ Demo credentials documented

**Verification Checklist:**
```
☐ Seed script runs without errors
☐ 4 users created (check: SELECT COUNT(*) FROM users;)
☐ 4 user-role assignments created
☐ 5 departments created
☐ 4 employees created
☐ 4 courses created
☐ 3 compliance templates created
☐ 3 assets created
☐ 4 KPIs created
☐ Demo credentials verified in database
☐ Database backup created
```

---

### **DAY 5: CI/CD PIPELINE & HEALTH CHECKS** (8 hours)

#### Morning (4 hours): CI/CD Configuration

**Step 1: Create GitHub Actions Workflow**
```bash
mkdir -p .github/workflows
```

**Step 2: Create Build Workflow** (See file below)

**Step 3: Create Deployment Workflow** (See file below)

**Step 4: Configure Environment Secrets in GitHub**
```
Go to GitHub repo → Settings → Secrets and variables → Actions

Add secrets:
- DATABASE_URL (Render production database)
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_S3_BUCKET
- JWT_SECRET (production)
- DOCKER_REGISTRY_USERNAME
- DOCKER_REGISTRY_PASSWORD
```

#### Afternoon (4 hours): Testing Framework & Health Checks

**Step 5: Setup Jest Testing**
```bash
cd backend
npm install --save-dev jest supertest

# Create test directory
mkdir -p tests
mkdir -p tests/unit tests/integration
```

**Step 6: Create Health Check Endpoint**
```javascript
// backend/routes/health.js
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    database: 'connected',
    redis: 'connected',
    version: '1.0.0'
  });
});
```

**Step 7: Start Backend Server**
```bash
cd backend
npm start

# Expected output:
# ✅ Connected to PostgreSQL database
# ✅ Redis cache connected
# ✅ Kafka brokers connected
# 🚀 Server running on port 5000
```

**Step 8: Test Health Endpoint**
```bash
# In another terminal
curl http://localhost:5000/health

# Expected:
# {
#   "status": "healthy",
#   "timestamp": "2026-10-27T15:30:45.123Z",
#   "uptime": 12.345,
#   "database": "connected",
#   "redis": "connected",
#   "version": "1.0.0"
# }
```

**Step 9: Run Database Connection Test**
```bash
# From backend directory
npm run test:db

# Expected output:
# ✅ Database connection pool: healthy
# ✅ Redis connection: healthy
# ✅ All tables present: 42+ tables
# ✅ Demo data verified: 4 users, 5 departments
```

**Step 10: Docker Healthchecks**
```bash
# Check if services are healthy
docker ps --format "table {{.Names}}\t{{.Status}}"

# Expected output:
# NAMES                NAMES
# ehs-postgres         Up 2 hours (healthy)
# ehs-redis            Up 2 hours (healthy)
# ehs-kafka            Up 2 hours (healthy)
# ehs-zookeeper        Up 2 hours (healthy)
# ehs-minio            Up 2 hours (healthy)
```

**Day 5 Deliverables:**
- ✅ GitHub Actions CI/CD workflows created
- ✅ Automated testing framework setup
- ✅ Health check endpoints functional
- ✅ Docker service health checks passing
- ✅ Backend server starts successfully
- ✅ Database connection verified
- ✅ All services operational

**Verification Checklist:**
```
☐ .github/workflows/ folder created with workflows
☐ GitHub Actions executing on push
☐ Build pipeline passes all checks
☐ Jest testing framework installed
☐ Backend server starts (npm start)
☐ Health endpoint responds correctly
☐ All 5 Docker services healthy
☐ Database seeded and accessible
☐ No console errors in backend
☐ CI/CD pipeline green
```

---

## 🎯 Phase 0 Success Criteria

### Technical Requirements
- ✅ **Database**: 42+ tables created, indexed, and seeded
- ✅ **Data**: Demo users, departments, employees, courses, assets, KPIs loaded
- ✅ **Services**: PostgreSQL, Redis, Kafka, MinIO all operational
- ✅ **Code Quality**: Linting passes, no errors
- ✅ **Testing**: Jest framework ready, basic health checks pass
- ✅ **CI/CD**: GitHub Actions pipeline configured and running
- ✅ **Monitoring**: Health checks operational for all services

### Operational Requirements
- ✅ **Documentation**: All commands and configurations documented
- ✅ **Reproducibility**: Another developer can run setup in <2 hours
- ✅ **Backup**: Database backup created and verified
- ✅ **Credentials**: Demo credentials documented securely
- ✅ **Performance**: All services respond in <100ms to health checks

### Code Quality Metrics
- Test coverage: Ready for >80% (Phase 1)
- Linting: 0 errors
- Database indexes: 100+ created
- Schema integrity: All constraints enforced
- Audit logging: Triggers in place

---

## 📊 Phase 0 Summary

| Item | Status | Details |
|------|--------|---------|
| **Duration** | 5 days | 40 hours total (10 per developer) |
| **Team** | 2 people | 1 DevOps, 1 Senior Backend Dev |
| **Services** | 5 running | PostgreSQL, Redis, Kafka, MinIO, Zookeeper |
| **Database Tables** | 42+ created | All schemas initialized |
| **Indexes** | 100+ created | For query performance |
| **Demo Data** | Seeded | 4 users, 5 departments, 4 courses, etc. |
| **CI/CD** | Configured | GitHub Actions, automated testing |
| **Testing** | Framework ready | Jest installed, health checks operational |
| **Documentation** | Complete | Setup guides, credentials, troubleshooting |

---

## 🔧 Troubleshooting

### Issue: "Cannot connect to Docker daemon"
**Solution:**
```bash
# Make sure Docker Desktop is running
# Start Docker Desktop application
docker ps  # Should work after Docker starts
```

### Issue: "Port 5432 already in use"
**Solution:**
```bash
# Kill existing PostgreSQL or container on port 5432
# Windows:
netstat -ano | findstr :5432
taskkill /PID <pid> /F

# Or change port in docker-compose.yml:
# ports:
#   - "5433:5432"  # Map to different port
```

### Issue: "Database connection refused"
**Solution:**
```bash
# Wait for database to start (takes 30-60 seconds)
docker logs ehs-postgres  # Check logs

# Restart services
docker-compose restart postgres

# Test connection
docker exec ehs-postgres pg_isready -U ehsuser
```

### Issue: "Seed script fails with 'table does not exist'"
**Solution:**
```bash
# Database might not have completed initialization
docker-compose restart postgres

# Wait 1 minute for init.sql to run
sleep 60

# Try seed script again
node seed.js
```

### Issue: "Redis/Kafka won't start"
**Solution:**
```bash
# Check Docker memory allocation (need ~4GB)
docker system df

# Increase Docker Desktop resources:
# Settings > Resources > Memory: 6-8 GB
# Settings > Resources > CPU: 4+ cores

# Restart Docker services
docker-compose down
docker-compose up -d
```

---

## 📝 Phase 0 Checklist

### Before Starting
- [ ] Read this entire guide
- [ ] Node.js 18+ installed
- [ ] Docker Desktop installed (4GB+ RAM available)
- [ ] Git configured
- [ ] .env file created

### Day 1-2: Environment
- [ ] Docker services running (docker ps shows 5)
- [ ] Database connection successful
- [ ] All health checks passing
- [ ] .env configured

### Day 3: Database
- [ ] 42+ tables created
- [ ] 100+ indexes created
- [ ] Views and functions working
- [ ] Schema integrity verified

### Day 4: Seeding
- [ ] 4 demo users created
- [ ] Demo roles assigned
- [ ] Departments and employees created
- [ ] Training courses added
- [ ] Assets and KPIs seeded

### Day 5: CI/CD
- [ ] GitHub Actions workflows created
- [ ] Testing framework installed
- [ ] Health endpoints functional
- [ ] Backend server running
- [ ] CI/CD pipeline passing

### Ready for Phase 1?
- [ ] All Phase 0 items complete
- [ ] No blocking issues
- [ ] Team trained on setup
- [ ] Documentation reviewed
- [ ] GO/NO-GO decision made

---

## 🚀 Next Steps After Phase 0

Once Phase 0 is complete:

1. **Phase 1 Begins (Week 1-2)**
   - Employee Service implementation
   - Document Service implementation
   - Incident Service implementation
   - Training Service implementation

2. **CI/CD Enhancements**
   - Automated Docker image building
   - Deploy to staging environment
   - Run integration tests

3. **Monitoring Setup**
   - Prometheus metrics collection
   - Grafana dashboards
   - ELK Stack logging

4. **Team Onboarding**
   - All developers set up local environment
   - Review architecture documentation
   - Prepare for Phase 1 sprint

---

## 📞 Support

**Issues or Questions?**

1. Check troubleshooting section above
2. Review BACKEND_DOCUMENTATION_SUMMARY.md
3. Check Docker logs: `docker logs <service_name>`
4. Review database logs: `docker exec ehs-postgres tail -f /var/log/postgresql/postgresql.log`
5. Escalate to tech lead

---

**Phase 0 Status:** 🟢 READY TO EXECUTE

**Last Updated:** October 27, 2026  
**Document Version:** 1.0  
**Target Audience:** DevOps Engineers, Backend Developers, Tech Leads
