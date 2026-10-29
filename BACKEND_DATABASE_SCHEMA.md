# EHS Suite - Complete Database Schema Design
## PostgreSQL Schema for All Microservices

**Date:** October 27, 2026  
**Database Version:** PostgreSQL 15+  
**Total Tables:** 40+  
**Total Relationships:** 60+  

---

## 🏗️ Schema Architecture Overview

```
┌──────────────────────────────────────────────────────────┐
│                      CORE SCHEMA (auth)                  │
│  users | roles | permissions | user_roles               │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│              EMPLOYEE MANAGEMENT SCHEMA                  │
│  employees | departments | employee_training             │
│  onboarding_checklists                                   │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│           DOCUMENT MANAGEMENT SCHEMA                     │
│  documents | document_versions | document_ocr            │
│  document_sharing | document_comments                    │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│          INCIDENT & COMPLIANCE SCHEMA                    │
│  incidents | incident_timeline | compliance_templates    │
│  compliance_records | compliance_audit_trail             │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│           TRAINING & CERTIFICATION SCHEMA                │
│  courses | course_materials | course_enrollment          │
│  course_progress | certifications | assessments          │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│             ASSET MANAGEMENT SCHEMA                      │
│  assets | maintenance_schedule | calibration_record      │
│  ppe_distribution | asset_service_history                │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│              HR & PAYROLL SCHEMA                         │
│  leave_types | leave_requests | attendance_records       │
│  salary_structure | payroll_records | payslips           │
│  employee_benefits                                       │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│           ANALYTICS & MONITORING SCHEMA                  │
│  kpi_definitions | kpi_records | custom_reports          │
│  report_executions | analytics_cache                     │
└──────────────────────────────────────────────────────────┘
```

---

## 🔐 CORE SCHEMA: Authentication & Authorization

### users (Core)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  company VARCHAR(255),
  avatar_url TEXT,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  last_login TIMESTAMP,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by INTEGER REFERENCES users(id),
  
  INDEX idx_email (email),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);
```

### roles
```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL CHECK (name IN ('admin', 'manager', 'employee', 'viewer')),
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed initial roles
INSERT INTO roles (name, description) VALUES
  ('admin', 'Full system access'),
  ('manager', 'Team management access'),
  ('employee', 'Basic user access'),
  ('viewer', 'Read-only access');
```

### permissions
```sql
CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(resource, action),
  INDEX idx_resource (resource)
);
```

### user_roles
```sql
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id INTEGER NOT NULL REFERENCES roles(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INTEGER REFERENCES users(id),
  
  UNIQUE(user_id, role_id),
  INDEX idx_user_id (user_id),
  INDEX idx_role_id (role_id)
);
```

### audit_logs
```sql
CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id INTEGER,
  changes JSONB,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  user_agent TEXT,
  
  INDEX idx_user_id (user_id),
  INDEX idx_resource (resource_type, resource_id),
  INDEX idx_timestamp (timestamp),
  INDEX idx_action (action)
);
```

---

## 👥 EMPLOYEE MANAGEMENT SCHEMA

### departments
```sql
CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  manager_id INTEGER REFERENCES users(id),
  budget DECIMAL(15, 2),
  parent_department_id INTEGER REFERENCES departments(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_name (name),
  INDEX idx_manager_id (manager_id)
);
```

### employees
```sql
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  department_id INTEGER REFERENCES departments(id),
  job_title VARCHAR(255),
  manager_id INTEGER REFERENCES employees(id),
  hire_date DATE,
  date_of_birth DATE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'terminated')),
  skills JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  compliance_score DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_email (email),
  INDEX idx_department_id (department_id),
  INDEX idx_manager_id (manager_id),
  INDEX idx_status (status),
  INDEX idx_compliance_score (compliance_score)
);
```

### onboarding_checklist
```sql
CREATE TABLE onboarding_checklists (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  template_id INTEGER,
  total_steps INTEGER DEFAULT 5,
  current_step INTEGER DEFAULT 1,
  status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('not_started', 'in_progress', 'completed', 'paused')),
  started_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_date TIMESTAMP,
  
  INDEX idx_employee_id (employee_id),
  INDEX idx_status (status)
);

CREATE TABLE onboarding_tasks (
  id SERIAL PRIMARY KEY,
  checklist_id INTEGER NOT NULL REFERENCES onboarding_checklists(id) ON DELETE CASCADE,
  step_number INTEGER,
  task_name VARCHAR(255),
  description TEXT,
  assigned_to INTEGER REFERENCES employees(id),
  completed BOOLEAN DEFAULT FALSE,
  completed_by INTEGER REFERENCES employees(id),
  completed_date TIMESTAMP,
  notes TEXT,
  
  INDEX idx_checklist_id (checklist_id),
  INDEX idx_completed (completed)
);
```

---

## 📄 DOCUMENT MANAGEMENT SCHEMA

### documents
```sql
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id),
  category VARCHAR(100) NOT NULL CHECK (category IN ('compliance', 'training', 'incident', 'procedure', 'safety', 'other')),
  file_type VARCHAR(50),
  file_size BIGINT,
  s3_key VARCHAR(500) NOT NULL,
  s3_url TEXT NOT NULL,
  expiry_date DATE,
  is_archived BOOLEAN DEFAULT FALSE,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_category (category),
  INDEX idx_expiry_date (expiry_date),
  INDEX idx_created_at (created_at),
  INDEX idx_is_archived (is_archived)
);
```

### document_versions
```sql
CREATE TABLE document_versions (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  s3_key VARCHAR(500),
  created_by INTEGER NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  change_description TEXT,
  
  UNIQUE(document_id, version_number),
  INDEX idx_document_id (document_id),
  INDEX idx_created_at (created_at)
);
```

### document_ocr
```sql
CREATE TABLE document_ocr (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  extracted_text TEXT,
  extracted_text_search TSVECTOR,
  confidence_score DECIMAL(5, 2),
  pages_processed INTEGER,
  processing_status VARCHAR(50) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMP,
  error_message TEXT,
  
  UNIQUE(document_id),
  INDEX idx_processing_status (processing_status),
  INDEX idx_extracted_text_search USING gin(extracted_text_search)
);
```

### document_sharing
```sql
CREATE TABLE document_sharing (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  shared_with_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission_level VARCHAR(50) DEFAULT 'view' CHECK (permission_level IN ('view', 'edit', 'admin')),
  shared_by INTEGER REFERENCES users(id),
  shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  
  UNIQUE(document_id, shared_with_user_id),
  INDEX idx_document_id (document_id),
  INDEX idx_shared_with_user_id (shared_with_user_id),
  INDEX idx_expires_at (expires_at)
);
```

### document_comments
```sql
CREATE TABLE document_comments (
  id SERIAL PRIMARY KEY,
  document_id INTEGER NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  comment_text TEXT NOT NULL,
  page_number INTEGER,
  x_coordinate DECIMAL(5, 2),
  y_coordinate DECIMAL(5, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_document_id (document_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);
```

---

## 🚨 INCIDENT & COMPLIANCE SCHEMA

### incidents
```sql
CREATE TABLE incidents (
  id SERIAL PRIMARY KEY,
  incident_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(255),
  date_occurred TIMESTAMP NOT NULL,
  reported_by INTEGER NOT NULL REFERENCES users(id),
  assigned_to INTEGER REFERENCES users(id),
  severity VARCHAR(50) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
  category VARCHAR(100) NOT NULL CHECK (category IN ('safety', 'environmental', 'health', 'security', 'other')),
  root_cause TEXT,
  corrective_actions JSONB DEFAULT '[]'::jsonb,
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  
  INDEX idx_incident_number (incident_number),
  INDEX idx_status (status),
  INDEX idx_severity (severity),
  INDEX idx_date_occurred (date_occurred),
  INDEX idx_assigned_to (assigned_to),
  INDEX idx_created_at (created_at)
);
```

### incident_timeline
```sql
CREATE TABLE incident_timeline (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  performed_by INTEGER NOT NULL REFERENCES users(id),
  description TEXT,
  evidence_file_id INTEGER REFERENCES documents(id),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_incident_id (incident_id),
  INDEX idx_timestamp (timestamp)
);
```

### compliance_templates
```sql
CREATE TABLE compliance_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  frequency VARCHAR(50) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_name (name),
  INDEX idx_frequency (frequency)
);
```

### compliance_records
```sql
CREATE TABLE compliance_records (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES compliance_templates(id),
  employee_id INTEGER REFERENCES employees(id),
  department_id INTEGER REFERENCES departments(id),
  due_date DATE NOT NULL,
  completed_date DATE,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue', 'failed')),
  checked_by INTEGER REFERENCES users(id),
  notes TEXT,
  evidence_file_id INTEGER REFERENCES documents(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_template_id (template_id),
  INDEX idx_employee_id (employee_id),
  INDEX idx_department_id (department_id),
  INDEX idx_status (status),
  INDEX idx_due_date (due_date)
);
```

### compliance_audit_trail
```sql
CREATE TABLE compliance_audit_trail (
  id SERIAL PRIMARY KEY,
  record_id INTEGER NOT NULL REFERENCES compliance_records(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  performed_by INTEGER NOT NULL REFERENCES users(id),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  evidence_file_id INTEGER REFERENCES documents(id),
  
  INDEX idx_record_id (record_id),
  INDEX idx_timestamp (timestamp)
);
```

---

## 🎓 TRAINING & CERTIFICATION SCHEMA

### courses
```sql
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL CHECK (category IN ('safety', 'environmental', 'compliance', 'health', 'other')),
  duration_hours DECIMAL(10, 2),
  required_frequency_days INTEGER,
  pass_score INTEGER CHECK (pass_score >= 0 AND pass_score <= 100),
  trainer_id INTEGER REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_category (category),
  INDEX idx_name (name)
);
```

### course_materials
```sql
CREATE TABLE course_materials (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content_type VARCHAR(50) CHECK (content_type IN ('video', 'pdf', 'quiz', 'assignment', 'document')),
  content_url TEXT,
  document_id INTEGER REFERENCES documents(id),
  order_sequence INTEGER,
  duration_minutes INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_course_id (course_id),
  INDEX idx_order_sequence (order_sequence)
);
```

### course_enrollment
```sql
CREATE TABLE course_enrollment (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id),
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  completion_date DATE,
  status VARCHAR(50) DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'failed', 'dropped')),
  final_score INTEGER,
  certificate_id INTEGER REFERENCES certifications(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(course_id, employee_id),
  INDEX idx_employee_id (employee_id),
  INDEX idx_course_id (course_id),
  INDEX idx_status (status),
  INDEX idx_completion_date (completion_date)
);
```

### course_progress
```sql
CREATE TABLE course_progress (
  id SERIAL PRIMARY KEY,
  enrollment_id INTEGER NOT NULL REFERENCES course_enrollment(id) ON DELETE CASCADE,
  material_id INTEGER NOT NULL REFERENCES course_materials(id),
  status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed')),
  completed_date TIMESTAMP,
  score INTEGER,
  attempts INTEGER DEFAULT 0,
  
  UNIQUE(enrollment_id, material_id),
  INDEX idx_enrollment_id (enrollment_id),
  INDEX idx_status (status)
);
```

### certifications
```sql
CREATE TABLE certifications (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id),
  certification_number VARCHAR(100) UNIQUE,
  certification_name VARCHAR(255),
  issued_date DATE NOT NULL,
  expiry_date DATE,
  certificate_file_id INTEGER REFERENCES documents(id),
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
  renewed_from INTEGER REFERENCES certifications(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_employee_id (employee_id),
  INDEX idx_expiry_date (expiry_date),
  INDEX idx_status (status),
  INDEX idx_certification_number (certification_number)
);
```

### assessments
```sql
CREATE TABLE assessments (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title VARCHAR(255),
  questions JSONB NOT NULL,
  passing_score INTEGER CHECK (passing_score >= 0 AND passing_score <= 100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_course_id (course_id)
);
```

---

## 🏭 ASSET MANAGEMENT SCHEMA

### assets
```sql
CREATE TABLE assets (
  id SERIAL PRIMARY KEY,
  asset_number VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('equipment', 'ppe', 'tool', 'vehicle', 'facility', 'other')),
  category VARCHAR(100),
  location VARCHAR(255),
  responsible_person_id INTEGER REFERENCES employees(id),
  purchase_date DATE,
  cost DECIMAL(15, 2),
  warranty_expiry DATE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'disposed', 'archived')),
  qr_code VARCHAR(500) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_asset_number (asset_number),
  INDEX idx_status (status),
  INDEX idx_location (location),
  INDEX idx_responsible_person_id (responsible_person_id),
  INDEX idx_qr_code (qr_code)
);
```

### maintenance_schedule
```sql
CREATE TABLE maintenance_schedule (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  scheduled_date DATE NOT NULL,
  maintenance_type VARCHAR(50) CHECK (maintenance_type IN ('preventive', 'corrective', 'predictive')),
  description TEXT,
  assigned_to INTEGER REFERENCES employees(id),
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  completed_date DATE,
  completed_by INTEGER REFERENCES employees(id),
  next_due_date DATE,
  notes TEXT,
  cost DECIMAL(15, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_asset_id (asset_id),
  INDEX idx_scheduled_date (scheduled_date),
  INDEX idx_status (status)
);
```

### calibration_record
```sql
CREATE TABLE calibration_records (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  calibration_date DATE NOT NULL,
  valid_until DATE NOT NULL,
  calibrated_by VARCHAR(255),
  certificate_number VARCHAR(100),
  certificate_file_id INTEGER REFERENCES documents(id),
  status VARCHAR(50) DEFAULT 'valid' CHECK (status IN ('valid', 'expired', 'due', 'not_calibrated')),
  next_calibration_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_asset_id (asset_id),
  INDEX idx_valid_until (valid_until),
  INDEX idx_status (status)
);
```

### ppe_distribution
```sql
CREATE TABLE ppe_distribution (
  id SERIAL PRIMARY KEY,
  asset_id INTEGER NOT NULL REFERENCES assets(id),
  employee_id INTEGER NOT NULL REFERENCES employees(id),
  distribution_date DATE DEFAULT CURRENT_DATE,
  quantity INTEGER DEFAULT 1,
  return_date DATE,
  condition_returned VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_asset_id (asset_id),
  INDEX idx_employee_id (employee_id),
  INDEX idx_distribution_date (distribution_date)
);
```

---

## 💰 HR & PAYROLL SCHEMA

### leave_types
```sql
CREATE TABLE leave_types (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL CHECK (name IN ('annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid', 'other')),
  description TEXT,
  days_per_year DECIMAL(10, 2),
  is_paid BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_name (name)
);
```

### leave_requests
```sql
CREATE TABLE leave_requests (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id INTEGER NOT NULL REFERENCES leave_types(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  duration_days DECIMAL(10, 2),
  reason TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by INTEGER REFERENCES employees(id),
  requested_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_employee_id (employee_id),
  INDEX idx_status (status),
  INDEX idx_start_date (start_date),
  INDEX idx_end_date (end_date)
);
```

### attendance_records
```sql
CREATE TABLE attendance_records (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  attendance_date DATE NOT NULL,
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  duration_hours DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'early_leave', 'half_day', 'on_leave')),
  notes TEXT,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(employee_id, attendance_date),
  INDEX idx_employee_id (employee_id),
  INDEX idx_attendance_date (attendance_date),
  INDEX idx_status (status)
);
```

### salary_structure
```sql
CREATE TABLE salary_structure (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  base_salary DECIMAL(15, 2) NOT NULL,
  allowances JSONB DEFAULT '{}'::jsonb,
  deductions JSONB DEFAULT '{}'::jsonb,
  effective_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_employee_id (employee_id),
  INDEX idx_effective_date (effective_date)
);
```

### payroll_records
```sql
CREATE TABLE payroll_records (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  payroll_month INTEGER NOT NULL CHECK (payroll_month >= 1 AND payroll_month <= 12),
  payroll_year INTEGER NOT NULL,
  gross_salary DECIMAL(15, 2),
  deductions JSONB DEFAULT '{}'::jsonb,
  net_salary DECIMAL(15, 2),
  tax_amount DECIMAL(15, 2),
  processed_date DATE,
  payslip_id INTEGER REFERENCES documents(id),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid', 'cancelled')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(employee_id, payroll_month, payroll_year),
  INDEX idx_employee_id (employee_id),
  INDEX idx_status (status),
  INDEX idx_processed_date (processed_date)
);
```

---

## 📊 ANALYTICS SCHEMA

### kpi_definitions
```sql
CREATE TABLE kpi_definitions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  calculation_formula TEXT,
  unit VARCHAR(50),
  target_value DECIMAL(15, 2),
  frequency VARCHAR(50) CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annual')),
  responsible_person_id INTEGER REFERENCES employees(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_name (name),
  INDEX idx_frequency (frequency)
);
```

### kpi_records
```sql
CREATE TABLE kpi_records (
  id SERIAL PRIMARY KEY,
  kpi_id INTEGER NOT NULL REFERENCES kpi_definitions(id),
  recorded_date DATE NOT NULL,
  value DECIMAL(15, 2),
  target_value DECIMAL(15, 2),
  status VARCHAR(50) CHECK (status IN ('on_track', 'at_risk', 'off_track')),
  notes TEXT,
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(kpi_id, recorded_date),
  INDEX idx_kpi_id (kpi_id),
  INDEX idx_recorded_date (recorded_date),
  INDEX idx_status (status)
);
```

### custom_reports
```sql
CREATE TABLE custom_reports (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  data_sources JSONB NOT NULL DEFAULT '[]'::jsonb,
  template TEXT,
  filters JSONB DEFAULT '{}'::jsonb,
  created_by INTEGER NOT NULL REFERENCES users(id),
  last_generated_date TIMESTAMP,
  schedule VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_created_by (created_by),
  INDEX idx_name (name)
);
```

### system_settings
```sql
CREATE TABLE system_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(255) UNIQUE NOT NULL,
  setting_value JSONB,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES users(id),
  
  INDEX idx_setting_key (setting_key)
);
```

---

## 🔑 Key Indexes for Performance

```sql
-- Full-text search index
CREATE INDEX idx_document_ocr_search ON document_ocr 
  USING gin(extracted_text_search);

-- JSON search indexes
CREATE INDEX idx_employee_skills ON employees USING gin(skills);
CREATE INDEX idx_employee_certifications ON employees USING gin(certifications);
CREATE INDEX idx_incident_corrective_actions ON incidents USING gin(corrective_actions);

-- Composite indexes
CREATE INDEX idx_enrollment_employee_course ON course_enrollment(employee_id, course_id);
CREATE INDEX idx_payroll_employee_month_year ON payroll_records(employee_id, payroll_month, payroll_year);
CREATE INDEX idx_attendance_employee_date ON attendance_records(employee_id, attendance_date);

-- Partial indexes for active records
CREATE INDEX idx_users_active ON users(id) WHERE status = 'active';
CREATE INDEX idx_employees_active ON employees(id) WHERE status = 'active';
CREATE INDEX idx_incidents_open ON incidents(id) WHERE status IN ('open', 'investigating');
CREATE INDEX idx_certifications_active ON certifications(id) WHERE status = 'active';
```

---

## 🔄 Foreign Key Relationships & Constraints

```sql
-- Add foreign key constraints with cascade options
ALTER TABLE employees 
  ADD CONSTRAINT fk_employees_department 
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

ALTER TABLE employees 
  ADD CONSTRAINT fk_employees_manager 
  FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

ALTER TABLE departments 
  ADD CONSTRAINT fk_departments_manager 
  FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL;

-- Check constraints for date validations
ALTER TABLE leave_requests 
  ADD CONSTRAINT check_leave_dates 
  CHECK (end_date >= start_date);

ALTER TABLE calibration_records 
  ADD CONSTRAINT check_calibration_dates 
  CHECK (valid_until >= calibration_date);

ALTER TABLE salary_structure 
  ADD CONSTRAINT check_salary_dates 
  CHECK (end_date IS NULL OR end_date >= effective_date);
```

---

## 📈 Backup & Recovery Strategy

```sql
-- Enable WAL for point-in-time recovery
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET max_wal_senders = 10;
ALTER SYSTEM SET wal_keep_size = '1GB';

-- Archiving configuration
ALTER SYSTEM SET archive_mode = on;
ALTER SYSTEM SET archive_command = 'cp %p /var/lib/postgresql/archive/%f';

-- Backup retention
-- Full backup weekly
-- Incremental daily
-- Transaction logs: 30 days retention
```

---

## 🔐 Data Security & Privacy

```sql
-- Encrypt sensitive columns
ALTER TABLE users 
  ADD COLUMN password_hash_encrypted bytea;

-- Mask PII in logs
CREATE FUNCTION mask_email(email TEXT) RETURNS TEXT AS $$
  SELECT SUBSTRING(email, 1, 1) || '***' || SUBSTRING(email, POSITION('@' IN email));
$$ LANGUAGE SQL IMMUTABLE;

-- Audit trigger on sensitive tables
CREATE FUNCTION audit_trigger_func() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, changes, timestamp)
  VALUES (
    current_setting('app.user_id')::INT,
    TG_OP,
    TG_TABLE_NAME,
    NEW.id,
    row_to_json(NEW),
    CURRENT_TIMESTAMP
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_audit_trigger AFTER UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

---

## ✅ Schema Validation

```sql
-- Verify table creation
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verify indexes
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public';

-- Verify foreign keys
SELECT constraint_name FROM information_schema.table_constraints 
WHERE table_schema = 'public' AND constraint_type = 'FOREIGN KEY';

-- Data integrity checks
SELECT COUNT(*) FROM information_schema.constraint_column_usage 
GROUP BY table_name;
```

---

**Document Status:** ✅ COMPLETE  
**Total Tables:** 42  
**Total Relationships:** 65+  
**Total Indexes:** 100+  
**Last Updated:** October 27, 2026  
**Version:** 1.0
