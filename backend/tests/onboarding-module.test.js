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

test('onboarding module exposes workflow start, status, and completion APIs', async () => {
  const token = await login();
  const employeeId = 1;

  const startResponse = await fetch(`${BASE_URL}/api/employees/${employeeId}/onboard`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      template_id: 1,
      total_steps: 3
    })
  });

  const startPayload = await startResponse.json();
  assert.equal(startResponse.status, 201, `Expected onboarding start to succeed, got ${startResponse.status}: ${startPayload.error || 'unknown error'}`);
  assert.ok(startPayload.data && startPayload.data.id, 'Onboarding create should return checklist data');

  const statusResponse = await fetch(`${BASE_URL}/api/employees/${employeeId}/onboard`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const statusPayload = await statusResponse.json();
  assert.equal(statusResponse.status, 200, `Expected onboarding fetch to succeed, got ${statusResponse.status}: ${statusPayload.error || 'unknown error'}`);
  assert.ok(Array.isArray(statusPayload.tasks), 'Onboarding status should return tasks');
  assert.ok(statusPayload.data && statusPayload.data.checklist, 'Onboarding status should include checklist');

  const firstTask = statusPayload.tasks[0];
  assert.ok(firstTask && firstTask.id, 'Expected at least one onboarding task');

  const stepResponse = await fetch(`${BASE_URL}/api/employees/${employeeId}/onboard/step`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      task_id: firstTask.id,
      notes: 'Completed during API verification.'
    })
  });

  const stepPayload = await stepResponse.json();
  assert.equal(stepResponse.status, 200, `Expected onboarding step completion to succeed, got ${stepResponse.status}: ${stepPayload.error || 'unknown error'}`);
  assert.ok(stepPayload.data && stepPayload.data.task, 'Onboarding step completion should return task data');
});
