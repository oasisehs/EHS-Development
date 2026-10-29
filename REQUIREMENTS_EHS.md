# EHS Management System Requirements

## 1. Document Purpose
This document captures the end-to-end requirements for the EHS (Environment, Health & Safety) management system inferred from the screenshots and project context. It is intended to serve as a baseline for implementation, design, testing, and future phase-wise delivery.

The system will be built incrementally, one module at a time, using this document as the source of truth.

---

## 2. Project Vision
The solution should provide a centralized platform to monitor employee safety compliance, track permits and risk assessments, manage incidents, review certificates, and offer dashboards for both management and employees.

The system should help EHS teams:
- monitor compliance status proactively,
- identify overdue or risky items,
- manage document uploads and approvals,
- reduce manual tracking,
- improve visibility for management and employees.

---

## 3. Scope
The system will cover:
- user authentication and role-based access,
- employee profile management,
- EHS compliance tracking,
- permit / PTW / SSRA management,
- incident reporting and follow-up,
- certificate and expiry tracking,
- document uploads and records,
- dashboard analytics and reporting,
- admin configuration and system maintenance.

### In Scope
- employee onboarding and profile maintenance,
- EHS compliance review,
- document collection and status tracking,
- dashboard views for managers and employees,
- reporting and alerting,
- audit trail for critical actions.

### Out of Scope (initial phase)
- biometric attendance integration,
- mobile push notification infrastructure,
- advanced AI prediction for incident risk,
- enterprise payroll or HRMS integration,
- external contractor management beyond basic employee/worker tracking.

---

## 4. Stakeholders
### 4.1 EHS In-charge
Responsible for:
- monitoring compliance across employees and sites,
- approving or rejecting submissions,
- tracking safety incidents,
- reviewing certificate expiry,
- generating operational reports.

### 4.2 Employees
Responsible for:
- viewing personal compliance status,
- submitting required documents,
- updating mandatory training/certificate information,
- reporting incidents or hazards,
- complying with safety requirements.

### 4.3 Management / Leadership
Responsible for:
- reviewing compliance trends,
- approving corrective actions,
- determining site-level risk exposure,
- monitoring safety performance.

### 4.4 System Administrator
Responsible for:
- user creation and access assignment,
- configuration of modules and statuses,
- managing system-wide settings,
- maintaining lookup tables and master data.

---

## 5. User Roles and Access
The system shall support at minimum the following roles:

1. Super Admin
   - full access to all modules,
   - manage users, roles, and settings,
   - view all records and reports.

2. EHS In-charge
   - manage compliance records,
   - review documents and submissions,
   - create and update incident records,
   - monitor site risk status,
   - perform approvals.

3. Employee
   - access own profile and compliance data,
   - submit required forms and documents,
   - review assigned tasks and alerts,
   - report incidents.

4. Manager / Supervisor (optional future role)
   - monitor assigned team compliance,
   - review employee safety records,
   - escalate required actions.

---

## 6. Core Functional Requirements

### FR1 - Authentication and Authorization
The system shall:
- allow users to sign in with username and password,
- support access control by role,
- restrict data visibility to authorized users only,
- log user activities for critical actions,
- invalidate sessions after inactivity or logout.

### FR2 - Employee Management
The system shall:
- maintain employee master records,
- capture employee name, ID, department, designation, site, and employment status,
- track employee onboarding date,
- support employee status update such as active, inactive, terminated,
- link employees to compliance records, incidents, certificates, and uploaded documents.

### FR3 - Dashboard Views
The system shall provide:
- an EHS In-charge dashboard with summarized compliance and risk indicators,
- an employee dashboard with personal status and tasks,
- management views summarizing department/site status,
- filters to view data by site, department, compliance category, and date range.

### FR4 - Compliance Tracking
The system shall:
- define compliance categories and rules,
- track whether each employee is compliant or non-compliant,
- display percentage-based compliance,
- identify expected actions for non-compliance,
- record the compliance status history over time.

### FR5 - Permit / PTW / SSRA Management
The system shall:
- allow submission of Permit to Work (PTW), SSRA, and related safety documents,
- track record status as draft, submitted, pending review, approved, rejected, or expired,
- store document metadata including submission date, approver, and remarks,
- enable review and approval workflow.

### FR6 - Incident Management
The system shall:
- allow users to report incidents,
- capture incident type, date, time, location, affected person, description, severity, and status,
- record actions taken and closure status,
- allow EHS personnel to investigate and track incidents to closure,
- provide incident summary analytics by category and severity.

### FR7 - Certificate and Expiry Tracking
The system shall:
- track mandatory certificates and validations,
- record expiry date and renewal date,
- flag certificates as valid, expiring soon, or expired,
- send alerts or display warnings for expiring or expired records,
- maintain certificate history.

### FR8 - Document Upload Management
The system shall:
- allow upload of supporting documents such as certificates, training records, and forms,
- capture file type, file name, uploaded by, and upload date,
- store documents securely,
- support viewing or downloading uploaded records,
- associate documents with employees, incidents, permits, or compliance checks.

### FR9 - Training and Awareness Records
The system shall:
- maintain employee training records,
- track training completion status and expiry,
- link training records to employee compliance,
- indicate overdue training requirements.

### FR10 - Alerts and Notifications
The system shall:
- display alert badges on dashboards,
- notify relevant roles when items require action,
- flag expiring certificates, unresolved incidents, pending approvals, and overdue submissions,
- support email or in-app notification mechanisms in future iterations.

### FR11 - Reports and Analytics
The system shall:
- produce summary reports for compliance, incidents, permits, and certificate status,
- provide date-range and department filters,
- support management review dashboards,
- export reports in PDF or Excel format (preferred).

### FR12 - Administration and Configuration
The system shall allow administrators to:
- manage user roles and permissions,
- configure compliance categories and checklist items,
- maintain lookup values (sites, departments, statuses, reasons),
- manage system-wide settings and thresholds.

---

## 7. End-to-End User Workflows

### Workflow 1: Employee Onboarding
1. Admin creates employee profile.
2. Employee details are stored with department, site, and status.
3. Mandatory compliance items are assigned.
4. Employee receives required training/ documentation tasks.
5. Employee uploads required files and completes compliance steps.
6. EHS In-charge reviews and approves or rejects compliance status.

### Workflow 2: Compliance Monitoring
1. EHS In-charge opens compliance dashboard.
2. System calculates compliance score for employees/sites.
3. Non-compliance or required actions are highlighted.
4. EHS In-charge reviews pending issues.
5. Corrective action is recorded and compliance status updated.

### Workflow 3: Permit / PTW / SSRA Submission
1. Employee or supervisor submits a permit, SSRA, or related safety form.
2. System records the submission and status.
3. EHS In-charge reviews the record.
4. Record is approved, rejected, or returned for revision.
5. Status is visible to relevant parties.

### Workflow 4: Incident Reporting
1. Employee or supervisor reports a hazard or incident.
2. Incident metadata is captured.
3. EHS In-charge reviews incident details.
4. Corrective action plan is assigned.
5. Case is closed when resolved.

### Workflow 5: Certificate Expiry Management
1. System records valid certificate data with expiry date.
2. Expiry alerts are generated before due date.
3. User receives warning and renewal action is initiated.
4. Updated certificate is uploaded and revalidated.

### Workflow 6: Management Reporting
1. Management opens dashboard or report page.
2. Data is filtered by time frame, site, or department.
3. Compliance, incident, and certificate trends are reviewed.
4. Risk decisions or interventions are taken.

---

## 8. Business Rules
The system shall enforce the following rules:
- employees must have an active profile before compliance or incident records can be created,
- records with expired certificates shall be flagged as non-compliant,
- incident records must include severity and status,
- only authorized users can approve or reject safety submissions,
- duplicate employee records shall be prevented,
- a document shall not be deleted if it is referenced by an active submission,
- compliance data shall retain historical records for auditing.

---

## 9. Data Requirements
The following major data entities are required:

### 9.1 Employee
- employee_id
- full_name
- employee_number
- department_id
- site_id
- designation
- status
- date_of_joining
- contact details

### 9.2 Site
- site_id
- site_name
- location
- status

### 9.3 Compliance Record
- compliance_id
- employee_id
- compliance_category
- checklist_item
- due_date
- status
- last_updated
- assigned_by

### 9.4 Permit / PTW / SSRA
- record_id
- employee_id or supervisor_id
- type
- submission_date
- status
- remarks
- approver_id

### 9.5 Incident
- incident_id
- employee_id
- incident_type
- description
- severity
- date_time
- location
- status
- resolution_notes

### 9.6 Certificate
- certificate_id
- employee_id
- certificate_type
- issue_date
- expiry_date
- status
- document_reference

### 9.7 Document
- document_id
- related_entity_type
- related_entity_id
- file_name
- file_path or storage_reference
- uploaded_by
- uploaded_at

### 9.8 User
- user_id
- username
- password_hash
- role_id
- employee_id
- status

---

## 10. Integration Requirements
The system may need future integration with:
- HR management system,
- employee attendance system,
- email or SMS notification service,
- cloud document storage (S3 / Azure Blob / equivalent),
- reporting tools or BI dashboards,
- mobile application interface for field-based users.

---

## 11. Non-Functional Requirements
### NFR1 - Usability
- dashboard should be intuitive for EHS in-charge and employees,
- key health and safety statuses should be visible at a glance,
- filters and navigation should be simple and mobile-friendly.

### NFR2 - Performance
- dashboards should load within a few seconds under normal usage,
- searches and report generation should complete promptly.

### NFR3 - Security
- all sensitive employee and safety data must be protected,
- access must be role-based,
- password storage must use secure hashing,
- audit logs for all critical changes must be maintained.

### NFR4 - Availability
- the system should be available during operational working hours,
- critical EHS records should not be lost during normal operations.

### NFR5 - Scalability
- the application should be designed to support multiple sites, departments, and increasing employees.

### NFR6 - Maintainability
- code and modules should be structured for future enhancement,
- configuration values should not be hardcoded where possible.

---

## 12. User Experience Requirements
- the interface should present compliance data in a clean visual layout,
- dashboards should use colour-coded indicators for health and safety status,
- action items should be clearly highlighted,
- tables should provide sorting and filtering,
- employees should be able to navigate their own data without needing technical knowledge.

---

## 13. Success Criteria
The solution is successful when:
- employees can view and maintain their personal compliance data,
- EHS officers can manage compliance and incident workflows from one platform,
- certificate expiry and safety risks are visible before they become critical,
- permit and SSRA records are tracked end-to-end,
- management can get a site-wide view of EHS performance,
- all core workflows are traceable and auditable.

---

## 14. Risks and Assumptions
### Assumptions
- employee data is available from HR or onboarding records,
- required EHS policies and compliance criteria are defined by the client,
- departments/sites can be configured centrally,
- document storage is available through cloud or file-system based approach.

### Risks
- unclear approval workflows,
- inconsistent policy definitions across sites,
- incomplete master data for employee compliance rules,
- limited user adoption if dashboards are not user friendly.

---

## 15. Open Questions
- Which site(s) are covered in the first release?
- Is the system for employees only or also contractors and visitors?
- Are there regulatory requirements specific to the client or region?
- Should alerts be in-app only or email/SMS as well?
- Which document types must be mandatory for every employee?
- Should incident workflows include approval and closure by management?
- Are there existing HR or ERP integrations already in use?

---

## 16. Recommended Delivery Phases
### Phase 1 - Foundation
- login and user roles,
- employee management,
- basic dashboard,
- admin configuration.

### Phase 2 - Safety Compliance Module
- compliance rules,
- employee compliance dashboard,
- document upload tracking.

### Phase 3 - Permit and Incident Management
- PTW/SSRA workflows,
- incident reporting,
- alerts and review.

### Phase 4 - Reporting and Analytics
- trend analysis,
- exports,
- advanced reporting and management consolidation.

---

## 17. Acceptance Summary
This project will be considered ready for implementation when the above functional and non-functional requirements are reviewed and approved by the client, and the first release backlog is based on each priority backlog item derived from this document.

---

## 18. Document Control
- Version: 1.0
- Status: Draft requirement baseline
- Created for: EHS Management System
- Source basis: screenshots and project context derived from EHS dashboard concepts
