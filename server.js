const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const aws = require('aws-sdk');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

// ===== AWS S3 CONFIGURATION =====
aws.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
});

const s3 = new aws.S3();
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
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://oasis:H5m3zZheus4iDA5RxS6HeCcDC8DwCBgV@dpg-d95i9fpoagis738st8p0-a.oregon-postgres.render.com/ehsdb_o0dm',
  ssl: {
    rejectUnauthorized: false
  }
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection error:', err);
  } else {
    console.log('Connected to PostgreSQL database:', res.rows[0].now);
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ===== DATABASE INITIALIZATION =====
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

    console.log('Database tables initialized successfully');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

initializeDatabase();

// ===== AUTHENTICATION ROUTES =====

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, fullName, company, department, phone } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, password, full_name, company, department, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, full_name',
      [email, hashedPassword, fullName, company, department, phone]
    );

    // Generate token
    const token = jwt.sign({ userId: result.rows[0].id, email: result.rows[0].email }, JWT_SECRET);

    res.status(201).json({
      message: 'User registered successfully',
      user: result.rows[0],
      token
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        company: user.company,
        department: user.department
      },
      token
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Forgot Password - Generate Reset Token
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate reset token (in production, store in DB with expiration)
    const resetToken = jwt.sign({ userId: result.rows[0].id }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: 'Password reset token generated',
      resetToken,
      note: 'In production, this should be sent via email'
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Request failed' });
  }
});

// Reset Password
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await pool.query('UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [hashedPassword, decoded.userId]);

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// ===== EHS DATA ROUTES =====

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - no token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Get user's EHS records
app.get('/api/ehs-records', verifyToken, async (req, res) => {
  try {
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
    const result = await pool.query(
      'SELECT id, email, full_name, company, department, phone FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// ===== FILE UPLOAD & S3 ENDPOINTS =====

// Upload file to S3
app.post('/api/files/upload', verifyToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    if (!S3_BUCKET || !process.env.AWS_ACCESS_KEY_ID) {
      return res.status(500).json({ error: 'S3 not configured. Please set AWS credentials in .env' });
    }

    const fileName = req.file.originalname;
    const fileSize = req.file.size;
    const fileType = req.file.mimetype;
    const uploadType = req.body.uploadType || 'document';
    const description = req.body.description || '';

    // Generate unique S3 key
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(7);
    const s3Key = `ehs/${req.userId}/${timestamp}-${randomString}-${fileName}`;

    // Upload to S3
    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: fileType,
      Metadata: {
        'original-filename': fileName,
        'user-id': req.userId.toString()
      }
    };

    s3.upload(params, async (err, data) => {
      if (err) {
        console.error('S3 upload error:', err);
        return res.status(500).json({ error: 'Failed to upload file to S3', details: err.message });
      }

      try {
        // Save file metadata to database
        const s3Url = data.Location;
        const result = await pool.query(
          'INSERT INTO files (user_id, file_name, s3_key, s3_url, file_size, file_type, upload_type, description) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
          [req.userId, fileName, s3Key, s3Url, fileSize, fileType, uploadType, description]
        );

        res.status(201).json({
          message: 'File uploaded successfully',
          file: {
            id: result.rows[0].id,
            fileName: result.rows[0].file_name,
            s3Url: result.rows[0].s3_url,
            fileSize: result.rows[0].file_size,
            fileType: result.rows[0].file_type,
            uploadType: result.rows[0].upload_type,
            createdAt: result.rows[0].created_at
          }
        });
      } catch (dbErr) {
        console.error('Database error:', dbErr);
        res.status(500).json({ error: 'File uploaded to S3 but failed to save metadata', s3Url: data.Location });
      }
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'File upload failed', details: err.message });
  }
});

// Get user's uploaded files
app.get('/api/files', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, file_name, s3_url, file_size, file_type, upload_type, description, created_at FROM files WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching files:', err);
    res.status(500).json({ error: 'Failed to fetch files' });
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

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching file:', err);
    res.status(500).json({ error: 'Failed to fetch file' });
  }
});

// Delete file from S3 and database
app.delete('/api/files/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Get file info
    const fileResult = await pool.query(
      'SELECT s3_key FROM files WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const s3Key = fileResult.rows[0].s3_key;

    // Delete from S3
    const s3Params = {
      Bucket: S3_BUCKET,
      Key: s3Key
    };

    s3.deleteObject(s3Params, async (err) => {
      if (err) {
        console.error('S3 delete error:', err);
        return res.status(500).json({ error: 'Failed to delete file from S3' });
      }

      try {
        // Delete from database
        await pool.query('DELETE FROM files WHERE id = $1 AND user_id = $2', [id, req.userId]);
        res.json({ message: 'File deleted successfully' });
      } catch (dbErr) {
        console.error('Database error:', dbErr);
        res.status(500).json({ error: 'Failed to delete file record from database' });
      }
    });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'File deletion failed' });
  }
});

// Generate pre-signed URL for secure file access
app.get('/api/files/:id/presigned-url', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const expirySeconds = parseInt(req.query.expiry) || 3600; // 1 hour default

    const fileResult = await pool.query(
      'SELECT s3_key FROM files WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (fileResult.rows.length === 0) {
      return res.status(404).json({ error: 'File not found' });
    }

    const s3Key = fileResult.rows[0].s3_key;

    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Expires: expirySeconds
    };

    const presignedUrl = s3.getSignedUrl('getObject', params);

    res.json({
      presignedUrl,
      expiresIn: expirySeconds
    });
  } catch (err) {
    console.error('Pre-signed URL error:', err);
    res.status(500).json({ error: 'Failed to generate pre-signed URL' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Start server
app.listen(PORT, () => {
  console.log(`EHS Suite Backend is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
