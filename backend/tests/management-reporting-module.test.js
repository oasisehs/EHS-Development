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

test('Management reporting endpoints expose compliance, incidents, certificates, and export data', async () => {
  const token = await login();

  const complianceResponse = await fetch(`${BASE_URL}/api/dashboard/compliance`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const compliancePayload = await complianceResponse.json();
  assert.equal(complianceResponse.status, 200, `Expected compliance summary to load, got ${complianceResponse.status}: ${compliancePayload.error || 'unknown error'}`);
  assert.ok(compliancePayload.data !== undefined, 'Compliance response should include a data payload');

  const incidentResponse = await fetch(`${BASE_URL}/api/dashboard/incidents`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const incidentPayload = await incidentResponse.json();
  assert.equal(incidentResponse.status, 200, `Expected incident dashboard summary to load, got ${incidentResponse.status}: ${incidentPayload.error || 'unknown error'}`);
  assert.ok(incidentPayload.data !== undefined, 'Incident dashboard response should include a data payload');

  const certificateResponse = await fetch(`${BASE_URL}/api/dashboard/certificates`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const certificatePayload = await certificateResponse.json();
  assert.equal(certificateResponse.status, 200, `Expected certificate dashboard to load, got ${certificateResponse.status}: ${certificatePayload.error || 'unknown error'}`);
  assert.ok(Array.isArray(certificatePayload.data) || certificatePayload.data !== undefined, 'Certificate dashboard response should include data');

  const exportResponse = await fetch(`${BASE_URL}/api/reports/export`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const exportPayload = await exportResponse.json();
  assert.equal(exportResponse.status, 200, `Expected reports export to load, got ${exportResponse.status}: ${exportPayload.error || 'unknown error'}`);
  assert.ok(exportPayload.data !== undefined, 'Reports export response should include a data payload');
});
