// ==========================================
// LOGIN FORM HANDLING & VALIDATION
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    // Form submission handler
    loginForm.addEventListener('submit', handleLogin);
    
    // Real-time input validation
    document.getElementById('email').addEventListener('blur', validateEmail);
    document.getElementById('password').addEventListener('blur', validatePassword);
    
    // Input event listeners for clearing errors
    document.getElementById('email').addEventListener('input', function() {
        clearError('emailError');
        clearError('generalError');
    });
    
    document.getElementById('password').addEventListener('input', function() {
        clearError('passwordError');
        clearError('generalError');
    });
});

/**
 * Toggle password visibility
 */
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const iconEye = document.querySelector('.icon-eye');
    const iconEyeOff = document.querySelector('.icon-eye-off');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        iconEye.style.display = 'none';
        iconEyeOff.style.display = 'block';
    } else {
        passwordInput.type = 'password';
        iconEye.style.display = 'block';
        iconEyeOff.style.display = 'none';
    }
}

/**
 * Validate email format
 */
function validateEmail() {
    const email = document.getElementById('email');
    const emailError = document.getElementById('emailError');
    
    if (!email.value.trim()) {
        showError(emailError, 'Email address or username is required');
        email.classList.add('error-input');
        return false;
    }
    
    // Email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$|^[a-zA-Z0-9_-]{3,}$/;
    
    if (!emailRegex.test(email.value.trim())) {
        showError(emailError, 'Please enter a valid email address or username (min 3 characters)');
        email.classList.add('error-input');
        return false;
    }
    
    clearError(emailError);
    email.classList.remove('error-input');
    return true;
}

/**
 * Validate password
 */
function validatePassword() {
    const password = document.getElementById('password');
    const passwordError = document.getElementById('passwordError');
    
    if (!password.value) {
        showError(passwordError, 'Password is required');
        password.classList.add('error-input');
        return false;
    }
    
    if (password.value.length < 6) {
        showError(passwordError, 'Password must be at least 6 characters');
        password.classList.add('error-input');
        return false;
    }
    
    clearError(passwordError);
    password.classList.remove('error-input');
    return true;
}

/**
 * Show error message
 */
function showError(errorElement, message) {
    errorElement.textContent = message;
    errorElement.classList.add('show');
}

/**
 * Clear error message
 */
function clearError(errorId) {
    const errorElement = document.getElementById(errorId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
}

/**
 * Main login handler
 */
function handleLogin(e) {
    e.preventDefault();
    
    // Clear previous errors
    document.getElementById('generalError').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
    
    // Validate all fields
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    
    if (!isEmailValid || !isPasswordValid) {
        return;
    }
    
    // Get form data
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.querySelector('input[name="rememberMe"]').checked;
    
    // Disable button and show loading state
    const loginBtn = document.querySelector('.login-btn');
    const originalText = loginBtn.innerHTML;
    loginBtn.disabled = true;
    loginBtn.classList.add('loading');
    loginBtn.innerHTML = '<svg style="width:16px;height:16px;animation:spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg> Signing in...';
    
    // Call backend API
    const apiUrl = localStorage.getItem('API_URL') || 'https://ehs-development.onrender.com';
    
    fetch(`${apiUrl}/api/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            // Success
            showSuccessMessage('Login successful! Redirecting...');
            
            // Store user session and token
            localStorage.setItem('ehssuite_token', data.token);
            localStorage.setItem('ehssuite_user', JSON.stringify(data.user));
            
            if (rememberMe) {
                localStorage.setItem('ehssuite_remember', 'true');
            } else {
                localStorage.setItem('ehssuite_remember', 'false');
            }
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            // Error
            showErrorMessage(data.error || 'Invalid email or password. Please try again.');
            loginBtn.disabled = false;
            loginBtn.classList.remove('loading');
            loginBtn.innerHTML = originalText;
        }
    })
    .catch(error => {
        console.error('Login error:', error);
        // Fallback to demo account if backend is not available
        const isDemoAccount = (email === 'demo@ehssuite.com' || email === 'demo') && password === 'Demo@123456';
        if (isDemoAccount) {
            showSuccessMessage('Login successful! Redirecting...');
            localStorage.setItem('ehssuite_user', email);
            if (rememberMe) {
                localStorage.setItem('ehssuite_remember', 'true');
            }
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            showErrorMessage('Connection error. Make sure the backend server is running on ' + apiUrl);
            loginBtn.disabled = false;
            loginBtn.classList.remove('loading');
            loginBtn.innerHTML = originalText;
        }
    });
}

/**
 * Show success message
 */
function showSuccessMessage(message) {
    const successAlert = document.getElementById('successMessage');
    successAlert.innerHTML = `
        <svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        ${message}
    `;
    successAlert.style.display = 'flex';
}

/**
 * Show error message
 */
function showErrorMessage(message) {
    const generalError = document.getElementById('generalError');
    generalError.innerHTML = `
        <svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
        ${message}
    `;
    generalError.style.display = 'flex';
}

/**
 * Restore saved email if "Remember me" was checked
 */
function restoreSavedEmail() {
    const savedEmail = localStorage.getItem('ehssuite_user');
    const isRemembered = localStorage.getItem('ehssuite_remember');
    
    if (savedEmail && isRemembered === 'true') {
        document.getElementById('email').value = savedEmail;
        document.querySelector('input[name="rememberMe"]').checked = true;
    }
}

/**
 * Add CSS animation for spinning loader
 */
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Restore saved email on page load
window.addEventListener('load', restoreSavedEmail);
