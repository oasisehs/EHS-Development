const test = require('node:test');
const assert = require('node:assert/strict');
const { Pool } = require('pg');

const BASE_URL = 'http://localhost:5000';
const pool = new Pool({
  host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.DB_NAME || process.env.POSTGRES_DB || 'ehsdb',
  user: process.env.DB_USER || process.env.POSTGRES_USER || 'ehsuser',
  password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'ehspassword123'
});

async function login() {
  const response = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@ehssuite.com',
      password: 'demo123456'
    })
  });

  const payload = await response.json();
  assert.equal(response.status, 200, `Login failed: ${payload.error || 'unknown error'}`);
  return payload.token;
}

async function getSeedIds() {
  const [courseRow, templateRow] = await Promise.all([
    pool.query('SELECT id FROM courses ORDER BY id ASC LIMIT 1'),
    pool.query('SELECT id FROM compliance_templates ORDER BY id ASC LIMIT 1')
  ]);

  return {
    courseId: courseRow.rows[0]?.id ?? null,
    templateId: templateRow.rows[0]?.id ?? null
  };
}

test('training and compliance module exposes the expected employee endpoints', async () => {
  const token = await login();
  const { courseId, templateId } = await getSeedIds();

  assert.ok(courseId, 'Expected at least one seeded training course');
  assert.ok(templateId, 'Expected at least one seeded compliance template');

  const trainingListResponse = await fetch(`${BASE_URL}/api/employees/1/training`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const trainingListPayload = await trainingListResponse.json();
  assert.equal(trainingListResponse.status, 200, `Expected training list to succeed, got ${trainingListResponse.status}: ${trainingListPayload.error || 'unknown error'}`);
  assert.ok(trainingListPayload.data, 'Training response should contain a data object');
  assert.ok(Array.isArray(trainingListPayload.data.enrollments), 'Training data should include enrollments array');

  const trainingCreateResponse = await fetch(`${BASE_URL}/api/employees/1/training`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      course_id: courseId,
      status: 'completed',
      final_score: 95
    })
  });

  const trainingCreatePayload = await trainingCreateResponse.json();
  assert.equal(trainingCreateResponse.status, 201, `Expected training create to succeed, got ${trainingCreateResponse.status}: ${trainingCreatePayload.error || 'unknown error'}`);
  assert.ok(trainingCreatePayload.data && trainingCreatePayload.data.course_id === courseId, 'Created training record should include the selected course id');

  const complianceListResponse = await fetch(`${BASE_URL}/api/employees/1/compliance`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const complianceListPayload = await complianceListResponse.json();
  assert.equal(complianceListResponse.status, 200, `Expected compliance list to succeed, got ${complianceListResponse.status}: ${complianceListPayload.error || 'unknown error'}`);
  assert.ok(complianceListPayload.data, 'Compliance response should contain a data object');
  assert.ok(Array.isArray(complianceListPayload.data.records), 'Compliance data should include records array');

  const complianceCreateResponse = await fetch(`${BASE_URL}/api/employees/1/compliance`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      template_id: templateId,
      due_date: '2026-12-31',
      status: 'pending',
      notes: 'Quarterly review required'
    })
  });

  const complianceCreatePayload = await complianceCreateResponse.json();
  assert.equal(complianceCreateResponse.status, 201, `Expected compliance create to succeed, got ${complianceCreateResponse.status}: ${complianceCreatePayload.error || 'unknown error'}`);
  assert.ok(complianceCreatePayload.data && complianceCreatePayload.data.template_id === templateId, 'Created compliance record should include the selected template id');
});
