# EHS Suite - Technical Implementation Roadmap & Developer Guide

## 📋 Document Navigation

This guide provides step-by-step implementation instructions for building all pending UI modules based on the Enterprise Architecture and Kubernetes deployment topology.

---

## 🏗️ Architecture Reference

### Enterprise EHS AI Stack

```
┌─────────────────────────────────────────────────────────────┐
│           PRESENTATION LAYER (React Components)             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Employee Portal │ HR Dashboard │ EHS Dashboard │Mgmt  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓↑ (REST API)
┌─────────────────────────────────────────────────────────────┐
│      BACKEND SERVICES LAYER (Node.js/Express)              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Employee Service │ Document Service │ Incident Service│ │
│  │ Training Service │ Asset Service    │ HR Service     │ │
│  │                  Kafka/RabbitMQ (Message Queue)      │ │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓↑ (Database)
┌─────────────────────────────────────────────────────────────┐
│           DATA LAYER (PostgreSQL)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ employees │ documents │ incidents │ training │ assets │ │
│  │ compliance │ notifications │ audit_logs              │ │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Kubernetes Deployment Architecture

```
┌─────────────────────────────────────────────────────┐
│          KUBERNETES CLUSTER (AKS)                  │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ NAMESPACE: ehs-app                             │ │
│  │                                                │ │
│  │  ┌─────────────┐  ┌─────────────┐             │ │
│  │  │  Frontend   │  │  Backend    │             │ │
│  │  │  Service    │  │  Service    │             │ │
│  │  │  (React)    │  │  (Node.js)  │             │ │
│  │  └──────┬──────┘  └──────┬──────┘             │ │
│  │         │                │                    │ │
│  │  ┌──────▼──────────────────▼──────┐           │ │
│  │  │   Database Service              │           │ │
│  │  │   (PostgreSQL)                  │           │ │
│  │  └─────────────────────────────────┘           │ │
│  │                                                │ │
│  │  ┌─────────────────────────────────┐           │ │
│  │  │  Message Queue (Kafka)          │           │ │
│  │  │  Event Processing               │           │ │
│  │  └─────────────────────────────────┘           │ │
│  │                                                │ │
│  │  ┌─────────────────────────────────┐           │ │
│  │  │  Monitoring (Prometheus)        │           │ │
│  │  │  Logging (ELK Stack)            │           │ │
│  │  └─────────────────────────────────┘           │ │
│  │                                                │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ NAMESPACE: ehs-ai                              │ │
│  │                                                │ │
│  │  ┌─────────────────────────────────┐           │ │
│  │  │  OCR Service (Tesseract)        │           │ │
│  │  │  NLP Service (spaCy)            │           │ │
│  │  │  AI Service (Claude)            │           │ │
│  │  └─────────────────────────────────┘           │ │
│  │                                                │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 📦 Technology Stack

### Frontend Stack
```
├── React 18.x
│   ├── React Router DOM (v6+) - Routing
│   ├── Redux Toolkit - State Management
│   ├── React Query - Server state management
│   └── Context API - Local state
│
├── UI Framework & Components
│   ├── Material-UI (MUI) v5+ - Component library
│   ├── Chakra UI - Alternative option
│   └── Tailwind CSS - Utility-first CSS
│
├── Forms & Validation
│   ├── React Hook Form - Form state
│   ├── Zod / Yup - Schema validation
│   └── date-fns - Date manipulation
│
├── Data Visualization
│   ├── Chart.js - Charting library
│   ├── React-Chartjs-2 - React wrapper
│   ├── D3.js - Advanced visualization
│   └── Recharts - React charts
│
├── Tables & Data
│   ├── @tanstack/react-table - Table library
│   ├── @tanstack/react-query - Data fetching
│   └── react-virtual - Virtual scrolling
│
├── HTTP Client
│   ├── Axios - API calls
│   └── Interceptors - Auth, error handling
│
├── UI Components & Icons
│   ├── React Icons - Icon library
│   ├── Heroicons - Another icon option
│   └── React Toastify - Notifications
│
└── Development Tools
    ├── TypeScript - Type safety
    ├── ESLint - Code linting
    ├── Prettier - Code formatting
    └── Vite - Build tool (faster than CRA)
```

### Backend Stack
```
├── Node.js 18.x LTS
│   ├── Express.js - Web framework
│   ├── TypeScript - Type safety
│   └── ESLint - Code linting
│
├── Database
│   ├── PostgreSQL 15+ - Primary database
│   ├── pg - Database driver
│   ├── Knex.js - Query builder (optional)
│   └── TypeORM / Sequelize - ORM (optional)
│
├── Authentication & Security
│   ├── jsonwebtoken (JWT) - Token generation
│   ├── bcryptjs - Password hashing
│   ├── Keycloak - Identity & Access Management
│   ├── helmet - Security headers
│   ├── cors - CORS handling
│   └── dotenv - Environment variables
│
├── File Handling & Storage
│   ├── multer - File uploads
│   ├── AWS SDK - S3 integration
│   ├── MinIO SDK - Alternative S3
│   └── sharp - Image processing
│
├── OCR & AI Integration
│   ├── tesseract.js - OCR in JS
│   ├── axios - API calls to Python services
│   └── node-fetch - Fetch API
│
├── Message Queue
│   ├── amqplib - RabbitMQ client
│   ├── kafkajs - Kafka client
│   └── bull - Redis-backed job queue
│
├── Logging & Monitoring
│   ├── winston - Logging library
│   ├── morgan - HTTP logging
│   ├── prom-client - Prometheus metrics
│   └── sentry - Error tracking
│
├── Testing
│   ├── Jest - Testing framework
│   ├── Supertest - HTTP testing
│   └── ts-jest - TypeScript support
│
└── Development
    ├── nodemon - Auto-restart on changes
    ├── ts-node - TypeScript execution
    └── cross-env - Cross-platform env vars
```

### Infrastructure & DevOps
```
├── Container & Orchestration
│   ├── Docker - Containerization
│   ├── Docker Compose - Local development
│   ├── Kubernetes - Container orchestration
│   ├── AKS - Azure Kubernetes Service
│   └── Helm - Kubernetes package manager
│
├── CI/CD
│   ├── GitHub Actions - CI/CD pipeline
│   ├── Azure Pipelines - Alternative
│   └── Docker Registry - Image storage
│
├── Infrastructure as Code
│   ├── Terraform - IaC provisioning
│   ├── Bicep - Azure IaC
│   └── Helm Charts - K8s manifests
│
├── Monitoring & Logging
│   ├── Prometheus - Metrics collection
│   ├── Grafana - Dashboard visualization
│   ├── ELK Stack (Elasticsearch, Logstash, Kibana)
│   ├── Jaeger - Distributed tracing
│   └── Alert Manager - Alerting
│
├── Security & Secrets
│   ├── Keycloak - IAM & MFA
│   ├── HashiCorp Vault - Secrets management
│   ├── Azure Key Vault - Cloud secrets
│   └── OWASP ZAP - Security scanning
│
└── Communication
    ├── Kafka - Event streaming
    ├── RabbitMQ - Message broker
    ├── Redis - Caching & sessions
    └── Socket.io - Real-time messaging
```

---

## 🚀 Project Setup Instructions

### Step 1: Initialize React Project

```bash
# Using Vite (recommended - faster than CRA)
npm create vite@latest ehs-suite-frontend -- --template react
cd ehs-suite-frontend

# Or using Create React App
npx create-react-app ehs-suite-frontend
cd ehs-suite-frontend
```

### Step 2: Install Core Dependencies

```bash
# React & Routing
npm install react react-dom react-router-dom

# State Management
npm install @reduxjs/toolkit react-redux
npm install @tanstack/react-query axios

# UI Framework
npm install @mui/material @emotion/react @emotion/styled
npm install @mui/icons-material

# Alternative or complementary UI
npm install chakra-ui @chakra-ui/react @emotion/react @emotion/styled

# Styling
npm install tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers
npm install date-fns

# Charts & Visualization
npm install chart.js react-chartjs-2
npm install recharts

# Tables
npm install @tanstack/react-table

# Notifications
npm install react-toastify

# Icons
npm install react-icons

# HTTP Client
npm install axios

# Development Tools
npm install -D typescript @types/react @types/react-dom
npm install -D eslint eslint-config-react-app prettier
npm install -D vite @vitejs/plugin-react
```

### Step 3: Project Structure

```bash
# Create folders
mkdir -p src/{components,pages,hooks,services,store,utils,styles,constants}
mkdir -p src/components/{auth,dashboard,employee,documents,incidents,hr,training,assets,common,ui}

# Create main files
touch src/App.jsx
touch src/index.jsx
touch src/styles/index.css
touch .env.example
touch .env.local
```

### Step 4: Configure Environment Variables

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=EHS Suite
VITE_APP_VERSION=1.0.0
VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=ehs-suite
VITE_KEYCLOAK_CLIENT_ID=ehs-frontend
```

---

## 📁 Detailed Project Structure

```
ehs-suite-frontend/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── SignupForm.jsx
│   │   │   ├── ForgotPasswordForm.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── AuthProvider.jsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── DashboardLayout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Header.jsx
│   │   │   ├── DashboardOverview.jsx
│   │   │   └── StatisticsCard.jsx
│   │   │
│   │   ├── employee/
│   │   │   ├── EmployeeDirectory.jsx
│   │   │   ├── EmployeeCard.jsx
│   │   │   ├── EmployeeProfile.jsx
│   │   │   ├── OnboardingWizard.jsx
│   │   │   └── EmployeeForm.jsx
│   │   │
│   │   ├── documents/
│   │   │   ├── DocumentRepository.jsx
│   │   │   ├── DocumentUpload.jsx
│   │   │   ├── OCRProcessor.jsx
│   │   │   ├── DocumentSearch.jsx
│   │   │   ├── DocumentViewer.jsx
│   │   │   └── VersionControl.jsx
│   │   │
│   │   ├── incidents/
│   │   │   ├── IncidentDashboard.jsx
│   │   │   ├── IncidentCard.jsx
│   │   │   ├── IncidentReportForm.jsx
│   │   │   ├── IncidentDetails.jsx
│   │   │   └── ComplianceChecklist.jsx
│   │   │
│   │   ├── hr/
│   │   │   ├── HRDashboard.jsx
│   │   │   ├── LeaveRequest.jsx
│   │   │   ├── LeaveApproval.jsx
│   │   │   ├── AttendanceTracker.jsx
│   │   │   └── PayrollIntegration.jsx
│   │   │
│   │   ├── training/
│   │   │   ├── TrainingCatalog.jsx
│   │   │   ├── CourseCard.jsx
│   │   │   ├── CourseEnrollment.jsx
│   │   │   ├── ProgressTracker.jsx
│   │   │   └── CertificationManager.jsx
│   │   │
│   │   ├── assets/
│   │   │   ├── AssetInventory.jsx
│   │   │   ├── AssetCard.jsx
│   │   │   ├── MaintenanceLog.jsx
│   │   │   ├── CalibrationTracker.jsx
│   │   │   └── PPEDistribution.jsx
│   │   │
│   │   ├── management/
│   │   │   ├── ExecutiveDashboard.jsx
│   │   │   ├── KPICard.jsx
│   │   │   ├── TrendChart.jsx
│   │   │   ├── PredictiveAnalytics.jsx
│   │   │   └── ComplianceReport.jsx
│   │   │
│   │   ├── travel/
│   │   │   ├── TravelPortal.jsx
│   │   │   ├── TravelRequest.jsx
│   │   │   ├── RiskAssessment.jsx
│   │   │   └── TravelAlerts.jsx
│   │   │
│   │   ├── common/
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── Breadcrumb.jsx
│   │   │   ├── Pagination.jsx
│   │   │   └── LoadingSpinner.jsx
│   │   │
│   │   ├── ui/
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── Tabs.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── Tooltip.jsx
│   │   │
│   │   └── layout/
│   │       ├── MainLayout.jsx
│   │       ├── AuthLayout.jsx
│   │       └── BlankLayout.jsx
│   │
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Signup.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Employees.jsx
│   │   ├── EmployeeDetail.jsx
│   │   ├── Documents.jsx
│   │   ├── Incidents.jsx
│   │   ├── HR.jsx
│   │   ├── Training.jsx
│   │   ├── Assets.jsx
│   │   ├── Management.jsx
│   │   ├── Travel.jsx
│   │   ├── Settings.jsx
│   │   ├── NotFound.jsx
│   │   └── Error.jsx
│   │
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useEmployee.js
│   │   ├── useDocument.js
│   │   ├── useIncident.js
│   │   ├── useForm.js
│   │   ├── useFetch.js
│   │   ├── useLocalStorage.js
│   │   ├── useDebounce.js
│   │   └── usePagination.js
│   │
│   ├── services/
│   │   ├── api.js              # Axios config & interceptors
│   │   ├── authService.js      # Auth API calls
│   │   ├── employeeService.js  # Employee API calls
│   │   ├── documentService.js  # Document API calls
│   │   ├── incidentService.js  # Incident API calls
│   │   ├── hrService.js        # HR API calls
│   │   ├── trainingService.js  # Training API calls
│   │   ├── assetService.js     # Asset API calls
│   │   └── ocrService.js       # OCR API calls
│   │
│   ├── store/
│   │   ├── index.js            # Redux store setup
│   │   ├── slices/
│   │   │   ├── authSlice.js
│   │   │   ├── userSlice.js
│   │   │   ├── employeeSlice.js
│   │   │   ├── documentSlice.js
│   │   │   ├── incidentSlice.js
│   │   │   ├── uiSlice.js
│   │   │   └── notificationSlice.js
│   │   └── middleware/
│   │       ├── authMiddleware.js
│   │       └── errorMiddleware.js
│   │
│   ├── utils/
│   │   ├── constants.js        # App constants
│   │   ├── validators.js       # Validation functions
│   │   ├── formatters.js       # Data formatters
│   │   ├── dateHelper.js       # Date utilities
│   │   ├── apiError.js         # Error handling
│   │   ├── permissions.js      # Role-based access
│   │   └── logger.js           # Logging utility
│   │
│   ├── styles/
│   │   ├── index.css           # Global styles
│   │   ├── tailwind.css        # Tailwind imports
│   │   ├── colors.css          # Color palette
│   │   ├── typography.css      # Font definitions
│   │   └── animations.css      # Animations
│   │
│   ├── constants/
│   │   ├── api.js              # API endpoints
│   │   ├── roles.js            # Role definitions
│   │   ├── status.js           # Status constants
│   │   └── messages.js         # UI messages
│   │
│   ├── App.jsx
│   ├── App.css
│   ├── index.jsx
│   └── index.css
│
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── logo.png
│
├── tests/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── utils/
│
├── .env.example
├── .env.local (git ignored)
├── .eslintrc.json
├── .prettierrc
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js              # If using Vite
├── webpack.config.js           # If using CRA
├── package.json
├── package-lock.json
├── README.md
├── DEVELOPMENT.md
└── .gitignore
```

---

## 🔌 API Integration Guide

### Backend API Endpoints

```javascript
// authService.js
const AUTH_ENDPOINTS = {
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/auth/refresh',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
  MFA_SETUP: '/auth/mfa/setup',
  MFA_VERIFY: '/auth/mfa/verify',
};

// employeeService.js
const EMPLOYEE_ENDPOINTS = {
  GET_ALL: '/employees',
  GET_BY_ID: '/employees/:id',
  CREATE: '/employees',
  UPDATE: '/employees/:id',
  DELETE: '/employees/:id',
  SEARCH: '/employees/search',
  BULK_IMPORT: '/employees/bulk',
  EXPORT: '/employees/export',
  COMPLIANCE_HISTORY: '/employees/:id/compliance',
  TRAINING_HISTORY: '/employees/:id/training',
};

// documentService.js
const DOCUMENT_ENDPOINTS = {
  GET_ALL: '/documents',
  GET_BY_ID: '/documents/:id',
  UPLOAD: '/documents/upload',
  PROCESS_OCR: '/documents/:id/ocr',
  SEARCH: '/documents/search',
  DELETE: '/documents/:id',
  VERSION_HISTORY: '/documents/:id/versions',
  DOWNLOAD: '/documents/:id/download',
  SHARE: '/documents/:id/share',
  CATEGORIZE: '/documents/:id/categorize',
};

// incidentService.js
const INCIDENT_ENDPOINTS = {
  GET_ALL: '/incidents',
  GET_BY_ID: '/incidents/:id',
  CREATE: '/incidents',
  UPDATE: '/incidents/:id',
  CLOSE: '/incidents/:id/close',
  ASSIGN: '/incidents/:id/assign',
  INVESTIGATE: '/incidents/:id/investigate',
  EXPORT_REPORT: '/incidents/:id/report',
  ANALYTICS: '/incidents/analytics',
};

// trainingService.js
const TRAINING_ENDPOINTS = {
  GET_COURSES: '/training/courses',
  GET_COURSE: '/training/courses/:id',
  ENROLL: '/training/enroll',
  GET_PROGRESS: '/training/progress/:employeeId',
  COMPLETE: '/training/:enrollmentId/complete',
  GET_CERTIFICATIONS: '/training/certifications',
  VERIFY_CERTIFICATE: '/training/certificates/:id/verify',
};

// assetService.js
const ASSET_ENDPOINTS = {
  GET_ALL: '/assets',
  GET_BY_ID: '/assets/:id',
  CREATE: '/assets',
  UPDATE: '/assets/:id',
  DELETE: '/assets/:id',
  MAINTENANCE: '/assets/:id/maintenance',
  CALIBRATION: '/assets/:id/calibration',
  QR_CODE: '/assets/:id/qr-code',
};
```

### Example API Service Implementation

```javascript
// services/api.js
import axios from 'axios';
import store from '../store';
import { logout } from '../store/slices/authSlice';

const API_BASE_URL = process.env.VITE_API_BASE_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add JWT token
api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const token = state.auth.token;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - logout user
      store.dispatch(logout());
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// services/employeeService.js
import api from './api';

export const employeeService = {
  // Get all employees with pagination
  getAll: (page = 1, limit = 10, filters = {}) =>
    api.get('/employees', { params: { page, limit, ...filters } }),

  // Get employee by ID
  getById: (id) =>
    api.get(`/employees/${id}`),

  // Create employee
  create: (data) =>
    api.post('/employees', data),

  // Update employee
  update: (id, data) =>
    api.put(`/employees/${id}`, data),

  // Delete employee
  delete: (id) =>
    api.delete(`/employees/${id}`),

  // Search employees
  search: (query, filters = {}) =>
    api.get('/employees/search', { params: { q: query, ...filters } }),

  // Get compliance history
  getComplianceHistory: (id) =>
    api.get(`/employees/${id}/compliance`),

  // Get training history
  getTrainingHistory: (id) =>
    api.get(`/employees/${id}/training`),
};
```

---

## 📝 Development Workflow

### Phase 1: Week 1-2 (Employee Lifecycle Portal)

#### Week 1 Day 1-2: Setup & Authentication
1. Project initialization
2. React Router setup
3. Redux store configuration
4. Authentication flow implementation
5. Protected route wrapper

#### Week 1 Day 3-5: Employee Directory
1. Employee list component
2. Search & filter functionality
3. Pagination implementation
4. Employee cards UI
5. Responsive design

#### Week 2 Day 1-3: Employee Profiles
1. Profile page layout
2. Tabs (Overview, Training, Compliance)
3. Profile form editing
4. API integration
5. Form validation

#### Week 2 Day 4-5: Onboarding Wizard
1. Multi-step wizard component
2. Form validation per step
3. Progress tracking
4. Data persistence
5. API submission

### Phase 1 Continued: Documents & Incidents

#### Week 2 (Continued) - Document Management
1. Document upload component
2. Drag & drop functionality
3. OCR processing UI
4. Document list with filters
5. Search implementation

#### Week 3 - Incident Management
1. Incident dashboard
2. Incident report form
3. Status tracking
4. Compliance checklist
5. Notification system

---

## 🧪 Testing Strategy

### Unit Testing (Jest)
```javascript
// Example: tests/components/EmployeeCard.test.jsx
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import EmployeeCard from '../components/employee/EmployeeCard';

describe('EmployeeCard Component', () => {
  const mockEmployee = {
    id: 1,
    name: 'John Doe',
    title: 'Safety Officer',
    department: 'Operations',
    status: 'active',
  };

  test('renders employee card with data', () => {
    render(
      <BrowserRouter>
        <EmployeeCard employee={mockEmployee} />
      </BrowserRouter>
    );
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Safety Officer')).toBeInTheDocument();
  });

  test('calls onClick handler when card is clicked', () => {
    const mockClick = jest.fn();
    render(
      <BrowserRouter>
        <EmployeeCard employee={mockEmployee} onClick={mockClick} />
      </BrowserRouter>
    );
    
    screen.getByTestId('employee-card').click();
    expect(mockClick).toHaveBeenCalledWith(mockEmployee.id);
  });
});
```

### Integration Testing (Playwright)
```javascript
// Example: tests/integration/employee.spec.js
import { test, expect } from '@playwright/test';

test('Employee directory search workflow', async ({ page }) => {
  // Navigate to employee page
  await page.goto('http://localhost:3000/employees');
  
  // Wait for employees to load
  await page.waitForSelector('[data-testid="employee-card"]');
  
  // Type in search box
  await page.fill('input[placeholder="Search..."]', 'John');
  
  // Wait for filtered results
  await page.waitForSelector('[data-testid="employee-card"]');
  
  // Verify results
  const cards = await page.locator('[data-testid="employee-card"]').count();
  expect(cards).toBeGreaterThan(0);
  
  // Verify filtered content
  await expect(page.locator('text=John')).toBeVisible();
});
```

---

## 🚢 Deployment

### Docker Setup

```dockerfile
# Dockerfile - Frontend
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Build app
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Install serve to run production build
RUN npm install -g serve

# Copy build from builder
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start server
CMD ["serve", "-s", "dist", "-l", "3000"]
```

### Kubernetes Deployment

```yaml
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ehs-frontend
  namespace: ehs-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ehs-frontend
  template:
    metadata:
      labels:
        app: ehs-frontend
    spec:
      containers:
      - name: frontend
        image: ehs-suite/frontend:latest
        ports:
        - containerPort: 3000
        env:
        - name: VITE_API_BASE_URL
          value: "http://ehs-backend:5000/api"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: ehs-frontend
  namespace: ehs-app
spec:
  type: LoadBalancer
  selector:
    app: ehs-frontend
  ports:
  - port: 80
    targetPort: 3000
---
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ehs-frontend-netpol
  namespace: ehs-app
spec:
  podSelector:
    matchLabels:
      app: ehs-frontend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - namespaceSelector: {}
    ports:
    - protocol: TCP
      port: 5000  # Backend
    - protocol: TCP
      port: 53   # DNS
```

---

## 📊 Metrics & Monitoring

### Frontend Monitoring (Prometheus)

```javascript
// utils/metrics.js
import { register, Counter, Gauge, Histogram } from 'prom-client';

// Page load time
export const pageLoadTime = new Histogram({
  name: 'page_load_time_ms',
  help: 'Page load time in milliseconds',
  buckets: [100, 500, 1000, 2000, 5000],
});

// API requests
export const apiRequests = new Counter({
  name: 'api_requests_total',
  help: 'Total API requests',
  labelNames: ['method', 'endpoint', 'status'],
});

// Active users
export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users',
});

// Form submissions
export const formSubmissions = new Counter({
  name: 'form_submissions_total',
  help: 'Total form submissions',
  labelNames: ['form_name', 'status'],
});
```

---

## 📚 References & Documentation

### Architecture Documents
- Enterprise Architecture: [Reference image]
- Kubernetes Topology: [Reference image]
- Technical Architecture: [Reference image]

### Business Requirements
- EHS Software Business Process Overview
- EHS Software Requirements (as of 11.06.2026)
- EHS Software Screenshots

### Development Resources
- [React Documentation](https://react.dev)
- [Material-UI Documentation](https://mui.com)
- [Tailwind CSS Documentation](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Redux Toolkit Documentation](https://redux-toolkit.js.org)
- [Kubernetes Documentation](https://kubernetes.io/docs)

---

## ✅ Pre-Launch Checklist

### Code Quality
- [ ] ESLint passes all checks
- [ ] Prettier formatting applied
- [ ] 80%+ test coverage
- [ ] TypeScript no errors
- [ ] No console warnings

### Performance
- [ ] Page load < 3 seconds
- [ ] Lighthouse score > 90
- [ ] Bundle size < 200KB (gzipped)
- [ ] Core Web Vitals green
- [ ] Images optimized

### Accessibility
- [ ] WCAG 2.1 Level AA compliant
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] Color contrast sufficient
- [ ] Focus states visible

### Security
- [ ] No hardcoded secrets
- [ ] XSS protection enabled
- [ ] CSRF tokens used
- [ ] Input validation complete
- [ ] Dependencies audit passed

### Documentation
- [ ] README updated
- [ ] API documentation complete
- [ ] Component storybook created
- [ ] Deployment guide written
- [ ] Troubleshooting guide included

### Testing
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] E2E tests passing
- [ ] Cross-browser tested
- [ ] Mobile responsive verified

---

**Document Status:** Complete  
**Version:** 1.0  
**Last Updated:** October 27, 2026  
**Next Review:** After Phase 1 Completion
