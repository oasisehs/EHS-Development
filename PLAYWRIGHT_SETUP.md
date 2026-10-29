# 🎭 Playwright E2E Testing - EHS Suite

Complete end-to-end testing setup for EHS Suite authentication flows using Playwright.

## 📋 Quick Start

### 1. **Install Dependencies**

```bash
# From root directory (c:\CODEBASE\EHS\)
npm install -D @playwright/test

# Or from backend directory
cd backend
npm install
npm install -D @playwright/test (if root level fails)
```

### 2. **Seed Demo User** (Required for testing)

```bash
cd backend
npm run seed
```

**Expected Output:**
```
🌱 Starting database seed...
✓ Demo user created successfully
  ID: 1
  Email: demo@ehssuite.com
  Name: Demo User
  Company: EHS Oasis

✓ Login with these credentials:
  Email: demo@ehssuite.com
  Password: Demo@123456
```

### 3. **Start Application Locally**

```bash
# Terminal 1: Start Backend
cd backend
npm start

# Expected: "EHS Suite Backend is running on port 5000"
```

### 4. **Run Playwright Tests**

```bash
# Terminal 2: Run All Tests
npx playwright test

# Run specific test file
npx playwright test auth.spec.js

# Run with headed browser (visible)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# Run single test
npx playwright test -g "should login successfully with demo credentials"
```

---

## 📊 Test Scenarios

### Login Page Tests
- ✅ Load login page correctly
- ✅ Display validation errors for empty fields
- ✅ Validate email format
- ✅ Toggle password visibility
- ✅ Show "Forgot Password" link
- ✅ Show "Sign Up" link
- ✅ Display loading state during login

### Login Functionality
- ✅ Login successfully with demo credentials
- ✅ Show error for invalid email
- ✅ Show error for incorrect password
- ✅ Persist login state in localStorage
- ✅ Save "Remember me" preference

### Signup Page
- ✅ Load signup page
- ✅ Validate full name field
- ✅ Validate password strength
- ✅ Register new user successfully
- ✅ Show error when passwords don't match

### Forgot Password
- ✅ Load forgot password page
- ✅ Proceed with email verification
- ✅ Reset password with valid token

### Dashboard Access
- ✅ Redirect unauthenticated users to login
- ✅ Load dashboard after successful login
- ✅ Display user information
- ✅ Have logout functionality

### API Integration
- ✅ Call login API endpoint
- ✅ Store JWT token after login

---

## 🔧 Test Reports

After running tests, check reports:

```bash
# View HTML report
npx playwright show-report

# View JSON results
cat test-results.json

# View JUnit XML (CI/CD integration)
cat test-results.xml
```

---

## 🎬 Playwright Inspector & Debug

### Debug Mode
```bash
# Run tests in debug mode with step-by-step execution
npx playwright test --debug
```

### Inspector UI
```bash
# Open the Playwright Inspector for interactive test authoring
npx playwright codegen http://localhost:5000
```

### Trace Viewer
```bash
# View detailed execution traces with videos and screenshots
npx playwright show-trace trace.zip
```

---

## 📝 Test File Structure

**Location:** `c:\CODEBASE\EHS\frontend\auth.spec.js`

### Test Organization

```javascript
test.describe('EHS Suite - Authentication', () => {
  test.describe('Login Page', () => {
    test('should load login page', async ({ page }) => {
      // Test implementation
    });
  });
});
```

### Selectors Used

```javascript
// Form elements
#loginForm                    // Login form
#email                       // Email input
#password                    // Password input
button[type="submit"]        // Submit button
#emailError                  // Email error display
#generalError               // General error display

// Links
a[href*="forgot"]          // Forgot password link
a[href*="signup"]          // Sign up link
text=Forgot Password       // Text-based selector

// Dashboard
text=Dashboard             // Dashboard text
text=Welcome              // Welcome text
button[id*="logout"]      // Logout button
```

---

## 🐛 Troubleshooting

### Tests Timeout or Fail

1. **Check if backend is running:**
   ```bash
   curl http://localhost:5000
   ```

2. **Check if database is accessible:**
   ```bash
   # From backend directory
   npm run seed
   ```

3. **Clear local storage:**
   ```javascript
   // Playwright automatically clears before each test
   // Manual clear in test:
   await page.context().clearCookies();
   await page.evaluate(() => localStorage.clear());
   ```

### Selectors Not Found

- Use `--debug` mode to inspect element selectors
- Use `npx playwright codegen` to record UI interactions
- Check browser console for JavaScript errors

### API Integration Tests Fail

- Verify backend API is responding: `curl http://localhost:5000/api/login`
- Check CORS configuration in `backend/server.js`
- Verify JWT_SECRET in `.env`

---

## 🚀 CI/CD Integration

### GitHub Actions Example

```yaml
name: Playwright Tests

on: [push, pull_request]

jobs:
  test:
    timeout-minutes: 60
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install -D @playwright/test
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      
      - name: Seed database
        run: cd backend && npm run seed
      
      - name: Run tests
        run: npx playwright test
      
      - name: Upload report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📚 Playwright Documentation

- **Official Docs:** https://playwright.dev
- **Test Configuration:** https://playwright.dev/docs/test-configuration
- **Best Practices:** https://playwright.dev/docs/best-practices
- **API Reference:** https://playwright.dev/docs/api/class-test

---

## 🔐 Security Testing

### Additional Tests to Consider

```javascript
// CSRF protection
test('should include CSRF token in requests', async ({ page }) => {
  // Verify security headers
});

// Password handling
test('should not expose password in network requests', async ({ page }) => {
  // Monitor network tab for sensitive data
});

// Session security
test('should invalidate token on logout', async ({ page }) => {
  // Verify token removal
});
```

---

## 📈 Performance Testing

### Measure Page Load Times

```javascript
test('should load login page within 2 seconds', async ({ page }) => {
  const startTime = Date.now();
  await page.goto(BASE_URL);
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(2000);
});
```

---

## ✅ Test Checklist

- [ ] All dependencies installed (`npm install -D @playwright/test`)
- [ ] Demo user seeded (`npm run seed`)
- [ ] Backend running on port 5000
- [ ] Playwright config created (`playwright.config.js`)
- [ ] Test file created (`auth.spec.js`)
- [ ] Tests run successfully (`npx playwright test`)
- [ ] HTML report generated
- [ ] Tests added to CI/CD pipeline

---

## 🎯 Next Steps

1. **Extend tests** - Add more test scenarios for new features
2. **Set up CI/CD** - Integrate with GitHub Actions, GitLab CI, or Azure Pipelines
3. **Add visual tests** - Implement screenshot comparisons
4. **Load testing** - Add Playwright's load testing capabilities
5. **Custom reporters** - Create custom test reporters for your needs

---

## 📧 Support

For issues or questions:
- Check Playwright documentation: https://playwright.dev
- Review test logs: `npx playwright show-report`
- Enable debug mode: `npx playwright test --debug`

---

**Last Updated:** October 27, 2026
**Playwright Version:** Latest
**Node.js Version:** 18+
