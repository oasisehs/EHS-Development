import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5000';
const ADMIN_EMAIL = 'admin@ehssuite.com';
const ADMIN_PASSWORD = 'demo123456';

async function loginAdminAndGetToken(request) {
  const response = await request.post(`${BASE_URL}/api/login`, {
    data: {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    }
  });

  const payload = await response.json();
  expect(response.ok(), `Admin login failed: ${JSON.stringify(payload)}`).toBeTruthy();
  return payload.token;
}

test.describe('First Login Password Flow', () => {
  test('should redirect first-login user and allow password update', async ({ request, page }) => {
    const adminToken = await loginAdminAndGetToken(request);
    const uniqueEmail = `first.login.${Date.now()}@ehssuite.com`;

    const createResponse = await request.post(`${BASE_URL}/api/admin/users`, {
      headers: {
        Authorization: `Bearer ${adminToken}`
      },
      data: {
        email: uniqueEmail,
        autoGeneratePassword: true,
        mustChangePassword: true,
        fullName: 'First Login User',
        role: 'employee'
      }
    });

    const createPayload = await createResponse.json();
    expect(createResponse.ok(), `Create user failed: ${JSON.stringify(createPayload)}`).toBeTruthy();
    expect(createPayload.temporaryPassword).toBeTruthy();

    await page.goto(`${BASE_URL}/index.html`);
    await page.fill('#email', uniqueEmail);
    await page.fill('#password', createPayload.temporaryPassword);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/first-login-password.html', { timeout: 10_000 });
    await expect(page.locator('h2')).toContainText('Update Password');

    const newPassword = 'UpdatedFirst@123';
    await page.fill('#newPassword', newPassword);
    await page.fill('#confirmPassword', newPassword);
    await page.click('#firstLoginSubmitBtn');

    await page.waitForURL('**/dashboard.html', { timeout: 10_000 });

    const userState = await page.evaluate(() => {
      const raw = localStorage.getItem('ehssuite_user') || sessionStorage.getItem('ehssuite_user');
      return raw ? JSON.parse(raw) : null;
    });

    expect(userState).toBeTruthy();
    expect(userState.must_change_password).toBeFalsy();

    await page.goto(`${BASE_URL}/index.html`);
    await page.fill('#email', uniqueEmail);
    await page.fill('#password', newPassword);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard.html', { timeout: 10_000 });
    await expect(page.locator('text=Welcome back').first()).toBeVisible();
  });
});
