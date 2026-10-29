# EHS System Implementation Plan

## 1. Purpose
This document defines the incremental build order for the EHS management system.
The work is divided into phases so that Database, API, and UI are implemented in a controlled and testable sequence.

---

## 2. Delivery Strategy
We will build the product in modules, not all at once.

For every module we will deliver:
- Database schema and seed data
- Backend API endpoints
- Business logic and validation
- UI screens and workflows
- Testing and verification

---

## 3. Implementation Phases

### Phase 1 - Foundation and Authentication
Goal: establish core system structure.

#### Deliverables
- [ ] Database: users, roles, permissions, audit log tables
- [ ] API: login, logout, session validation, role-based access
- [ ] UI: login, signup, forgot password, landing page

#### Tasks
##### DB
- [ ] Create users table
- [ ] Create roles and permissions tables
- [ ] Create audit_logs table
- [ ] Add seeded admin and employee users

##### API
- [ ] POST /api/auth/login
- [ ] POST /api/auth/register
- [ ] POST /api/auth/forgot-password
- [ ] POST /api/auth/reset-password
- [ ] GET /api/auth/me
- [ ] POST /api/auth/logout

##### UI
- [ ] Login page
- [ ] Signup page
- [ ] Forgot password flow
- [ ] Session handling and role-based navigation

#### Definition of Done
- User can login and logout successfully
- User roles are validated server-side
- UI redirects correctly after login

---

### Phase 2 - Employee Management
Goal: manage employees and their profiles.

#### Deliverables
- [ ] Database: employees, departments, sites, profiles
- [ ] API: employee CRUD and search/filter
- [ ] UI: employee directory and profile management

#### Tasks
##### DB
- [ ] Create departments table
- [ ] Create sites table
- [ ] Create employees table
- [ ] Add employee status and onboarding fields

##### API
- [ ] GET /api/employees
- [ ] GET /api/employees/:id
- [ ] POST /api/employees
- [ ] PUT /api/employees/:id
- [ ] DELETE /api/employees/:id
- [ ] GET /api/employees/search

##### UI
- [ ] Employee directory page
- [ ] Employee profile page
- [ ] Add/edit employee form
- [ ] Filters by department/site/status

#### Definition of Done
- Admin can add and manage employee records
- Profiles display compliance and onboarding data
- Search and filters work properly

---

### Phase 3 - Compliance and Training Tracking
Goal: manage employee compliance and required training.

#### Deliverables
- [ ] Database: compliance categories, compliance records, training records
- [ ] API: compliance tracking and training completion endpoints
- [ ] UI: compliance dashboard and training screen

#### Tasks
##### DB
- [ ] Create compliance_categories table
- [ ] Create compliance_records table
- [ ] Create training_courses table
- [ ] Create employee_training_records table
- [ ] Add status enum values: pending, compliant, non-compliant, expired

##### API
- [ ] GET /api/compliance
- [ ] GET /api/compliance/:employeeId
- [ ] POST /api/compliance/record
- [ ] PUT /api/compliance/:id
- [ ] GET /api/training
- [ ] POST /api/training/enroll
- [ ] PUT /api/training/:id/complete

##### UI
- [ ] Employee compliance dashboard
- [ ] Training status section
- [ ] Expiring or overdue records highlight
- [ ] Compliance summary cards

#### Definition of Done
- User can see compliance score for each employee
- Training completion status is tracked
- Overdue items are visible clearly

---

### Phase 4 - Permit, PTW and SSRA Management
Goal: manage workplace approval and permit documentation.

#### Deliverables
- [ ] Database: permits, PTW, SSRA records, approval workflow tables
- [ ] API: permit lifecycle endpoints
- [ ] UI: permit submission and approval screens

#### Tasks
##### DB
- [ ] Create permit_records table
- [ ] Create ptw_records table
- [ ] Create ssra_records table
- [ ] Add status values: draft, submitted, pending_review, approved, rejected, expired

##### API
- [ ] GET /api/permits
- [ ] POST /api/permits
- [ ] PUT /api/permits/:id
- [ ] POST /api/permits/:id/approve
- [ ] POST /api/permits/:id/reject
- [ ] GET /api/permits/:id/history

##### UI
- [ ] Permit submission form
- [ ] Permit list and filter views
- [ ] Approval panel for EHS in-charge
- [ ] Status badges and comments

#### Definition of Done
- Employees can submit work permit or SSRA records
- EHS in-charge can approve or reject them
- Approvals are traceable and visible

---

### Phase 5 - Incident Management
Goal: capture safety incidents and their resolutions.

#### Deliverables
- [ ] Database: incidents, actions, severity, closures
- [ ] API: incident create/read/update and closure workflow
- [ ] UI: incident report form and dashboard

#### Tasks
##### DB
- [ ] Create incidents table
- [ ] Create incident_actions table
- [ ] Add severity and status fields
- [ ] Capture root cause and resolution notes

##### API
- [ ] GET /api/incidents
- [ ] GET /api/incidents/:id
- [ ] POST /api/incidents
- [ ] PUT /api/incidents/:id
- [ ] POST /api/incidents/:id/resolve
- [ ] GET /api/incidents/summary

##### UI
- [ ] Incident report form
- [ ] Incident dashboard
- [ ] Severity filters
- [ ] Resolution/closure workflow

#### Definition of Done
- Incident can be reported and tracked
- Actions and closure notes are stored
- Dashboard shows open and resolved incidents

---

### Phase 6 - Certificates and Document Uploads
Goal: track expiries and required proofs.

#### Deliverables
- [ ] Database: certificates, document registry, upload metadata
- [ ] API: upload, list, view, and status update endpoints
- [ ] UI: document repository and expiry alerts

#### Tasks
##### DB
- [ ] Create certificates table
- [ ] Create documents table
- [ ] Create document_versions table
- [ ] Add expiry and validation fields

##### API
- [ ] POST /api/documents/upload
- [ ] GET /api/documents
- [ ] GET /api/documents/:id
- [ ] DELETE /api/documents/:id
- [ ] GET /api/certificates/expiring
- [ ] PUT /api/certificates/:id/renew

##### UI
- [ ] Upload documents page
- [ ] Document list with filters
- [ ] Certificate expiry dashboard
- [ ] Document preview/download actions

#### Definition of Done
- Documents can be uploaded and linked to employees
- Expiring certificates are highlighted
- Registered documents can be retrieved

---

### Phase 7 - Dashboards and Reporting
Goal: provide management-level visibility.

#### Deliverables
- [ ] Database: KPI definitions and reporting data views
- [ ] API: analytics and summary endpoints
- [ ] UI: EHS management dashboard and reporting screens

#### Tasks
##### DB
- [ ] Create kpis table
- [ ] Create reports table or reporting metadata
- [ ] Build summary views for site reports

##### API
- [ ] GET /api/dashboard/summary
- [ ] GET /api/dashboard/compliance
- [ ] GET /api/dashboard/incidents
- [ ] GET /api/dashboard/certificates
- [ ] GET /api/reports/export

##### UI
- [ ] Overall EHS dashboard
- [ ] KPI cards
- [ ] Baron or chart-based summaries
- [ ] Filter by department/site/date

#### Definition of Done
- Manager can review site and employee safety overview
- Dashboard shows current risk and compliance numbers
- Reporting is exportable and easy to review

---

### Phase 8 - Admin, Security, and Production Readiness
Goal: make the solution production-wearable.

#### Deliverables
- [ ] Role and permission management
- [ ] Audit log configuration
- [ ] Backup strategy
- [ ] Security hardening
- [ ] Deployment readiness

#### Tasks
- [ ] Add admin config screens
- [ ] Implement audit logging
- [ ] Validate role-based access rules
- [ ] Configure secure secrets management
- [ ] Verify environment variables and deployment settings
- [ ] Run smoke tests and user acceptance tests

---

## 4. Recommended Build Order
1. Foundation and auth
2. Employee management
3. Compliance and training
4. Permit/PTW/SSRA
5. Incident management
6. Certificates and document uploads
7. Dashboards and reporting
8. Production hardening and deployment

---

## 5. Design Principles
- Build one module at a time
- Keep DB, API, and UI aligned in each phase
- Validate each module before moving to the next
- Maintain requirement traceability back to [REQUIREMENTS_EHS.md](REQUIREMENTS_EHS.md)
- Prefer simple working implementation over broad early complexity

---

## 6. Acceptance Rule
A phase is complete only when all of the following are true:
- database tables are created and validated,
- backend APIs are implemented and tested,
- frontend screens are built and wired to live data,
- basic user workflow is working end-to-end,
- the result matches the requirement intent captured in [REQUIREMENTS_EHS.md](REQUIREMENTS_EHS.md).

---

## 7. Immediate Next Action
We will start with Phase 1: Foundation and Authentication.
This includes:
- user DB schema,
- login API,
- role-based auth,
- login and signup UI.
