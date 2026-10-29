# EHS Suite Backend Services Architecture
## Comprehensive Microservices Design & Implementation Guide

**Date:** October 27, 2026  
**Project:** EHS Software Suite - Backend Services  
**Status:** 📋 Architecture & Specification Phase  
**Target:** Enterprise-Grade Microservices on Kubernetes  

---

## 🏗️ Executive Summary

This document defines the complete backend services architecture for the EHS Suite, mapping each of the 9 UI portals to dedicated microservices with clear responsibilities, API contracts, and deployment topology.

### Current State
- ✅ Authentication service (Express.js)
- ✅ File upload to S3
- ✅ PostgreSQL database
- ❌ 6 additional microservices needed

### Services to Build (6 new + 1 existing = 7 total)
1. **Employee Lifecycle Service** - Manage employees, onboarding, training
2. **Document Management Service** - Upload, OCR, search, versioning
3. **Incident & Compliance Service** - Track incidents, compliance checklists
4. **Training Service** - Manage courses, enrollment, certifications
5. **Asset Management Service** - Equipment, calibration, maintenance
6. **HR & Payroll Service** - Leave management, attendance, payroll
7. **Analytics & Reporting Service** - KPIs, dashboards, predictive insights

### Architecture Principles
- **Microservices**: Independent, loosely-coupled services
- **API-First**: RESTful APIs with OpenAPI spec
- **Event-Driven**: Kafka/RabbitMQ for inter-service communication
- **Data Isolation**: Each service owns its database schema
- **Security**: Keycloak IAM, JWT tokens, RBAC
- **Scalability**: Container-native, Kubernetes-ready
- **Observability**: Structured logging, metrics, tracing

---

## 📊 Service Topology Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                      API GATEWAY / LOAD BALANCER                │
│              (Nginx Ingress / Azure Application Gateway)        │
└────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  AUTH SERVICE    │  │  EMPLOYEE SVCS   │  │  DOCUMENT SVCS   │
│  (Existing)      │  │  (New)           │  │  (New)           │
│                  │  │                  │  │                  │
│ • Login/Signup   │  │ • Employees      │  │ • Upload         │
│ • JWT Tokens     │  │ • Onboarding     │  │ • OCR Processing │
│ • Password Reset │  │ • Training       │  │ • Search         │
│ • MFA Ready      │  │ • Certification  │  │ • Versioning     │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                     │
        ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ INCIDENT SVCS    │  │  ASSET SVCS      │  │  HR SVCS         │
│ (New)            │  │  (New)           │  │  (New)           │
│                  │  │                  │  │                  │
│ • Incidents      │  │ • Equipment      │  │ • Leave Mgmt     │
│ • Compliance     │  │ • Maintenance    │  │ • Attendance     │
│ • Checklists     │  │ • Calibration    │  │ • Payroll        │
│ • Workflows      │  │ • QR Codes       │  │ • Department     │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                     │
        ▼                     ▼                     ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ TRAVEL SVCS      │  │  ANALYTICS SVCS  │  │ MANAGEMENT SVCS  │
│ (New)            │  │  (New)           │  │  (New)           │
│                  │  │                  │  │                  │
│ • Travel Reqs    │  │ • KPI Metrics    │  │ • Settings       │
│ • Risk Assess    │  │ • Reports        │  │ • RBAC           │
│ • Insurance      │  │ • Predictions    │  │ • Integration    │
│ • Alerts         │  │ • Dashboards     │  │ • Health Check   │
└────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘
         │                     │                     │
        ▼━━━━━━━━━━━━━━━━━━━━━▼━━━━━━━━━━━━━━━━━━━━▼
┌────────────────────────────────────────────────────────────────┐
│              MESSAGE QUEUE (Kafka/RabbitMQ)                     │
│  Events: UserCreated, DocumentUploaded, IncidentCreated, etc    │
└────────────────────────────────────────────────────────────────┘
         │
┌────────┴─────────────────────────────────────────┐
│                                                   │
▼                                                   ▼
┌──────────────────────┐              ┌──────────────────────┐
│   DATA LAYER         │              │  AI/AUTOMATION LAYER │
│                      │              │                      │
│ • PostgreSQL Master  │              │ • Tesseract (OCR)    │
│ • Read Replicas      │              │ • spaCy (NLP)        │
│ • Redis Cache        │              │ • Claude API         │
│ • MinIO (S3 Files)   │              │ • LangChain          │
│ • Keycloak IAM       │              │ • Workflow Engine    │
│ • HashiCorp Vault    │              │ • Scheduler          │
└──────────────────────┘              └──────────────────────┘
```

---

## 🔐 Service Definitions & Responsibilities

### 1. **AUTH SERVICE** (Existing - Express.js)
**Port:** 3001  
**Database:** PostgreSQL (users table)  
**Responsibility:** User authentication, authorization, token management

**Key Endpoints:**
```
POST   /api/auth/register              Register new user
POST   /api/auth/login                 User login (returns JWT)
POST   /api/auth/logout                User logout
POST   /api/auth/refresh-token         Refresh JWT token
GET    /api/auth/profile               Get current user profile
POST   /api/auth/forgot-password       Initiate password reset
POST   /api/auth/reset-password        Complete password reset
POST   /api/auth/mfa/setup             Setup MFA (Keycloak)
POST   /api/auth/mfa/verify            Verify MFA code
```

**Database Schema:**
```sql
users
├─ id (PK)
├─ email (UNIQUE)
├─ password (hashed)
├─ full_name
├─ department_id (FK)
├─ role (admin, manager, employee, viewer)
├─ status (active, inactive, suspended)
├─ created_at
├─ updated_at
└─ last_login
```

---

### 2. **EMPLOYEE LIFECYCLE SERVICE** (New)
**Port:** 3002  
**Database:** PostgreSQL (employees schema)  
**Responsibility:** Employee data, onboarding, training tracking

**Key Features:**
- Employee profiles with skills, certifications
- Onboarding workflow (multi-step, templated)
- Training enrollment & tracking
- Compliance status per employee
- Department & team management
- Employee directory with search/filter

**Key Endpoints:**
```
GET    /api/employees                  List all employees (paginated)
GET    /api/employees/search?q=term    Search employees
GET    /api/employees/:id              Get employee details
POST   /api/employees                  Create employee
PUT    /api/employees/:id              Update employee
DELETE /api/employees/:id              Deactivate employee
GET    /api/employees/:id/compliance   Get employee compliance status
GET    /api/employees/:id/training     Get employee training history
POST   /api/employees/:id/onboard      Start onboarding workflow
GET    /api/employees/:id/onboard      Get onboarding status
POST   /api/employees/:id/onboard/step Complete onboarding step
GET    /api/departments                List departments
POST   /api/departments                Create department
```

**Database Schema:**
```sql
employees
├─ id (PK)
├─ user_id (FK to users)
├─ first_name
├─ last_name
├─ email
├─ phone
├─ department_id (FK)
├─ job_title
├─ manager_id (FK - self join)
├─ hire_date
├─ status (active, inactive, on_leave)
├─ skills (JSON array)
├─ certifications (JSON array)
└─ created_at, updated_at

departments
├─ id (PK)
├─ name
├─ description
├─ manager_id (FK)
├─ budget
└─ created_at

employee_training
├─ id (PK)
├─ employee_id (FK)
├─ training_id (FK)
├─ enrollment_date
├─ completion_date
├─ status (enrolled, in_progress, completed)
└─ score (0-100)

onboarding_checklist
├─ id (PK)
├─ employee_id (FK)
├─ template_id (FK)
├─ step (1-5)
├─ task
├─ completed (boolean)
├─ completed_by (FK to users)
└─ completed_date
```

---

### 3. **DOCUMENT MANAGEMENT SERVICE** (New)
**Port:** 3003  
**Database:** PostgreSQL (documents schema)  
**File Storage:** MinIO / AWS S3  
**Responsibility:** Document upload, OCR, search, version control

**Key Features:**
- Document upload (drag & drop, bulk)
- Automatic OCR processing (Tesseract)
- Full-text search & filtering
- Document versioning & audit trail
- Expiry date tracking
- Category management
- Sharing & permissions
- Comment & annotation

**Key Endpoints:**
```
POST   /api/documents/upload           Upload document(s)
GET    /api/documents                  List documents (with filters)
GET    /api/documents/search?q=term    Full-text search
GET    /api/documents/:id              Get document details
GET    /api/documents/:id/download     Download document
GET    /api/documents/:id/preview      Preview document
PUT    /api/documents/:id              Update document metadata
DELETE /api/documents/:id              Delete document
GET    /api/documents/:id/versions     Get document history
POST   /api/documents/:id/restore      Restore previous version
POST   /api/documents/:id/ocr          Trigger OCR processing
GET    /api/documents/:id/ocr-status   Get OCR status
GET    /api/documents/:id/ocr-text     Get extracted text
POST   /api/documents/:id/share        Share document
GET    /api/documents/:id/comments     Get comments
POST   /api/documents/:id/comments     Add comment
```

**Database Schema:**
```sql
documents
├─ id (PK)
├─ name
├─ user_id (FK - uploader)
├─ category (compliance, training, incident, etc)
├─ s3_key (file path)
├─ s3_url
├─ file_type (pdf, docx, jpg, etc)
├─ file_size
├─ expiry_date (nullable)
├─ is_archived
├─ created_at
├─ updated_at
└─ ocr_status (pending, processing, completed, failed)

document_versions
├─ id (PK)
├─ document_id (FK)
├─ version_number
├─ s3_key
├─ created_by (FK)
├─ created_at
└─ change_description

document_ocr
├─ id (PK)
├─ document_id (FK)
├─ extracted_text (TSVECTOR for search)
├─ confidence_score
├─ processed_at
└─ pages_processed

document_sharing
├─ id (PK)
├─ document_id (FK)
├─ shared_with_user_id (FK)
├─ permission_level (view, edit, admin)
├─ shared_at
└─ expires_at (nullable)

document_comments
├─ id (PK)
├─ document_id (FK)
├─ user_id (FK)
├─ comment_text
├─ page_number (nullable)
├─ created_at
└─ updated_at
```

---

### 4. **INCIDENT & COMPLIANCE SERVICE** (New)
**Port:** 3004  
**Database:** PostgreSQL (incidents schema)  
**Responsibility:** Incident tracking, compliance checklists, workflows

**Key Features:**
- Incident reporting (multi-step form)
- Status tracking & assignment
- Root cause analysis
- Compliance checklist templates
- Due date management & reminders
- Automated escalation rules
- Email notifications
- Audit trail & evidence tracking

**Key Endpoints:**
```
POST   /api/incidents                  Create incident report
GET    /api/incidents                  List incidents (with filters)
GET    /api/incidents/:id              Get incident details
PUT    /api/incidents/:id              Update incident
DELETE /api/incidents/:id              Delete incident
POST   /api/incidents/:id/investigate  Add investigation details
GET    /api/incidents/:id/timeline     Get incident timeline
POST   /api/incidents/:id/assign       Assign incident
POST   /api/incidents/:id/close        Close incident
POST   /api/incidents/:id/reopen       Reopen incident
GET    /api/incidents/analytics        Incident analytics & trends
GET    /api/compliance/checklists      List compliance templates
POST   /api/compliance/checklists      Create template
GET    /api/compliance/checklists/:id  Get template details
GET    /api/compliance/status          Get compliance dashboard
POST   /api/compliance/verify          Verify compliance item
GET    /api/compliance/audit-trail     Get audit trail
```

**Database Schema:**
```sql
incidents
├─ id (PK)
├─ incident_number (unique)
├─ title
├─ description
├─ location
├─ date_occurred
├─ reported_by (FK)
├─ assigned_to (FK, nullable)
├─ severity (critical, high, medium, low)
├─ status (open, investigating, resolved, closed)
├─ category (safety, environmental, health, security)
├─ root_cause (text, nullable)
├─ corrective_actions (JSON array)
├─ due_date
├─ created_at
├─ updated_at
└─ closed_at (nullable)

incident_timeline
├─ id (PK)
├─ incident_id (FK)
├─ action (created, assigned, investigated, resolved, etc)
├─ performed_by (FK)
├─ description
├─ timestamp
└─ evidence_file_id (FK, nullable)

compliance_templates
├─ id (PK)
├─ name
├─ description
├─ frequency (daily, weekly, monthly, quarterly, annual)
├─ items (JSON array of checklist items)
├─ created_at
└─ updated_at

compliance_records
├─ id (PK)
├─ template_id (FK)
├─ employee_id (FK)
├─ due_date
├─ completed_date (nullable)
├─ status (pending, completed, overdue, failed)
├─ checked_by (FK, nullable)
├─ notes (text)
└─ created_at

compliance_audit_trail
├─ id (PK)
├─ record_id (FK)
├─ action
├─ performed_by (FK)
├─ timestamp
└─ evidence_file_id (FK)
```

---

### 5. **TRAINING SERVICE** (New)
**Port:** 3005  
**Database:** PostgreSQL (training schema)  
**Responsibility:** Course management, enrollment, certifications

**Key Features:**
- Course catalog with descriptions
- Enrollment management
- Progress tracking
- Certification management
- Expiry tracking & reminders
- Course materials & resources
- Assessments & quizzes
- Completion certificates
- Compliance mapping

**Key Endpoints:**
```
GET    /api/training/courses           List all courses
GET    /api/training/courses/:id       Get course details
POST   /api/training/courses           Create course
PUT    /api/training/courses/:id       Update course
DELETE /api/training/courses/:id       Delete course
GET    /api/training/courses/:id/enroll Get enrollment info
POST   /api/training/enroll            Enroll in course
GET    /api/training/progress/:empId   Get employee progress
GET    /api/training/certifications    List certifications
GET    /api/training/certifications/:id Get certification details
POST   /api/training/certifications    Issue certification
GET    /api/training/expiring          Get expiring certifications
POST   /api/training/reminders         Send renewal reminders
GET    /api/training/catalog           Browse course catalog
```

**Database Schema:**
```sql
courses
├─ id (PK)
├─ name
├─ description
├─ category (safety, environmental, compliance, etc)
├─ duration_hours
├─ required_frequency_days
├─ pass_score (%)
├─ created_at
└─ updated_at

course_materials
├─ id (PK)
├─ course_id (FK)
├─ title
├─ content_type (video, pdf, quiz, assignment)
├─ content_url
├─ order_sequence
└─ created_at

course_enrollment
├─ id (PK)
├─ course_id (FK)
├─ employee_id (FK)
├─ enrollment_date
├─ completion_date (nullable)
├─ status (enrolled, in_progress, completed, failed)
├─ final_score (nullable)
└─ certificate_id (FK, nullable)

course_progress
├─ id (PK)
├─ enrollment_id (FK)
├─ material_id (FK)
├─ status (not_started, in_progress, completed)
├─ completed_date (nullable)
└─ score (nullable)

certifications
├─ id (PK)
├─ employee_id (FK)
├─ course_id (FK)
├─ certification_number (unique)
├─ issued_date
├─ expiry_date
├─ certificate_file_id (FK)
├─ status (active, expired)
└─ renewed_from (FK, nullable)

assessments
├─ id (PK)
├─ course_id (FK)
├─ title
├─ questions (JSON)
├─ passing_score
└─ created_at
```

---

### 6. **ASSET MANAGEMENT SERVICE** (New)
**Port:** 3006  
**Database:** PostgreSQL (assets schema)  
**Responsibility:** Equipment, calibration, maintenance tracking

**Key Features:**
- Equipment inventory
- QR code generation & scanning
- Maintenance scheduling
- Calibration tracking
- PPE distribution
- Replacement reminders
- Service history
- Depreciation tracking
- Compliance mapping

**Key Endpoints:**
```
GET    /api/assets                     List assets
GET    /api/assets/search?q=term       Search assets
GET    /api/assets/:id                 Get asset details
POST   /api/assets                     Create asset
PUT    /api/assets/:id                 Update asset
DELETE /api/assets/:id                 Deactivate asset
GET    /api/assets/:id/qr              Get QR code
POST   /api/assets/:id/scan            Scan QR code
GET    /api/assets/:id/maintenance     Get maintenance history
POST   /api/assets/:id/maintenance     Schedule maintenance
PUT    /api/assets/:id/maintenance/:mid Update maintenance record
GET    /api/assets/:id/calibration     Get calibration history
POST   /api/assets/:id/calibrate       Schedule calibration
GET    /api/assets/ppe                 List PPE items
POST   /api/assets/:id/distribute      Distribute PPE
GET    /api/assets/compliance          Asset compliance status
```

**Database Schema:**
```sql
assets
├─ id (PK)
├─ asset_number (unique)
├─ name
├─ description
├─ asset_type (equipment, ppe, tool, vehicle)
├─ category
├─ location
├─ responsible_person (FK)
├─ purchase_date
├─ cost
├─ warranty_expiry (nullable)
├─ status (active, maintenance, disposed)
├─ qr_code (unique)
├─ created_at
└─ updated_at

maintenance_schedule
├─ id (PK)
├─ asset_id (FK)
├─ scheduled_date
├─ maintenance_type (preventive, corrective)
├─ description
├─ assigned_to (FK)
├─ status (scheduled, in_progress, completed)
├─ completed_date (nullable)
├─ next_due_date
└─ notes

calibration_record
├─ id (PK)
├─ asset_id (FK)
├─ calibration_date
├─ valid_until
├─ calibrated_by (FK)
├─ certificate_number
├─ status (valid, expired, due)
└─ next_due_date

ppe_distribution
├─ id (PK)
├─ asset_id (FK - PPE item)
├─ employee_id (FK)
├─ distribution_date
├─ return_date (nullable)
├─ condition_returned
├─ notes
└─ created_at

asset_service_history
├─ id (PK)
├─ asset_id (FK)
├─ service_date
├─ service_type
├─ performed_by
├─ cost
├─ notes
└─ next_service_date
```

---

### 7. **HR & PAYROLL SERVICE** (New)
**Port:** 3007  
**Database:** PostgreSQL (hr schema)  
**Responsibility:** Leave management, attendance, payroll

**Key Features:**
- Leave request management
- Attendance tracking
- Payroll processing
- Department management
- Employee benefits
- Salary structures
- Deductions & allowances
- Payslip generation
- Tax calculations

**Key Endpoints:**
```
GET    /api/hr/leaves                  Get leave types
POST   /api/hr/leave-request           Submit leave request
GET    /api/hr/leave-request           List leave requests
PUT    /api/hr/leave-request/:id       Update leave request
POST   /api/hr/leave-request/:id/approve Approve leave
POST   /api/hr/leave-request/:id/reject Reject leave
GET    /api/hr/attendance              Get attendance records
POST   /api/hr/attendance              Mark attendance
GET    /api/hr/payroll                 Get payroll info
POST   /api/hr/payroll/process         Process payroll
GET    /api/hr/payslip/:id             Get payslip
GET    /api/hr/benefits                Get benefits info
POST   /api/hr/benefits/enroll         Enroll in benefit
```

**Database Schema:**
```sql
leave_types
├─ id (PK)
├─ name (annual, sick, casual, maternity)
├─ days_per_year
├─ description
└─ is_paid (boolean)

leave_requests
├─ id (PK)
├─ employee_id (FK)
├─ leave_type_id (FK)
├─ start_date
├─ end_date
├─ duration_days
├─ reason
├─ status (pending, approved, rejected, cancelled)
├─ approved_by (FK, nullable)
├─ requested_date
└─ updated_at

attendance_records
├─ id (PK)
├─ employee_id (FK)
├─ attendance_date
├─ check_in_time
├─ check_out_time
├─ status (present, absent, late, half_day, on_leave)
├─ notes
└─ recorded_at

salary_structure
├─ id (PK)
├─ employee_id (FK)
├─ base_salary
├─ allowances (JSON)
├─ deductions (JSON)
├─ effective_date
├─ end_date (nullable)
└─ created_at

payroll_records
├─ id (PK)
├─ employee_id (FK)
├─ payroll_month
├─ payroll_year
├─ gross_salary
├─ deductions (JSON)
├─ net_salary
├─ tax_amount
├─ processed_date
├─ payslip_id (FK)
└─ status (pending, processed, paid)

payslips
├─ id (PK)
├─ payroll_record_id (FK)
├─ file_id (FK - PDF)
├─ generated_date
└─ sent_date (nullable)

employee_benefits
├─ id (PK)
├─ employee_id (FK)
├─ benefit_name
├─ enrollment_date
├─ status (active, inactive)
└─ details (JSON)
```

---

### 8. **ANALYTICS & REPORTING SERVICE** (New)
**Port:** 3008  
**Database:** PostgreSQL (analytics schema)  
**Caching:** Redis (for performance)  
**Responsibility:** KPIs, dashboards, predictive insights

**Key Features:**
- KPI calculations & tracking
- Custom reporting
- Data export (PDF, Excel, CSV)
- Predictive analytics (Claude AI)
- Trend analysis
- Compliance scoring
- Real-time dashboards
- Scheduled reports

**Key Endpoints:**
```
GET    /api/analytics/dashboard        Get dashboard KPIs
GET    /api/analytics/kpi/:name        Get specific KPI
GET    /api/analytics/reports          List available reports
GET    /api/analytics/reports/:id      Get report details
POST   /api/analytics/reports          Create custom report
GET    /api/analytics/reports/:id/export Export report
GET    /api/analytics/trends           Get trend data
GET    /api/analytics/predictions      Get predictive insights
GET    /api/analytics/compliance-score Get compliance score
POST   /api/analytics/schedule-report  Schedule report delivery
GET    /api/analytics/incident-metrics Get incident analytics
GET    /api/analytics/employee-metrics Get employee analytics
```

**Database Schema:**
```sql
kpi_definitions
├─ id (PK)
├─ name
├─ description
├─ calculation_formula
├─ unit (%, count, hours, days)
├─ target_value
├─ frequency (daily, weekly, monthly)
├─ responsible_person (FK)
└─ created_at

kpi_records
├─ id (PK)
├─ kpi_id (FK)
├─ recorded_date
├─ value
├─ target_value
├─ status (on_track, at_risk, off_track)
├─ notes
└─ calculated_at

custom_reports
├─ id (PK)
├─ name
├─ description
├─ data_sources (JSON - array of service endpoints)
├─ template (html/pdf template)
├─ filters (JSON)
├─ created_by (FK)
├─ last_generated_date
├─ schedule (cron expression, nullable)
└─ created_at

report_executions
├─ id (PK)
├─ report_id (FK)
├─ execution_date
├─ file_id (FK - generated report file)
├─ sent_to_emails (JSON array)
└─ status (generated, sent, failed)

analytics_cache
├─ id (PK)
├─ cache_key (unique)
├─ cached_data (JSON)
├─ cache_type (kpi, trend, prediction)
├─ created_at
└─ expires_at
```

---

### 9. **MANAGEMENT & SETTINGS SERVICE** (New)
**Port:** 3009  
**Database:** PostgreSQL (management schema)  
**Responsibility:** Configuration, RBAC, health checks

**Key Features:**
- Role-based access control (RBAC)
- User permissions management
- System configuration
- Integration management
- Health checks & monitoring
- Audit logs
- System settings
- Feature flags

**Key Endpoints:**
```
GET    /api/management/roles           List roles
POST   /api/management/roles           Create role
PUT    /api/management/roles/:id       Update role
GET    /api/management/roles/:id/perms Get role permissions
POST   /api/management/permissions     Assign permission
DELETE /api/management/permissions/:id Remove permission
GET    /api/management/settings        Get system settings
PUT    /api/management/settings        Update system settings
GET    /api/management/health          Get system health
GET    /api/management/audit-logs      Get audit logs
POST   /api/management/integrations    Configure integration
GET    /api/management/feature-flags   Get feature flags
POST   /api/management/feature-flags   Toggle feature flag
```

**Database Schema:**
```sql
roles
├─ id (PK)
├─ name (admin, manager, employee, viewer)
├─ description
├─ permissions (JSON array)
└─ created_at

permissions
├─ id (PK)
├─ resource (employees, documents, incidents, etc)
├─ action (read, create, update, delete)
├─ description
└─ created_at

user_roles
├─ id (PK)
├─ user_id (FK)
├─ role_id (FK)
└─ assigned_at

system_settings
├─ id (PK)
├─ setting_key (unique)
├─ setting_value (JSON)
├─ description
├─ updated_at
└─ updated_by (FK)

audit_logs
├─ id (PK)
├─ user_id (FK)
├─ action
├─ resource_type
├─ resource_id
├─ changes (JSON)
├─ timestamp
└─ ip_address

integrations
├─ id (PK)
├─ name (jira, slack, email, teams, etc)
├─ config (JSON encrypted)
├─ is_active (boolean)
├─ created_at
└─ updated_at

feature_flags
├─ id (PK)
├─ flag_name
├─ description
├─ is_enabled (boolean)
├─ rollout_percentage (0-100)
├─ created_at
└─ updated_at
```

---

## 🔌 Inter-Service Communication Patterns

### Event-Driven Communication (Async)
```
USER CREATED
  ├─ Employee Service: Create employee profile
  ├─ HR Service: Setup payroll record
  └─ Training Service: Assign mandatory onboarding courses

DOCUMENT UPLOADED
  ├─ Document Service: Store metadata
  ├─ AI Service: Trigger OCR processing
  └─ Notification Service: Send upload confirmation

INCIDENT CREATED
  ├─ Compliance Service: Create checklist
  ├─ Notification Service: Send alerts
  ├─ Analytics Service: Update incident metrics
  └─ Workflow Engine: Start incident process

TRAINING COMPLETED
  ├─ Employee Service: Update certification
  ├─ Compliance Service: Mark checklist item
  ├─ Analytics Service: Update employee metrics
  └─ Notification Service: Send completion certificate
```

### API-to-API Communication (Sync)
```
Dashboard requests employee data
  → Employee Service API

Dashboard requests employee training
  → Training Service API

Dashboard requests compliance status
  → Compliance Service API

All responses cached for 5-10 minutes
```

### Message Queue (Kafka Topics)
```
Topics:
├─ user.events (user.created, user.updated, user.deleted)
├─ document.events (document.uploaded, document.ocr_complete)
├─ incident.events (incident.created, incident.closed)
├─ training.events (training.enrolled, training.completed)
├─ employee.events (employee.onboarded, employee.certified)
├─ compliance.events (compliance.verified, compliance.overdue)
└─ notification.events (send.email, send.sms)

Partitions: By user_id or resource_id for ordering guarantee
Retention: 30 days
Replicas: 3 (production)
```

---

## 🔐 Security Architecture

### Authentication Flow
```
1. User logs in via AUTH Service
   ↓
2. AUTH Service validates credentials against Keycloak
   ↓
3. JWT token issued with:
   - user_id
   - role
   - permissions (scopes)
   - exp (1 hour)
   - iat
   
4. Refresh token stored in secure httpOnly cookie (7 days)
   ↓
5. Frontend includes JWT in Authorization header
   ↓
6. API Gateway validates JWT signature
   ↓
7. Request forwarded to backend service
   ↓
8. Service-level authorization check
```

### Authorization Model (RBAC)
```
Role: Admin
  └─ Permissions:
      ├─ employees.read, employees.create, employees.update, employees.delete
      ├─ documents.read, documents.create, documents.update, documents.delete
      ├─ incidents.read, incidents.create, incidents.update, incidents.delete
      ├─ settings.read, settings.update
      └─ audit_logs.read

Role: Manager
  └─ Permissions:
      ├─ employees.read (only team members)
      ├─ documents.read (assigned only)
      ├─ incidents.read, incidents.update (assigned only)
      └─ reports.read

Role: Employee
  └─ Permissions:
      ├─ employees.read (own profile only)
      ├─ documents.read (assigned or public)
      ├─ incidents.create (own reports)
      └─ training.read (own records)

Role: Viewer
  └─ Permissions:
      └─ All resources.read (no write access)
```

### Data Encryption
```
In Transit:
  ├─ TLS 1.3 for all API calls
  ├─ HTTPS for web traffic
  └─ Encrypted Kafka messages

At Rest:
  ├─ PostgreSQL: Column-level encryption for PII
  ├─ File Storage: Server-side encryption (S3 KMS)
  ├─ Vault: Encrypted secrets (HashiCorp Vault)
  └─ Redis: Optional persistence encryption
```

### Secrets Management
```
Environment Variables:
  ├─ DATABASE_URL → Stored in Vault
  ├─ JWT_SECRET → Stored in Vault
  ├─ AWS_ACCESS_KEY_ID → Stored in Vault
  ├─ AWS_SECRET_ACCESS_KEY → Stored in Vault
  ├─ KEYCLOAK_CLIENT_SECRET → Stored in Vault
  └─ API_KEYS → Stored in Vault

Runtime Retrieval:
  ├─ Service starts
  ├─ Authenticates to Vault
  ├─ Retrieves secrets
  ├─ Stores in memory (never on disk)
  └─ Rotates periodically
```

---

## 📦 Technology Stack

### Core Frameworks
```
Runtime:        Node.js 18 LTS
Framework:      Express.js 4.x
Language:       JavaScript (with TypeScript ready)
Package Mgr:    npm 8.x

Web:
  ├─ Express.js (HTTP framework)
  ├─ Cors (CORS middleware)
  └─ Helmet (security headers)

Database:
  ├─ PostgreSQL 15
  ├─ pg (Node.js driver)
  ├─ Sequelize (ORM) - Optional
  └─ Redis (caching)

Authentication:
  ├─ JWT (jsonwebtoken)
  ├─ bcryptjs (password hashing)
  ├─ Keycloak (IAM)
  └─ Passport.js - Optional

File Upload/Processing:
  ├─ Multer (file handling)
  ├─ AWS SDK (S3)
  ├─ Tesseract.js (OCR)
  ├─ sharp (image processing)
  └─ pdf-parse (PDF processing)

Async Processing:
  ├─ Bull (job queue based on Redis)
  ├─ Kafka (message streaming)
  └─ RabbitMQ (message broker) - Alternative

API & Documentation:
  ├─ Express Router (API routing)
  ├─ Swagger/OpenAPI (documentation)
  ├─ Postman (API testing)
  └─ ajv (JSON schema validation)

Monitoring & Logging:
  ├─ Pino (logging)
  ├─ Prometheus (metrics)
  ├─ ELK Stack (log aggregation)
  ├─ Grafana (dashboards)
  └─ Sentry (error tracking)

Testing:
  ├─ Jest (unit testing)
  ├─ Supertest (HTTP testing)
  ├─ Mocha (integration testing)
  └─ Cypress (E2E testing)

Deployment:
  ├─ Docker (containerization)
  ├─ Kubernetes (orchestration)
  ├─ Helm (K8s package manager)
  └─ GitHub Actions (CI/CD)
```

---

## 📊 Deployment Topology (Kubernetes)

```
Namespace: ehs-app

Deployment Structure:
├─ auth-service (1 pod minimum, 3 max)
│  └─ Port 3001, replicas: 1-3, CPU: 200m, Memory: 256Mi
│
├─ employee-service (1 pod minimum, 3 max)
│  └─ Port 3002, replicas: 1-3, CPU: 200m, Memory: 256Mi
│
├─ document-service (1 pod minimum, 3 max)
│  └─ Port 3003, replicas: 1-3, CPU: 500m, Memory: 512Mi
│
├─ incident-service (1 pod minimum, 2 max)
│  └─ Port 3004, replicas: 1-2, CPU: 200m, Memory: 256Mi
│
├─ training-service (1 pod minimum, 2 max)
│  └─ Port 3005, replicas: 1-2, CPU: 200m, Memory: 256Mi
│
├─ asset-service (1 pod minimum, 2 max)
│  └─ Port 3006, replicas: 1-2, CPU: 200m, Memory: 256Mi
│
├─ hr-service (1 pod minimum, 2 max)
│  └─ Port 3007, replicas: 1-2, CPU: 200m, Memory: 256Mi
│
├─ analytics-service (1 pod minimum, 2 max)
│  └─ Port 3008, replicas: 1-2, CPU: 500m, Memory: 512Mi
│
├─ management-service (1 pod minimum, 1 max)
│  └─ Port 3009, replicas: 1, CPU: 100m, Memory: 128Mi
│
└─ Data Layer:
   ├─ PostgreSQL StatefulSet (1 master, 2 replicas)
   ├─ Redis StatefulSet (1 master, 2 replicas)
   ├─ Kafka StatefulSet (3 brokers)
   └─ MinIO StatefulSet (4 nodes)

Services:
├─ Ingress Service (nginx-ingress)
│  ├─ /api/auth → auth-service:3001
│  ├─ /api/employees → employee-service:3002
│  ├─ /api/documents → document-service:3003
│  ├─ /api/incidents → incident-service:3004
│  ├─ /api/training → training-service:3005
│  ├─ /api/assets → asset-service:3006
│  ├─ /api/hr → hr-service:3007
│  ├─ /api/analytics → analytics-service:3008
│  └─ /api/management → management-service:3009
│
├─ ClusterIP Services (internal)
│  └─ One per service for pod-to-pod communication
│
└─ StatefulSet Services
   ├─ postgres-service
   ├─ redis-service
   ├─ kafka-service
   └─ minio-service

Persistent Volumes:
├─ PostgreSQL data (100Gi)
├─ Redis data (20Gi)
├─ Kafka data (100Gi)
└─ MinIO data (500Gi)

ConfigMaps:
├─ database-config
├─ logging-config
├─ kafka-config
└─ service-config

Secrets:
├─ database-credentials
├─ jwt-secret
├─ aws-credentials
├─ keycloak-credentials
└─ vault-credentials
```

---

## 🚀 Implementation Sequence

### Phase 0: Foundation (Week 0)
```
✓ Setup development environment
✓ Create base project structure
✓ Configure PostgreSQL database schema
✓ Setup CI/CD pipeline
✓ Create Kubernetes manifests
✓ Deploy infrastructure
```

### Phase 1: Core Services (Weeks 1-2)
```
Week 1:
  Day 1-2: Employee Service (CRUD endpoints)
  Day 3-4: Document Service (upload, store, list)
  Day 5: Testing & debugging

Week 2:
  Day 1-2: Incident Service (create, assign, track)
  Day 3-4: Training Service (courses, enrollment)
  Day 5: Kafka integration & testing
```

### Phase 2: Advanced Services (Weeks 3-4)
```
Week 3:
  Day 1-2: Asset Service (inventory, maintenance)
  Day 3-4: HR Service (leave, attendance, payroll)
  Day 5: Testing & optimization

Week 4:
  Day 1-2: Analytics Service (KPIs, reporting)
  Day 3-4: Management Service (RBAC, settings)
  Day 5: Integration testing
```

### Phase 3: Features & Deployment (Weeks 5-6)
```
Week 5:
  Day 1-2: OCR processing pipeline
  Day 3-4: Email notification service
  Day 5: Workflow engine

Week 6:
  Day 1-2: Predictive analytics (Claude AI)
  Day 3-4: Performance optimization
  Day 5: Final testing & deployment
```

---

## ✅ Success Criteria

### Performance
- API response time: < 500ms (p95)
- Database query time: < 100ms (p95)
- File upload: < 5MB/s throughput
- OCR processing: < 30s per document

### Reliability
- Service uptime: > 99.5%
- Message delivery: At-least-once guarantee
- Database replication: RPO < 1 minute, RTO < 5 minutes
- Error rate: < 0.1%

### Scalability
- 500+ concurrent users
- 10,000+ documents per day
- 1,000+ incidents per month
- Sub-linear response time degradation

### Security
- 0 Critical vulnerabilities
- All data encrypted in transit (TLS 1.3)
- All secrets encrypted at rest
- Audit trail for all changes
- OWASP Top 10 compliance

### Testing
- Unit test coverage: > 80%
- Integration test coverage: > 60%
- E2E test coverage: > 50%
- Load testing: 1,000 concurrent users

---

## 📈 Monitoring & Alerting

### Key Metrics per Service
```
CPU Usage:        Alert > 70%
Memory Usage:     Alert > 80%
Disk Usage:       Alert > 85%
Response Time:    Alert > 1000ms (p99)
Error Rate:       Alert > 1%
Kafka Lag:        Alert > 60s
Database Pool:    Alert > 80% utilization
```

### Dashboards
```
Infrastructure Dashboard:
  ├─ Cluster health
  ├─ Node status
  ├─ Pod status
  └─ Resource usage

Application Dashboard:
  ├─ Service health
  ├─ Response times
  ├─ Error rates
  └─ Throughput

Business Dashboard:
  ├─ Incident metrics
  ├─ Employee metrics
  ├─ Compliance score
  └─ Training completion
```

---

## 📞 Next Steps

1. ✅ **Review architecture** with team
2. ⏳ **Create detailed API specifications** (OpenAPI/Swagger)
3. ⏳ **Setup development environment** (Docker Compose)
4. ⏳ **Scaffold project structure** (all 9 services)
5. ⏳ **Implement Phase 1 services** (Employee, Document, Incident)
6. ⏳ **Create integration tests**
7. ⏳ **Deploy to Kubernetes**

---

**Document Status:** ✅ COMPLETE  
**Version:** 1.0  
**Last Updated:** October 27, 2026
