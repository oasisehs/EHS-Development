# 🎭 Playwright - Quick Reference Guide

## 🚀 Quick Start Commands

```bash
# 1. Install Playwright
npm install -D @playwright/test

# 2. Seed demo user
cd backend
npm run seed
cd ..

# 3. Start backend (Terminal 1)
cd backend
npm start

# 4. Run tests (Terminal 2)
npx playwright test
```

---

## 📋 Essential Commands

### Running Tests

```bash
# Run all tests
npx playwright test

# Run specific test file
npx playwright test auth.spec.js

# Run with visible browser (headed mode)
npx playwright test --headed

# Run in debug mode (step-by-step)
npx playwright test --debug

# Run single test by name
npx playwright test -g "should login successfully"

# Run with specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run tests in serial (one after another)
npx playwright test --workers=1

# Run tests with specific timeout
npx playwright test --timeout=10000
```

### Reports & Debugging

```bash
# View HTML test report
npx playwright show-report

# View detailed trace (videos, screenshots)
npx playwright show-trace

# Open code generator (record interactions)
npx playwright codegen http://localhost:5000

# Run with verbose logging
npx playwright test --verbose

# List all tests without running
npx playwright test --list
```

---

## 🔍 Test Selectors

### Common Selectors in auth.spec.js

```javascript
// By ID
page.locator('#loginForm')
page.locator('#email')
page.locator('#password')

// By CSS
page.locator('button[type="submit"]')
page.locator('input[type="checkbox"]')
page.locator('a[href*="forgot"]')

// By Text
page.locator('text=Login')
page.locator('text=Forgot Password')
page.locator('text=Sign Up')

// By Role
page.locator('button:has-text("Submit")')
page.locator('link:has-text("Logout")')

// Multiple selectors
page.locator('#emailError, .error-message')
page.locator('text=Dashboard, text=Welcome, text=Compliance')
```

---

## 📊 Test Structure

### Basic Test Template

```javascript
import { test, expect } from '@playwright/test';

test('my test', async ({ page }) => {
  // Navigate to page
  await page.goto('http://localhost:5000');
  
  // Interact with elements
  await page.locator('#email').fill('test@example.com');
  await page.locator('#password').fill('Password123');
  
  // Click button
  await page.click('button[type="submit"]');
  
  // Wait for navigation
  await page.waitForURL('**/dashboard**');
  
  // Assert
  await expect(page.locator('text=Welcome')).toBeVisible();
});
```

### Test Groups

```javascript
test.describe('Login Tests', () => {
  test('should login successfully', async ({ page }) => {
    // Test implementation
  });
  
  test('should show error on invalid credentials', async ({ page }) => {
    // Test implementation
  });
});
```

---

## ⚙️ Configuration

### playwright.config.js

```javascript
// Base URL for tests
use: {
  baseURL: 'http://localhost:5000',
},

// Screenshots on failure
use: {
  screenshot: 'only-on-failure',
},

// Video on failure
use: {
  video: 'retain-on-failure',
},

// Wait time
timeout: 10000,

// Number of workers
workers: 4,

// Retries
retries: 2,
```

---

## 🔧 Common Actions

```javascript
// Navigation
await page.goto('http://localhost:5000');
await page.goBack();
await page.goForward();
await page.reload();

// Fill inputs
await page.locator('#email').fill('test@example.com');
await page.locator('#password').fill('Password123');

// Click
await page.click('button[type="submit"]');
await page.locator('text=Login').click();

// Type (character by character)
await page.locator('#search').type('search term', { delay: 100 });

// Select option
await page.selectOption('select', 'option-value');

// Check/uncheck
await page.locator('input[type="checkbox"]').check();
await page.locator('input[type="checkbox"]').uncheck();

// Hover
await page.locator('.menu-item').hover();

// Scroll
await page.locator('.content').scrollIntoViewIfNeeded();

// Right-click
await page.locator('#element').click({ button: 'right' });

// Double-click
await page.locator('#element').dblclick();
```

---

## ⏳ Waiting & Delays

```javascript
// Wait for element to be visible
await expect(page.locator('text=Success')).toBeVisible();

// Wait for navigation
await page.waitForURL('**/dashboard**');
await page.waitForURL(url => url.hostname === 'localhost');

// Wait for specific event
await page.waitForLoadState('networkidle');
await page.waitForLoadState('domcontentloaded');

// Wait for element to appear in DOM
await page.waitForSelector('#myElement');

// Wait for function
await page.waitForFunction(() => window.pageLoaded === true);

// General wait
await page.waitForTimeout(1000); // 1 second
```

---

## ✅ Assertions

```javascript
// Visibility
await expect(page.locator('#email')).toBeVisible();
await expect(page.locator('#email')).toBeHidden();

// Value
await expect(page.locator('#email')).toHaveValue('test@example.com');

// Text
await expect(page.locator('.message')).toContainText('Login successful');
await expect(page.locator('.message')).toHaveText('Login successful');

// Attributes
await expect(page.locator('#email')).toHaveAttribute('type', 'email');
await expect(page.locator('button')).toHaveClass('primary');

// Count
await expect(page.locator('li')).toHaveCount(5);

// Enabled/Disabled
await expect(page.locator('button')).toBeEnabled();
await expect(page.locator('button')).toBeDisabled();

// Checked
await expect(page.locator('input[type="checkbox"]')).toBeChecked();

// URL
await expect(page).toHaveURL('http://localhost:5000/dashboard.html');
await expect(page).toHaveTitle(/Dashboard/);

// Editable
await expect(page.locator('#email')).toBeFocused();
```

---

## 🐛 Debugging Tips

### 1. Use Debug Mode
```bash
npx playwright test --debug
```
This opens Playwright Inspector where you can step through tests.

### 2. Add Debug Statements
```javascript
await page.pause(); // Pauses execution
console.log(await page.locator('#email').textContent());
```

### 3. Take Screenshots
```javascript
await page.screenshot({ path: 'screenshot.png' });
```

### 4. View Page Content
```javascript
console.log(await page.content()); // HTML
console.log(await page.title()); // Title
console.log(await page.url()); // Current URL
```

### 5. Check Element State
```javascript
const isVisible = await page.locator('#email').isVisible();
const isEnabled = await page.locator('button').isEnabled();
const value = await page.locator('#email').inputValue();
```

---

## 🚨 Common Issues

### Tests Timeout
```bash
# Increase timeout in playwright.config.js
timeout: 30000, // 30 seconds

# Or for specific test
test('slow test', async ({ page }) => {
  page.setDefaultTimeout(30000);
  // test code
}, { timeout: 60000 });
```

### Element Not Found
```javascript
// Use multiple selectors
await page.locator('#email, input[name="email"], input[placeholder*="Email"]').fill('test@test.com');

// Wait for element
await page.waitForSelector('#email');
await expect(page.locator('#email')).toBeVisible();

// Use headless: false to see browser
```

### Flaky Tests
```javascript
// Wait for element to be stable
await expect(page.locator('#email')).toBeVisible();

// Wait for network
await page.waitForLoadState('networkidle');

// Retry logic
for (let i = 0; i < 3; i++) {
  try {
    await page.click('button');
    break;
  } catch (e) {
    if (i === 2) throw e;
    await page.waitForTimeout(500);
  }
}
```

---

## 📈 Performance Testing

```javascript
test('measure page load time', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('http://localhost:5000');
  const loadTime = Date.now() - startTime;
  
  console.log(`Page loaded in ${loadTime}ms`);
  expect(loadTime).toBeLessThan(3000); // Less than 3 seconds
});
```

---

## 🔐 Testing Authentication

```javascript
test('should handle JWT token', async ({ page }) => {
  // Login
  await page.goto('http://localhost:5000');
  await page.locator('#email').fill('demo@ehssuite.com');
  await page.locator('#password').fill('Demo@123456');
  await page.click('button[type="submit"]');
  
  // Check stored token
  const token = await page.evaluate(() => {
    return localStorage.getItem('authToken');
  });
  
  expect(token).toBeTruthy();
  expect(token).toMatch(/^Bearer /);
});
```

---

## 📚 Resources

- **Official Docs:** https://playwright.dev
- **API Reference:** https://playwright.dev/docs/api/class-test
- **Best Practices:** https://playwright.dev/docs/best-practices
- **Debugging:** https://playwright.dev/docs/debug
- **CI/CD:** https://playwright.dev/docs/ci

---

## 🎯 Quick Commands Summary

| Task | Command |
|------|---------|
| Install | `npm install -D @playwright/test` |
| Run All Tests | `npx playwright test` |
| Run Headed | `npx playwright test --headed` |
| Debug Mode | `npx playwright test --debug` |
| Code Gen | `npx playwright codegen http://localhost:5000` |
| Show Report | `npx playwright show-report` |
| Specific Test | `npx playwright test -g "test name"` |
| Single File | `npx playwright test auth.spec.js` |

---

**Last Updated:** October 27, 2026  
**For EHS Suite:** Version 1.0
