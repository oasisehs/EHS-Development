import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5000';
const ADMIN_EMAIL = 'admin@ehssuite.com';
const ADMIN_PASSWORD = 'demo123456';
const TEST_USER_EMAIL = `testuser${Date.now()}@ehssuite.com`;
const TEST_USER_PASSWORD = 'Test@123456';

async function loginAsAdmin(page) {
  await page.goto(`${BASE_URL}/index.html`);
  await page.fill('#email', ADMIN_EMAIL);
  await page.fill('#password', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard.html', { timeout: 10000 });
}

test.describe('EHS Suite - Authentication', () => {
  test.describe('Login Page', () => {
    test('should load login page', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);
      await expect(page).toHaveTitle(/Login|EHS/i);
      await expect(page.locator('#loginForm')).toBeVisible();
      await expect(page.locator('#email')).toBeVisible();
      await expect(page.locator('#password')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should display validation errors for empty fields', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);
      await page.click('#email');
      await page.locator('#email').blur();
      await page.click('#password');
      await page.locator('#password').blur();
      await expect(page.locator('#emailError')).toContainText('required');
      await expect(page.locator('#passwordError')).toContainText('required');
    });

    test('should validate email format', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);
      await page.fill('#email', 'ab');
      await page.locator('#email').blur();
      await expect(page.locator('#emailError')).toContainText('valid email');
    });

    test('should show forgot password and signup links', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);
      await expect(page.locator('a[href*="forgot"], a:has-text("Forgot Password")').first()).toBeVisible();
      await expect(page.locator('a[href*="signup"], a:has-text("Create one")').first()).toBeVisible();
    });
  });

  test.describe('Login Functionality', () => {
    test('should login successfully with admin credentials', async ({ page }) => {
      await loginAsAdmin(page);
      await expect(page.locator('text=Welcome back').first()).toBeVisible();

      const stored = await page.evaluate(() => {
        return {
          token: localStorage.getItem('ehssuite_token'),
          user: localStorage.getItem('ehssuite_user')
        };
      });

      expect(stored.token).toBeTruthy();
      expect(stored.user).toBeTruthy();

      if (stored.user) {
        const parsed = JSON.parse(stored.user);
        expect(parsed.email).toBe(ADMIN_EMAIL);
      }
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);
      await page.fill('#email', 'nonexistent@test.com');
      await page.fill('#password', 'WrongPassword123');
      await page.click('button[type="submit"]');
      await expect(page.locator('#generalError')).toBeVisible();
    });

    test('should save remember me preference', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);
      await page.check('input[name="rememberMe"]');
      await page.fill('#email', ADMIN_EMAIL);
      await page.fill('#password', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard.html', { timeout: 10000 });

      const rememberFlag = await page.evaluate(() => localStorage.getItem('ehssuite_remember'));
      expect(rememberFlag).toBe('true');
    });
  });

  test.describe('Signup Page', () => {
    test('should load signup page', async ({ page }) => {
      await page.goto(`${BASE_URL}/signup.html`);
      await expect(page.locator('#signupForm')).toBeVisible();
      await expect(page.locator('h2')).toContainText('Create Account');
    });

    test('should show error when passwords do not match', async ({ page }) => {
      await page.goto(`${BASE_URL}/signup.html`);

      await page.fill('#fullName', 'Test User');
      await page.fill('#company', 'Test Company');
      await page.fill('#email', TEST_USER_EMAIL);
      await page.fill('#password', TEST_USER_PASSWORD);
      await page.fill('#confirmPassword', 'DifferentPassword123');
      await page.click('button[type="submit"]');

      await expect(page.locator('#confirmPasswordError')).toContainText('match');
    });

    test('should register new user successfully', async ({ page }) => {
      await page.goto(`${BASE_URL}/signup.html`);

      await page.fill('#fullName', 'Test User');
      await page.fill('#company', 'Test Company');
      await page.fill('#email', `new.${Date.now()}@ehssuite.com`);
      await page.fill('#password', TEST_USER_PASSWORD);
      await page.fill('#confirmPassword', TEST_USER_PASSWORD);
      await page.check('input[name="agreeTerms"]');
      await page.click('button[type="submit"]');

      await expect(page.locator('#successMessage')).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Forgot Password', () => {
    test('should load forgot password page', async ({ page }) => {
      await page.goto(`${BASE_URL}/forgot-password.html`);
      await expect(page.locator('#forgotPasswordForm')).toBeVisible();
      await expect(page.locator('#stepOne h2')).toContainText('Forgot Password');
    });

    test('should proceed with email verification step', async ({ page }) => {
      await page.goto(`${BASE_URL}/forgot-password.html`);
      await page.fill('#email', ADMIN_EMAIL);
      await page.click('#forgotPasswordForm button[type="submit"]');

      await expect(page.locator('#stepTwo')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('#confirmEmail')).toContainText(ADMIN_EMAIL);
    });
  });

  test.describe('Dashboard Access', () => {
    test('should redirect unauthenticated user to login', async ({ page }) => {
      await page.goto(`${BASE_URL}/index.html`);
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });

      await page.goto(`${BASE_URL}/dashboard.html`);
      await expect(page).toHaveURL(/index\.html$/);
      await expect(page.locator('#loginForm')).toBeVisible();
    });

    test('should load dashboard after successful login', async ({ page }) => {
      await loginAsAdmin(page);
      await expect(page.locator('h2')).toContainText('Welcome back');
      await expect(page.locator('.sidebar-nav')).toBeVisible();
    });

    test('should have logout functionality', async ({ page }) => {
      await loginAsAdmin(page);
      await page.evaluate(() => {
        if (typeof logout === 'function') {
          logout();
        }
      });
      await expect(page).toHaveURL(/index\.html$/);
      await expect(page.locator('#loginForm')).toBeVisible();
    });
  });

  test.describe('API Integration', () => {
    test('should call login API endpoint and receive token', async ({ page }) => {
      const loginResponsePromise = page.waitForResponse(
        (response) => response.url().includes('/api/login') && response.request().method() === 'POST'
      );

      await page.goto(`${BASE_URL}/index.html`);
      await page.fill('#email', ADMIN_EMAIL);
      await page.fill('#password', ADMIN_PASSWORD);
      await page.click('button[type="submit"]');

      const loginResponse = await loginResponsePromise;
      expect(loginResponse.ok()).toBeTruthy();

      const body = await loginResponse.json();
      expect(body.token).toBeTruthy();
      expect(body.user).toBeTruthy();
      expect(body.message).toContain('successful');
    });

    test('should store JWT token after login', async ({ page }) => {
      await loginAsAdmin(page);
      const storedToken = await page.evaluate(() => localStorage.getItem('ehssuite_token'));
      expect(storedToken).toBeTruthy();
    });
  });
});
