# EHSSuite Quick Start Guide

## 🚀 Quick Start

### Option 1: Open in Browser
1. Navigate to `c:\CODEBASE\EHS\`
2. Double-click `index.html` to open in default browser
3. Or right-click and select "Open with" → Choose your browser

### Option 2: Use VS Code
1. Open the folder in VS Code
2. Right-click `index.html` → "Open with Live Server" (if installed)
3. Or press `Go Live` button

### Option 3: Local Server
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000

# Node.js (if installed)
npx http-server
```

## 📝 Testing the System

### Login Page Tests
1. **Valid Login**
   - Email: `demo@ehssuite.com`
   - Password: `Demo@123456`
   - Result: Redirects to dashboard

2. **Remember Me**
   - Check "Remember me" before login
   - Closes browser completely
   - Reopens index.html
   - Email should be pre-filled

3. **Invalid Credentials**
   - Try any other email/password combination
   - Should show error message
   - Button should briefly show loading state

4. **Form Validation**
   - Try submitting with empty fields
   - Try invalid email format
   - Try password less than 6 chars
   - Should show specific error messages

### Signup Page Tests
1. Click "Create one" link on login page
2. Try these test scenarios:
   - Full name with numbers (should fail)
   - Email without @ (should fail)
   - Password without uppercase (should fail)
   - Passwords don't match (should fail)
   - All valid (should succeed)

### Password Reset Tests
1. Click "Forgot Password?" on login page
2. Test scenarios:
   - Enter valid email
   - Should show "Check your email" confirmation
   - Click "Send again" (resend functionality)
   - Click "Back to Login"
   - Try entering email again to see "Create new password" step

### Dashboard Tests
1. Login successfully
2. Sidebar Navigation:
   - Click different menu items
   - Active state should change
   - On mobile, sidebar should collapse after click
3. User Menu:
   - Click user avatar/name
   - Menu should dropdown
   - Click "Logout" to return to login
4. Mobile View:
   - Resize browser to <768px
   - Sidebar should collapse
   - Click hamburger menu to toggle
   - Notification badge visible

## 🎨 Customization Guide

### Change Logo
**File**: `index.html`, `signup.html`, `forgot-password.html`, `dashboard.html`

Find the SVG logo section:
```html
<svg class="logo-icon" viewBox="0 0 24 24" ...>
    <!-- Replace with your SVG -->
</svg>
```

Or replace with image:
```html
<img src="your-logo.png" alt="Logo" class="logo-icon">
```

### Change Colors
**File**: `styles.css` and `dashboard.css`

Update CSS variables in `:root`:
```css
:root {
    --primary-dark: #1e5a96;      /* Change to your primary color */
    --accent-orange: #ff8c42;      /* Change to your accent color */
    --success-color: #10b981;      /* Change status colors */
    --error-color: #ef4444;
}
```

### Change Company Name
Replace "EHSSuite" with your company name in:
1. HTML `<title>` tags
2. Brand title sections (`.brand-title`)
3. Logo text areas
4. Page headings

### Change Demo Credentials
**File**: `script.js`

Find in `handleLogin()` function:
```javascript
const isDemoAccount = (email === 'demo@ehssuite.com' || email === 'demo') 
    && password === 'Demo@123456';
```

Update to:
```javascript
const isDemoAccount = (email === 'your@email.com' || email === 'username') 
    && password === 'YourPassword123';
```

### Update Dashboard Content
**File**: `dashboard.html`

Modify:
- Navigation menu items (`.nav-section` blocks)
- Stats cards (`.stat-card` elements)
- Feature items in sidebar
- Dashboard metrics

### Change Sidebar Menu Items
**File**: `dashboard.html`

Find the navigation section and modify:
```html
<div class="nav-section">
    <p class="nav-label">Category Name</p>
    <a href="#" class="nav-link">
        <svg><!-- Icon --></svg>
        <span>Menu Item</span>
        <span class="badge">Count</span>
    </a>
</div>
```

## 🔗 Connect to Backend API

### Step 1: Modify Login Handler
**File**: `script.js` - Replace the timeout in `handleLogin()`:

```javascript
// OLD:
setTimeout(() => {
    const isDemoAccount = ...;
    if (isDemoAccount || ...) {
        showSuccessMessage('Login successful!');
        // ...
    }
}, 1500);

// NEW:
fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, rememberMe })
})
.then(response => response.json())
.then(data => {
    if (data.success) {
        showSuccessMessage('Login successful!');
        sessionStorage.setItem('ehssuite_user', email);
        sessionStorage.setItem('ehssuite_token', data.token);
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 2000);
    } else {
        showErrorMessage(data.message || 'Invalid credentials');
    }
})
.catch(error => {
    showErrorMessage('Connection error. Please try again.');
    console.error('Error:', error);
})
.finally(() => {
    loginBtn.disabled = false;
    loginBtn.classList.remove('loading');
    loginBtn.innerHTML = originalText;
});
```

### Step 2: Modify Signup Handler
**File**: `signup.js` - Similar pattern:

```javascript
fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fullName, company, email, password })
})
.then(response => response.json())
.then(data => {
    if (data.success) {
        showSuccessMessage('Account created! Redirecting...');
        setTimeout(() => {
            window.location.href = 'index.html?email=' + encodeURIComponent(email);
        }, 2000);
    }
})
.catch(error => showErrorMessage('Registration failed'))
```

### Step 3: Add Authentication Token
Update dashboard redirect to include token:
```javascript
// In script.js after successful login
sessionStorage.setItem('ehssuite_token', data.token);

// In dashboard.html's checkUserSession()
const user = sessionStorage.getItem('ehssuite_user');
const token = sessionStorage.getItem('ehssuite_token');

if (!user || !token) {
    window.location.href = 'index.html';
}

// Use token in fetch requests
fetch('/api/dashboard/stats', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
})
```

## 🔐 Security Checklist

- [ ] Use HTTPS in production
- [ ] Implement backend password hashing (bcrypt/Argon2)
- [ ] Add CSRF tokens to forms
- [ ] Implement rate limiting on login attempts
- [ ] Use secure HTTP-only cookies for auth tokens
- [ ] Add email verification for signup
- [ ] Implement 2FA (two-factor authentication)
- [ ] Add password expiration policy
- [ ] Log authentication events
- [ ] Implement session timeout

## 📊 Performance Optimization

1. **Minify CSS/JS** for production
2. **Lazy load images** if added
3. **Use CDN** for static files
4. **Cache-bust** CSS/JS files in production
5. **Compress images** (PNGs/JPGs)
6. **Reduce animations** on slow devices

## 📱 Mobile Optimization Notes

- All pages are mobile-responsive
- Touch targets are 44x44px minimum
- Sidebar collapses on mobile (<768px)
- Forms use proper input types (email, password)
- Viewport meta tag included
- Test on real devices

## 🐛 Troubleshooting

### Pages not loading
- Check file paths are correct
- Ensure all files are in same directory
- Clear browser cache (Ctrl+Shift+Del)
- Open browser console (F12) for errors

### Styles not appearing
- Clear browser cache
- Check CSS file path in HTML `<link>` tag
- Verify file permissions

### Forms not validating
- Check JavaScript file is loading
- Open console for JavaScript errors
- Verify form IDs match JavaScript selectors

### Session not persisting
- Check browser allows localStorage/sessionStorage
- Verify private/incognito mode is not enabled
- Check browser developer tools Storage tab

## 📚 Additional Resources

- HTML: https://developer.mozilla.org/en-US/docs/Web/HTML
- CSS: https://developer.mozilla.org/en-US/docs/Web/CSS
- JavaScript: https://developer.mozilla.org/en-US/docs/Web/JavaScript
- Form Validation: https://www.w3.org/TR/html5/forms.html

---

**Version**: 1.0.0  
**Last Updated**: 2026-06-28
