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

test('HR and payroll endpoints expose leave workflow and payroll data', async () => {
  const token = await login();

  const leaveTypesResponse = await fetch(`${BASE_URL}/api/hr/leaves`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const leaveTypesPayload = await leaveTypesResponse.json();
  assert.equal(leaveTypesResponse.status, 200, `Expected leave types to load, got ${leaveTypesResponse.status}: ${leaveTypesPayload.error || 'unknown error'}`);
  assert.ok(Array.isArray(leaveTypesPayload.data), 'Leave types response should include a data array');

  const createRequestResponse = await fetch(`${BASE_URL}/api/hr/leave-request`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      employee_name: 'Admin User',
      leave_type: 'annual',
      start_date: '2026-11-10',
      end_date: '2026-11-12',
      reason: 'Annual leave for year-end planning'
    })
  });

  const createRequestPayload = await createRequestResponse.json();
  assert.equal(createRequestResponse.status, 201, `Expected leave request creation to succeed, got ${createRequestResponse.status}: ${createRequestPayload.error || 'unknown error'}`);
  assert.ok(createRequestPayload.data, 'Leave request creation should return a data object');

  const leaveListResponse = await fetch(`${BASE_URL}/api/hr/leave-request`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const leaveListPayload = await leaveListResponse.json();
  assert.equal(leaveListResponse.status, 200, `Expected leave list to load, got ${leaveListResponse.status}: ${leaveListPayload.error || 'unknown error'}`);
  assert.ok(Array.isArray(leaveListPayload.data), 'Leave list response should include a data array');

  const payrollResponse = await fetch(`${BASE_URL}/api/hr/payroll`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const payrollPayload = await payrollResponse.json();
  assert.equal(payrollResponse.status, 200, `Expected payroll overview to load, got ${payrollResponse.status}: ${payrollPayload.error || 'unknown error'}`);
  assert.ok(Array.isArray(payrollPayload.data), 'Payroll response should include a data array');
});
