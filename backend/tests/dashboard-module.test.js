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

test('dashboard summary and KPI APIs expose the expected operational snapshot', async () => {
  const token = await login();

  const summaryResponse = await fetch(`${BASE_URL}/api/dashboard/summary`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const summaryPayload = await summaryResponse.json();
  assert.equal(summaryResponse.status, 200, `Expected dashboard summary to succeed, got ${summaryResponse.status}: ${summaryPayload.error || 'unknown error'}`);
  assert.ok(summaryPayload.data && typeof summaryPayload.data.total_employees === 'number', 'Dashboard summary should expose employee totals');
  assert.ok(summaryPayload.data && typeof summaryPayload.data.active_incidents === 'number', 'Dashboard summary should expose incident totals');

  const kpisResponse = await fetch(`${BASE_URL}/api/dashboard/kpis`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const kpisPayload = await kpisResponse.json();
  assert.equal(kpisResponse.status, 200, `Expected KPI endpoint to succeed, got ${kpisResponse.status}: ${kpisPayload.error || 'unknown error'}`);
  assert.ok(Array.isArray(kpisPayload.data), 'KPI endpoint should return a data array');
});
