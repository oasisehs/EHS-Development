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

test('document module exposes list and upload APIs with consistent JSON payloads', async () => {
  const token = await login();

  const listResponse = await fetch(`${BASE_URL}/api/files`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const listPayload = await listResponse.json();
  assert.equal(listResponse.status, 200, `Expected file list to succeed, got ${listResponse.status}: ${listPayload.error || 'unknown error'}`);
  assert.ok(Array.isArray(listPayload.data), 'Document list should return a data array');

  const formData = new FormData();
  formData.append('file', new Blob(['sample document text'], { type: 'text/plain' }), 'sample.txt');
  formData.append('uploadType', 'document');
  formData.append('description', 'Sample document upload');

  const uploadResponse = await fetch(`${BASE_URL}/api/files/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  const uploadPayload = await uploadResponse.json();
  assert.equal(uploadResponse.status, 201, `Expected upload to succeed, got ${uploadResponse.status}: ${uploadPayload.error || 'unknown error'}`);
  assert.ok(uploadPayload.data && uploadPayload.data.file_name === 'sample.txt', 'Upload response should include created file metadata');
});
