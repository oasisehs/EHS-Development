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

test('Admin security endpoints expose settings, counts, and audit data for production readiness', async () => {
  const token = await login();
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const summaryResponse = await fetch(`${BASE_URL}/api/admin/summary`, { headers });
  const summaryPayload = await summaryResponse.json();
  assert.equal(summaryResponse.status, 200, `Expected admin summary to succeed, got ${summaryResponse.status}: ${summaryPayload.error || 'unknown error'}`);
  assert.ok(summaryPayload.data && typeof summaryPayload.data.total_users === 'number', 'Admin summary should include total users');
  assert.ok(summaryPayload.data && typeof summaryPayload.data.total_roles === 'number', 'Admin summary should include total roles');

  const settingsResponse = await fetch(`${BASE_URL}/api/admin/settings`, { headers });
  const settingsPayload = await settingsResponse.json();
  assert.equal(settingsResponse.status, 200, `Expected admin settings to succeed, got ${settingsResponse.status}: ${settingsPayload.error || 'unknown error'}`);
  assert.ok(settingsPayload.data && typeof settingsPayload.data.incident_escalation_threshold === 'number', 'Settings should expose the escalation threshold');

  const auditResponse = await fetch(`${BASE_URL}/api/admin/audit-log`, { headers });
  const auditPayload = await auditResponse.json();
  assert.equal(auditResponse.status, 200, `Expected audit log to succeed, got ${auditResponse.status}: ${auditPayload.error || 'unknown error'}`);
  assert.ok(Array.isArray(auditPayload.data), 'Audit log should return a data array');

  const updateResponse = await fetch(`${BASE_URL}/api/admin/settings`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ incident_escalation_threshold: 82 })
  });

  const updatePayload = await updateResponse.json();
  assert.equal(updateResponse.status, 200, `Expected admin settings update to succeed, got ${updateResponse.status}: ${updatePayload.error || 'unknown error'}`);
  assert.equal(updatePayload.data.incident_escalation_threshold, 82, 'Settings update should return the updated threshold');
});
