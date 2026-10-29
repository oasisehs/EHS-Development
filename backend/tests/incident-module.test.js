const test = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = 'http://localhost:5000';

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

test('incident module exposes list and create APIs', async () => {
  const token = await login();

  const listResponse = await fetch(`${BASE_URL}/api/incidents?limit=10`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const listPayload = await listResponse.json();
  assert.equal(listResponse.status, 200, `Expected incident list to succeed, got ${listResponse.status}: ${listPayload.error || 'unknown error'}`);
  assert.ok(Array.isArray(listPayload.data), 'Incident list should return a data array');

  const createResponse = await fetch(`${BASE_URL}/api/incidents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      title: 'Incident API test',
      description: 'Forklift near miss during shift handover.',
      category: 'safety',
      severity: 'medium',
      location: 'Warehouse Bay 2',
      date_occurred: new Date().toISOString(),
      status: 'open'
    })
  });

  const createPayload = await createResponse.json();
  assert.equal(createResponse.status, 201, `Expected incident create to succeed, got ${createResponse.status}: ${createPayload.error || 'unknown error'}`);
  assert.ok(createPayload.data && createPayload.data.id, 'Incident create should return created record data');
  assert.equal(createPayload.data.category, 'safety');
});
