import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5000';
const ADMIN_EMAIL = 'admin@ehssuite.com';
const ADMIN_PASSWORD = 'demo123456';

test.describe('Operations Console UI', () => {
  test('redirects to login when unauthenticated', async ({ page }) => {
    await page.goto(`${BASE_URL}/operations.html`);
    await expect(page).toHaveURL(/index\.html$/);
    await expect(page.locator('#loginForm')).toBeVisible();
  });

  test('login and open operations page from dashboard links', async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);

    await page.fill('#email', ADMIN_EMAIL);
    await page.fill('#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/dashboard.html', { timeout: 10000 });

    // Both nav entries route to operations.html. Open first visible match.
    const operationsLink = page.locator('a[href="operations.html"]').first();
    await expect(operationsLink).toBeVisible();
    await operationsLink.click();

    await page.waitForURL('**/operations.html', { timeout: 10000 });
    await expect(page.locator('h1')).toHaveText('Operations Console');
  });

  test('operations page renders core modules', async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await page.fill('#email', ADMIN_EMAIL);
    await page.fill('#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard.html', { timeout: 10000 });

    await page.goto(`${BASE_URL}/operations.html`);

    await expect(page.locator('h2', { hasText: 'Employees' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'Departments' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'Training' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'Compliance' })).toBeVisible();
    await expect(page.locator('h2', { hasText: 'Onboarding' })).toBeVisible();
  });

  test('can refresh employee and department lists', async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await page.fill('#email', ADMIN_EMAIL);
    await page.fill('#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard.html', { timeout: 10000 });

    await page.goto(`${BASE_URL}/operations.html`);

    await page.click('#loadEmployeesBtn');
    await expect(page.locator('#employeesBody')).toBeVisible();

    await page.click('#loadDepartmentsBtn');
    await expect(page.locator('#departmentsBody')).toBeVisible();
  });

  test('training history and compliance status actions write logs', async ({ page }) => {
    await page.goto(`${BASE_URL}/index.html`);
    await page.fill('#email', ADMIN_EMAIL);
    await page.fill('#password', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard.html', { timeout: 10000 });

    await page.goto(`${BASE_URL}/operations.html`);

    // Uses seeded employee id seen in prior backend checks.
    await page.fill('#trainingEmployeeId', '5');
    await page.click('#viewTrainingBtn');
    await expect(page.locator('#trainingLog')).not.toHaveText('');

    await page.fill('#compEmployeeId', '5');
    await page.click('#viewComplianceBtn');
    await expect(page.locator('#complianceLog')).not.toHaveText('');
  });
});
