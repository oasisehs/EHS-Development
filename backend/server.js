const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';
const isProduction = process.env.NODE_ENV === 'production';
const UPLOADS_DIR = path.join(__dirname, 'uploads');

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const parseAllowedOrigins = (value) => {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const allowedOrigins = parseAllowedOrigins(process.env.CORS_ALLOWED_ORIGINS);

function validateRuntimeConfig() {
  if (isProduction) {
    const missing = [];

    if (!process.env.JWT_SECRET) {
      missing.push('JWT_SECRET');
    }

    if (!process.env.DATABASE_URL && !process.env.DB_HOST && !process.env.POSTGRES_HOST) {
      missing.push('DATABASE_URL or DB_HOST/POSTGRES_HOST');
    }

    if (missing.length > 0) {
      throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
    }

    if (allowedOrigins.length === 0) {
      throw new Error('CORS_ALLOWED_ORIGINS must be set in production.');
    }
  }
}

validateRuntimeConfig();

// ===== AWS S3 CONFIGURATION =====
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const S3_BUCKET = process.env.AWS_S3_BUCKET;
const S3_URL = process.env.AWS_S3_URL;

// Multer configuration for file uploads (memory storage for S3)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// ===== POSTGRESQL CONNECTION POOL =====
const hasDirectDbHost = Boolean(process.env.DB_HOST || process.env.POSTGRES_HOST);
const useConnectionString = Boolean(process.env.DATABASE_URL) && !hasDirectDbHost;

const poolConfig = useConnectionString
  ? {
      connectionString: process.env.DATABASE_URL
    }
  : {
      host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || process.env.POSTGRES_PORT || '5432', 10),
      database: process.env.DB_NAME || process.env.POSTGRES_DB || 'ehsdb',
      user: process.env.DB_USER || process.env.POSTGRES_USER || 'ehsuser',
      password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'ehspassword123'
    };

const sslFromEnv = process.env.DB_SSL;
if (sslFromEnv === 'true') {
  poolConfig.ssl = { rejectUnauthorized: false };
} else if (sslFromEnv !== 'false' && useConnectionString) {
  const remoteHostPattern = /(render\.com|rds\.amazonaws\.com|azure\.com)/i;
  if (remoteHostPattern.test(process.env.DATABASE_URL || '')) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }
}

const pool = new Pool(poolConfig);

const memoryStore = {
  users: [],
  roles: [
    { id: 1, name: 'admin' },
    { id: 2, name: 'manager' },
    { id: 3, name: 'employee' },
    { id: 4, name: 'viewer' }
  ],
  departments: [],
  employees: [],
  ehsRecords: [],
  permits: [],
  incidents: [],
  auditLogs: []
};

let databaseReady = true;

const seedDemoMemoryData = async () => {
  if (databaseReady || memoryStore.users.some((entry) => entry.email === 'demo@ehssuite.com')) {
    return;
  }

  const passwordHash = await bcrypt.hash('Demo@123456', 10);
  memoryStore.users.push(buildMemoryUser({
    id: 1,
    email: 'demo@ehssuite.com',
    passwordHash,
    fullName: 'Demo Admin',
    company: 'EHSSuite',
    department: 'Safety',
    phone: '+1-555-0100',
    role: 'admin'
  }));

  const deptRows = [
    { id: 1, name: 'Safety & Compliance', description: 'Workplace safety and compliance operations.', manager_id: 1, budget: 150000, parent_department_id: null },
    { id: 2, name: 'Operations', description: 'Daily production and service execution.', manager_id: null, budget: 420000, parent_department_id: null },
    { id: 3, name: 'Human Resources', description: 'People operations and onboarding.', manager_id: null, budget: 180000, parent_department_id: null },
    { id: 4, name: 'Training & Development', description: 'Training programs and capability development.', manager_id: null, budget: 120000, parent_department_id: null }
  ];

  const employeeRows = [
    {
      id: 1,
      user_id: 1,
      first_name: 'Demo',
      last_name: 'Admin',
      email: 'demo@ehssuite.com',
      phone: '+1-555-0100',
      department_id: 1,
      department_name: 'Safety & Compliance',
      job_title: 'Safety Manager',
      manager_id: null,
      manager_name: null,
      hire_date: '2020-01-15',
      date_of_birth: null,
      status: 'active',
      skills: ['Safety Management', 'Incident Investigation', 'Risk Assessment'],
      certifications: ['IOSH', 'HSE Lead'],
      compliance_score: 96,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      user_id: null,
      first_name: 'Aisha',
      last_name: 'Nolan',
      email: 'aisha.nolan@ehssuite.com',
      phone: '+1-555-0101',
      department_id: 2,
      department_name: 'Operations',
      job_title: 'Operations Supervisor',
      manager_id: 1,
      manager_name: 'Demo Admin',
      hire_date: '2021-04-10',
      date_of_birth: null,
      status: 'active',
      skills: ['Operations', 'Supervisor', 'PPE Audits'],
      certifications: ['Forklift Safety'],
      compliance_score: 89,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      user_id: null,
      first_name: 'Ruben',
      last_name: 'Kim',
      email: 'ruben.kim@ehssuite.com',
      phone: '+1-555-0102',
      department_id: 3,
      department_name: 'Human Resources',
      job_title: 'HR Partner',
      manager_id: 1,
      manager_name: 'Demo Admin',
      hire_date: '2022-02-01',
      date_of_birth: null,
      status: 'on_leave',
      skills: ['HR Support', 'Onboarding', 'Wellbeing'],
      certifications: ['ER Specialist'],
      compliance_score: 82,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 4,
      user_id: null,
      first_name: 'Mila',
      last_name: 'Patel',
      email: 'mila.patel@ehssuite.com',
      phone: '+1-555-0103',
      department_id: 4,
      department_name: 'Training & Development',
      job_title: 'Learning Coordinator',
      manager_id: 1,
      manager_name: 'Demo Admin',
      hire_date: '2023-09-18',
      date_of_birth: null,
      status: 'active',
      skills: ['Training Design', 'Competency Matrix', 'Risk Awareness'],
      certifications: ['Train-the-Trainer'],
      compliance_score: 94,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  memoryStore.departments = deptRows;
  memoryStore.employees = employeeRows;
  memoryStore.ehsRecords = [
    {
      id: 1,
      user_id: 1,
      record_type: 'compliance',
      title: 'Monthly Safety Audit',
      description: 'Safety checklist review completed.',
      severity: 'medium',
      status: 'open',
      due_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  memoryStore.permits = [
    {
      id: 1,
      permit_type: 'hot_work',
      title: 'Roofing maintenance permit',
      description: 'Permit for temporary hot work and access controls during roof maintenance.',
      site: 'North Plant',
      location: 'Roof Access Point A',
      submitted_by: 1,
      approver_id: 1,
      approver_name: 'Demo Admin',
      status: 'approved',
      risk_level: 'medium',
      approval_notes: 'Approved with permit conditions and spot supervision.',
      effective_from: new Date().toISOString(),
      effective_to: new Date(Date.now() + 86400000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
};

const seedDemoMemoryUser = async () => {
  await seedDemoMemoryData();
};

const apiDoc = {
  openapi: '3.0.3',
  info: {
    title: 'EHS Suite Backend API',
    version: '1.0.0',
    description: 'Authentication, EHS records, employees, departments, compliance, training, onboarding and file APIs.'
  },
  servers: [
    { url: `http://localhost:${PORT}`, description: 'Local server' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          code: { type: 'string', nullable: true },
          details: { type: 'string', nullable: true }
        },
        required: ['error']
      },
      TrainingEnrollment: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          course_id: { type: 'integer' },
          employee_id: { type: 'integer' },
          enrollment_date: { type: 'string', format: 'date-time' },
          completion_date: { type: 'string', format: 'date-time', nullable: true },
          status: {
            type: 'string',
            enum: ['enrolled', 'in_progress', 'completed', 'failed', 'dropped']
          },
          final_score: { type: 'integer', nullable: true },
          certificate_id: { type: 'integer', nullable: true },
          created_at: { type: 'string', format: 'date-time' }
        }
      },
      ComplianceRecord: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          template_id: { type: 'integer' },
          employee_id: { type: 'integer' },
          department_id: { type: 'integer', nullable: true },
          due_date: { type: 'string', format: 'date-time' },
          completed_date: { type: 'string', format: 'date-time', nullable: true },
          status: {
            type: 'string',
            enum: ['pending', 'completed', 'overdue', 'failed']
          },
          checked_by: { type: 'integer', nullable: true },
          notes: { type: 'string', nullable: true },
          evidence_file_id: { type: 'integer', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' }
        }
      },
      EmployeeTrainingGetData: {
        type: 'object',
        properties: {
          employee: { type: 'object' },
          enrollments: {
            type: 'array',
            items: { type: 'object' }
          },
          certifications: {
            type: 'array',
            items: { type: 'object' }
          }
        }
      },
      EmployeeComplianceGetData: {
        type: 'object',
        properties: {
          employee: { type: 'object' },
          summary: { type: 'object' },
          records: {
            type: 'array',
            items: { type: 'object' }
          }
        }
      },
      OnboardingGetData: {
        type: 'object',
        properties: {
          checklist: { type: 'object' },
          tasks: {
            type: 'array',
            items: { type: 'object' }
          }
        }
      },
      OnboardingStepData: {
        type: 'object',
        properties: {
          task: { type: 'object' },
          checklist: { type: 'object' },
          progress: {
            type: 'object',
            properties: {
              total_steps: { type: 'integer' },
              completed_steps: { type: 'integer' }
            }
          }
        }
      }
    }
  },
  security: [{ bearerAuth: [] }],
  paths: {}
};

function definePath(pathKey, spec) {
  apiDoc.paths[pathKey] = spec;
}

function sendError(res, statusCode, message, options = {}) {
  const payload = {
    error: message
  };

  if (options.code) {
    payload.code = options.code;
  }

  if (options.details) {
    payload.details = options.details;
  }

  return res.status(statusCode).json(payload);
}

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    databaseReady = false;
    console.warn('Database connection unavailable, using in-memory development fallback for auth flows.');
    console.warn(err.message);
    seedDemoMemoryUser();
  } else {
    console.log('Connected to PostgreSQL database:', res.rows[0].now);
  }
});

// Middleware
app.use(
  helmet({
    contentSecurityPolicy: false
  })
);

app.use(morgan(isProduction ? 'combined' : 'dev'));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (!isProduction || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('CORS policy does not allow access from this origin'));
    }
  })
);

app.use((req, res, next) => {
  const originalJson = res.json.bind(res);

  res.json = (body) => {
    if (
      res.statusCode >= 400 &&
      body &&
      typeof body === 'object' &&
      !Array.isArray(body) &&
      typeof body.error === 'string'
    ) {
      if (!body.code) {
        if (res.statusCode === 400) body.code = 'BAD_REQUEST';
        else if (res.statusCode === 401) body.code = 'UNAUTHORIZED';
        else if (res.statusCode === 403) body.code = 'FORBIDDEN';
        else if (res.statusCode === 404) body.code = 'NOT_FOUND';
        else if (res.statusCode === 409) body.code = 'CONFLICT';
        else if (res.statusCode >= 500) body.code = 'INTERNAL_ERROR';
      }

      if (process.env.NODE_ENV === 'production' && body.details) {
        delete body.details;
      }
    }

    return originalJson(body);
  };

  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/uploads', express.static(UPLOADS_DIR));

// ===== DATABASE INITIALIZATION =====
async function ensureDemoUser() {
  try {
    const seededUsers = [
      {
        email: 'admin@ehssuite.com',
        password: 'demo123456',
        full_name: 'Admin User',
        phone: '+1-555-0001',
        company: 'Acme Corp',
        role: 'admin'
      },
      {
        email: 'manager@ehssuite.com',
        password: 'demo123456',
        full_name: 'Sarah Manager',
        phone: '+1-555-0002',
        company: 'Acme Corp',
        role: 'manager'
      },
      {
        email: 'employee@ehssuite.com',
        password: 'demo123456',
        full_name: 'John Employee',
        phone: '+1-555-0003',
        company: 'Acme Corp',
        role: 'employee'
      },
      {
        email: 'safety@ehssuite.com',
        password: 'demo123456',
        full_name: 'Alice Safety Officer',
        phone: '+1-555-0004',
        company: 'Acme Corp',
        role: 'manager'
      },
      {
        email: 'demo@ehssuite.com',
        password: 'Demo@123456',
        full_name: 'Demo Admin',
        phone: '+1-555-0100',
        company: 'EHSSuite',
        role: 'admin'
      }
    ];

    for (const userSeed of seededUsers) {
      const hashedPassword = await bcrypt.hash(userSeed.password, 10);
      const userCheck = await pool.query('SELECT id, password_hash FROM users WHERE email = $1', [userSeed.email]);

      if (userCheck.rows.length > 0) {
        const user = userCheck.rows[0];
        const needsPasswordReset = !user.password_hash || user.password_hash === '$2a$10$YourHashedPasswordHere';
        if (needsPasswordReset) {
          await pool.query(
            `UPDATE users
             SET password_hash = $1,
                 full_name = COALESCE(full_name, $2),
                 phone = COALESCE(phone, $3),
                 company = COALESCE(company, $4),
                 status = 'active',
                 updated_at = CURRENT_TIMESTAMP
             WHERE email = $5`,
            [hashedPassword, userSeed.full_name, userSeed.phone, userSeed.company, userSeed.email]
          );
        }
      } else {
        await pool.query(
          `INSERT INTO users (email, password_hash, full_name, phone, company, status)
           VALUES ($1, $2, $3, $4, $5, 'active')
           ON CONFLICT (email) DO NOTHING`,
          [userSeed.email, hashedPassword, userSeed.full_name, userSeed.phone, userSeed.company]
        );
      }

      const normalizedUser = await pool.query('SELECT id FROM users WHERE email = $1', [userSeed.email]);
      const userId = normalizedUser.rows[0]?.id;
      if (userId) {
        const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1 LIMIT 1', [userSeed.role]);
        if (roleResult.rows.length > 0) {
          await pool.query(
            `INSERT INTO user_roles (user_id, role_id)
             VALUES ($1, $2)
             ON CONFLICT (user_id, role_id) DO NOTHING`,
            [userId, roleResult.rows[0].id]
          );
        }
      }
    }
  } catch (error) {
    console.warn('Demo user bootstrap skipped:', error.message);
  }
}

const initializeDatabase = async () => {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        full_name VARCHAR(255),
        company VARCHAR(255),
        department VARCHAR(255),
        phone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create EHS data table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ehs_records (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        record_type VARCHAR(100),
        title VARCHAR(255),
        description TEXT,
        severity VARCHAR(50),
        status VARCHAR(50),
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create files table for S3 uploads
    await pool.query(`
      CREATE TABLE IF NOT EXISTS files (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        file_name VARCHAR(255) NOT NULL,
        s3_key VARCHAR(500) NOT NULL,
        s3_url TEXT NOT NULL,
        file_size INTEGER,
        file_type VARCHAR(100),
        upload_type VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create permit/PTW/SSRA records
    await pool.query(`
      CREATE TABLE IF NOT EXISTS permit_records (
        id SERIAL PRIMARY KEY,
        permit_type VARCHAR(50) NOT NULL CHECK (permit_type IN ('hot_work', 'confined_space', 'lifting', 'electrical', 'general', 'ssra')),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        site VARCHAR(255),
        location VARCHAR(255),
        submitted_by INTEGER REFERENCES employees(id),
        approver_id INTEGER REFERENCES employees(id),
        status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'pending_review', 'approved', 'rejected', 'expired')),
        risk_level VARCHAR(30) DEFAULT 'medium',
        approval_notes TEXT,
        effective_from TIMESTAMP,
        effective_to TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL CHECK (name IN ('admin', 'manager', 'employee', 'viewer')),
        description TEXT,
        permissions JSONB DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      INSERT INTO roles (name, description, permissions) VALUES
        ('admin', 'Full system access with all permissions', '["*:*"]'::jsonb),
        ('manager', 'Team management and supervisory access', '["read:*", "write:team", "manage:team", "view:reports"]'::jsonb),
        ('employee', 'Basic user access for own records', '["read:own", "write:own", "read:public"]'::jsonb),
        ('viewer', 'Read-only access to shared resources', '["read:*"]'::jsonb)
      ON CONFLICT (name) DO NOTHING
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id INTEGER NOT NULL REFERENCES roles(id),
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        assigned_by INTEGER REFERENCES users(id),
        UNIQUE(user_id, role_id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value JSONB NOT NULL DEFAULT '{}'::jsonb,
        description TEXT,
        updated_by INTEGER REFERENCES users(id),
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      INSERT INTO system_settings (setting_key, setting_value, description)
      VALUES (
        'ehs_defaults',
        '{"incident_escalation_threshold":75,"compliance_target":95,"session_timeout_minutes":60,"require_mfa":false,"email_alerts_enabled":true,"in_app_alerts_enabled":true}'::jsonb,
        'Core EHS admin defaults'
      )
      ON CONFLICT (setting_key) DO NOTHING
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      ALTER TABLE audit_logs
      ADD COLUMN IF NOT EXISTS entity_type VARCHAR(100),
      ADD COLUMN IF NOT EXISTS entity_id INTEGER,
      ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id SERIAL PRIMARY KEY,
        incident_number VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        location VARCHAR(255),
        date_occurred TIMESTAMP NOT NULL,
        reported_by INTEGER NOT NULL REFERENCES users(id),
        assigned_to INTEGER REFERENCES employees(id),
        severity VARCHAR(50) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
        status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'investigating', 'resolved', 'closed')),
        category VARCHAR(100) NOT NULL CHECK (category IN ('safety', 'environmental', 'health', 'security', 'other')),
        root_cause TEXT,
        corrective_actions JSONB DEFAULT '[]'::jsonb,
        due_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS incident_timeline (
        id SERIAL PRIMARY KEY,
        incident_id INTEGER NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
        action VARCHAR(100) NOT NULL,
        performed_by INTEGER NOT NULL REFERENCES users(id),
        description TEXT,
        evidence_file_id INTEGER REFERENCES files(id),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create assets table for asset management module
    await pool.query(`
      CREATE TABLE IF NOT EXISTS assets (
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS leave_types (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE CHECK (name IN ('annual', 'sick', 'casual', 'maternity', 'paternity', 'unpaid', 'other')),
        description TEXT,
        days_per_year DECIMAL(10, 2),
        is_paid BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS leave_types_name_idx
      ON leave_types (name)
    `);

    await pool.query(`
      INSERT INTO leave_types (name, description, days_per_year, is_paid) VALUES
        ('annual', 'Annual paid leave', 20, TRUE),
        ('sick', 'Sick leave for illness', 10, TRUE),
        ('casual', 'Casual paid leave', 5, TRUE),
        ('maternity', 'Maternity leave', 90, TRUE),
        ('paternity', 'Paternity leave', 14, TRUE),
        ('unpaid', 'Unpaid leave of absence', NULL, FALSE),
        ('other', 'Other types of leave', NULL, TRUE)
      ON CONFLICT (name) DO NOTHING
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS leave_requests (
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
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance_records (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        attendance_date DATE NOT NULL,
        check_in_time TIMESTAMP,
        check_out_time TIMESTAMP,
        duration_hours DECIMAL(10, 2),
        status VARCHAR(50) DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'early_leave', 'half_day', 'on_leave')),
        notes TEXT,
        recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, attendance_date)
      )
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS attendance_records_employee_date_idx
      ON attendance_records (employee_id, attendance_date)
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS salary_structure (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        base_salary DECIMAL(15, 2) NOT NULL,
        allowances JSONB DEFAULT '{}'::jsonb,
        deductions JSONB DEFAULT '{}'::jsonb,
        effective_date DATE DEFAULT CURRENT_DATE,
        end_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS payroll_records (
        id SERIAL PRIMARY KEY,
        employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
        payroll_month INTEGER NOT NULL CHECK (payroll_month >= 1 AND payroll_month <= 12),
        payroll_year INTEGER NOT NULL,
        gross_salary DECIMAL(15, 2),
        deductions JSONB DEFAULT '{}'::jsonb,
        net_salary DECIMAL(15, 2),
        tax_amount DECIMAL(15, 2),
        processed_date DATE,
        payslip_id INTEGER,
        status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid', 'cancelled')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(employee_id, payroll_month, payroll_year)
      )
    `);

    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS payroll_records_employee_month_year_idx
      ON payroll_records (employee_id, payroll_month, payroll_year)
    `);

    await ensureDemoUser();
    console.log('Database tables initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

initializeDatabase();

// ===== AUTHENTICATION ROUTES =====

async function getUserRole(userId) {
  if (!databaseReady) {
    const user = memoryStore.users.find((entry) => entry.id === userId);
    return user?.role || 'viewer';
  }

  const roleResult = await pool.query(
    `SELECT r.name
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = $1
     ORDER BY ur.assigned_at ASC
     LIMIT 1`,
    [userId]
  );

  return roleResult.rows[0]?.name || 'viewer';
}

function buildMemoryUser({ id, email, passwordHash, fullName, company, department, phone, role = 'employee' }) {
  return {
    id,
    email,
    password_hash: passwordHash,
    full_name: fullName || null,
    company: company || null,
    department: department || null,
    phone: phone || null,
    role,
    created_at: new Date().toISOString(),
    last_login: null,
    status: 'active'
  };
}

async function logAuditAction(userId, action, entityType, entityId, details = {}) {
  const entry = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    user_id: userId ?? null,
    action,
    entity_type: entityType || null,
    entity_id: entityId ?? null,
    details: details || {},
    created_at: new Date().toISOString()
  };

  if (!databaseReady) {
    memoryStore.auditLogs.unshift(entry);
    return entry;
  }

  try {
    const result = await pool.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, resource_type, resource_id, changes, timestamp, user_agent)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8::jsonb, NOW(), $9)
       RETURNING *`,
      [
        entry.user_id,
        entry.action,
        entry.entity_type,
        entry.entity_id,
        JSON.stringify(entry.details),
        entry.entity_type || 'system',
        entry.entity_id,
        JSON.stringify(entry.details),
        'EHS Backend'
      ]
    );
    return result.rows[0] || entry;
  } catch (err) {
    console.warn('Audit log write failed:', err.message);
    memoryStore.auditLogs.unshift(entry);
    return entry;
  }
}

async function registerHandler(req, res) {
  try {
    const { email, password, fullName, company, department, phone } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required', { code: 'VALIDATION_ERROR' });
    }

    if (!databaseReady) {
      const normalizedEmail = email.toLowerCase();
      const existingUser = memoryStore.users.find((entry) => entry.email.toLowerCase() === normalizedEmail);
      if (existingUser) {
        return sendError(res, 400, 'Email already registered', { code: 'EMAIL_EXISTS' });
      }

      const id = memoryStore.users.length > 0 ? Math.max(...memoryStore.users.map((entry) => entry.id)) + 1 : 1;
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = buildMemoryUser({
        id,
        email: normalizedEmail,
        passwordHash: hashedPassword,
        fullName: fullName || null,
        company: company || null,
        department: department || null,
        phone: phone || null,
        role: 'employee'
      });
      memoryStore.users.push(user);

      const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
      return res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          company: user.company,
          department: user.department,
          phone: user.phone,
          role: user.role,
          created_at: user.created_at
        },
        token
      });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return sendError(res, 400, 'Email already registered', { code: 'EMAIL_EXISTS' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, company, phone, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING id, email, full_name, company, phone, created_at`,
      [email, hashedPassword, fullName || null, company || null, phone || null]
    );

    const user = result.rows[0];

    const roleResult = await pool.query('SELECT id FROM roles WHERE name = $1 LIMIT 1', ['employee']);
    if (roleResult.rows.length > 0) {
      await pool.query(
        `INSERT INTO user_roles (user_id, role_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, role_id) DO NOTHING`,
        [user.id, roleResult.rows[0].id]
      );
    }

    const role = await getUserRole(user.id);
    const token = jwt.sign({ userId: user.id, email: user.email, role }, JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        ...user,
        department: department || null,
        role
      },
      token
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({
      error: 'Registration failed',
      code: 'REGISTRATION_FAILED',
      details: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  }
}

async function loginHandler(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required', { code: 'VALIDATION_ERROR' });
    }

    if (!databaseReady) {
      const normalizedEmail = email.toLowerCase();
      const user = memoryStore.users.find((entry) => entry.email.toLowerCase() === normalizedEmail);

      if (!user) {
        return sendError(res, 401, 'Invalid email or password', { code: 'INVALID_CREDENTIALS' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash || '');
      if (!isPasswordValid) {
        return sendError(res, 401, 'Invalid email or password', { code: 'INVALID_CREDENTIALS' });
      }

      user.last_login = new Date().toISOString();
      const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

      return res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          company: user.company,
          department: user.department,
          phone: user.phone,
          role: user.role,
          last_login: user.last_login
        },
        token
      });
    }

    const result = await pool.query(
      `SELECT id, email, full_name, company, phone, created_at, last_login,
              COALESCE(password_hash, to_jsonb(users)->>'password') AS password_value
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return sendError(res, 401, 'Invalid email or password', { code: 'INVALID_CREDENTIALS' });
    }

    const user = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password_value || '');
    if (!isPasswordValid) {
      return sendError(res, 401, 'Invalid email or password', { code: 'INVALID_CREDENTIALS' });
    }

    await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    const role = await getUserRole(user.id);
    const token = jwt.sign({ userId: user.id, email: user.email, role }, JWT_SECRET, { expiresIn: '24h' });

    await logAuditAction(user.id, 'login', 'auth', user.id, {
      email: user.email,
      role,
      source: 'api'
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        company: user.company,
        department: null,
        phone: user.phone,
        role,
        last_login: new Date().toISOString()
      },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      error: 'Login failed',
      code: 'LOGIN_FAILED',
      details: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  }
}

async function forgotPasswordHandler(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 400, 'Email is required', { code: 'VALIDATION_ERROR' });
    }

    if (!databaseReady) {
      const normalizedEmail = email.toLowerCase();
      const user = memoryStore.users.find((entry) => entry.email.toLowerCase() === normalizedEmail);
      if (!user) {
        return sendError(res, 404, 'User not found', { code: 'USER_NOT_FOUND' });
      }

      const resetToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });
      return res.json({
        message: 'Password reset token generated',
        resetToken,
        note: 'In production, this should be sent via email'
      });
    }

    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return sendError(res, 404, 'User not found', { code: 'USER_NOT_FOUND' });
    }

    const resetToken = jwt.sign({ userId: result.rows[0].id }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: 'Password reset token generated',
      resetToken,
      note: 'In production, this should be sent via email'
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({
      error: 'Request failed',
      code: 'FORGOT_PASSWORD_FAILED',
      details: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  }
}

async function resetPasswordHandler(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return sendError(res, 400, 'Token and new password are required', { code: 'VALIDATION_ERROR' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (!databaseReady) {
      const user = memoryStore.users.find((entry) => entry.id === decoded.userId);
      if (!user) {
        return sendError(res, 404, 'User not found', { code: 'USER_NOT_FOUND' });
      }
      user.password_hash = hashedPassword;
      return res.json({ message: 'Password reset successfully' });
    }

    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [hashedPassword, decoded.userId]
    );

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({
      error: 'Password reset failed',
      code: 'RESET_PASSWORD_FAILED',
      details: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  }
}

// User Registration
app.post('/api/register', registerHandler);
app.post('/api/auth/register', registerHandler);

// User Login
app.post('/api/login', loginHandler);
app.post('/api/auth/login', loginHandler);

// Forgot Password - Generate Reset Token
app.post('/api/forgot-password', forgotPasswordHandler);
app.post('/api/auth/forgot-password', forgotPasswordHandler);

// Reset Password
app.post('/api/reset-password', resetPasswordHandler);
app.post('/api/auth/reset-password', resetPasswordHandler);

// ===== EHS DATA ROUTES =====

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return sendError(res, 401, 'Unauthorized - no token provided', { code: 'TOKEN_MISSING' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role;
    next();
  } catch (err) {
    return sendError(res, 401, 'Invalid or expired token', { code: 'TOKEN_INVALID' });
  }
};

const requireRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const role = req.userRole || (await getUserRole(req.userId));
      if (!allowedRoles.includes(role)) {
        return res.status(403).json({ error: 'Forbidden - insufficient permissions' });
      }

      req.userRole = role;
      next();
    } catch (err) {
      console.error('Role authorization error:', err);
      res.status(500).json({ error: 'Authorization check failed' });
    }
  };
};

app.get('/api/admin/summary', verifyToken, requireRoles('admin'), async (req, res) => {
  try {
    const [userResult, roleResult, incidentResult, complianceResult, certificateResult] = await Promise.all([
      pool.query('SELECT COUNT(*)::INT AS total_users FROM users'),
      pool.query('SELECT COUNT(*)::INT AS total_roles FROM roles'),
      pool.query('SELECT COUNT(*)::INT AS total_incidents, COUNT(*) FILTER (WHERE status != \'closed\')::INT AS open_incidents FROM incidents'),
      pool.query('SELECT COUNT(*) FILTER (WHERE status = \'pending\')::INT AS pending_compliance FROM compliance_records'),
      pool.query(`
        SELECT COUNT(*)::INT AS expiring_certificates
        FROM certifications
        WHERE status = 'active'
          AND (expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '30 days')
      `)
    ]);

    const data = {
      total_users: Number(userResult.rows[0]?.total_users || 0),
      total_roles: Number(roleResult.rows[0]?.total_roles || 0),
      total_incidents: Number(incidentResult.rows[0]?.total_incidents || 0),
      open_incidents: Number(incidentResult.rows[0]?.open_incidents || 0),
      pending_compliance: Number(complianceResult.rows[0]?.pending_compliance || 0),
      expiring_certificates: Number(certificateResult.rows[0]?.expiring_certificates || 0)
    };

    res.json({ message: 'Admin summary loaded successfully', data });
  } catch (err) {
    console.error('Error loading admin summary:', err);
    res.status(500).json({ error: 'Failed to load admin summary' });
  }
});

app.get('/api/admin/settings', verifyToken, requireRoles('admin'), async (req, res) => {
  try {
    if (!databaseReady) {
      return res.json({
        message: 'Admin settings loaded successfully',
        data: {
          incident_escalation_threshold: 75,
          compliance_target: 95,
          session_timeout_minutes: 60,
          require_mfa: false,
          email_alerts_enabled: true,
          in_app_alerts_enabled: true
        }
      });
    }

    const result = await pool.query(
      `SELECT setting_value FROM system_settings WHERE setting_key = 'ehs_defaults' LIMIT 1`
    );

    const data = result.rows[0]?.setting_value || {
      incident_escalation_threshold: 75,
      compliance_target: 95,
      session_timeout_minutes: 60,
      require_mfa: false,
      email_alerts_enabled: true,
      in_app_alerts_enabled: true
    };

    res.json({ message: 'Admin settings loaded successfully', data });
  } catch (err) {
    console.error('Error loading admin settings:', err);
    res.status(500).json({ error: 'Failed to load admin settings' });
  }
});

app.put('/api/admin/settings', verifyToken, requireRoles('admin'), async (req, res) => {
  try {
    const allowedKeys = new Set([
      'incident_escalation_threshold',
      'compliance_target',
      'session_timeout_minutes',
      'require_mfa',
      'email_alerts_enabled',
      'in_app_alerts_enabled'
    ]);

    const updates = Object.fromEntries(
      Object.entries(req.body || {}).filter(([key, value]) => allowedKeys.has(key) && value !== undefined)
    );

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'At least one valid setting must be supplied' });
    }

    let currentSettings = {
      incident_escalation_threshold: 75,
      compliance_target: 95,
      session_timeout_minutes: 60,
      require_mfa: false,
      email_alerts_enabled: true,
      in_app_alerts_enabled: true
    };

    if (databaseReady) {
      const result = await pool.query(
        `SELECT setting_value FROM system_settings WHERE setting_key = 'ehs_defaults' LIMIT 1`
      );
      currentSettings = { ...currentSettings, ...(result.rows[0]?.setting_value || {}) };
    }

    const mergedSettings = { ...currentSettings, ...updates };

    if (databaseReady) {
      await pool.query(
        `INSERT INTO system_settings (setting_key, setting_value, description, updated_by, updated_at)
         VALUES ('ehs_defaults', $1::jsonb, 'Core EHS admin defaults', $2, CURRENT_TIMESTAMP)
         ON CONFLICT (setting_key) DO UPDATE SET
           setting_value = EXCLUDED.setting_value,
           updated_by = EXCLUDED.updated_by,
           updated_at = CURRENT_TIMESTAMP`,
        [JSON.stringify(mergedSettings), req.userId]
      );
    }

    await logAuditAction(req.userId, 'update_settings', 'system_settings', null, { updates });

    res.json({ message: 'Admin settings updated successfully', data: mergedSettings });
  } catch (err) {
    console.error('Error updating admin settings:', err);
    res.status(500).json({ error: 'Failed to update admin settings' });
  }
});

app.get('/api/admin/audit-log', verifyToken, requireRoles('admin'), async (req, res) => {
  try {
    if (!databaseReady) {
      return res.json({
        message: 'Audit log loaded successfully',
        data: memoryStore.auditLogs.slice(0, 25)
      });
    }

    const result = await pool.query(`
      SELECT al.*, u.full_name AS actor_name
      FROM audit_logs al
      LEFT JOIN users u ON u.id = al.user_id
      ORDER BY al.timestamp DESC
      LIMIT 25
    `);

    res.json({ message: 'Audit log loaded successfully', data: result.rows });
  } catch (err) {
    console.error('Error loading admin audit log:', err);
    res.status(500).json({ error: 'Failed to load audit log' });
  }
});

app.get('/api/admin/users', verifyToken, requireRoles('admin'), async (req, res) => {
  try {
    if (!databaseReady) {
      return res.json({
        message: 'Users loaded successfully',
        data: memoryStore.users.map((user) => ({
          id: user.id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          status: user.status
        }))
      });
    }

    const result = await pool.query(`
      SELECT u.id, u.email, u.full_name, u.status, COALESCE(r.name, 'viewer') AS role
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      LEFT JOIN roles r ON r.id = ur.role_id
      ORDER BY u.id ASC
    `);

    const rows = result.rows.map((row) => ({
      id: row.id,
      email: row.email,
      full_name: row.full_name,
      role: row.role,
      status: row.status
    }));

    res.json({ message: 'Users loaded successfully', data: rows });
  } catch (err) {
    console.error('Error loading users:', err);
    res.status(500).json({ error: 'Failed to load users' });
  }
});

// Get user's EHS records
app.get('/api/ehs-records', verifyToken, async (req, res) => {
  try {
    if (!databaseReady) {
      return res.json(memoryStore.ehsRecords.filter((record) => record.user_id === req.userId));
    }

    const result = await pool.query(
      'SELECT * FROM ehs_records WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching records:', err);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// Create EHS record
app.post('/api/ehs-records', verifyToken, async (req, res) => {
  try {
    const { recordType, title, description, severity, status, dueDate } = req.body;

    if (!databaseReady) {
      const nextId = memoryStore.ehsRecords.length ? Math.max(...memoryStore.ehsRecords.map((record) => record.id)) + 1 : 1;
      const record = {
        id: nextId,
        user_id: req.userId,
        record_type: recordType,
        title,
        description,
        severity,
        status,
        due_date: dueDate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      memoryStore.ehsRecords.push(record);
      return res.status(201).json(record);
    }

    const result = await pool.query(
      'INSERT INTO ehs_records (user_id, record_type, title, description, severity, status, due_date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.userId, recordType, title, description, severity, status, dueDate]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating record:', err);
    res.status(500).json({ error: 'Failed to create record' });
  }
});

// Update EHS record
app.put('/api/ehs-records/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { recordType, title, description, severity, status, dueDate } = req.body;

    if (!databaseReady) {
      const record = memoryStore.ehsRecords.find((entry) => String(entry.id) === String(id) && entry.user_id === req.userId);
      if (!record) {
        return res.status(404).json({ error: 'Record not found' });
      }
      Object.assign(record, {
        record_type: recordType ?? record.record_type,
        title: title ?? record.title,
        description: description ?? record.description,
        severity: severity ?? record.severity,
        status: status ?? record.status,
        due_date: dueDate ?? record.due_date,
        updated_at: new Date().toISOString()
      });
      return res.json(record);
    }

    const result = await pool.query(
      'UPDATE ehs_records SET record_type = $1, title = $2, description = $3, severity = $4, status = $5, due_date = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 AND user_id = $8 RETURNING *',
      [recordType, title, description, severity, status, dueDate, id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating record:', err);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

// Delete EHS record
app.delete('/api/ehs-records/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!databaseReady) {
      const index = memoryStore.ehsRecords.findIndex((entry) => String(entry.id) === String(id) && entry.user_id === req.userId);
      if (index === -1) {
        return res.status(404).json({ error: 'Record not found' });
      }
      memoryStore.ehsRecords.splice(index, 1);
      return res.json({ message: 'Record deleted successfully' });
    }

    const result = await pool.query(
      'DELETE FROM ehs_records WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    console.error('Error deleting record:', err);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

// Get user profile
app.get('/api/user/profile', verifyToken, async (req, res) => {
  try {
    if (!databaseReady) {
      const user = memoryStore.users.find((entry) => entry.id === req.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        company: user.company,
        department: user.department,
        phone: user.phone,
        created_at: user.created_at,
        last_login: user.last_login,
        role: user.role
      });
    }

    const result = await pool.query(
      `SELECT id, email, full_name, company, phone, avatar_url, created_at, last_login,
              to_jsonb(users)->>'department' AS department
       FROM users
       WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const role = await getUserRole(req.userId);
    res.json({
      ...result.rows[0],
      role
    });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.get('/api/auth/profile', verifyToken, async (req, res) => {
  try {
    if (!databaseReady) {
      const user = memoryStore.users.find((entry) => entry.id === req.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json({
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        company: user.company,
        department: user.department,
        phone: user.phone,
        created_at: user.created_at,
        last_login: user.last_login,
        role: user.role
      });
    }

    const result = await pool.query(
      `SELECT id, email, full_name, company, phone, avatar_url, created_at, last_login,
              to_jsonb(users)->>'department' AS department
       FROM users
       WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const role = await getUserRole(req.userId);
    res.json({
      ...result.rows[0],
      role
    });
  } catch (err) {
    console.error('Error fetching auth profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ===== EMPLOYEE MODULE ROUTES =====

app.get('/api/employees', verifyToken, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const offset = (page - 1) * limit;

    if (!databaseReady) {
      let rows = [...memoryStore.employees];

      if (req.query.status) {
        rows = rows.filter((row) => row.status === req.query.status);
      }

      if (req.query.department_id) {
        rows = rows.filter((row) => String(row.department_id) === String(req.query.department_id));
      }

      if (req.query.manager_id) {
        rows = rows.filter((row) => String(row.manager_id) === String(req.query.manager_id));
      }

      if (req.query.q) {
        const q = String(req.query.q).toLowerCase();
        rows = rows.filter((row) => {
          const haystack = [row.first_name, row.last_name, row.email, row.job_title, row.department_name].filter(Boolean).join(' ').toLowerCase();
          return haystack.includes(q);
        });
      }

      const total = rows.length;
      const pagedRows = rows.slice(offset, offset + limit);
      return res.json({
        data: pagedRows,
        pagination: {
          total,
          page,
          limit,
          pages: Math.max(Math.ceil(total / limit), 1)
        }
      });
    }

    const allowedSortFields = new Set(['id', 'first_name', 'last_name', 'email', 'status', 'hire_date', 'created_at', 'compliance_score']);
    const sort = allowedSortFields.has(req.query.sort) ? req.query.sort : 'created_at';
    const order = String(req.query.order || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const filters = [];
    const params = [];

    if (req.query.status) {
      params.push(req.query.status);
      filters.push(`e.status = $${params.length}`);
    }

    if (req.query.department_id) {
      params.push(parseInt(req.query.department_id, 10));
      filters.push(`e.department_id = $${params.length}`);
    }

    if (req.query.manager_id) {
      params.push(parseInt(req.query.manager_id, 10));
      filters.push(`e.manager_id = $${params.length}`);
    }

    if (req.query.q) {
      params.push(`%${req.query.q}%`);
      filters.push(`(
        e.first_name ILIKE $${params.length}
        OR e.last_name ILIKE $${params.length}
        OR e.email ILIKE $${params.length}
        OR COALESCE(e.job_title, '') ILIKE $${params.length}
      )`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*)::INT AS total FROM employees e ${whereClause}`;
    const countResult = await pool.query(countSql, params);
    const total = countResult.rows[0]?.total || 0;

    const dataSql = `
      SELECT
        e.id,
        e.user_id,
        e.first_name,
        e.last_name,
        e.email,
        e.phone,
        e.department_id,
        d.name AS department_name,
        e.job_title,
        e.manager_id,
        CASE WHEN m.id IS NULL THEN NULL ELSE CONCAT(m.first_name, ' ', m.last_name) END AS manager_name,
        e.hire_date,
        e.date_of_birth,
        e.status,
        e.skills,
        e.certifications,
        e.compliance_score,
        e.created_at,
        e.updated_at
      FROM employees e
      LEFT JOIN departments d ON d.id = e.department_id
      LEFT JOIN employees m ON m.id = e.manager_id
      ${whereClause}
      ORDER BY e.${sort} ${order}
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `;

    const dataResult = await pool.query(dataSql, [...params, limit, offset]);

    res.json({
      data: dataResult.rows,
      pagination: {
        total,
        page,
        limit,
        pages: Math.max(Math.ceil(total / limit), 1)
      }
    });
  } catch (err) {
    console.error('Error listing employees:', err);
    res.status(500).json({ error: 'Failed to list employees' });
  }
});

app.get('/api/employees/search', verifyToken, async (req, res) => {
  try {
    if (!databaseReady) {
      const q = String(req.query.q || '').trim();
      if (!q) {
        return res.status(400).json({ error: 'Search query q is required' });
      }

      const rows = memoryStore.employees.filter((row) => {
        const haystack = [row.first_name, row.last_name, row.email, row.job_title, row.department_name].filter(Boolean).join(' ').toLowerCase();
        return haystack.includes(q.toLowerCase());
      }).slice(0, 50);
      return res.json({ data: rows });
    }

    const q = String(req.query.q || '').trim();
    if (!q) {
      return res.status(400).json({ error: 'Search query q is required' });
    }

    const search = `%${q}%`;
    const result = await pool.query(
      `SELECT
         e.id,
         e.first_name,
         e.last_name,
         e.email,
         e.job_title,
         e.status,
         d.name AS department_name
       FROM employees e
       LEFT JOIN departments d ON d.id = e.department_id
       WHERE e.first_name ILIKE $1
          OR e.last_name ILIKE $1
          OR e.email ILIKE $1
          OR COALESCE(e.job_title, '') ILIKE $1
       ORDER BY e.first_name ASC, e.last_name ASC
       LIMIT 50`,
      [search]
    );

    res.json({ data: result.rows });
  } catch (err) {
    console.error('Error searching employees:', err);
    res.status(500).json({ error: 'Failed to search employees' });
  }
});

app.get('/api/employees/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return sendError(res, 400, 'Invalid employee id', { code: 'INVALID_EMPLOYEE_ID' });
    }

    if (!databaseReady) {
      const employee = memoryStore.employees.find((row) => row.id === id);
      if (!employee) {
        return sendError(res, 404, 'Employee not found', { code: 'EMPLOYEE_NOT_FOUND' });
      }
      return res.json(employee);
    }

    const result = await pool.query(
      `SELECT
         e.id,
         e.user_id,
         e.first_name,
         e.last_name,
         e.email,
         e.phone,
         e.department_id,
         d.name AS department_name,
         e.job_title,
         e.manager_id,
         CASE WHEN m.id IS NULL THEN NULL ELSE CONCAT(m.first_name, ' ', m.last_name) END AS manager_name,
         e.hire_date,
         e.date_of_birth,
         e.status,
         e.skills,
         e.certifications,
         e.compliance_score,
         e.created_at,
         e.updated_at
       FROM employees e
       LEFT JOIN departments d ON d.id = e.department_id
       LEFT JOIN employees m ON m.id = e.manager_id
       WHERE e.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return sendError(res, 404, 'Employee not found', { code: 'EMPLOYEE_NOT_FOUND' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching employee:', err);
    return sendError(res, 500, 'Failed to fetch employee', { details: err.message });
  }
});

app.post('/api/employees', verifyToken, requireRoles('admin', 'manager'), async (req, res) => {
  try {
    const {
      user_id,
      first_name,
      last_name,
      email,
      phone,
      department_id,
      job_title,
      manager_id,
      hire_date,
      date_of_birth,
      status,
      skills,
      certifications,
      compliance_score
    } = req.body;

    if (!first_name || !last_name || !email) {
      return res.status(400).json({ error: 'first_name, last_name and email are required' });
    }

    const allowedStatuses = new Set(['active', 'inactive', 'on_leave', 'terminated']);
    const finalStatus = status || 'active';
    if (!allowedStatuses.has(finalStatus)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    if (!databaseReady) {
      const existing = memoryStore.employees.find((row) => row.email.toLowerCase() === String(email).toLowerCase());
      if (existing) {
        return res.status(409).json({ error: 'Employee email or user_id already exists' });
      }

      const nextId = memoryStore.employees.length ? Math.max(...memoryStore.employees.map((row) => row.id)) + 1 : 1;
      const department = memoryStore.departments.find((row) => String(row.id) === String(department_id));
      const created = {
        id: nextId,
        user_id: user_id || null,
        first_name,
        last_name,
        email,
        phone: phone || null,
        department_id: department_id || null,
        department_name: department?.name || null,
        job_title: job_title || null,
        manager_id: manager_id || null,
        manager_name: null,
        hire_date: hire_date || null,
        date_of_birth: date_of_birth || null,
        status: finalStatus,
        skills: Array.isArray(skills) ? skills : [],
        certifications: Array.isArray(certifications) ? certifications : [],
        compliance_score: compliance_score ?? 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      memoryStore.employees.push(created);
      return res.status(201).json({ message: 'Employee created successfully', data: created });
    }

    const result = await pool.query(
      `INSERT INTO employees (
         user_id, first_name, last_name, email, phone, department_id,
         job_title, manager_id, hire_date, date_of_birth, status,
         skills, certifications, compliance_score
       ) VALUES (
         $1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10, $11,
         $12::jsonb, $13::jsonb, $14
       )
       RETURNING *`,
      [
        user_id || null,
        first_name,
        last_name,
        email,
        phone || null,
        department_id || null,
        job_title || null,
        manager_id || null,
        hire_date || null,
        date_of_birth || null,
        finalStatus,
        JSON.stringify(Array.isArray(skills) ? skills : []),
        JSON.stringify(Array.isArray(certifications) ? certifications : []),
        compliance_score ?? 0
      ]
    );

    res.status(201).json({ message: 'Employee created successfully', data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Employee email or user_id already exists' });
    }

    console.error('Error creating employee:', err);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

app.put('/api/employees/:id', verifyToken, requireRoles('admin', 'manager'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid employee id' });
    }

    if (!databaseReady) {
      const existing = memoryStore.employees.find((row) => row.id === id);
      if (!existing) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      const {
        first_name,
        last_name,
        email,
        phone,
        department_id,
        job_title,
        manager_id,
        hire_date,
        date_of_birth,
        status,
        skills,
        certifications,
        compliance_score
      } = req.body;

      if (status) {
        const allowedStatuses = new Set(['active', 'inactive', 'on_leave', 'terminated']);
        if (!allowedStatuses.has(status)) {
          return res.status(400).json({ error: 'Invalid status value' });
        }
      }

      Object.assign(existing, {
        first_name: first_name ?? existing.first_name,
        last_name: last_name ?? existing.last_name,
        email: email ?? existing.email,
        phone: phone ?? existing.phone,
        department_id: department_id ?? existing.department_id,
        department_name: memoryStore.departments.find((row) => String(row.id) === String(department_id ?? existing.department_id))?.name || existing.department_name,
        job_title: job_title ?? existing.job_title,
        manager_id: manager_id ?? existing.manager_id,
        manager_name: existing.manager_name,
        hire_date: hire_date ?? existing.hire_date,
        date_of_birth: date_of_birth ?? existing.date_of_birth,
        status: status ?? existing.status,
        skills: Array.isArray(skills) ? skills : existing.skills,
        certifications: Array.isArray(certifications) ? certifications : existing.certifications,
        compliance_score: compliance_score ?? existing.compliance_score,
        updated_at: new Date().toISOString()
      });
      return res.json({ message: 'Employee updated successfully', data: existing });
    }

    const {
      first_name,
      last_name,
      email,
      phone,
      department_id,
      job_title,
      manager_id,
      hire_date,
      date_of_birth,
      status,
      skills,
      certifications,
      compliance_score
    } = req.body;

    const existing = await pool.query('SELECT id FROM employees WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    if (status) {
      const allowedStatuses = new Set(['active', 'inactive', 'on_leave', 'terminated']);
      if (!allowedStatuses.has(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
    }

    const result = await pool.query(
      `UPDATE employees
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           email = COALESCE($3, email),
           phone = COALESCE($4, phone),
           department_id = COALESCE($5, department_id),
           job_title = COALESCE($6, job_title),
           manager_id = COALESCE($7, manager_id),
           hire_date = COALESCE($8, hire_date),
           date_of_birth = COALESCE($9, date_of_birth),
           status = COALESCE($10, status),
           skills = COALESCE($11::jsonb, skills),
           certifications = COALESCE($12::jsonb, certifications),
           compliance_score = COALESCE($13, compliance_score),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $14
       RETURNING *`,
      [
        first_name ?? null,
        last_name ?? null,
        email ?? null,
        phone ?? null,
        department_id ?? null,
        job_title ?? null,
        manager_id ?? null,
        hire_date ?? null,
        date_of_birth ?? null,
        status ?? null,
        Array.isArray(skills) ? JSON.stringify(skills) : null,
        Array.isArray(certifications) ? JSON.stringify(certifications) : null,
        compliance_score ?? null,
        id
      ]
    );

    res.json({ message: 'Employee updated successfully', data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Employee email already exists' });
    }

    console.error('Error updating employee:', err);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

app.delete('/api/employees/:id', verifyToken, requireRoles('admin', 'manager'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid employee id' });
    }

    if (!databaseReady) {
      const index = memoryStore.employees.findIndex((row) => row.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Employee not found' });
      }

      memoryStore.employees[index].status = 'inactive';
      memoryStore.employees[index].updated_at = new Date().toISOString();
      return res.json({ message: 'Employee deactivated successfully', data: memoryStore.employees[index] });
    }

    const result = await pool.query(
      `UPDATE employees
       SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, status, updated_at`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    res.json({ message: 'Employee deactivated successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error deactivating employee:', err);
    res.status(500).json({ error: 'Failed to deactivate employee' });
  }
});

// ===== DEPARTMENT MODULE ROUTES =====

app.get('/api/departments', verifyToken, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const offset = (page - 1) * limit;
    const q = String(req.query.q || '').trim();

    if (!databaseReady) {
      let rows = memoryStore.departments.map((department) => {
        const employeeCount = memoryStore.employees.filter((employee) => String(employee.department_id) === String(department.id)).length;
        return {
          ...department,
          manager_name: memoryStore.users.find((user) => user.id === department.manager_id)?.full_name || null,
          employee_count: employeeCount
        };
      });

      if (q) {
        const search = q.toLowerCase();
        rows = rows.filter((department) => [department.name, department.description].join(' ').toLowerCase().includes(search));
      }

      const total = rows.length;
      const pagedRows = rows.slice(offset, offset + limit);
      return res.json({
        data: pagedRows,
        pagination: {
          total,
          page,
          limit,
          pages: Math.max(Math.ceil(total / limit), 1)
        }
      });
    }

    const params = [];
    let whereClause = '';
    if (q) {
      params.push(`%${q}%`);
      whereClause = `WHERE d.name ILIKE $1 OR COALESCE(d.description, '') ILIKE $1`;
    }

    const countSql = `SELECT COUNT(*)::INT AS total FROM departments d ${whereClause}`;
    const countResult = await pool.query(countSql, params);
    const total = countResult.rows[0]?.total || 0;

    const dataSql = `
      SELECT
        d.id,
        d.name,
        d.description,
        d.manager_id,
        d.budget,
        d.parent_department_id,
        d.created_at,
        d.updated_at,
        u.full_name AS manager_name,
        COUNT(e.id)::INT AS employee_count
      FROM departments d
      LEFT JOIN users u ON u.id = d.manager_id
      LEFT JOIN employees e ON e.department_id = d.id
      ${whereClause}
      GROUP BY d.id, u.full_name
      ORDER BY d.name ASC
      LIMIT $${params.length + 1}
      OFFSET $${params.length + 2}
    `;

    const dataResult = await pool.query(dataSql, [...params, limit, offset]);

    res.json({
      data: dataResult.rows,
      pagination: {
        total,
        page,
        limit,
        pages: Math.max(Math.ceil(total / limit), 1)
      }
    });
  } catch (err) {
    console.error('Error listing departments:', err);
    res.status(500).json({ error: 'Failed to list departments' });
  }
});

app.get('/api/departments/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid department id' });
    }

    if (!databaseReady) {
      const department = memoryStore.departments.find((row) => row.id === id);
      if (!department) {
        return res.status(404).json({ error: 'Department not found' });
      }
      return res.json({
        ...department,
        manager_name: memoryStore.users.find((user) => user.id === department.manager_id)?.full_name || null,
        employee_count: memoryStore.employees.filter((employee) => String(employee.department_id) === String(id)).length
      });
    }

    const result = await pool.query(
      `SELECT
         d.id,
         d.name,
         d.description,
         d.manager_id,
         d.budget,
         d.parent_department_id,
         d.created_at,
         d.updated_at,
         u.full_name AS manager_name,
         COUNT(e.id)::INT AS employee_count
       FROM departments d
       LEFT JOIN users u ON u.id = d.manager_id
       LEFT JOIN employees e ON e.department_id = d.id
       WHERE d.id = $1
       GROUP BY d.id, u.full_name`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching department:', err);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

app.post('/api/departments', verifyToken, requireRoles('admin', 'manager'), async (req, res) => {
  try {
    const { name, description, manager_id, budget, parent_department_id } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'name is required' });
    }

    if (!databaseReady) {
      const nextId = memoryStore.departments.length ? Math.max(...memoryStore.departments.map((row) => row.id)) + 1 : 1;
      const created = {
        id: nextId,
        name: String(name).trim(),
        description: description || null,
        manager_id: manager_id || null,
        budget: budget ?? null,
        parent_department_id: parent_department_id || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      memoryStore.departments.push(created);
      return res.status(201).json({ message: 'Department created successfully', data: created });
    }

    const result = await pool.query(
      `INSERT INTO departments (name, description, manager_id, budget, parent_department_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        String(name).trim(),
        description || null,
        manager_id || null,
        budget ?? null,
        parent_department_id || null
      ]
    );

    res.status(201).json({ message: 'Department created successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error creating department:', err);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

app.put('/api/departments/:id', verifyToken, requireRoles('admin', 'manager'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid department id' });
    }

    if (!databaseReady) {
      const department = memoryStore.departments.find((row) => row.id === id);
      if (!department) {
        return res.status(404).json({ error: 'Department not found' });
      }
      Object.assign(department, {
        name: req.body.name ?? department.name,
        description: req.body.description ?? department.description,
        manager_id: req.body.manager_id ?? department.manager_id,
        budget: req.body.budget ?? department.budget,
        parent_department_id: req.body.parent_department_id ?? department.parent_department_id,
        updated_at: new Date().toISOString()
      });
      return res.json({ message: 'Department updated successfully', data: department });
    }

    const { name, description, manager_id, budget, parent_department_id } = req.body;

    const existing = await pool.query('SELECT id FROM departments WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const result = await pool.query(
      `UPDATE departments
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           manager_id = COALESCE($3, manager_id),
           budget = COALESCE($4, budget),
           parent_department_id = COALESCE($5, parent_department_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [
        name ?? null,
        description ?? null,
        manager_id ?? null,
        budget ?? null,
        parent_department_id ?? null,
        id
      ]
    );

    res.json({ message: 'Department updated successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error updating department:', err);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

app.delete('/api/departments/:id', verifyToken, requireRoles('admin'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid department id' });
    }

    if (!databaseReady) {
      const employeeCount = memoryStore.employees.filter((employee) => String(employee.department_id) === String(id)).length;
      if (employeeCount > 0) {
        return res.status(409).json({ error: 'Cannot delete department with assigned employees' });
      }
      const index = memoryStore.departments.findIndex((row) => row.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Department not found' });
      }
      const [deleted] = memoryStore.departments.splice(index, 1);
      return res.json({ message: 'Department deleted successfully', data: deleted });
    }

    const employeeCountResult = await pool.query('SELECT COUNT(*)::INT AS count FROM employees WHERE department_id = $1', [id]);
    if ((employeeCountResult.rows[0]?.count || 0) > 0) {
      return res.status(409).json({ error: 'Cannot delete department with assigned employees' });
    }

    const result = await pool.query('DELETE FROM departments WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json({ message: 'Department deleted successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error deleting department:', err);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

// ===== PERMIT / PTW / SSRA MODULE ROUTES =====

app.get('/api/permits', verifyToken, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const offset = (page - 1) * limit;

    if (!databaseReady) {
      let rows = [...memoryStore.permits];

      if (req.query.status) {
        rows = rows.filter((row) => row.status === req.query.status);
      }

      if (req.query.permit_type) {
        rows = rows.filter((row) => row.permit_type === req.query.permit_type);
      }

      if (req.query.q) {
        const q = String(req.query.q).toLowerCase();
        rows = rows.filter((row) => {
          const haystack = [row.title, row.site, row.location, row.description].filter(Boolean).join(' ').toLowerCase();
          return haystack.includes(q);
        });
      }

      const total = rows.length;
      return res.json({
        data: rows.slice(offset, offset + limit),
        pagination: {
          total,
          page,
          limit,
          pages: Math.max(Math.ceil(total / limit), 1)
        }
      });
    }

    const params = [];
    const filters = [];

    if (req.query.status) {
      params.push(req.query.status);
      filters.push(`status = $${params.length}`);
    }

    if (req.query.permit_type) {
      params.push(req.query.permit_type);
      filters.push(`permit_type = $${params.length}`);
    }

    if (req.query.q) {
      params.push(`%${req.query.q}%`);
      filters.push(`(
        title ILIKE $${params.length}
        OR COALESCE(site, '') ILIKE $${params.length}
        OR COALESCE(location, '') ILIKE $${params.length}
        OR COALESCE(description, '') ILIKE $${params.length}
      )`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const countResult = await pool.query(`SELECT COUNT(*)::INT AS total FROM permit_records ${whereClause}`, params);
    const total = countResult.rows[0]?.total || 0;

    const dataResult = await pool.query(
      `SELECT
         p.id,
         p.permit_type,
         p.title,
         p.description,
         p.site,
         p.location,
         p.submitted_by,
         CONCAT(e.first_name, ' ', e.last_name) AS submitted_by_name,
         p.approver_id,
         CONCAT(a.first_name, ' ', a.last_name) AS approver_name,
         p.status,
         p.risk_level,
         p.approval_notes,
         p.effective_from,
         p.effective_to,
         p.created_at,
         p.updated_at
       FROM permit_records p
       LEFT JOIN employees e ON e.id = p.submitted_by
       LEFT JOIN employees a ON a.id = p.approver_id
       ${whereClause}
       ORDER BY p.created_at DESC
       LIMIT $${params.length + 1}
       OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({
      data: dataResult.rows,
      pagination: {
        total,
        page,
        limit,
        pages: Math.max(Math.ceil(total / limit), 1)
      }
    });
  } catch (err) {
    console.error('Error listing permits:', err);
    res.status(500).json({ error: 'Failed to list permits' });
  }
});

app.get('/api/permits/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid permit id' });
    }

    if (!databaseReady) {
      const permit = memoryStore.permits.find((entry) => entry.id === id);
      if (!permit) {
        return res.status(404).json({ error: 'Permit not found' });
      }
      return res.json(permit);
    }

    const result = await pool.query(
      `SELECT
         p.id,
         p.permit_type,
         p.title,
         p.description,
         p.site,
         p.location,
         p.submitted_by,
         CONCAT(e.first_name, ' ', e.last_name) AS submitted_by_name,
         p.approver_id,
         CONCAT(a.first_name, ' ', a.last_name) AS approver_name,
         p.status,
         p.risk_level,
         p.approval_notes,
         p.effective_from,
         p.effective_to,
         p.created_at,
         p.updated_at
       FROM permit_records p
       LEFT JOIN employees e ON e.id = p.submitted_by
       LEFT JOIN employees a ON a.id = p.approver_id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching permit:', err);
    res.status(500).json({ error: 'Failed to fetch permit' });
  }
});

app.post('/api/permits', verifyToken, requireRoles('admin', 'manager', 'employee'), async (req, res) => {
  try {
    const {
      permit_type,
      title,
      description,
      site,
      location,
      submitted_by,
      approver_id,
      status,
      risk_level,
      approval_notes,
      effective_from,
      effective_to
    } = req.body;

    if (!permit_type || !title) {
      return res.status(400).json({ error: 'permit_type and title are required' });
    }

    const allowedTypes = new Set(['hot_work', 'confined_space', 'lifting', 'electrical', 'general', 'ssra']);
    if (!allowedTypes.has(permit_type)) {
      return res.status(400).json({ error: 'Invalid permit_type value' });
    }

    const finalStatus = status || 'draft';
    const allowedStatuses = new Set(['draft', 'submitted', 'pending_review', 'approved', 'rejected', 'expired']);
    if (!allowedStatuses.has(finalStatus)) {
      return res.status(400).json({ error: 'Invalid permit status' });
    }

    if (!databaseReady) {
      const nextId = memoryStore.permits.length ? Math.max(...memoryStore.permits.map((entry) => entry.id)) + 1 : 1;
      const permit = {
        id: nextId,
        permit_type,
        title,
        description: description || null,
        site: site || null,
        location: location || null,
        submitted_by: submitted_by || req.userId || null,
        approver_id: approver_id || null,
        approver_name: null,
        status: finalStatus,
        risk_level: risk_level || 'medium',
        approval_notes: approval_notes || null,
        effective_from: effective_from || null,
        effective_to: effective_to || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      memoryStore.permits.push(permit);
      return res.status(201).json({ message: 'Permit created successfully', data: permit });
    }

    const result = await pool.query(
      `INSERT INTO permit_records (
         permit_type, title, description, site, location, submitted_by, approver_id,
         status, risk_level, approval_notes, effective_from, effective_to
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        permit_type,
        title,
        description || null,
        site || null,
        location || null,
        submitted_by || req.userId || null,
        approver_id || null,
        finalStatus,
        risk_level || 'medium',
        approval_notes || null,
        effective_from || null,
        effective_to || null
      ]
    );

    res.status(201).json({ message: 'Permit created successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error creating permit:', err);
    res.status(500).json({ error: 'Failed to create permit' });
  }
});

app.put('/api/permits/:id', verifyToken, requireRoles('admin', 'manager', 'employee'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid permit id' });
    }

    const allowedFields = [
      'permit_type',
      'title',
      'description',
      'site',
      'location',
      'approved_by',
      'approver_id',
      'status',
      'risk_level',
      'approval_notes',
      'effective_from',
      'effective_to'
    ];

    const updateFields = {};
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updateFields[key] = req.body[key];
      }
    }

    if (!Object.keys(updateFields).length) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    if (updateFields.permit_type) {
      const allowedTypes = new Set(['hot_work', 'confined_space', 'lifting', 'electrical', 'general', 'ssra']);
      if (!allowedTypes.has(updateFields.permit_type)) {
        return res.status(400).json({ error: 'Invalid permit_type value' });
      }
    }

    if (updateFields.status) {
      const allowedStatuses = new Set(['draft', 'submitted', 'pending_review', 'approved', 'rejected', 'expired']);
      if (!allowedStatuses.has(updateFields.status)) {
        return res.status(400).json({ error: 'Invalid permit status' });
      }
    }

    if (!databaseReady) {
      const permit = memoryStore.permits.find((entry) => entry.id === id);
      if (!permit) {
        return res.status(404).json({ error: 'Permit not found' });
      }
      Object.assign(permit, updateFields, { updated_at: new Date().toISOString() });
      return res.json({ message: 'Permit updated successfully', data: permit });
    }

    const assignments = [];
    const values = [];

    for (const [key, value] of Object.entries(updateFields)) {
      assignments.push(`${key} = $${values.length + 1}`);
      values.push(value === null ? null : value);
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE permit_records
       SET ${assignments.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    res.json({ message: 'Permit updated successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error updating permit:', err);
    res.status(500).json({ error: 'Failed to update permit' });
  }
});

app.post('/api/permits/:id/approve', verifyToken, requireRoles('admin', 'manager'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid permit id' });
    }

    const approvalNotes = req.body.approval_notes || req.body.notes || null;
    const approverId = req.body.approver_id || req.userId || null;

    if (!databaseReady) {
      const permit = memoryStore.permits.find((entry) => entry.id === id);
      if (!permit) {
        return res.status(404).json({ error: 'Permit not found' });
      }
      permit.status = 'approved';
      permit.approver_id = approverId;
      permit.approval_notes = approvalNotes;
      permit.updated_at = new Date().toISOString();
      return res.json({ message: 'Permit approved successfully', data: permit });
    }

    const result = await pool.query(
      `UPDATE permit_records
       SET status = 'approved', approver_id = COALESCE($1, approver_id), approval_notes = COALESCE($2, approval_notes), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [approverId, approvalNotes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    res.json({ message: 'Permit approved successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error approving permit:', err);
    res.status(500).json({ error: 'Failed to approve permit' });
  }
});

app.post('/api/permits/:id/reject', verifyToken, requireRoles('admin', 'manager'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid permit id' });
    }

    const approvalNotes = req.body.approval_notes || req.body.notes || 'Rejected by reviewer';
    const approverId = req.body.approver_id || req.userId || null;

    if (!databaseReady) {
      const permit = memoryStore.permits.find((entry) => entry.id === id);
      if (!permit) {
        return res.status(404).json({ error: 'Permit not found' });
      }
      permit.status = 'rejected';
      permit.approver_id = approverId;
      permit.approval_notes = approvalNotes;
      permit.updated_at = new Date().toISOString();
      return res.json({ message: 'Permit rejected successfully', data: permit });
    }

    const result = await pool.query(
      `UPDATE permit_records
       SET status = 'rejected', approver_id = COALESCE($1, approver_id), approval_notes = COALESCE($2, approval_notes), updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [approverId, approvalNotes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Permit not found' });
    }

    res.json({ message: 'Permit rejected successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error rejecting permit:', err);
    res.status(500).json({ error: 'Failed to reject permit' });
  }
});

// ===== INCIDENT MODULE ROUTES =====

app.get('/api/incidents', verifyToken, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const offset = (page - 1) * limit;

    if (!databaseReady) {
      let rows = [...memoryStore.incidents];
      if (req.query.status) rows = rows.filter((row) => row.status === req.query.status);
      if (req.query.severity) rows = rows.filter((row) => row.severity === req.query.severity);
      if (req.query.category) rows = rows.filter((row) => row.category === req.query.category);
      if (req.query.q) {
        const q = String(req.query.q).toLowerCase();
        rows = rows.filter((row) => [row.title, row.description, row.location].join(' ').toLowerCase().includes(q));
      }
      return res.json({
        data: rows.slice(offset, offset + limit),
        pagination: { total: rows.length, page, limit, pages: Math.max(Math.ceil(rows.length / limit), 1) }
      });
    }

    const params = [];
    const filters = [];

    if (req.query.status) {
      params.push(req.query.status);
      filters.push(`status = $${params.length}`);
    }

    if (req.query.severity) {
      params.push(req.query.severity);
      filters.push(`severity = $${params.length}`);
    }

    if (req.query.category) {
      params.push(req.query.category);
      filters.push(`category = $${params.length}`);
    }

    if (req.query.q) {
      params.push(`%${req.query.q}%`);
      filters.push(`(title ILIKE $${params.length} OR COALESCE(description, '') ILIKE $${params.length} OR COALESCE(location, '') ILIKE $${params.length})`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const countResult = await pool.query(`SELECT COUNT(*)::INT AS total FROM incidents ${whereClause}`, params);
    const total = countResult.rows[0]?.total || 0;

    const rowsResult = await pool.query(
      `SELECT * FROM incidents ${whereClause} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({ data: rowsResult.rows, pagination: { total, page, limit, pages: Math.max(Math.ceil(total / limit), 1) } });
  } catch (err) {
    console.error('Error listing incidents:', err);
    res.status(500).json({ error: 'Failed to list incidents' });
  }
});

app.get('/api/incidents/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid incident id' });
    }

    if (!databaseReady) {
      const item = memoryStore.incidents.find((row) => row.id === id);
      if (!item) return res.status(404).json({ error: 'Incident not found' });
      return res.json({ data: item });
    }

    const result = await pool.query('SELECT * FROM incidents WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Incident not found' });
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Error fetching incident:', err);
    res.status(500).json({ error: 'Failed to fetch incident' });
  }
});

app.post('/api/incidents', verifyToken, requireRoles('admin', 'manager', 'employee'), async (req, res) => {
  try {
    const {
      title,
      description,
      category = 'other',
      severity = 'medium',
      location,
      date_occurred,
      status = 'open',
      assigned_to,
      root_cause,
      corrective_actions,
      due_date
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'title and description are required' });
    }

    const allowedCategories = new Set(['safety', 'environmental', 'health', 'security', 'other']);
    const allowedSeverities = new Set(['critical', 'high', 'medium', 'low']);
    const allowedStatuses = new Set(['open', 'investigating', 'resolved', 'closed']);

    if (!allowedCategories.has(category)) return res.status(400).json({ error: 'Invalid incident category' });
    if (!allowedSeverities.has(severity)) return res.status(400).json({ error: 'Invalid incident severity' });
    if (!allowedStatuses.has(status)) return res.status(400).json({ error: 'Invalid incident status' });

    if (!databaseReady) {
      const nextId = memoryStore.incidents.length ? Math.max(...memoryStore.incidents.map((entry) => entry.id)) + 1 : 1;
      const item = {
        id: nextId,
        incident_number: `INC-${nextId.toString().padStart(4, '0')}`,
        title,
        description,
        location: location || null,
        date_occurred: date_occurred || new Date().toISOString(),
        reported_by: req.userId,
        assigned_to: assigned_to || null,
        severity,
        status,
        category,
        root_cause: root_cause || null,
        corrective_actions: Array.isArray(corrective_actions) ? corrective_actions : [],
        due_date: due_date || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        closed_at: null
      };
      memoryStore.incidents.push(item);
      return res.status(201).json({ message: 'Incident created successfully', data: item });
    }

    const result = await pool.query(
      `INSERT INTO incidents (
         incident_number, title, description, location, date_occurred, reported_by,
         assigned_to, severity, status, category, root_cause, corrective_actions, due_date
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        `INC-${Date.now()}`,
        title,
        description,
        location || null,
        date_occurred || new Date().toISOString(),
        req.userId,
        assigned_to || null,
        severity,
        status,
        category,
        root_cause || null,
        JSON.stringify(Array.isArray(corrective_actions) ? corrective_actions : []),
        due_date || null
      ]
    );

    res.status(201).json({ message: 'Incident created successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error creating incident:', err);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

app.put('/api/incidents/:id', verifyToken, requireRoles('admin', 'manager', 'employee'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid incident id' });
    }

    const updateFields = {};
    const allowedFields = ['title', 'description', 'location', 'date_occurred', 'assigned_to', 'severity', 'status', 'category', 'root_cause', 'corrective_actions', 'due_date'];

    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        updateFields[key] = req.body[key];
      }
    }

    if (!Object.keys(updateFields).length) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    if (updateFields.category && !new Set(['safety', 'environmental', 'health', 'security', 'other']).has(updateFields.category)) {
      return res.status(400).json({ error: 'Invalid incident category' });
    }
    if (updateFields.severity && !new Set(['critical', 'high', 'medium', 'low']).has(updateFields.severity)) {
      return res.status(400).json({ error: 'Invalid incident severity' });
    }
    if (updateFields.status && !new Set(['open', 'investigating', 'resolved', 'closed']).has(updateFields.status)) {
      return res.status(400).json({ error: 'Invalid incident status' });
    }

    if (!databaseReady) {
      const item = memoryStore.incidents.find((row) => row.id === id);
      if (!item) return res.status(404).json({ error: 'Incident not found' });
      Object.assign(item, updateFields, { updated_at: new Date().toISOString() });
      return res.json({ message: 'Incident updated successfully', data: item });
    }

    const assignments = [];
    const values = [];
    Object.entries(updateFields).forEach(([key, value]) => {
      assignments.push(`${key} = $${values.length + 1}`);
      values.push(key === 'corrective_actions' && Array.isArray(value) ? JSON.stringify(value) : value);
    });
    values.push(id);

    const result = await pool.query(
      `UPDATE incidents SET ${assignments.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Incident not found' });
    res.json({ message: 'Incident updated successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error updating incident:', err);
    res.status(500).json({ error: 'Failed to update incident' });
  }
});

app.post('/api/incidents/:id/resolve', verifyToken, requireRoles('admin', 'manager'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid incident id' });
    }

    const { root_cause, corrective_actions, notes } = req.body;

    if (!databaseReady) {
      const item = memoryStore.incidents.find((row) => row.id === id);
      if (!item) return res.status(404).json({ error: 'Incident not found' });
      item.status = 'resolved';
      item.root_cause = root_cause || item.root_cause || null;
      item.corrective_actions = Array.isArray(corrective_actions) ? corrective_actions : item.corrective_actions || [];
      item.closed_at = new Date().toISOString();
      item.updated_at = new Date().toISOString();
      return res.json({ message: 'Incident resolved successfully', data: item });
    }

    const result = await pool.query(
      `UPDATE incidents
       SET status = 'resolved',
           root_cause = COALESCE($1, root_cause),
           corrective_actions = COALESCE($2, corrective_actions),
           closed_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [root_cause || null, JSON.stringify(Array.isArray(corrective_actions) ? corrective_actions : []), id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Incident not found' });
    res.json({ message: 'Incident resolved successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error resolving incident:', err);
    res.status(500).json({ error: 'Failed to resolve incident' });
  }
});

app.get('/api/incidents/summary', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status != 'closed' THEN 1 ELSE 0 END) AS open_count,
        SUM(CASE WHEN severity = 'high' OR severity = 'critical' THEN 1 ELSE 0 END) AS high_priority_count,
        SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved_count
      FROM incidents
    `);

    const row = result.rows[0] || {};
    res.json({
      data: {
        total: Number(row.total || 0),
        open_count: Number(row.open_count || 0),
        high_priority_count: Number(row.high_priority_count || 0),
        resolved_count: Number(row.resolved_count || 0)
      }
    });
  } catch (err) {
    console.error('Error getting incident summary:', err);
    res.status(500).json({ error: 'Failed to summarize incidents' });
  }
});

app.get('/api/dashboard/summary', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*)::INT FROM employees) AS total_employees,
        (SELECT COUNT(*)::INT FROM employees WHERE status = 'active') AS active_employees,
        (SELECT COUNT(*)::INT FROM incidents) AS total_incidents,
        (SELECT COUNT(*)::INT FROM incidents WHERE status != 'closed') AS active_incidents,
        (SELECT COUNT(*)::INT FROM incidents WHERE severity IN ('high', 'critical')) AS high_severity_incidents,
        (SELECT COUNT(*)::INT FROM permit_records WHERE status IN ('submitted', 'pending_review', 'approved')) AS active_permits,
        (SELECT COUNT(*)::INT FROM files) AS total_documents,
        (SELECT COUNT(*)::INT FROM compliance_records WHERE status = 'pending') AS pending_compliance,
        (SELECT COUNT(*)::INT FROM course_enrollment WHERE status = 'completed') AS completed_training
    `);

    const row = result.rows[0] || {};
    const summary = {
      total_employees: Number(row.total_employees || 0),
      active_employees: Number(row.active_employees || 0),
      total_incidents: Number(row.total_incidents || 0),
      active_incidents: Number(row.active_incidents || 0),
      high_severity_incidents: Number(row.high_severity_incidents || 0),
      active_permits: Number(row.active_permits || 0),
      total_documents: Number(row.total_documents || 0),
      pending_compliance: Number(row.pending_compliance || 0),
      completed_training: Number(row.completed_training || 0)
    };

    res.json({
      message: 'Dashboard summary loaded successfully',
      data: summary
    });
  } catch (err) {
    console.error('Error getting dashboard summary:', err);
    res.status(500).json({ error: 'Failed to load dashboard summary' });
  }
});

app.get('/api/dashboard/kpis', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        k.id,
        k.name,
        k.description,
        k.unit,
        k.target_value,
        k.frequency,
        COALESCE(
          (
            SELECT kr.value
            FROM kpi_records kr
            WHERE kr.kpi_id = k.id
            ORDER BY kr.recorded_date DESC, kr.calculated_at DESC
            LIMIT 1
          ),
          k.target_value
        ) AS current_value,
        COALESCE(
          (
            SELECT kr.status
            FROM kpi_records kr
            WHERE kr.kpi_id = k.id
            ORDER BY kr.recorded_date DESC, kr.calculated_at DESC
            LIMIT 1
          ),
          'on_track'
        ) AS status
      FROM kpi_definitions k
      ORDER BY k.name ASC
    `);

    const data = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      unit: row.unit,
      target_value: Number(row.target_value || 0),
      current_value: Number(row.current_value ?? row.target_value ?? 0),
      frequency: row.frequency,
      status: row.status || 'on_track',
      progress_percentage: Number(row.target_value)
        ? Math.min(100, Math.max(0, ((Number(row.current_value ?? row.target_value ?? 0) / Number(row.target_value)) * 100)))
        : 0
    }));

    res.json({
      message: 'Dashboard KPI data loaded successfully',
      data
    });
  } catch (err) {
    console.error('Error getting dashboard KPIs:', err);
    res.status(500).json({ error: 'Failed to load dashboard KPI data' });
  }
});

app.get('/api/dashboard/compliance', verifyToken, async (req, res) => {
  try {
    const summaryResult = await pool.query(`
      SELECT
        COUNT(*)::INT AS total_records,
        COUNT(*) FILTER (WHERE status = 'pending')::INT AS pending_records,
        COUNT(*) FILTER (WHERE status = 'completed')::INT AS completed_records,
        COUNT(*) FILTER (WHERE status = 'overdue')::INT AS overdue_records,
        COUNT(*) FILTER (WHERE status = 'failed')::INT AS failed_records,
        ROUND(
          ((COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL) / NULLIF(COUNT(*)::DECIMAL, 0)) * 100,
          2
        ) AS completion_rate
      FROM compliance_records
    `);

    const recentResult = await pool.query(`
      SELECT
        cr.id,
        cr.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        ct.name AS template_name,
        cr.due_date,
        cr.completed_date,
        cr.status,
        cr.notes
      FROM compliance_records cr
      LEFT JOIN employees e ON e.id = cr.employee_id
      LEFT JOIN compliance_templates ct ON ct.id = cr.template_id
      ORDER BY cr.updated_at DESC, cr.id DESC
      LIMIT 10
    `);

    const byStatusResult = await pool.query(`
      SELECT status, COUNT(*)::INT AS count
      FROM compliance_records
      GROUP BY status
      ORDER BY count DESC, status ASC
    `);

    const row = summaryResult.rows[0] || {};
    const data = {
      summary: {
        total_records: Number(row.total_records || 0),
        pending_records: Number(row.pending_records || 0),
        completed_records: Number(row.completed_records || 0),
        overdue_records: Number(row.overdue_records || 0),
        failed_records: Number(row.failed_records || 0),
        completion_rate: Number(row.completion_rate || 0)
      },
      by_status: byStatusResult.rows,
      recent_records: recentResult.rows
    };

    res.json({ message: 'Compliance dashboard loaded successfully', data });
  } catch (err) {
    console.error('Error getting compliance dashboard:', err);
    res.status(500).json({ error: 'Failed to load compliance dashboard' });
  }
});

app.get('/api/dashboard/incidents', verifyToken, async (req, res) => {
  try {
    const summaryResult = await pool.query(`
      SELECT
        COUNT(*)::INT AS total_incidents,
        COUNT(*) FILTER (WHERE status != 'closed')::INT AS open_incidents,
        COUNT(*) FILTER (WHERE severity IN ('high', 'critical'))::INT AS high_priority_incidents,
        COUNT(*) FILTER (WHERE status = 'resolved')::INT AS resolved_incidents
      FROM incidents
    `);

    const bySeverityResult = await pool.query(`
      SELECT severity, COUNT(*)::INT AS count
      FROM incidents
      GROUP BY severity
      ORDER BY count DESC, severity ASC
    `);

    const recentResult = await pool.query(`
      SELECT
        i.id,
        i.incident_number,
        i.title,
        i.severity,
        i.status,
        i.location,
        i.date_occurred,
        COALESCE(u.full_name, 'System') AS reported_by_name
      FROM incidents i
      LEFT JOIN users u ON u.id = i.reported_by
      ORDER BY i.date_occurred DESC, i.id DESC
      LIMIT 10
    `);

    const row = summaryResult.rows[0] || {};
    const data = {
      summary: {
        total_incidents: Number(row.total_incidents || 0),
        open_incidents: Number(row.open_incidents || 0),
        high_priority_incidents: Number(row.high_priority_incidents || 0),
        resolved_incidents: Number(row.resolved_incidents || 0)
      },
      by_severity: bySeverityResult.rows,
      recent_incidents: recentResult.rows
    };

    res.json({ message: 'Incident dashboard loaded successfully', data });
  } catch (err) {
    console.error('Error getting incident dashboard:', err);
    res.status(500).json({ error: 'Failed to load incident dashboard' });
  }
});

app.get('/api/dashboard/certificates', verifyToken, async (req, res) => {
  try {
    const summaryResult = await pool.query(`
      SELECT
        COUNT(*)::INT AS total_certificates,
        COUNT(*) FILTER (WHERE status = 'active')::INT AS active_certificates,
        COUNT(*) FILTER (WHERE expiry_date <= CURRENT_DATE)::INT AS expired_certificates,
        COUNT(*) FILTER (WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')::INT AS expiring_soon
      FROM certifications
    `);

    const certificatesResult = await pool.query(`
      SELECT
        c.id,
        c.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        c.certification_name,
        c.certification_number,
        c.issued_date,
        c.expiry_date,
        c.status,
        CASE
          WHEN c.expiry_date IS NULL THEN 'unknown'
          WHEN c.expiry_date < CURRENT_DATE THEN 'expired'
          WHEN c.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
          ELSE 'valid'
        END AS expiry_status
      FROM certifications c
      LEFT JOIN employees e ON e.id = c.employee_id
      ORDER BY c.expiry_date ASC NULLS LAST, c.id DESC
      LIMIT 50
    `);

    const row = summaryResult.rows[0] || {};
    const data = {
      summary: {
        total_certificates: Number(row.total_certificates || 0),
        active_certificates: Number(row.active_certificates || 0),
        expired_certificates: Number(row.expired_certificates || 0),
        expiring_soon: Number(row.expiring_soon || 0)
      },
      certificates: certificatesResult.rows
    };

    res.json({ message: 'Certificate dashboard loaded successfully', data });
  } catch (err) {
    console.error('Error getting certificate dashboard:', err);
    res.status(500).json({ error: 'Failed to load certificate dashboard' });
  }
});

app.get('/api/reports/export', verifyToken, async (req, res) => {
  try {
    const complianceSummary = await pool.query(`
      SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE status = 'completed')::INT AS completed,
        COUNT(*) FILTER (WHERE status = 'pending')::INT AS pending,
        COUNT(*) FILTER (WHERE status IN ('overdue', 'failed'))::INT AS overdue
      FROM compliance_records
    `);

    const incidentsSummary = await pool.query(`
      SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE status != 'closed')::INT AS open,
        COUNT(*) FILTER (WHERE severity IN ('high', 'critical'))::INT AS high_priority
      FROM incidents
    `);

    const certificateSummary = await pool.query(`
      SELECT
        COUNT(*)::INT AS total,
        COUNT(*) FILTER (WHERE status = 'active')::INT AS active,
        COUNT(*) FILTER (WHERE expiry_date <= CURRENT_DATE)::INT AS expired,
        COUNT(*) FILTER (WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days')::INT AS expiring_soon
      FROM certifications
    `);

    const kpiSummary = await pool.query(`
      SELECT
        k.id,
        k.name,
        k.target_value,
        COALESCE(
          (
            SELECT kr.value
            FROM kpi_records kr
            WHERE kr.kpi_id = k.id
            ORDER BY kr.recorded_date DESC, kr.calculated_at DESC
            LIMIT 1
          ),
          k.target_value
        ) AS current_value
      FROM kpi_definitions k
      ORDER BY k.id ASC
    `);

    const data = {
      generated_at: new Date().toISOString(),
      compliance: complianceSummary.rows[0] || {},
      incidents: incidentsSummary.rows[0] || {},
      certificates: certificateSummary.rows[0] || {},
      kpis: kpiSummary.rows
    };

    res.json({ message: 'Report export generated successfully', data });
  } catch (err) {
    console.error('Error exporting reports:', err);
    res.status(500).json({ error: 'Failed to export report data' });
  }
});

// ===== HR & PAYROLL MODULE ROUTES =====

app.get('/api/hr/leaves', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM leave_types ORDER BY id ASC'
    );

    res.json({ data: result.rows });
  } catch (err) {
    console.error('Error listing leave types:', err);
    res.status(500).json({ error: 'Failed to load leave types' });
  }
});

app.get('/api/hr/leave-request', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        lr.id,
        lr.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        lr.leave_type_id,
        lt.name AS leave_type,
        lr.start_date,
        lr.end_date,
        lr.duration_days,
        lr.reason,
        lr.status,
        lr.approved_by,
        CONCAT(approver.first_name, ' ', approver.last_name) AS approved_by_name,
        lr.requested_date,
        lr.updated_at
      FROM leave_requests lr
      LEFT JOIN employees e ON e.id = lr.employee_id
      LEFT JOIN leave_types lt ON lt.id = lr.leave_type_id
      LEFT JOIN employees approver ON approver.id = lr.approved_by
      ORDER BY lr.requested_date DESC, lr.id DESC
    `);

    res.json({ data: result.rows });
  } catch (err) {
    console.error('Error listing leave requests:', err);
    res.status(500).json({ error: 'Failed to load leave requests' });
  }
});

app.post('/api/hr/leave-request', verifyToken, async (req, res) => {
  try {
    const {
      employee_id,
      employee_name,
      leave_type,
      start_date,
      end_date,
      reason
    } = req.body;

    let employeeId = parseInt(employee_id, 10);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      if (employee_name) {
        const employeeLookup = await pool.query(
          `SELECT id FROM employees WHERE LOWER(CONCAT(first_name, ' ', last_name)) LIKE $1 LIMIT 1`,
          [`%${String(employee_name).trim().toLowerCase()}%`]
        );
        employeeId = employeeLookup.rows[0]?.id || null;
      }
    }

    if (!employeeId) {
      return res.status(400).json({ error: 'employee_id or employee_name is required' });
    }

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }

    const leaveTypeName = leave_type || 'annual';
    const leaveTypeResult = await pool.query(
      'SELECT id FROM leave_types WHERE name = $1 LIMIT 1',
      [leaveTypeName]
    );

    if (leaveTypeResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid leave type' });
    }

    const start = new Date(start_date);
    const end = new Date(end_date);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      return res.status(400).json({ error: 'Invalid leave date range' });
    }

    const diffInDays = Math.max((end - start) / 86400000 + 1, 1);

    const result = await pool.query(
      `INSERT INTO leave_requests (employee_id, leave_type_id, start_date, end_date, duration_days, reason, status)
       VALUES ($1, $2, $3::date, $4::date, $5, $6, 'pending')
       RETURNING *`,
      [employeeId, leaveTypeResult.rows[0].id, start_date, end_date, diffInDays, reason || null]
    );

    res.status(201).json({ message: 'Leave request submitted successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error creating leave request:', err);
    res.status(500).json({ error: 'Failed to submit leave request' });
  }
});

app.put('/api/hr/leave-request/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid leave request id' });
    }

    const { leave_type, start_date, end_date, reason, status } = req.body;
    const updates = [];
    const values = [];

    if (leave_type) {
      const leaveTypeResult = await pool.query('SELECT id FROM leave_types WHERE name = $1 LIMIT 1', [leave_type]);
      if (leaveTypeResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid leave type' });
      }
      updates.push('leave_type_id = $' + (values.length + 1));
      values.push(leaveTypeResult.rows[0].id);
    }

    if (start_date) {
      updates.push('start_date = $' + (values.length + 1));
      values.push(start_date);
    }

    if (end_date) {
      updates.push('end_date = $' + (values.length + 1));
      values.push(end_date);
    }

    if (reason !== undefined) {
      updates.push('reason = $' + (values.length + 1));
      values.push(reason);
    }

    if (status) {
      updates.push('status = $' + (values.length + 1));
      values.push(status);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'At least one field is required to update' });
    }

    if (start_date || end_date) {
      const currentRequest = await pool.query('SELECT start_date, end_date FROM leave_requests WHERE id = $1', [id]);
      const effectiveStart = start_date || currentRequest.rows[0]?.start_date;
      const effectiveEnd = end_date || currentRequest.rows[0]?.end_date;
      if (effectiveStart && effectiveEnd) {
        const diffInDays = Math.max((new Date(effectiveEnd) - new Date(effectiveStart)) / 86400000 + 1, 1);
        updates.push('duration_days = $' + (values.length + 1));
        values.push(diffInDays);
      }
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE leave_requests
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    res.json({ message: 'Leave request updated successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error updating leave request:', err);
    res.status(500).json({ error: 'Failed to update leave request' });
  }
});

app.post('/api/hr/leave-request/:id/approve', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid leave request id' });
    }

    const result = await pool.query(
      `UPDATE leave_requests
       SET status = 'approved', approved_by = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [req.userId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    res.json({ message: 'Leave request approved successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error approving leave request:', err);
    res.status(500).json({ error: 'Failed to approve leave request' });
  }
});

app.post('/api/hr/leave-request/:id/reject', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid leave request id' });
    }

    const result = await pool.query(
      `UPDATE leave_requests
       SET status = 'rejected', approved_by = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [req.userId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    res.json({ message: 'Leave request rejected successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error rejecting leave request:', err);
    res.status(500).json({ error: 'Failed to reject leave request' });
  }
});

app.get('/api/hr/attendance', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        ar.id,
        ar.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        ar.attendance_date,
        ar.check_in_time,
        ar.check_out_time,
        ar.duration_hours,
        ar.status,
        ar.notes,
        ar.recorded_at
      FROM attendance_records ar
      LEFT JOIN employees e ON e.id = ar.employee_id
      ORDER BY ar.attendance_date DESC, ar.id DESC
      LIMIT 100
    `);

    res.json({ data: result.rows });
  } catch (err) {
    console.error('Error listing attendance records:', err);
    res.status(500).json({ error: 'Failed to load attendance records' });
  }
});

app.get('/api/hr/payroll', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        pr.id,
        pr.employee_id,
        CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
        pr.payroll_month,
        pr.payroll_year,
        pr.gross_salary,
        pr.deductions,
        pr.net_salary,
        pr.tax_amount,
        pr.processed_date,
        pr.status,
        ss.base_salary
      FROM payroll_records pr
      LEFT JOIN employees e ON e.id = pr.employee_id
      LEFT JOIN salary_structure ss ON ss.employee_id = pr.employee_id AND ss.end_date IS NULL
      ORDER BY pr.payroll_year DESC, pr.payroll_month DESC, pr.id DESC
    `);

    if (result.rows.length === 0) {
      const fallbackEmployees = await pool.query(
        `SELECT id, first_name, last_name, department_id FROM employees ORDER BY id ASC LIMIT 50`
      );

      const generatedRows = fallbackEmployees.rows.map((employee, index) => ({
        id: index + 1,
        employee_id: employee.id,
        employee_name: `${employee.first_name} ${employee.last_name}`,
        payroll_month: new Date().getMonth() + 1,
        payroll_year: new Date().getFullYear(),
        gross_salary: 4000 + index * 250,
        deductions: {},
        net_salary: 3700 + index * 250,
        tax_amount: 300 + index * 20,
        processed_date: new Date().toISOString().slice(0, 10),
        status: 'processed',
        base_salary: 4000 + index * 250
      }));

      return res.json({ data: generatedRows });
    }

    res.json({ data: result.rows });
  } catch (err) {
    console.error('Error listing payroll records:', err);
    res.status(500).json({ error: 'Failed to load payroll information' });
  }
});

app.post('/api/hr/payroll/process', verifyToken, async (req, res) => {
  try {
    const {
      employee_id,
      payroll_month,
      payroll_year,
      gross_salary,
      deductions,
      net_salary,
      tax_amount,
      status
    } = req.body;

    const employeeId = parseInt(employee_id, 10);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return res.status(400).json({ error: 'employee_id is required' });
    }

    const month = parseInt(payroll_month, 10) || new Date().getMonth() + 1;
    const year = parseInt(payroll_year, 10) || new Date().getFullYear();
    const gross = Number(gross_salary ?? 0);
    const tax = Number(tax_amount ?? 0);
    const net = Number(net_salary ?? Math.max(gross - tax, 0));

    const result = await pool.query(
      `INSERT INTO payroll_records (
         employee_id, payroll_month, payroll_year, gross_salary, deductions, net_salary, tax_amount, processed_date, status
       ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, CURRENT_DATE, $8)
       ON CONFLICT (employee_id, payroll_month, payroll_year)
       DO UPDATE SET
         gross_salary = EXCLUDED.gross_salary,
         deductions = EXCLUDED.deductions,
         net_salary = EXCLUDED.net_salary,
         tax_amount = EXCLUDED.tax_amount,
         processed_date = CURRENT_DATE,
         status = EXCLUDED.status
       RETURNING *`,
      [employeeId, month, year, gross, JSON.stringify(deductions || {}), net, tax, status || 'processed']
    );

    res.status(201).json({ message: 'Payroll processed successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error processing payroll:', err);
    res.status(500).json({ error: 'Failed to process payroll' });
  }
});

// ===== ASSET MODULE ROUTES =====

app.get('/api/assets', verifyToken, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || '20', 10), 1), 100);
    const offset = (page - 1) * limit;

    const params = [];
    const filters = [];

    if (req.query.status) {
      params.push(req.query.status);
      filters.push(`a.status = $${params.length}`);
    }

    if (req.query.asset_type) {
      params.push(req.query.asset_type);
      filters.push(`a.asset_type = $${params.length}`);
    }

    if (req.query.q) {
      params.push(`%${req.query.q}%`);
      filters.push(`(
        a.asset_number ILIKE $${params.length}
        OR a.name ILIKE $${params.length}
        OR COALESCE(a.location, '') ILIKE $${params.length}
      )`);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*)::INT AS total FROM assets a ${whereClause}`,
      params
    );

    const dataResult = await pool.query(
      `SELECT
         a.id,
         a.asset_number,
         a.name,
         a.description,
         a.asset_type,
         a.category,
         a.location,
         a.responsible_person_id,
         a.purchase_date,
         a.cost,
         a.warranty_expiry,
         a.status,
         a.created_at,
         a.updated_at,
         CASE
           WHEN e.id IS NULL THEN NULL
           ELSE CONCAT(e.first_name, ' ', e.last_name)
         END AS responsible_person_name
       FROM assets a
       LEFT JOIN employees e ON e.id = a.responsible_person_id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT $${params.length + 1}
       OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({
      data: dataResult.rows,
      pagination: {
        total: countResult.rows[0]?.total || 0,
        page,
        limit,
        pages: Math.max(Math.ceil((countResult.rows[0]?.total || 0) / limit), 1)
      }
    });
  } catch (err) {
    console.error('Error listing assets:', err);
    res.status(500).json({ error: 'Failed to list assets' });
  }
});

app.get('/api/assets/:id', verifyToken, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid asset id' });
    }

    const result = await pool.query(
      `SELECT
         a.id,
         a.asset_number,
         a.name,
         a.description,
         a.asset_type,
         a.category,
         a.location,
         a.responsible_person_id,
         a.purchase_date,
         a.cost,
         a.warranty_expiry,
         a.status,
         a.created_at,
         a.updated_at,
         CASE
           WHEN e.id IS NULL THEN NULL
           ELSE CONCAT(e.first_name, ' ', e.last_name)
         END AS responsible_person_name
       FROM assets a
       LEFT JOIN employees e ON e.id = a.responsible_person_id
       WHERE a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching asset:', err);
    res.status(500).json({ error: 'Failed to fetch asset' });
  }
});

app.post('/api/assets', verifyToken, requireRoles('admin', 'manager'), async (req, res) => {
  try {
    const {
      asset_number,
      name,
      description,
      asset_type,
      category,
      location,
      responsible_person_id,
      purchase_date,
      cost,
      warranty_expiry,
      status
    } = req.body;

    if (!asset_number || !name || !asset_type) {
      return res.status(400).json({ error: 'asset_number, name, and asset_type are required' });
    }

    const allowedTypes = new Set(['equipment', 'ppe', 'tool', 'vehicle', 'facility', 'other']);
    if (!allowedTypes.has(asset_type)) {
      return res.status(400).json({ error: 'Invalid asset_type value' });
    }

    const allowedStatuses = new Set(['active', 'maintenance', 'disposed', 'archived']);
    const finalStatus = status || 'active';
    if (!allowedStatuses.has(finalStatus)) {
      return res.status(400).json({ error: 'Invalid status value' });
    }

    const result = await pool.query(
      `INSERT INTO assets (
         asset_number, name, description, asset_type, category, location,
         responsible_person_id, purchase_date, cost, warranty_expiry, status
       ) VALUES (
         $1, $2, $3, $4, $5, $6,
         $7, $8, $9, $10, $11
       )
       RETURNING *`,
      [
        String(asset_number).trim(),
        String(name).trim(),
        description || null,
        asset_type,
        category || null,
        location || null,
        responsible_person_id || null,
        purchase_date || null,
        cost ?? null,
        warranty_expiry || null,
        finalStatus
      ]
    );

    res.status(201).json({ message: 'Asset created successfully', data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Asset number already exists' });
    }

    console.error('Error creating asset:', err);
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

app.put('/api/assets/:id', verifyToken, requireRoles('admin', 'manager'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid asset id' });
    }

    const {
      asset_number,
      name,
      description,
      asset_type,
      category,
      location,
      responsible_person_id,
      purchase_date,
      cost,
      warranty_expiry,
      status
    } = req.body;

    const existing = await pool.query('SELECT id FROM assets WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if (asset_type) {
      const allowedTypes = new Set(['equipment', 'ppe', 'tool', 'vehicle', 'facility', 'other']);
      if (!allowedTypes.has(asset_type)) {
        return res.status(400).json({ error: 'Invalid asset_type value' });
      }
    }

    if (status) {
      const allowedStatuses = new Set(['active', 'maintenance', 'disposed', 'archived']);
      if (!allowedStatuses.has(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
      }
    }

    const result = await pool.query(
      `UPDATE assets
       SET asset_number = COALESCE($1, asset_number),
           name = COALESCE($2, name),
           description = COALESCE($3, description),
           asset_type = COALESCE($4, asset_type),
           category = COALESCE($5, category),
           location = COALESCE($6, location),
           responsible_person_id = COALESCE($7, responsible_person_id),
           purchase_date = COALESCE($8, purchase_date),
           cost = COALESCE($9, cost),
           warranty_expiry = COALESCE($10, warranty_expiry),
           status = COALESCE($11, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $12
       RETURNING *`,
      [
        asset_number ?? null,
        name ?? null,
        description ?? null,
        asset_type ?? null,
        category ?? null,
        location ?? null,
        responsible_person_id ?? null,
        purchase_date ?? null,
        cost ?? null,
        warranty_expiry ?? null,
        status ?? null,
        id
      ]
    );

    res.json({ message: 'Asset updated successfully', data: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Asset number already exists' });
    }

    console.error('Error updating asset:', err);
    res.status(500).json({ error: 'Failed to update asset' });
  }
});

app.delete('/api/assets/:id', verifyToken, requireRoles('admin', 'manager'), async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid asset id' });
    }

    const result = await pool.query(
      `UPDATE assets
       SET status = 'archived', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING id, status, updated_at`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json({ message: 'Asset archived successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error archiving asset:', err);
    res.status(500).json({ error: 'Failed to archive asset' });
  }
});

// ===== EMPLOYEE SUB-ENDPOINTS =====

app.get('/api/employees/:id/compliance', verifyToken, async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return res.status(400).json({ error: 'Invalid employee id' });
    }

    const employeeResult = await pool.query(
      `SELECT id, first_name, last_name, email, compliance_score, status
       FROM employees
       WHERE id = $1`,
      [employeeId]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const summaryResult = await pool.query(
      `SELECT
         COUNT(*)::INT AS total_records,
         COUNT(*) FILTER (WHERE status = 'pending')::INT AS pending_records,
         COUNT(*) FILTER (WHERE status = 'completed')::INT AS completed_records,
         COUNT(*) FILTER (WHERE status = 'overdue')::INT AS overdue_records,
         COUNT(*) FILTER (WHERE status = 'failed')::INT AS failed_records,
         MIN(due_date) FILTER (WHERE status = 'pending') AS next_due_date
       FROM compliance_records
       WHERE employee_id = $1`,
      [employeeId]
    );

    const recordsResult = await pool.query(
      `SELECT
         cr.id,
         cr.template_id,
         ct.name AS template_name,
         cr.due_date,
         cr.completed_date,
         cr.status,
         cr.notes,
         cr.updated_at
       FROM compliance_records cr
       JOIN compliance_templates ct ON ct.id = cr.template_id
       WHERE cr.employee_id = $1
       ORDER BY cr.due_date DESC, cr.id DESC
       LIMIT 20`,
      [employeeId]
    );

    const data = {
      employee: employeeResult.rows[0],
      summary: summaryResult.rows[0],
      records: recordsResult.rows
    };

    res.json({
      message: 'Compliance status fetched successfully',
      data,
      employee: data.employee,
      summary: data.summary,
      records: data.records
    });
  } catch (err) {
    console.error('Error fetching compliance status:', err);
    res.status(500).json({ error: 'Failed to fetch compliance status' });
  }
});

app.get('/api/employees/:id/training', verifyToken, async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return res.status(400).json({ error: 'Invalid employee id' });
    }

    const employeeResult = await pool.query(
      'SELECT id, first_name, last_name, email, status FROM employees WHERE id = $1',
      [employeeId]
    );

    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const enrollmentResult = await pool.query(
      `SELECT
         ce.id,
         ce.course_id,
         c.name AS course_name,
         c.category,
         c.duration_hours,
         ce.enrollment_date,
         ce.completion_date,
         ce.status,
         ce.final_score
       FROM course_enrollment ce
       JOIN courses c ON c.id = ce.course_id
       WHERE ce.employee_id = $1
       ORDER BY ce.created_at DESC`,
      [employeeId]
    );

    const certificationResult = await pool.query(
      `SELECT
         id,
         certification_number,
         certification_name,
         issued_date,
         expiry_date,
         status
       FROM certifications
       WHERE employee_id = $1
       ORDER BY issued_date DESC, id DESC`,
      [employeeId]
    );

    const data = {
      employee: employeeResult.rows[0],
      enrollments: enrollmentResult.rows,
      certifications: certificationResult.rows
    };

    res.json({
      message: 'Training history fetched successfully',
      data,
      employee: data.employee,
      enrollments: data.enrollments,
      certifications: data.certifications
    });
  } catch (err) {
    console.error('Error fetching training history:', err);
    res.status(500).json({ error: 'Failed to fetch training history' });
  }
});

app.post('/api/employees/:id/onboard', verifyToken, requireRoles('admin', 'manager'), async (req, res) => {
  const client = await pool.connect();

  try {
    const employeeId = parseInt(req.params.id, 10);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return res.status(400).json({ error: 'Invalid employee id' });
    }

    const { template_id, total_steps } = req.body;

    const employeeResult = await client.query('SELECT id FROM employees WHERE id = $1', [employeeId]);
    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const existingChecklist = await client.query(
      `SELECT id, status
       FROM onboarding_checklists
       WHERE employee_id = $1
       ORDER BY id DESC
       LIMIT 1`,
      [employeeId]
    );

    if (existingChecklist.rows.length > 0) {
      const activeStatus = existingChecklist.rows[0].status;
      if (['not_started', 'in_progress', 'paused'].includes(activeStatus)) {
        await client.query('DELETE FROM onboarding_tasks WHERE checklist_id = $1', [existingChecklist.rows[0].id]);
        await client.query('DELETE FROM onboarding_checklists WHERE id = $1', [existingChecklist.rows[0].id]);
      }
    }

    const checklistResult = await client.query(
      `INSERT INTO onboarding_checklists (employee_id, template_id, total_steps, current_step, status)
       VALUES ($1, $2, $3, 1, 'in_progress')
       RETURNING *`,
      [employeeId, template_id || null, total_steps || 5]
    );

    const checklist = checklistResult.rows[0];

    const defaultTasks = [
      { step_number: 1, task_name: 'Complete profile and HR documents', description: 'Collect employee profile details and required HR forms' },
      { step_number: 2, task_name: 'Assign safety orientation', description: 'Enroll employee in mandatory safety orientation' },
      { step_number: 3, task_name: 'Issue compliance checklist', description: 'Provide initial compliance tasks and due dates' },
      { step_number: 4, task_name: 'Provision tools and access', description: 'Set up system access, PPE, and operational tools' },
      { step_number: 5, task_name: 'Manager final review', description: 'Perform manager verification and onboarding sign-off' }
    ];

    for (const task of defaultTasks.slice(0, checklist.total_steps)) {
      await pool.query(
        `INSERT INTO onboarding_tasks (checklist_id, step_number, task_name, description)
         VALUES ($1, $2, $3, $4)`,
        [checklist.id, task.step_number, task.task_name, task.description]
      );
    }

    res.status(201).json({ message: 'Onboarding checklist started successfully', data: checklist });
  } catch (err) {
    console.error('Error starting onboarding:', err);
    res.status(500).json({ error: 'Failed to start onboarding workflow' });
  }
});

app.get('/api/employees/:id/onboard', verifyToken, async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return res.status(400).json({ error: 'Invalid employee id' });
    }

    const checklistResult = await pool.query(
      `SELECT *
       FROM onboarding_checklists
       WHERE employee_id = $1
       ORDER BY id DESC
       LIMIT 1`,
      [employeeId]
    );

    if (checklistResult.rows.length === 0) {
      return res.status(404).json({ error: 'No onboarding checklist found for this employee' });
    }

    const checklist = checklistResult.rows[0];

    const tasksResult = await pool.query(
      `SELECT
         id,
         step_number,
         task_name,
         description,
         assigned_to,
         completed,
         completed_by,
         completed_date,
         notes
       FROM onboarding_tasks
       WHERE checklist_id = $1
       ORDER BY step_number ASC, id ASC`,
      [checklist.id]
    );

    const data = {
      checklist,
      tasks: tasksResult.rows
    };

    res.json({
      message: 'Onboarding status fetched successfully',
      data,
      checklist: data.checklist,
      tasks: data.tasks
    });
  } catch (err) {
    console.error('Error fetching onboarding status:', err);
    res.status(500).json({ error: 'Failed to fetch onboarding status' });
  }
});

app.post('/api/employees/:id/onboard/step', verifyToken, requireRoles('admin', 'manager'), async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const employeeId = parseInt(req.params.id, 10);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid employee id' });
    }

    const taskId = parseInt(req.body.task_id, 10);
    const { notes } = req.body;
    if (!Number.isInteger(taskId) || taskId <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'task_id is required' });
    }

    const checklistResult = await client.query(
      `SELECT *
       FROM onboarding_checklists
       WHERE employee_id = $1
       ORDER BY id DESC
       LIMIT 1`,
      [employeeId]
    );

    if (checklistResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'No onboarding checklist found for this employee' });
    }

    const checklist = checklistResult.rows[0];
    if (checklist.status === 'completed') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Onboarding checklist is already completed' });
    }

    const taskResult = await client.query(
      `UPDATE onboarding_tasks
       SET completed = TRUE,
           completed_by = $1,
           completed_date = CURRENT_TIMESTAMP,
           notes = COALESCE($2, notes)
       WHERE id = $3 AND checklist_id = $4
       RETURNING *`,
      [employeeId, notes || null, taskId, checklist.id]
    );

    if (taskResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Onboarding task not found for this employee checklist' });
    }

    const progressResult = await client.query(
      `SELECT
         COUNT(*)::INT AS total,
         COUNT(*) FILTER (WHERE completed = TRUE)::INT AS completed
       FROM onboarding_tasks
       WHERE checklist_id = $1`,
      [checklist.id]
    );

    const total = progressResult.rows[0].total;
    const completed = progressResult.rows[0].completed;
    const isCompleted = completed >= total && total > 0;
    const nextStep = Math.min((taskResult.rows[0].step_number || checklist.current_step || 1) + 1, checklist.total_steps || total || 1);

    const updatedChecklistResult = await client.query(
      `UPDATE onboarding_checklists
       SET current_step = $1,
           status = $2::text,
           completed_date = CASE WHEN $2::text = 'completed' THEN CURRENT_TIMESTAMP ELSE completed_date END
       WHERE id = $3
       RETURNING *`,
      [nextStep, isCompleted ? 'completed' : 'in_progress', checklist.id]
    );

    await client.query('COMMIT');

    const stepMessage = isCompleted ? 'Onboarding completed successfully' : 'Onboarding step completed successfully';
    const data = {
      task: taskResult.rows[0],
      checklist: updatedChecklistResult.rows[0],
      progress: {
        total_steps: total,
        completed_steps: completed
      }
    };

    res.json({
      message: stepMessage,
      data,
      task: data.task,
      checklist: data.checklist,
      progress: data.progress
    });
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('Rollback error during onboarding step:', rollbackErr);
    }
    console.error('Error completing onboarding step:', err);
    res.status(500).json({
      error: 'Failed to complete onboarding step',
      details: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  } finally {
    client.release();
  }
});

app.post('/api/employees/:id/training', verifyToken, requireRoles('admin', 'manager'), async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return res.status(400).json({ error: 'Invalid employee id' });
    }

    const { course_id, status, final_score } = req.body;
    const courseId = parseInt(course_id, 10);
    if (!Number.isInteger(courseId) || courseId <= 0) {
      return res.status(400).json({ error: 'course_id is required' });
    }

    const enrollmentStatus = status || 'enrolled';
    const allowed = new Set(['enrolled', 'in_progress', 'completed', 'failed', 'dropped']);
    if (!allowed.has(enrollmentStatus)) {
      return res.status(400).json({ error: 'Invalid enrollment status' });
    }

    const employeeResult = await pool.query('SELECT id FROM employees WHERE id = $1', [employeeId]);
    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const courseResult = await pool.query('SELECT id FROM courses WHERE id = $1', [courseId]);
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }

    const result = await pool.query(
      `INSERT INTO course_enrollment (course_id, employee_id, status, final_score, completion_date)
       VALUES ($1, $2, $3::text, $4::int, CASE WHEN $3::text = 'completed' THEN CURRENT_DATE ELSE NULL END)
       ON CONFLICT (course_id, employee_id)
       DO UPDATE SET
         status = EXCLUDED.status,
         final_score = EXCLUDED.final_score,
         completion_date = CASE WHEN EXCLUDED.status = 'completed' THEN CURRENT_DATE ELSE course_enrollment.completion_date END
       RETURNING *`,
      [courseId, employeeId, enrollmentStatus, final_score ?? null]
    );

    res.status(201).json({ message: 'Training enrollment saved successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error saving training enrollment:', err);
    res.status(500).json({
      error: 'Failed to save training enrollment',
      details: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  }
});

app.post('/api/employees/:id/compliance', verifyToken, requireRoles('admin', 'manager'), async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id, 10);
    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return res.status(400).json({ error: 'Invalid employee id' });
    }

    const { template_id, due_date, status, notes, checked_by } = req.body;
    const templateId = parseInt(template_id, 10);
    if (!Number.isInteger(templateId) || templateId <= 0) {
      return res.status(400).json({ error: 'template_id is required' });
    }

    if (!due_date) {
      return res.status(400).json({ error: 'due_date is required' });
    }

    const recordStatus = status || 'pending';
    const allowed = new Set(['pending', 'completed', 'overdue', 'failed']);
    if (!allowed.has(recordStatus)) {
      return res.status(400).json({ error: 'Invalid compliance status' });
    }

    const employeeResult = await pool.query('SELECT id, department_id FROM employees WHERE id = $1', [employeeId]);
    if (employeeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const templateResult = await pool.query('SELECT id FROM compliance_templates WHERE id = $1', [templateId]);
    if (templateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance template not found' });
    }

    const result = await pool.query(
      `INSERT INTO compliance_records (
         template_id, employee_id, department_id, due_date, status, notes, checked_by, completed_date
       ) VALUES (
         $1, $2, $3, $4::date, $5::text, $6, $7, CASE WHEN $5::text = 'completed' THEN CURRENT_DATE ELSE NULL END
       )
       RETURNING *`,
      [
        templateId,
        employeeId,
        employeeResult.rows[0].department_id || null,
        due_date,
        recordStatus,
        notes || null,
        checked_by || null
      ]
    );

    res.status(201).json({ message: 'Compliance record created successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error creating compliance record:', err);
    res.status(500).json({
      error: 'Failed to create compliance record',
      details: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  }
});

app.put('/api/compliance-records/:id', verifyToken, requireRoles('admin', 'manager'), async (req, res) => {
  try {
    const recordId = parseInt(req.params.id, 10);
    if (!Number.isInteger(recordId) || recordId <= 0) {
      return res.status(400).json({ error: 'Invalid compliance record id' });
    }

    const { status, notes, checked_by, due_date } = req.body;
    if (!status && notes === undefined && checked_by === undefined && !due_date) {
      return res.status(400).json({ error: 'At least one field is required to update' });
    }

    if (status) {
      const allowed = new Set(['pending', 'completed', 'overdue', 'failed']);
      if (!allowed.has(status)) {
        return res.status(400).json({ error: 'Invalid compliance status' });
      }
    }

    const result = await pool.query(
      `UPDATE compliance_records
       SET status = COALESCE($1, status),
           notes = COALESCE($2, notes),
           checked_by = COALESCE($3, checked_by),
           due_date = COALESCE($4, due_date),
           completed_date = CASE
             WHEN COALESCE($1, status) = 'completed' THEN COALESCE(completed_date, CURRENT_DATE)
             ELSE completed_date
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [status || null, notes ?? null, checked_by ?? null, due_date || null, recordId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Compliance record not found' });
    }

    res.json({ message: 'Compliance record updated successfully', data: result.rows[0] });
  } catch (err) {
    console.error('Error updating compliance record:', err);
    res.status(500).json({
      error: 'Failed to update compliance record',
      details: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  }
});

// ===== FILE UPLOAD & S3 ENDPOINTS =====

// Upload file to S3
app.post('/api/files/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    const fileType = req.file.mimetype;
    const uploadType = req.body.uploadType || 'document';
    const description = req.body.description || '';

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const safeFileName = fileName.replace(/[\\/:*?"<>|]/g, '_');
    const s3Key = `ehs/${req.userId}/${timestamp}-${randomString}-${safeFileName}`;

    let s3Url = null;
    let localStoragePath = null;

    if (S3_BUCKET && process.env.AWS_ACCESS_KEY_ID) {
      const params = {
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: req.file.buffer,
        ContentType: fileType,
        Metadata: {
          'original-filename': safeFileName,
          'user-id': req.userId.toString()
        }
      };

      await s3Client.send(new PutObjectCommand(params));
      s3Url = `${S3_URL || `https://${S3_BUCKET}.s3.amazonaws.com`}/${s3Key}`;
    } else {
      const relativeKey = `${Date.now()}-${randomString}-${safeFileName}`;
      localStoragePath = path.join(UPLOADS_DIR, relativeKey);
      fs.writeFileSync(localStoragePath, req.file.buffer);
      s3Key = relativeKey;
      s3Url = `http://localhost:${PORT}/uploads/${relativeKey}`;
    }

    const result = await pool.query(
      'INSERT INTO files (user_id, file_name, s3_key, s3_url, file_size, file_type, upload_type, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.userId, fileName, s3Key, s3Url, fileSize, fileType, uploadType, description]
    );

    const responseData = {
      id: result.rows[0].id,
      file_name: result.rows[0].file_name,
      s3_url: result.rows[0].s3_url,
      file_size: result.rows[0].file_size,
      file_type: result.rows[0].file_type,
      upload_type: result.rows[0].upload_type,
      description: result.rows[0].description,
      created_at: result.rows[0].created_at
    };

    return res.status(201).json({
      message: 'File uploaded successfully',
      file: responseData,
      data: responseData
    });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ error: 'File upload failed', details: err.message });
  }
});

// Get user's uploaded files
app.get('/api/files', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, file_name, s3_url, file_size, file_type, upload_type, description, created_at FROM files WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    return res.json({ data: result.rows });
  } catch (err) {
    console.error('Error fetching files:', err);
    return res.status(500).json({ error: 'Failed to fetch files' });
  }
});

// Get file by ID
app.get('/api/files/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM files WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    return res.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Error fetching file:', err);
    return res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// Delete file from S3 and database
app.delete('/api/files/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const fileResult = await pool.query(
      'SELECT s3_key, s3_url FROM files WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const { s3_key: s3Key, s3_url: s3Url } = fileResult.rows[0];

    if (S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && s3Key) {
      const s3Params = { Bucket: S3_BUCKET, Key: s3Key };
      await s3Client.send(new DeleteObjectCommand(s3Params));
    } else if (s3Url && s3Url.startsWith(`http://localhost:${PORT}/uploads/`)) {
      const relativeFileName = s3Url.split('/uploads/')[1];
      const localPath = path.join(UPLOADS_DIR, relativeFileName);
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    }

    await pool.query('DELETE FROM files WHERE id = $1 AND user_id = $2', [id, req.userId]);
    return res.json({ message: 'File deleted successfully', data: { id } });
  } catch (err) {
    console.error('Delete error:', err);
    return res.status(500).json({ error: 'File deletion failed', details: err.message });
  }
});

// Generate pre-signed URL for secure file access
app.get('/api/files/:id/presigned-url', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const expirySeconds = parseInt(req.query.expiry) || 3600;

    const fileResult = await pool.query(
      'SELECT s3_key, s3_url FROM files WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const { s3_key: s3Key, s3_url: s3Url } = fileResult.rows[0];

    if (!S3_BUCKET || !process.env.AWS_ACCESS_KEY_ID) {
      return res.json({ data: { presignedUrl: s3Url || null, expiresIn: expirySeconds } });
    }

    const params = { Bucket: S3_BUCKET, Key: s3Key };
    const command = new GetObjectCommand(params);
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: expirySeconds });

    return res.json({ data: { presignedUrl, expiresIn: expirySeconds } });
  } catch (err) {
    console.error('Pre-signed URL error:', err);
    return res.status(500).json({ error: 'Failed to generate pre-signed URL' });
  }
});

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');

    res.json({
      status: 'ok',
      service: 'ehs-suite-backend',
      environment: process.env.NODE_ENV || 'development',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      service: 'ehs-suite-backend',
      environment: process.env.NODE_ENV || 'development',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
      error: 'Database connectivity check failed'
    });
  }
});

definePath('/api/register', {
  post: {
    tags: ['Auth'],
    summary: 'Register user',
    security: [],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string' },
              fullName: { type: 'string' },
              company: { type: 'string' },
              department: { type: 'string' },
              phone: { type: 'string' }
            }
          }
        }
      }
    },
    responses: {
      201: { description: 'Created' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});
definePath('/api/auth/register', apiDoc.paths['/api/register']);
definePath('/api/login', {
  post: {
    tags: ['Auth'],
    summary: 'Login user',
    security: [],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string' }
            }
          }
        }
      }
    },
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});
definePath('/api/auth/login', apiDoc.paths['/api/login']);
definePath('/api/forgot-password', {
  post: {
    tags: ['Auth'],
    summary: 'Generate password reset token',
    security: [],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['email'],
            properties: {
              email: { type: 'string', format: 'email' }
            }
          }
        }
      }
    },
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});
definePath('/api/auth/forgot-password', apiDoc.paths['/api/forgot-password']);
definePath('/api/reset-password', {
  post: {
    tags: ['Auth'],
    summary: 'Reset password',
    security: [],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['token', 'newPassword'],
            properties: {
              token: { type: 'string' },
              newPassword: { type: 'string' }
            }
          }
        }
      }
    },
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});
definePath('/api/auth/reset-password', apiDoc.paths['/api/reset-password']);
definePath('/api/user/profile', {
  get: {
    tags: ['Auth'],
    summary: 'Current user profile',
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});
definePath('/api/auth/profile', apiDoc.paths['/api/user/profile']);

definePath('/api/ehs-records', {
  get: {
    tags: ['EHS Records'],
    summary: 'List EHS records',
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  },
  post: {
    tags: ['EHS Records'],
    summary: 'Create EHS record',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              recordType: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string' },
              status: { type: 'string' },
              dueDate: { type: 'string', format: 'date' }
            }
          }
        }
      }
    },
    responses: {
      201: { description: 'Created' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});
definePath('/api/ehs-records/{id}', {
  put: {
    tags: ['EHS Records'],
    summary: 'Update EHS record',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              recordType: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              severity: { type: 'string' },
              status: { type: 'string' },
              dueDate: { type: 'string', format: 'date' }
            }
          }
        }
      }
    },
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  },
  delete: {
    tags: ['EHS Records'],
    summary: 'Delete EHS record',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/employees', {
  get: {
    tags: ['Employees'],
    summary: 'List employees',
    parameters: [
      { name: 'page', in: 'query', required: false, schema: { type: 'integer' } },
      { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } },
      { name: 'sort', in: 'query', required: false, schema: { type: 'string' } },
      { name: 'order', in: 'query', required: false, schema: { type: 'string', enum: ['asc', 'desc'] } },
      { name: 'status', in: 'query', required: false, schema: { type: 'string' } },
      { name: 'department_id', in: 'query', required: false, schema: { type: 'integer' } },
      { name: 'manager_id', in: 'query', required: false, schema: { type: 'integer' } },
      { name: 'q', in: 'query', required: false, schema: { type: 'string' } }
    ],
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  },
  post: {
    tags: ['Employees'],
    summary: 'Create employee',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['first_name', 'last_name', 'email'],
            properties: {
              user_id: { type: 'integer' },
              first_name: { type: 'string' },
              last_name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              phone: { type: 'string' },
              department_id: { type: 'integer' },
              job_title: { type: 'string' },
              manager_id: { type: 'integer' },
              hire_date: { type: 'string', format: 'date' },
              date_of_birth: { type: 'string', format: 'date' },
              status: { type: 'string', enum: ['active', 'inactive', 'on_leave', 'terminated'] },
              skills: { type: 'array', items: { type: 'string' } },
              certifications: { type: 'array', items: { type: 'string' } },
              compliance_score: { type: 'number' }
            }
          }
        }
      }
    },
    responses: {
      201: { description: 'Created' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      409: { description: 'Conflict', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});
definePath('/api/employees/search', {
  get: {
    tags: ['Employees'],
    summary: 'Search employees',
    parameters: [
      { name: 'q', in: 'query', required: true, schema: { type: 'string' } }
    ],
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});
definePath('/api/employees/{id}', {
  get: {
    tags: ['Employees'],
    summary: 'Get employee details',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  },
  put: {
    tags: ['Employees'],
    summary: 'Update employee',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              first_name: { type: 'string' },
              last_name: { type: 'string' },
              email: { type: 'string', format: 'email' },
              phone: { type: 'string' },
              department_id: { type: 'integer' },
              job_title: { type: 'string' },
              manager_id: { type: 'integer' },
              hire_date: { type: 'string', format: 'date' },
              date_of_birth: { type: 'string', format: 'date' },
              status: { type: 'string', enum: ['active', 'inactive', 'on_leave', 'terminated'] },
              skills: { type: 'array', items: { type: 'string' } },
              certifications: { type: 'array', items: { type: 'string' } },
              compliance_score: { type: 'number' }
            }
          }
        }
      }
    },
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      409: { description: 'Conflict', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  },
  delete: {
    tags: ['Employees'],
    summary: 'Deactivate employee',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});
definePath('/api/employees/{id}/compliance', {
  get: {
    tags: ['Compliance'],
    summary: 'Get employee compliance summary',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                data: { $ref: '#/components/schemas/EmployeeComplianceGetData' }
              },
              required: ['message', 'data']
            }
          }
        }
      },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  },
  post: {
    tags: ['Compliance'],
    summary: 'Create employee compliance record',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['template_id', 'due_date'],
            properties: {
              template_id: { type: 'integer' },
              due_date: { type: 'string', format: 'date' },
              status: { type: 'string', enum: ['pending', 'completed', 'overdue', 'failed'] },
              notes: { type: 'string' },
              checked_by: { type: 'integer' }
            }
          }
        }
      }
    },
    responses: {
      201: {
        description: 'Created',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                data: { $ref: '#/components/schemas/ComplianceRecord' }
              },
              required: ['message', 'data']
            }
          }
        }
      },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});
definePath('/api/compliance-records/{id}', {
  put: {
    tags: ['Compliance'],
    summary: 'Update compliance record',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['pending', 'completed', 'overdue', 'failed'] },
              notes: { type: 'string' },
              checked_by: { type: 'integer' },
              due_date: { type: 'string', format: 'date' }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                data: { $ref: '#/components/schemas/ComplianceRecord' }
              },
              required: ['message', 'data']
            }
          }
        }
      },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});
definePath('/api/employees/{id}/training', {
  get: {
    tags: ['Training'],
    summary: 'Get employee training history',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                data: { $ref: '#/components/schemas/EmployeeTrainingGetData' }
              },
              required: ['message', 'data']
            }
          }
        }
      },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  },
  post: {
    tags: ['Training'],
    summary: 'Create/update employee training enrollment',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['course_id'],
            properties: {
              course_id: { type: 'integer' },
              status: { type: 'string', enum: ['enrolled', 'in_progress', 'completed', 'failed', 'dropped'] },
              final_score: { type: 'integer' }
            }
          }
        }
      }
    },
    responses: {
      201: {
        description: 'Created',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                data: { $ref: '#/components/schemas/TrainingEnrollment' }
              },
              required: ['message', 'data']
            }
          }
        }
      },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});
definePath('/api/employees/{id}/onboard', {
  get: {
    tags: ['Onboarding'],
    summary: 'Get onboarding status',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                data: { $ref: '#/components/schemas/OnboardingGetData' }
              },
              required: ['message', 'data']
            }
          }
        }
      },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  },
  post: {
    tags: ['Onboarding'],
    summary: 'Start onboarding workflow',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    requestBody: {
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              template_id: { type: 'integer' },
              total_steps: { type: 'integer', minimum: 1 }
            }
          }
        }
      }
    },
    responses: {
      201: {
        description: 'Created',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                data: { type: 'object' }
              },
              required: ['message', 'data']
            }
          }
        }
      },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      409: { description: 'Conflict', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});
definePath('/api/employees/{id}/onboard/step', {
  post: {
    tags: ['Onboarding'],
    summary: 'Complete onboarding step',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['task_id'],
            properties: {
              task_id: { type: 'integer' },
              notes: { type: 'string' }
            }
          }
        }
      }
    },
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                message: { type: 'string' },
                data: { $ref: '#/components/schemas/OnboardingStepData' }
              },
              required: ['message', 'data']
            }
          }
        }
      },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      409: { description: 'Conflict', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/departments', {
  get: {
    tags: ['Departments'],
    summary: 'List departments',
    parameters: [
      { name: 'page', in: 'query', required: false, schema: { type: 'integer' } },
      { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } },
      { name: 'q', in: 'query', required: false, schema: { type: 'string' } }
    ],
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  },
  post: {
    tags: ['Departments'],
    summary: 'Create department',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['name'],
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              manager_id: { type: 'integer' },
              budget: { type: 'number' },
              parent_department_id: { type: 'integer' }
            }
          }
        }
      }
    },
    responses: {
      201: { description: 'Created' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});
definePath('/api/departments/{id}', {
  get: {
    tags: ['Departments'],
    summary: 'Get department details',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  },
  put: {
    tags: ['Departments'],
    summary: 'Update department',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              manager_id: { type: 'integer' },
              budget: { type: 'number' },
              parent_department_id: { type: 'integer' }
            }
          }
        }
      }
    },
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  },
  delete: {
    tags: ['Departments'],
    summary: 'Delete department',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      409: { description: 'Conflict', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/assets', {
  get: {
    tags: ['Assets'],
    summary: 'List assets',
    parameters: [
      { name: 'page', in: 'query', required: false, schema: { type: 'integer' } },
      { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } },
      { name: 'q', in: 'query', required: false, schema: { type: 'string' } },
      { name: 'status', in: 'query', required: false, schema: { type: 'string' } },
      { name: 'asset_type', in: 'query', required: false, schema: { type: 'string' } }
    ],
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  },
  post: {
    tags: ['Assets'],
    summary: 'Create asset',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['asset_number', 'name', 'asset_type'],
            properties: {
              asset_number: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              asset_type: { type: 'string' },
              category: { type: 'string' },
              location: { type: 'string' },
              responsible_person_id: { type: 'integer' },
              purchase_date: { type: 'string', format: 'date' },
              cost: { type: 'number' },
              warranty_expiry: { type: 'string', format: 'date' },
              status: { type: 'string' }
            }
          }
        }
      }
    },
    responses: {
      201: { description: 'Created' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      409: { description: 'Conflict', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/assets/{id}', {
  get: {
    tags: ['Assets'],
    summary: 'Get asset details',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  },
  put: {
    tags: ['Assets'],
    summary: 'Update asset',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              asset_number: { type: 'string' },
              name: { type: 'string' },
              description: { type: 'string' },
              asset_type: { type: 'string' },
              category: { type: 'string' },
              location: { type: 'string' },
              responsible_person_id: { type: 'integer' },
              purchase_date: { type: 'string', format: 'date' },
              cost: { type: 'number' },
              warranty_expiry: { type: 'string', format: 'date' },
              status: { type: 'string' }
            }
          }
        }
      }
    },
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      409: { description: 'Conflict', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  },
  delete: {
    tags: ['Assets'],
    summary: 'Archive asset',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/files/upload', {
  post: {
    tags: ['Files'],
    summary: 'Upload file',
    requestBody: {
      required: true,
      content: {
        'multipart/form-data': {
          schema: {
            type: 'object',
            required: ['file'],
            properties: {
              file: { type: 'string', format: 'binary' },
              uploadType: { type: 'string' },
              description: { type: 'string' }
            }
          }
        }
      }
    },
    responses: {
      201: { description: 'Created' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});
definePath('/api/files', {
  get: {
    tags: ['Files'],
    summary: 'List files',
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});
definePath('/api/files/{id}', {
  get: {
    tags: ['Files'],
    summary: 'Get file details',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  },
  delete: {
    tags: ['Files'],
    summary: 'Delete file',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});
definePath('/api/files/{id}/presigned-url', {
  get: {
    tags: ['Files'],
    summary: 'Get pre-signed URL',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } },
      { name: 'expiry', in: 'query', required: false, schema: { type: 'integer' } }
    ],
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});
definePath('/api/health', {
  get: {
    tags: ['System'],
    summary: 'Health check',
    security: [],
    responses: {
      200: {
        description: 'OK',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                service: { type: 'string' },
                environment: { type: 'string' },
                database: { type: 'string' },
                error: { type: 'string', nullable: true },
                timestamp: { type: 'string', format: 'date-time' }
              },
              required: ['status', 'service', 'environment', 'database', 'timestamp']
            }
          }
        }
      }
    }
  }
});

definePath('/api/admin/summary', {
  get: {
    tags: ['Admin'],
    summary: 'Get admin summary',
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/admin/settings', {
  get: {
    tags: ['Admin'],
    summary: 'Get admin settings',
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  },
  put: {
    tags: ['Admin'],
    summary: 'Update admin settings',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              incident_escalation_threshold: { type: 'integer' },
              compliance_target: { type: 'integer' },
              session_timeout_minutes: { type: 'integer' },
              require_mfa: { type: 'boolean' },
              email_alerts_enabled: { type: 'boolean' },
              in_app_alerts_enabled: { type: 'boolean' }
            }
          }
        }
      }
    },
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/admin/audit-log', {
  get: {
    tags: ['Admin'],
    summary: 'Get audit log',
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/admin/users', {
  get: {
    tags: ['Admin'],
    summary: 'Get user list for admin view',
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/permits', {
  get: {
    tags: ['Permits'],
    summary: 'List permits',
    parameters: [
      { name: 'page', in: 'query', required: false, schema: { type: 'integer' } },
      { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } },
      { name: 'status', in: 'query', required: false, schema: { type: 'string' } },
      { name: 'permit_type', in: 'query', required: false, schema: { type: 'string' } },
      { name: 'q', in: 'query', required: false, schema: { type: 'string' } }
    ],
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  },
  post: {
    tags: ['Permits'],
    summary: 'Create permit',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['permit_type', 'title'],
            properties: {
              permit_type: { type: 'string', enum: ['hot_work', 'confined_space', 'lifting', 'electrical', 'general', 'ssra'] },
              title: { type: 'string' },
              description: { type: 'string' },
              site: { type: 'string' },
              location: { type: 'string' },
              approver_id: { type: 'integer' },
              status: { type: 'string', enum: ['draft', 'submitted', 'pending_review', 'approved', 'rejected', 'expired'] },
              risk_level: { type: 'string' },
              approval_notes: { type: 'string' },
              effective_from: { type: 'string', format: 'date-time' },
              effective_to: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    },
    responses: {
      201: { description: 'Created' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/permits/{id}', {
  get: {
    tags: ['Permits'],
    summary: 'Get permit details',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  },
  put: {
    tags: ['Permits'],
    summary: 'Update permit',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              permit_type: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              site: { type: 'string' },
              location: { type: 'string' },
              approver_id: { type: 'integer' },
              status: { type: 'string' },
              risk_level: { type: 'string' },
              approval_notes: { type: 'string' },
              effective_from: { type: 'string', format: 'date-time' },
              effective_to: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    },
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/permits/{id}/approve', {
  post: {
    tags: ['Permits'],
    summary: 'Approve permit',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    requestBody: {
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              approval_notes: { type: 'string' },
              approver_id: { type: 'integer' }
            }
          }
        }
      }
    },
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/permits/{id}/reject', {
  post: {
    tags: ['Permits'],
    summary: 'Reject permit',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    requestBody: {
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              approval_notes: { type: 'string' },
              approver_id: { type: 'integer' }
            }
          }
        }
      }
    },
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/incidents', {
  get: {
    tags: ['Incidents'],
    summary: 'List incidents',
    parameters: [
      { name: 'page', in: 'query', required: false, schema: { type: 'integer' } },
      { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } },
      { name: 'status', in: 'query', required: false, schema: { type: 'string' } },
      { name: 'severity', in: 'query', required: false, schema: { type: 'string' } },
      { name: 'category', in: 'query', required: false, schema: { type: 'string' } },
      { name: 'q', in: 'query', required: false, schema: { type: 'string' } }
    ],
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  },
  post: {
    tags: ['Incidents'],
    summary: 'Create incident',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['title', 'description'],
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string', enum: ['safety', 'environmental', 'health', 'security', 'other'] },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              location: { type: 'string' },
              date_occurred: { type: 'string', format: 'date-time' },
              assigned_to: { type: 'integer' },
              root_cause: { type: 'string' },
              corrective_actions: { type: 'array', items: { type: 'string' } },
              due_date: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    },
    responses: {
      201: { description: 'Created' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/incidents/{id}', {
  get: {
    tags: ['Incidents'],
    summary: 'Get incident details',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  },
  put: {
    tags: ['Incidents'],
    summary: 'Update incident',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              description: { type: 'string' },
              category: { type: 'string' },
              severity: { type: 'string' },
              status: { type: 'string' },
              location: { type: 'string' },
              assigned_to: { type: 'integer' },
              root_cause: { type: 'string' },
              corrective_actions: { type: 'array', items: { type: 'string' } },
              due_date: { type: 'string', format: 'date-time' }
            }
          }
        }
      }
    },
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/incidents/{id}/resolve', {
  post: {
    tags: ['Incidents'],
    summary: 'Resolve incident',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    requestBody: {
      required: false,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              root_cause: { type: 'string' },
              corrective_actions: { type: 'array', items: { type: 'string' } },
              notes: { type: 'string' }
            }
          }
        }
      }
    },
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/incidents/summary', {
  get: {
    tags: ['Incidents'],
    summary: 'Get incident summary',
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/dashboard/summary', {
  get: {
    tags: ['Dashboard'],
    summary: 'Get dashboard summary',
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/dashboard/kpis', {
  get: {
    tags: ['Dashboard'],
    summary: 'Get KPI data',
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/dashboard/compliance', {
  get: {
    tags: ['Dashboard'],
    summary: 'Get compliance dashboard data',
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/dashboard/incidents', {
  get: {
    tags: ['Dashboard'],
    summary: 'Get incident dashboard data',
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/dashboard/certificates', {
  get: {
    tags: ['Dashboard'],
    summary: 'Get certificate dashboard data',
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/reports/export', {
  get: {
    tags: ['Reports'],
    summary: 'Export consolidated report data',
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/hr/leaves', {
  get: {
    tags: ['HR'],
    summary: 'List leave types',
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/hr/leave-request', {
  get: {
    tags: ['HR'],
    summary: 'List leave requests',
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  },
  post: {
    tags: ['HR'],
    summary: 'Create leave request',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['employee_id', 'start_date', 'end_date'],
            properties: {
              employee_id: { type: 'integer' },
              employee_name: { type: 'string' },
              leave_type: { type: 'string' },
              start_date: { type: 'string', format: 'date' },
              end_date: { type: 'string', format: 'date' },
              reason: { type: 'string' }
            }
          }
        }
      }
    },
    responses: {
      201: { description: 'Created' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/hr/leave-request/{id}', {
  put: {
    tags: ['HR'],
    summary: 'Update leave request',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              leave_type: { type: 'string' },
              start_date: { type: 'string', format: 'date' },
              end_date: { type: 'string', format: 'date' },
              reason: { type: 'string' },
              status: { type: 'string' }
            }
          }
        }
      }
    },
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/hr/leave-request/{id}/approve', {
  post: {
    tags: ['HR'],
    summary: 'Approve leave request',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/hr/leave-request/{id}/reject', {
  post: {
    tags: ['HR'],
    summary: 'Reject leave request',
    parameters: [
      { name: 'id', in: 'path', required: true, schema: { type: 'integer' } }
    ],
    responses: {
      200: { description: 'OK' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      404: { description: 'Not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/hr/attendance', {
  get: {
    tags: ['HR'],
    summary: 'List attendance records',
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/hr/payroll', {
  get: {
    tags: ['HR'],
    summary: 'List payroll information',
    responses: {
      200: { description: 'OK' },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

definePath('/api/hr/payroll/process', {
  post: {
    tags: ['HR'],
    summary: 'Process payroll entry',
    requestBody: {
      required: true,
      content: {
        'application/json': {
          schema: {
            type: 'object',
            required: ['employee_id'],
            properties: {
              employee_id: { type: 'integer' },
              payroll_month: { type: 'integer' },
              payroll_year: { type: 'integer' },
              gross_salary: { type: 'number' },
              deductions: { type: 'object' },
              net_salary: { type: 'number' },
              tax_amount: { type: 'number' },
              status: { type: 'string' }
            }
          }
        }
      }
    },
    responses: {
      201: { description: 'Created' },
      400: { description: 'Bad request', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      401: { description: 'Unauthorized', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } },
      500: { description: 'Server error', content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } } }
    }
  }
});

app.get('/api/docs.json', (req, res) => {
  res.json(apiDoc);
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(apiDoc, {
  explorer: true,
  customSiteTitle: 'EHS Suite API Docs'
}));

// Start server
const server = app.listen(PORT, () => {
  console.log(`EHS Suite Backend is running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

let isShuttingDown = false;

const shutdown = async (signal) => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  server.close(async () => {
    try {
      await pool.end();
      console.log('PostgreSQL pool closed. Shutdown complete.');
      process.exit(0);
    } catch (error) {
      console.error('Error while closing PostgreSQL pool:', error);
      process.exit(1);
    }
  });

  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

module.exports = app;
