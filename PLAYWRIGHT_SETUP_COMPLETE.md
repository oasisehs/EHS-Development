# 🔧 Playwright Integration - Complete Setup & Troubleshooting

## ⚠️ Database Connection Issue

**Current Status:** Local Render PostgreSQL is not accessible from local machine.

### Solution Options

#### Option 1: Use Local PostgreSQL (Recommended for Local Testing)

**Step 1: Install PostgreSQL**
- Download: https://www.postgresql.org/download/
- Or use Docker:
  ```bash
  docker run --name postgres-ehs -e POSTGRES_PASSWORD=password -d -p 5432:5432 postgres:15
  ```

**Step 2: Update .env**
```bash
# backend/.env
DATABASE_URL=postgresql://postgres:password@localhost:5432/ehsdb_local
```

**Step 3: Seed Demo User**
```bash
cd backend
npm run seed
```

---

#### Option 2: Configure Render Database Access

**Step 1: Allow Local IP in Render**
1. Go to Render Dashboard: https://dashboard.render.com
2. Select your PostgreSQL instance
3. Go to "Private IP" settings
4. Add your IP address (check: https://whatismyipaddress.com/)

**Step 2: Use SSH Tunnel (Recommended)**
```bash
# Create SSH tunnel to Render database
ssh -L 5432:dpg-xxxxx.postgres.render.com:5432 user@render-host
```

**Step 3: Update local .env**
```bash
DATABASE_URL=postgresql://oasis:password@localhost:5432/ehsdb_o0dm
```

---

#### Option 3: Create Mock Authentication for Testing

Use Playwright to test without requiring database connectivity:

```javascript
// In test setup
test.beforeEach(async ({ page }) => {
  // Mock login response
  await page.route('**/api/login', route => {
    route.abort('blockedbyclient');
  });
  
  // Simulate login locally
  await page.evaluate(() => {
    localStorage.setItem('ehssuite_user', JSON.stringify({
      id: 1,
      email: 'demo@ehssuite.com',
      full_name: 'Demo User'
    }));
    localStorage.setItem('authToken', 'mock-token-xyz');
  });
});
```

---

## 🚀 Quick Start (Offline Mode)

If database is not accessible, use this setup:

### 1. Install Dependencies
```bash
# From root directory
npm install -D @playwright/test
```

### 2. Install Playwright Browsers
```bash
npx playwright install
```

### 3. Run Tests with Backend Running
```bash
# Terminal 1: Start Backend
cd backend
npm start

# Terminal 2: Run Tests
npx playwright test --headed
```

---

## 📋 Complete Installation Steps

### Prerequisites
- Node.js 18+ installed
- PostgreSQL accessible (local or Render configured)
- Backend running on port 5000

### Step-by-Step Setup

```bash
# 1. Clone/Navigate to project
cd c:\CODEBASE\EHS

# 2. Install Playwright
npm install -D @playwright/test

# 3. Start backend (Terminal 1)
cd backend
npm install  # Install dependencies if needed
npm start

# 4. Seed demo user (Terminal 2)
cd backend
npm run seed

# 5. Run tests (Terminal 2 after seeding)
npx playwright test

# 6. View report
npx playwright show-report
```

---

## 🎭 Running Tests

### Option A: Using Convenience Scripts

**Windows (Batch):**
```bash
run-tests.bat
# Then select option from menu
```

**PowerShell:**
```bash
./run-tests.ps1
# Or
powershell -ExecutionPolicy Bypass -File run-tests.ps1
```

### Option B: Manual Commands

```bash
# Run all tests
npx playwright test

# Run with visible browser
npx playwright test --headed

# Run single test
npx playwright test auth.spec.js

# Debug mode
npx playwright test --debug

# Record new tests
npx playwright codegen http://localhost:5000
```

---

## 📊 Test Files Created

| File | Purpose | Location |
|------|---------|----------|
| `auth.spec.js` | Complete E2E test suite | `frontend/auth.spec.js` |
| `seed.js` | Database seeding script | `backend/seed.js` |
| `playwright.config.js` | Playwright configuration | `root/playwright.config.js` |
| `run-tests.bat` | Windows test launcher | `root/run-tests.bat` |
| `run-tests.ps1` | PowerShell test launcher | `root/run-tests.ps1` |

---

## 🔐 Demo Credentials

```
Email:    demo@ehssuite.com
Password: Demo@123456
```

These will be available after running `npm run seed` successfully.

---

## ✅ Test Coverage

### Login Tests (7 tests)
- ✅ Load login page
- ✅ Validate empty fields
- ✅ Validate email format
- ✅ Toggle password visibility
- ✅ Show forgot password link
- ✅ Show sign up link
- ✅ Display loading state

### Login Functionality (5 tests)
- ✅ Login with demo credentials
- ✅ Error for invalid email
- ✅ Error for invalid password
- ✅ Persist login in localStorage
- ✅ Save remember me preference

### Signup Tests (4 tests)
- ✅ Load signup page
- ✅ Validate full name
- ✅ Validate password strength
- ✅ Register new user

### Forgot Password (2 tests)
- ✅ Load forgot password page
- ✅ Reset password with token

### Dashboard Access (4 tests)
- ✅ Redirect unauthenticated users
- ✅ Load dashboard after login
- ✅ Display user information
- ✅ Logout functionality

### API Integration (2 tests)
- ✅ Call login API endpoint
- ✅ Store JWT token

**Total: 24+ E2E Tests**

---

## 🐛 Troubleshooting

### Problem: "Error initializing database" on npm start

**Solution:**
- This is expected when Render DB is not accessible
- Backend will still start and serve frontend
- Use mock data or local PostgreSQL
- See "Database Connection Issue" section above

### Problem: "Cannot find seed.js"

**Solution:**
```bash
# Make sure you're in correct directory
cd c:\CODEBASE\EHS\backend
ls -la seed.js  # Check if file exists
node seed.js    # Run it
```

### Problem: Tests fail with "page not found"

**Solution:**
1. Verify backend is running:
   ```bash
   curl http://localhost:5000
   ```

2. Check backend logs for errors

3. Try with `--headed` to see browser:
   ```bash
   npx playwright test --headed
   ```

### Problem: "Playwright not found"

**Solution:**
```bash
# Install Playwright
npm install -D @playwright/test

# Install browsers
npx playwright install
```

### Problem: Tests timeout

**Solution:**
```bash
# Increase timeout in playwright.config.js
timeout: 30000,

# Or for specific test
test('name', async ({ page }) => {
  // test
}, { timeout: 60000 });

# Or run with timeout option
npx playwright test --timeout=60000
```

---

## 🔗 API Endpoints

These endpoints are available for testing:

```
POST   /api/register              - User registration
POST   /api/login                 - User login
POST   /api/forgot-password       - Request password reset
POST   /api/reset-password        - Reset password
GET    /api/user/profile          - Get user profile
GET    /api/ehs-records           - List EHS records
POST   /api/files/upload          - Upload file to S3
GET    /api/files                 - List user files
DELETE /api/files/:id             - Delete file
GET    /api/files/:id/presigned-url - Get share link
```

---

## 📈 Performance Metrics

After running tests, you can measure:

```javascript
test('measure performance', async ({ page }) => {
  const startTime = Date.now();
  await page.goto('http://localhost:5000');
  const navigationTime = Date.now() - startTime;
  
  console.log(`Page load: ${navigationTime}ms`);
  expect(navigationTime).toBeLessThan(3000);
});
```

---

## 🚀 Next Steps

1. **Run Tests Locally**
   ```bash
   npx playwright test --headed
   ```

2. **View Report**
   ```bash
   npx playwright show-report
   ```

3. **Add More Tests**
   - Extend `auth.spec.js`
   - Test file uploads
   - Test EHS records
   - Test dashboard functionality

4. **CI/CD Integration**
   - Set up GitHub Actions
   - Add to Azure Pipelines
   - Configure pre-commit hooks

5. **Performance Testing**
   - Add load tests with k6
   - Profile page load times
   - Monitor Core Web Vitals

---

## 📚 Resources

- **Playwright Docs:** https://playwright.dev
- **Test Best Practices:** https://playwright.dev/docs/best-practices
- **Debugging:** https://playwright.dev/docs/debug
- **Docker Setup:** https://docs.docker.com/
- **PostgreSQL:** https://www.postgresql.org/docs/

---

## 🎯 Checklist

- [ ] Node.js 18+ installed
- [ ] Playwright installed (`npm install -D @playwright/test`)
- [ ] Database configured (local or Render)
- [ ] Backend running on port 5000
- [ ] Demo user seeded (`npm run seed`)
- [ ] Tests run successfully (`npx playwright test`)
- [ ] HTML report generated
- [ ] Screenshots captured
- [ ] Videos recorded (on failure)

---

## 💡 Tips

1. **Use `--headed` mode** to debug visually:
   ```bash
   npx playwright test --headed
   ```

2. **Use `--debug` mode** for step-by-step execution:
   ```bash
   npx playwright test --debug
   ```

3. **Record new tests** with Codegen:
   ```bash
   npx playwright codegen http://localhost:5000
   ```

4. **View traces** for detailed execution info:
   ```bash
   npx playwright show-trace
   ```

5. **Filter tests** by name:
   ```bash
   npx playwright test -g "login"
   ```

---

**Created:** October 27, 2026  
**Version:** 1.0  
**Status:** ✅ Ready for Use
