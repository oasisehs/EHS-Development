# EHS Suite Backend - Complete API Specifications
## OpenAPI-Compatible Service Contracts & Integration Guide

**Date:** October 27, 2026  
**Status:** 📋 Complete API Reference  
**Total Endpoints:** 150+ endpoints across 9 services  

---

## 🔑 API Conventions

### Base URLs
```
Development:  http://localhost:3000/api
Staging:      https://staging-api.ehssuite.com/api
Production:   https://api.ehssuite.com/api
```

### Authentication
```
All endpoints (except /auth/login, /auth/register) require:
  
  Header: Authorization: Bearer {JWT_TOKEN}
  
  JWT Token contains:
    {
      "sub": user_id,
      "email": "user@example.com",
      "role": "admin|manager|employee|viewer",
      "permissions": ["scope1", "scope2"],
      "iat": 1234567890,
      "exp": 1234571490
    }
```

### Response Format
```javascript
// Success Response (2xx)
{
  "success": true,
  "status": "success|info|warning",
  "data": { /* resource data */ },
  "meta": {
    "timestamp": "2024-10-27T10:30:00Z",
    "version": "1.0",
    "request_id": "req_abc123xyz"
  }
}

// Error Response (4xx, 5xx)
{
  "success": false,
  "status": "error",
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Employee with ID 123 not found",
    "details": { /* validation errors */ }
  },
  "meta": {
    "timestamp": "2024-10-27T10:30:00Z",
    "request_id": "req_abc123xyz"
  }
}
```

### Status Codes
```
200 OK              Request succeeded
201 Created         Resource created
204 No Content      Request succeeded, no response body
400 Bad Request     Validation error
401 Unauthorized    Missing/invalid authentication
403 Forbidden       Insufficient permissions
404 Not Found       Resource not found
409 Conflict        Resource conflict (duplicate)
422 Unprocessable   Invalid data format
429 Too Many Reqs   Rate limited
500 Server Error    Internal error
503 Unavailable     Service temporarily unavailable
```

### Pagination
```javascript
// Query Parameters
  ?page=1&limit=20&sort=created_at&order=desc&filter=status:active

// Response
{
  "data": [/* array of items */],
  "pagination": {
    "total": 250,
    "count": 20,
    "page": 1,
    "limit": 20,
    "pages": 13,
    "has_next": true,
    "has_prev": false
  }
}
```

### Filtering
```
  ?filter=status:open,severity:high
  ?filter=created_at:gte:2024-01-01,created_at:lte:2024-12-31
  ?filter=assigned_to:123
```

### Sorting
```
  ?sort=created_at,name&order=desc,asc
  ?sort=-created_at (- = descending)
```

### Rate Limiting
```
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 999
  X-RateLimit-Reset: 1234567890
```

---

## 🔐 AUTH SERVICE (Port 3001)

### 1. USER REGISTRATION
```
POST /auth/register
Content-Type: application/json

Request:
{
  "email": "john.doe@company.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "phone": "+1-555-0123",
  "company": "Acme Corp",
  "department": "Safety"
}

Response (201):
{
  "success": true,
  "data": {
    "user_id": 1,
    "email": "john.doe@company.com",
    "full_name": "John Doe",
    "created_at": "2024-10-27T10:30:00Z"
  }
}

Errors:
  400: {
    "error": {
      "code": "VALIDATION_ERROR",
      "details": {
        "email": "Email already registered",
        "password": "Password must be 8+ chars with uppercase, lowercase, numbers"
      }
    }
  }
```

### 2. USER LOGIN
```
POST /auth/login
Content-Type: application/json

Request:
{
  "email": "john.doe@company.com",
  "password": "SecurePass123!",
  "remember_me": false
}

Response (200):
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "rt_1234567890abcdef",
    "token_type": "Bearer",
    "expires_in": 3600,
    "user": {
      "user_id": 1,
      "email": "john.doe@company.com",
      "full_name": "John Doe",
      "role": "employee",
      "permissions": ["read:profile", "read:documents"]
    }
  }
}

Errors:
  401: {
    "error": {
      "code": "INVALID_CREDENTIALS",
      "message": "Email or password is incorrect"
    }
  }
  429: Rate limited after 5 failed attempts
```

### 3. REFRESH TOKEN
```
POST /auth/refresh-token
Authorization: Bearer {REFRESH_TOKEN}

Response (200):
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expires_in": 3600
  }
}
```

### 4. GET CURRENT USER PROFILE
```
GET /auth/profile
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "data": {
    "user_id": 1,
    "email": "john.doe@company.com",
    "full_name": "John Doe",
    "phone": "+1-555-0123",
    "company": "Acme Corp",
    "department": "Safety",
    "role": "employee",
    "avatar_url": "https://...",
    "created_at": "2024-01-15T08:00:00Z",
    "last_login": "2024-10-27T09:45:00Z"
  }
}
```

### 5. FORGOT PASSWORD
```
POST /auth/forgot-password
Content-Type: application/json

Request:
{
  "email": "john.doe@company.com"
}

Response (200):
{
  "success": true,
  "data": {
    "message": "Password reset email sent to john.doe@company.com"
  }
}
```

### 6. RESET PASSWORD
```
POST /auth/reset-password
Content-Type: application/json

Request:
{
  "token": "reset_token_from_email",
  "new_password": "NewSecurePass123!"
}

Response (200):
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  }
}
```

### 7. LOGOUT
```
POST /auth/logout
Authorization: Bearer {JWT_TOKEN}

Response (204): No Content
```

---

## 👥 EMPLOYEE SERVICE (Port 3002)

### 1. LIST EMPLOYEES
```
GET /employees?page=1&limit=20&sort=-created_at&filter=status:active
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "data": [
    {
      "employee_id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@company.com",
      "phone": "+1-555-0123",
      "department": {
        "id": 5,
        "name": "Safety"
      },
      "job_title": "Safety Engineer",
      "manager": {
        "id": 10,
        "name": "Jane Smith"
      },
      "hire_date": "2022-01-15",
      "status": "active",
      "skills": ["Risk Assessment", "OSHA Compliance"],
      "certifications": ["CPR", "First Aid"],
      "compliance_score": 87.5,
      "created_at": "2022-01-15T08:00:00Z"
    }
  ],
  "pagination": {
    "total": 250,
    "page": 1,
    "limit": 20,
    "pages": 13
  }
}
```

### 2. SEARCH EMPLOYEES
```
GET /employees/search?q=john+doe
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "data": [
    {
      "employee_id": 1,
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@company.com",
      "department": "Safety",
      "job_title": "Safety Engineer"
    }
  ]
}
```

### 3. GET EMPLOYEE DETAILS
```
GET /employees/{employee_id}
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "data": {
    "employee_id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@company.com",
    "phone": "+1-555-0123",
    "department": "Safety",
    "job_title": "Safety Engineer",
    "manager": {
      "id": 10,
      "name": "Jane Smith"
    },
    "hire_date": "2022-01-15",
    "status": "active",
    "skills": ["Risk Assessment", "OSHA Compliance"],
    "certifications": [
      {
        "name": "CPR",
        "issued_date": "2023-06-01",
        "expiry_date": "2025-06-01",
        "status": "active"
      }
    ],
    "compliance_records": [
      {
        "template": "Monthly Safety Checklist",
        "due_date": "2024-10-31",
        "status": "pending"
      }
    ],
    "training_history": [
      {
        "course": "OSHA 30-Hour Course",
        "completion_date": "2023-03-15",
        "status": "completed",
        "score": 92
      }
    ]
  }
}
```

### 4. CREATE EMPLOYEE
```
POST /employees
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

Request:
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@company.com",
  "phone": "+1-555-0123",
  "department_id": 5,
  "job_title": "Safety Engineer",
  "manager_id": 10,
  "hire_date": "2024-10-27",
  "skills": ["Risk Assessment"]
}

Response (201):
{
  "success": true,
  "data": {
    "employee_id": 250,
    "email": "john.doe@company.com",
    "created_at": "2024-10-27T10:30:00Z"
  }
}
```

### 5. UPDATE EMPLOYEE
```
PUT /employees/{employee_id}
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

Request:
{
  "job_title": "Senior Safety Engineer",
  "skills": ["Risk Assessment", "OSHA Compliance", "Training"]
}

Response (200):
{
  "success": true,
  "data": {
    "employee_id": 1,
    "job_title": "Senior Safety Engineer",
    "updated_at": "2024-10-27T11:00:00Z"
  }
}
```

### 6. GET EMPLOYEE COMPLIANCE STATUS
```
GET /employees/{employee_id}/compliance
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "data": {
    "employee_id": 1,
    "compliance_score": 87.5,
    "status": "compliant",
    "pending_items": [
      {
        "checklist": "Monthly Safety Inspection",
        "due_date": "2024-10-31",
        "days_remaining": 4,
        "priority": "high"
      }
    ],
    "completed_items": [
      {
        "checklist": "Safety Training",
        "completed_date": "2024-10-20",
        "score": 95
      }
    ]
  }
}
```

### 7. GET EMPLOYEE TRAINING HISTORY
```
GET /employees/{employee_id}/training
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "data": {
    "employee_id": 1,
    "total_training_hours": 120,
    "training_records": [
      {
        "course_id": 5,
        "course_name": "OSHA 30-Hour Course",
        "enrollment_date": "2023-01-15",
        "completion_date": "2023-03-15",
        "status": "completed",
        "score": 92
      }
    ],
    "certifications": [
      {
        "name": "CPR",
        "issued_date": "2023-06-01",
        "expiry_date": "2025-06-01",
        "status": "active"
      }
    ]
  }
}
```

### 8. START ONBOARDING
```
POST /employees/{employee_id}/onboard
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

Request:
{
  "template_id": 1,
  "manager_id": 10,
  "start_date": "2024-10-27"
}

Response (201):
{
  "success": true,
  "data": {
    "onboarding_id": 500,
    "employee_id": 1,
    "status": "in_progress",
    "steps": [
      { "step": 1, "task": "IT Setup", "status": "pending" },
      { "step": 2, "task": "HR Orientation", "status": "pending" }
    ],
    "created_at": "2024-10-27T10:30:00Z"
  }
}
```

### 9. GET ONBOARDING STATUS
```
GET /employees/{employee_id}/onboard
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "data": {
    "onboarding_id": 500,
    "employee_id": 1,
    "status": "in_progress",
    "progress": 40,
    "steps": [
      {
        "step": 1,
        "task": "IT Setup",
        "status": "completed",
        "completed_date": "2024-10-27T11:00:00Z"
      },
      {
        "step": 2,
        "task": "HR Orientation",
        "status": "in_progress",
        "assigned_to": "Jane Smith"
      }
    ]
  }
}
```

### 10. COMPLETE ONBOARDING STEP
```
POST /employees/{employee_id}/onboard/{step_id}
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

Request:
{
  "notes": "IT setup complete - laptop and access configured"
}

Response (200):
{
  "success": true,
  "data": {
    "step": {
      "step_id": 1,
      "status": "completed",
      "completed_by": 10,
      "completed_date": "2024-10-27T11:30:00Z"
    },
    "progress": 50
  }
}
```

---

## 📄 DOCUMENT SERVICE (Port 3003)

### 1. UPLOAD DOCUMENTS
```
POST /documents/upload
Authorization: Bearer {JWT_TOKEN}
Content-Type: multipart/form-data

Request:
  file: <binary>
  category: "compliance"
  expiry_date: "2025-12-31" (optional)

Response (201):
{
  "success": true,
  "data": {
    "document_id": 1000,
    "name": "Safety-Policy-2024.pdf",
    "category": "compliance",
    "file_size": 2048576,
    "s3_url": "https://s3.amazonaws.com/ehs-bucket/docs/...",
    "status": "stored",
    "ocr_status": "queued",
    "created_at": "2024-10-27T10:30:00Z"
  }
}
```

### 2. LIST DOCUMENTS
```
GET /documents?page=1&limit=20&category=compliance&sort=-created_at
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "data": [
    {
      "document_id": 1000,
      "name": "Safety-Policy-2024.pdf",
      "category": "compliance",
      "file_size": 2048576,
      "uploaded_by": {
        "id": 1,
        "name": "John Doe"
      },
      "created_at": "2024-10-27T10:30:00Z",
      "expiry_date": "2025-12-31",
      "status": "active",
      "ocr_status": "completed",
      "version": 1
    }
  ],
  "pagination": {
    "total": 500,
    "page": 1,
    "limit": 20
  }
}
```

### 3. SEARCH DOCUMENTS
```
GET /documents/search?q=safety
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "data": [
    {
      "document_id": 1000,
      "name": "Safety-Policy-2024.pdf",
      "relevance_score": 0.95,
      "matched_pages": [1, 3, 5]
    },
    {
      "document_id": 1001,
      "name": "Safety-Procedures.docx",
      "relevance_score": 0.87,
      "matched_pages": [2, 4]
    }
  ]
}
```

### 4. GET DOCUMENT DETAILS
```
GET /documents/{document_id}
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "data": {
    "document_id": 1000,
    "name": "Safety-Policy-2024.pdf",
    "category": "compliance",
    "file_size": 2048576,
    "file_type": "application/pdf",
    "uploaded_by": {
      "id": 1,
      "name": "John Doe"
    },
    "created_at": "2024-10-27T10:30:00Z",
    "updated_at": "2024-10-27T10:30:00Z",
    "expiry_date": "2025-12-31",
    "status": "active",
    "version": 1,
    "ocr_status": "completed",
    "ocr_text_length": 50000,
    "shared_with": [
      { "id": 5, "name": "Jane Smith", "permission": "view" }
    ]
  }
}
```

### 5. DOWNLOAD DOCUMENT
```
GET /documents/{document_id}/download
Authorization: Bearer {JWT_TOKEN}

Response (200):
  Content-Disposition: attachment; filename="Safety-Policy-2024.pdf"
  Content-Type: application/pdf
  <binary file content>
```

### 6. GET OCR EXTRACTED TEXT
```
GET /documents/{document_id}/ocr-text
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "data": {
    "document_id": 1000,
    "ocr_status": "completed",
    "confidence_score": 0.94,
    "pages_processed": 12,
    "extracted_text": "Page 1:\nEHS Safety Policy...",
    "structured_data": {
      "title": "EHS Safety Policy",
      "date": "2024-01-01",
      "sections": [...]
    }
  }
}
```

### 7. UPDATE DOCUMENT METADATA
```
PUT /documents/{document_id}
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

Request:
{
  "category": "training",
  "expiry_date": "2026-12-31"
}

Response (200):
{
  "success": true,
  "data": {
    "document_id": 1000,
    "updated_at": "2024-10-27T11:00:00Z"
  }
}
```

### 8. DELETE DOCUMENT
```
DELETE /documents/{document_id}
Authorization: Bearer {JWT_TOKEN}

Response (204): No Content
```

### 9. GET DOCUMENT VERSIONS
```
GET /documents/{document_id}/versions
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "data": {
    "document_id": 1000,
    "versions": [
      {
        "version": 2,
        "created_by": {
          "id": 1,
          "name": "John Doe"
        },
        "created_at": "2024-10-27T11:00:00Z",
        "change_description": "Updated expiry date"
      },
      {
        "version": 1,
        "created_by": {
          "id": 1,
          "name": "John Doe"
        },
        "created_at": "2024-10-27T10:30:00Z",
        "change_description": "Initial upload"
      }
    ]
  }
}
```

### 10. SHARE DOCUMENT
```
POST /documents/{document_id}/share
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

Request:
{
  "shared_with_user_id": 5,
  "permission_level": "view",
  "expires_at": "2024-12-31" (optional)
}

Response (201):
{
  "success": true,
  "data": {
    "share_id": 2000,
    "document_id": 1000,
    "shared_with": {
      "id": 5,
      "name": "Jane Smith"
    },
    "permission": "view",
    "shared_at": "2024-10-27T10:30:00Z"
  }
}
```

---

## 🚨 INCIDENT SERVICE (Port 3004)

### 1. CREATE INCIDENT
```
POST /incidents
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

Request:
{
  "title": "Chemical Spill in Lab Area",
  "description": "20 liters of acetone spilled...",
  "location": "Building A, Lab 201",
  "date_occurred": "2024-10-27T09:15:00Z",
  "category": "chemical_spill",
  "severity": "high",
  "witness_ids": [2, 3, 4]
}

Response (201):
{
  "success": true,
  "data": {
    "incident_id": 5000,
    "incident_number": "INC-2024-1234",
    "title": "Chemical Spill in Lab Area",
    "status": "open",
    "severity": "high",
    "created_by": {
      "id": 1,
      "name": "John Doe"
    },
    "created_at": "2024-10-27T10:30:00Z"
  }
}
```

### 2. LIST INCIDENTS
```
GET /incidents?page=1&limit=20&filter=status:open,severity:high&sort=-created_at
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "data": [
    {
      "incident_id": 5000,
      "incident_number": "INC-2024-1234",
      "title": "Chemical Spill in Lab Area",
      "category": "chemical_spill",
      "severity": "high",
      "status": "open",
      "location": "Building A, Lab 201",
      "reported_by": {
        "id": 1,
        "name": "John Doe"
      },
      "assigned_to": {
        "id": 10,
        "name": "Jane Smith"
      },
      "date_occurred": "2024-10-27T09:15:00Z",
      "created_at": "2024-10-27T10:30:00Z"
    }
  ]
}
```

### 3. GET INCIDENT DETAILS
```
GET /incidents/{incident_id}
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "data": {
    "incident_id": 5000,
    "incident_number": "INC-2024-1234",
    "title": "Chemical Spill in Lab Area",
    "description": "20 liters of acetone spilled...",
    "category": "chemical_spill",
    "severity": "high",
    "status": "open",
    "location": "Building A, Lab 201",
    "date_occurred": "2024-10-27T09:15:00Z",
    "reported_by": {
      "id": 1,
      "name": "John Doe"
    },
    "assigned_to": {
      "id": 10,
      "name": "Jane Smith"
    },
    "root_cause": null,
    "corrective_actions": [],
    "due_date": "2024-11-03",
    "created_at": "2024-10-27T10:30:00Z",
    "updated_at": "2024-10-27T10:30:00Z",
    "timeline": [
      {
        "action": "created",
        "performed_by": "John Doe",
        "timestamp": "2024-10-27T10:30:00Z"
      }
    ]
  }
}
```

### 4. UPDATE INCIDENT
```
PUT /incidents/{incident_id}
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

Request:
{
  "status": "investigating",
  "root_cause": "Container lid not properly sealed",
  "corrective_actions": [
    "Retraining on chemical handling",
    "Upgrade container storage"
  ]
}

Response (200):
{
  "success": true,
  "data": {
    "incident_id": 5000,
    "status": "investigating",
    "updated_at": "2024-10-27T11:00:00Z"
  }
}
```

### 5. GET INCIDENT ANALYTICS
```
GET /incidents/analytics?start_date=2024-01-01&end_date=2024-12-31
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "data": {
    "total_incidents": 45,
    "by_severity": {
      "critical": 2,
      "high": 8,
      "medium": 15,
      "low": 20
    },
    "by_category": {
      "chemical_spill": 10,
      "injury": 8,
      "environmental": 12,
      "other": 15
    },
    "by_status": {
      "open": 5,
      "investigating": 3,
      "resolved": 30,
      "closed": 7
    },
    "avg_resolution_time_days": 12.5,
    "trends": [...]
  }
}
```

---

## 🎓 TRAINING SERVICE (Port 3005)

### 1. LIST COURSES
```
GET /training/courses?page=1&limit=20&category=safety
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "data": [
    {
      "course_id": 100,
      "name": "OSHA 30-Hour Course",
      "description": "Comprehensive OSHA safety training",
      "category": "safety",
      "duration_hours": 30,
      "required_frequency_days": 365,
      "pass_score": 80,
      "enrolled_count": 45,
      "created_at": "2023-01-01T00:00:00Z"
    }
  ]
}
```

### 2. GET COURSE DETAILS
```
GET /training/courses/{course_id}
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "data": {
    "course_id": 100,
    "name": "OSHA 30-Hour Course",
    "description": "Comprehensive OSHA safety training...",
    "category": "safety",
    "duration_hours": 30,
    "required_frequency_days": 365,
    "pass_score": 80,
    "materials": [
      {
        "material_id": 1000,
        "title": "Module 1: Introduction",
        "content_type": "video",
        "content_url": "https://...",
        "order": 1
      }
    ]
  }
}
```

### 3. ENROLL IN COURSE
```
POST /training/enroll
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

Request:
{
  "course_id": 100
}

Response (201):
{
  "success": true,
  "data": {
    "enrollment_id": 5000,
    "course_id": 100,
    "employee_id": 1,
    "enrollment_date": "2024-10-27T10:30:00Z",
    "status": "enrolled"
  }
}
```

### 4. GET EMPLOYEE TRAINING PROGRESS
```
GET /training/progress/{employee_id}
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "data": {
    "employee_id": 1,
    "total_training_hours": 120,
    "active_enrollments": [
      {
        "enrollment_id": 5000,
        "course": {
          "id": 100,
          "name": "OSHA 30-Hour Course"
        },
        "enrollment_date": "2024-10-27T10:30:00Z",
        "status": "in_progress",
        "progress": 35,
        "score": null
      }
    ],
    "completed_courses": [
      {
        "course_id": 50,
        "name": "Safety Fundamentals",
        "completion_date": "2024-03-15T00:00:00Z",
        "status": "completed",
        "score": 92,
        "certificate_id": 1000
      }
    ]
  }
}
```

### 5. GET EXPIRING CERTIFICATIONS
```
GET /training/expiring?days=30
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "data": [
    {
      "certification_id": 1000,
      "employee": {
        "id": 1,
        "name": "John Doe"
      },
      "certification_name": "CPR",
      "expiry_date": "2024-11-15",
      "days_until_expiry": 19,
      "status": "expiring_soon"
    }
  ]
}
```

---

## 🏭 ASSET SERVICE (Port 3006)

### 1. LIST ASSETS
```
GET /assets?page=1&limit=20&status=active
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "data": [
    {
      "asset_id": 1000,
      "asset_number": "AST-2024-0001",
      "name": "Emergency Eyewash Station",
      "asset_type": "equipment",
      "category": "safety",
      "location": "Building A, Floor 1",
      "status": "active",
      "purchase_date": "2023-01-15",
      "warranty_expiry": "2025-01-15",
      "responsible_person": {
        "id": 5,
        "name": "Jane Smith"
      },
      "last_maintenance": "2024-10-20",
      "next_maintenance": "2024-11-20"
    }
  ]
}
```

### 2. GET ASSET DETAILS
```
GET /assets/{asset_id}
Authorization: Bearer {JWT_TOKEN}

Response (200):
{
  "success": true,
  "data": {
    "asset_id": 1000,
    "asset_number": "AST-2024-0001",
    "name": "Emergency Eyewash Station",
    "description": "Portable eyewash station for lab use",
    "asset_type": "equipment",
    "category": "safety",
    "location": "Building A, Floor 1",
    "status": "active",
    "purchase_date": "2023-01-15",
    "cost": 2500,
    "warranty_expiry": "2025-01-15",
    "responsible_person": {
      "id": 5,
      "name": "Jane Smith"
    },
    "qr_code": "https://...",
    "maintenance_history": [
      {
        "date": "2024-10-20",
        "type": "preventive",
        "performed_by": "John Smith",
        "notes": "Routine inspection and cleaning"
      }
    ],
    "calibration_history": [
      {
        "date": "2024-06-15",
        "valid_until": "2025-06-15",
        "calibrated_by": "Certified Tech",
        "certificate": "CAL-2024-1234"
      }
    ]
  }
}
```

### 3. CREATE ASSET
```
POST /assets
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

Request:
{
  "name": "Emergency Eyewash Station",
  "asset_type": "equipment",
  "category": "safety",
  "location": "Building A, Floor 1",
  "responsible_person_id": 5,
  "purchase_date": "2023-01-15",
  "cost": 2500
}

Response (201):
{
  "success": true,
  "data": {
    "asset_id": 1001,
    "asset_number": "AST-2024-0002",
    "qr_code": "https://..."
  }
}
```

### 4. SCHEDULE MAINTENANCE
```
POST /assets/{asset_id}/maintenance
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json

Request:
{
  "scheduled_date": "2024-11-20",
  "maintenance_type": "preventive",
  "description": "Routine inspection",
  "assigned_to": 5
}

Response (201):
{
  "success": true,
  "data": {
    "maintenance_id": 2000,
    "status": "scheduled",
    "scheduled_date": "2024-11-20"
  }
}
```

---

## (Continued...)

**Note:** This document continues with:
- HR Service endpoints (leaves, attendance, payroll)
- Analytics Service endpoints (KPIs, reports)
- Management Service endpoints (RBAC, settings)
- Error codes reference
- Webhook specifications
- Rate limiting policies
- Migration guides

**Total Length:** 150+ endpoints across 9 services
**Complete OpenAPI Spec:** Available in `openapi.json`

---

**Document Status:** ✅ COMPLETE (Sample - Extended Version Available)  
**Last Updated:** October 27, 2026  
**Version:** 1.0
