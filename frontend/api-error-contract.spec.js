import { test, expect } from '@playwright/test';

const BASE_URL = process.env.E2E_BASE_URL || 'http://localhost:5000';
const ADMIN_EMAIL = 'admin@ehssuite.com';
const ADMIN_PASSWORD = 'demo123456';

async function loginAndGetToken(request) {
  const response = await request.post(`${BASE_URL}/api/login`, {
    data: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }
  });

  expect(response.ok()).toBeTruthy();
  const payload = await response.json();
  expect(payload.token).toBeTruthy();
  return payload.token;
}

async function expectStructuredError(response, expectedStatus) {
  expect(response.status()).toBe(expectedStatus);

  const payload = await response.json();
  expect(typeof payload.error).toBe('string');
  expect(payload.code).toBeTruthy();
}

test.describe('API Error Contract', () => {
  test('returns structured 400 validation error for login payload', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/login`, {
      data: {
        email: ADMIN_EMAIL
      }
    });

    await expectStructuredError(response, 400);
  });

  test('returns structured 401 error when token is missing', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/employees`);

    await expectStructuredError(response, 401);
  });

  test('returns structured 404 for unknown forgot-password user', async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/forgot-password`, {
      data: {
        email: `missing-${Date.now()}@ehssuite.com`
      }
    });

    await expectStructuredError(response, 404);
  });

  test('returns structured 400 for invalid employee id on protected route', async ({ request }) => {
    const token = await loginAndGetToken(request);

    const response = await request.get(`${BASE_URL}/api/employees/0`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    await expectStructuredError(response, 400);
  });

  test('returns structured 400 for invalid department id on protected route', async ({ request }) => {
    const token = await loginAndGetToken(request);

    const response = await request.get(`${BASE_URL}/api/departments/0`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    await expectStructuredError(response, 400);
  });

  test('returns structured 400 when file upload is missing file payload', async ({ request }) => {
    const token = await loginAndGetToken(request);

    const response = await request.post(`${BASE_URL}/api/files/upload`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      multipart: {
        uploadType: 'manual'
      }
    });

    await expectStructuredError(response, 400);
  });

  test('returns structured 404 for missing file detail lookup', async ({ request }) => {
    const token = await loginAndGetToken(request);

    const response = await request.get(`${BASE_URL}/api/files/99999999`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    await expectStructuredError(response, 404);
  });

  test('returns structured 404 for missing file pre-signed URL lookup', async ({ request }) => {
    const token = await loginAndGetToken(request);

    const response = await request.get(`${BASE_URL}/api/files/99999999/presigned-url`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    await expectStructuredError(response, 404);
  });

  test('returns structured 404 for missing file delete operation', async ({ request }) => {
    const token = await loginAndGetToken(request);

    const response = await request.delete(`${BASE_URL}/api/files/99999999`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    await expectStructuredError(response, 404);
  });

  test('returns structured 400 for invalid employee id on onboarding status route', async ({ request }) => {
    const token = await loginAndGetToken(request);

    const response = await request.get(`${BASE_URL}/api/employees/0/onboard`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    await expectStructuredError(response, 400);
  });

  test('returns structured 400 for missing task_id on onboarding step completion', async ({ request }) => {
    const token = await loginAndGetToken(request);

    const response = await request.post(`${BASE_URL}/api/employees/5/onboard/step`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {}
    });

    await expectStructuredError(response, 400);
  });

  test('returns structured 400 for missing course_id on training enrollment', async ({ request }) => {
    const token = await loginAndGetToken(request);

    const response = await request.post(`${BASE_URL}/api/employees/5/training`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {}
    });

    await expectStructuredError(response, 400);
  });

  test('returns structured 400 for missing template_id on compliance record creation', async ({ request }) => {
    const token = await loginAndGetToken(request);

    const response = await request.post(`${BASE_URL}/api/employees/5/compliance`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
        due_date: '2030-01-01'
      }
    });

    await expectStructuredError(response, 400);
  });

  test('returns structured 400 for missing due_date on compliance record creation', async ({ request }) => {
    const token = await loginAndGetToken(request);

    const response = await request.post(`${BASE_URL}/api/employees/5/compliance`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
        template_id: 1
      }
    });

    await expectStructuredError(response, 400);
  });

  test('returns structured 400 for invalid compliance record update payload', async ({ request }) => {
    const token = await loginAndGetToken(request);

    const response = await request.put(`${BASE_URL}/api/compliance-records/1`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {}
    });

    await expectStructuredError(response, 400);
  });

  test('returns structured 400 for invalid asset id lookup', async ({ request }) => {
    const token = await loginAndGetToken(request);

    const response = await request.get(`${BASE_URL}/api/assets/0`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    await expectStructuredError(response, 400);
  });

  test('returns structured 400 for missing required asset fields', async ({ request }) => {
    const token = await loginAndGetToken(request);

    const response = await request.post(`${BASE_URL}/api/assets`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
        name: 'Missing Number Asset'
      }
    });

    await expectStructuredError(response, 400);
  });

  test('returns structured 409 for duplicate asset number', async ({ request }) => {
    const token = await loginAndGetToken(request);
    const assetNumber = `ASSET-DUP-${Date.now()}`;

    const createResponse = await request.post(`${BASE_URL}/api/assets`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
        asset_number: assetNumber,
        name: 'Duplicate Test Asset',
        asset_type: 'equipment',
        status: 'active'
      }
    });

    expect(createResponse.ok()).toBeTruthy();

    const duplicateResponse = await request.post(`${BASE_URL}/api/assets`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
        asset_number: assetNumber,
        name: 'Duplicate Test Asset 2',
        asset_type: 'equipment',
        status: 'active'
      }
    });

    await expectStructuredError(duplicateResponse, 409);
  });

  test('returns structured 404 when archiving missing asset', async ({ request }) => {
    const token = await loginAndGetToken(request);

    const response = await request.delete(`${BASE_URL}/api/assets/99999999`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    await expectStructuredError(response, 404);
  });

});
