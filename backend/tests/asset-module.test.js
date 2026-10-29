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

test('asset module exposes list and create APIs', async () => {
  const token = await login();

  const listResponse = await fetch(`${BASE_URL}/api/assets?limit=10`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const listPayload = await listResponse.json();
  assert.equal(listResponse.status, 200, `Expected asset list to succeed, got ${listResponse.status}: ${listPayload.error || 'unknown error'}`);
  assert.ok(Array.isArray(listPayload.data), 'Asset list should return a data array');

  const assetNumber = `ASSET-API-${Date.now()}`;
  const createResponse = await fetch(`${BASE_URL}/api/assets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      asset_number: assetNumber,
      name: 'Forklift 24A',
      description: 'Asset created during module verification.',
      asset_type: 'equipment',
      category: 'Material Handling',
      location: 'Warehouse Bay 2',
      responsible_person_id: 1,
      purchase_date: '2024-02-15',
      cost: 18500.00,
      warranty_expiry: '2029-02-15',
      status: 'active'
    })
  });

  const createPayload = await createResponse.json();
  assert.equal(createResponse.status, 201, `Expected asset create to succeed, got ${createResponse.status}: ${createPayload.error || 'unknown error'}`);
  assert.ok(createPayload.data && createPayload.data.id, 'Asset create should return created record data');
  assert.equal(createPayload.data.asset_number, assetNumber);
});
