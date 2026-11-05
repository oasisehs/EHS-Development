import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5000';
const ADMIN_EMAIL = 'admin@ehssuite.com';
const ADMIN_PASSWORD = 'demo123456';

async function loginAdminAndGetToken(request) {
  const loginResponse = await request.post(`${BASE_URL}/api/login`, {
    data: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }
  });

  const loginPayload = await loginResponse.json();
  expect(loginResponse.ok(), `Admin login failed: ${JSON.stringify(loginPayload)}`).toBeTruthy();
  expect(loginPayload.token).toBeTruthy();
  return loginPayload.token;
}

test.describe('Admin User Management APIs', () => {
  test('should create user, change role, and toggle active/inactive status', async ({ request }) => {
    const token = await loginAdminAndGetToken(request);
    const uniqueEmail = `admin.manage.${Date.now()}@ehssuite.com`;

    const createResponse = await request.post(`${BASE_URL}/api/admin/users`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
        email: uniqueEmail,
        autoGeneratePassword: true,
        mustChangePassword: true,
        fullName: 'Admin Managed User',
        role: 'employee'
      }
    });

    const createPayload = await createResponse.json();
    expect(createResponse.ok(), `Create user failed: ${JSON.stringify(createPayload)}`).toBeTruthy();
    expect(createPayload.data?.email).toBe(uniqueEmail);
    expect(createPayload.data?.role).toBe('employee');
    expect(createPayload.data?.must_change_password).toBeTruthy();
    expect(createPayload.temporaryPassword).toBeTruthy();

    const createdUserId = createPayload.data.id;
    expect(Number.isInteger(createdUserId)).toBeTruthy();

    const roleResponse = await request.put(`${BASE_URL}/api/admin/users/${createdUserId}/role`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
        role: 'manager'
      }
    });

    const rolePayload = await roleResponse.json();
    expect(roleResponse.ok(), `Role update failed: ${JSON.stringify(rolePayload)}`).toBeTruthy();
    expect(rolePayload.data?.role).toBe('manager');

    const inactiveResponse = await request.put(`${BASE_URL}/api/admin/users/${createdUserId}/status`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
        status: 'inactive'
      }
    });

    const inactivePayload = await inactiveResponse.json();
    expect(inactiveResponse.ok(), `Deactivate failed: ${JSON.stringify(inactivePayload)}`).toBeTruthy();
    expect(inactivePayload.data?.status).toBe('inactive');

    const blockedLogin = await request.post(`${BASE_URL}/api/login`, {
      data: {
        email: uniqueEmail,
        password: createPayload.temporaryPassword
      }
    });
    expect(blockedLogin.status()).toBe(403);

    const reactivateResponse = await request.put(`${BASE_URL}/api/admin/users/${createdUserId}/status`, {
      headers: {
        Authorization: `Bearer ${token}`
      },
      data: {
        status: 'active'
      }
    });

    const reactivatePayload = await reactivateResponse.json();
    expect(reactivateResponse.ok(), `Reactivate failed: ${JSON.stringify(reactivatePayload)}`).toBeTruthy();
    expect(reactivatePayload.data?.status).toBe('active');

    const userListResponse = await request.get(`${BASE_URL}/api/admin/users`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const userListPayload = await userListResponse.json();
    expect(userListResponse.ok(), `User list failed: ${JSON.stringify(userListPayload)}`).toBeTruthy();

    const managedUser = (userListPayload.data || []).find((entry) => entry.email === uniqueEmail);
    expect(managedUser).toBeTruthy();
    expect(managedUser.role).toBe('manager');
    expect(String(managedUser.status).toLowerCase()).toBe('active');
  });
});
