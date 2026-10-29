const test = require('node:test');
const assert = require('node:assert/strict');

const BASE_URL = 'http://localhost:5000';

async function login() {
  const response = await fetch(`${BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'demo@ehssuite.com',
      password: 'Demo@123456'
    })
  });

  const payload = await response.json();
  assert.equal(response.status, 200, `Login failed: ${payload.error || 'unknown error'}`);
  return payload.token;
}

test('permit module exposes list and create APIs', async () => {
  const token = await login();

  const listResponse = await fetch(`${BASE_URL}/api/permits?limit=10`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const listPayload = await listResponse.json();
  assert.equal(listResponse.status, 200, `Expected permit list to succeed, got ${listResponse.status}: ${listPayload.error || 'unknown error'}`);
  assert.ok(Array.isArray(listPayload.data), 'Permit list should return a data array');

  const createResponse = await fetch(`${BASE_URL}/api/permits`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      permit_type: 'hot_work',
      title: 'Permit API test',
      submitted_by: 1,
      site: 'Plant A',
      location: 'Warehouse Bay 2',
      description: 'Test permit created during module verification.',
      status: 'draft'
    })
  });

  const createPayload = await createResponse.json();
  assert.equal(createResponse.status, 201, `Expected permit create to succeed, got ${createResponse.status}: ${createPayload.error || 'unknown error'}`);
  assert.ok(createPayload.data && createPayload.data.id, 'Permit create should return created record data');
  assert.equal(createPayload.data.permit_type, 'hot_work');
});
