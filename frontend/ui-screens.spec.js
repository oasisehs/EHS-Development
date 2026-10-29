import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5000';
const ADMIN_EMAIL = 'admin@ehssuite.com';
const ADMIN_PASSWORD = 'demo123456';

async function login(page) {
  await page.goto(`${BASE_URL}/index.html`);
  await page.fill('#email', ADMIN_EMAIL);
  await page.fill('#password', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard.html', { timeout: 10000 });
}

test.describe('Required UI Screens', () => {
  test('dashboard links to new screens', async ({ page }) => {
    await login(page);

    await expect(page.locator('a[href="training.html"]').first()).toBeVisible();
    await expect(page.locator('a[href="employees.html"]').first()).toBeVisible();
    await expect(page.locator('a[href="assets.html"]').first()).toBeVisible();
    await expect(page.locator('a[href="onboarding.html"]').first()).toBeVisible();
    await expect(page.locator('a[href="documents.html"]').first()).toBeVisible();
    await expect(page.locator('a[href="incidents.html"]').first()).toBeVisible();
  });

  test('training portal screen loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/training.html`);

    await expect(page.locator('h1')).toHaveText('Training Portal');
    await expect(page.locator('#assignTrainingBtn')).toBeVisible();
    await expect(page.locator('#viewTrainingBtn')).toBeVisible();
  });

  test('hr dashboard screen loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/hr.html`);

    await expect(page.locator('h1')).toHaveText('HR Dashboard');
    await expect(page.locator('#addLeaveBtn')).toBeVisible();
    await expect(page.locator('#leaveTableBody')).toBeVisible();
  });

  test('asset management screen loads and can add local row', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/assets.html`);

    await expect(page.locator('h1')).toHaveText('Asset Management');
    const assetTag = `EHS-TST-${Date.now()}`;

    await page.fill('#assetTag', assetTag);
    await page.fill('#assetName', 'Test Device');
    await page.selectOption('#assetType', 'equipment');
    await page.fill('#assetLocation', 'QA Lab');
    await page.selectOption('#assetStatus', 'active');

    const createResponse = page.waitForResponse(
      (res) => res.url().includes('/api/assets') && res.request().method() === 'POST'
    );
    await page.click('#addAssetBtn');
    await createResponse;

    await page.click('#refreshAssetsBtn');

    await expect(page.locator('#assetsTableBody')).toContainText(assetTag);
  });

  test('employee lifecycle screen loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/employees.html`);

    await expect(page.locator('h1')).toHaveText('Employee Lifecycle Portal');
    await expect(page.locator('#employeeSearch')).toBeVisible();
    await expect(page.locator('#applyEmployeeFiltersBtn')).toBeVisible();
    await expect(page.locator('#employeeCards')).toBeVisible();
  });

  test('onboarding wizard screen loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/onboarding.html`);

    await expect(page.locator('h1')).toHaveText('Onboarding Wizard');
    await expect(page.locator('#startOnboardingBtn')).toBeVisible();
    await expect(page.locator('#loadOnboardingBtn')).toBeVisible();
    await expect(page.locator('#completeStepBtn')).toBeVisible();
  });

  test('documents portal screen loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/documents.html`);

    await expect(page.locator('h1')).toHaveText('Document Management Portal');
    await expect(page.locator('#docSearch')).toBeVisible();
    await expect(page.locator('#applyDocFiltersBtn')).toBeVisible();
    await expect(page.locator('#documentsBody')).toBeVisible();
  });

  test('incident hub screen loads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/incidents.html`);

    await expect(page.locator('h1')).toHaveText('Incident & Compliance Hub');
    await expect(page.locator('#submitIncidentBtn')).toBeVisible();
    await expect(page.locator('#refreshIncidentsBtn')).toBeVisible();
    await expect(page.locator('#incidentsBody')).toBeVisible();
  });
});
