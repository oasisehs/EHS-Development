// ==========================================
// SIGNUP FORM HANDLING & VALIDATION
// ==========================================

const API_BASE_URL = 'https://ehs-development.onrender.com';

document.addEventListener('DOMContentLoaded', function() {
    const signupForm = document.getElementById('signupForm');
    
    // Form submission handler
    signupForm.addEventListener('submit', handleSignup);
    
    // Real-time input validation
    document.getElementById('fullName').addEventListener('blur', validateFullName);
    document.getElementById('company').addEventListener('blur', validateCompany);
    document.getElementById('email').addEventListener('blur', validateEmail);
    document.getElementById('password').addEventListener('blur', validatePassword);
    document.getElementById('confirmPassword').addEventListener('blur', validateConfirmPassword);
    
    // Input event listeners for clearing errors
    document.getElementById('fullName').addEventListener('input', function() {
        clearError('fullNameError');
        clearError('generalError');
    });
    document.getElementById('company').addEventListener('input', function() {
        clearError('companyError');
        clearError('generalError');
    });
    document.getElementById('email').addEventListener('input', function() {
        clearError('emailError');
        clearError('generalError');
    });
    document.getElementById('password').addEventListener('input', function() {
        clearError('passwordError');
        clearError('generalError');
    });
    document.getElementById('confirmPassword').addEventListener('input', function() {
        clearError('confirmPasswordError');
        clearError('generalError');
    });
});

/**
 * Toggle password visibility
 */
function togglePasswordVisibility(fieldId) {
    const passwordInput = document.getElementById(fieldId);
    const iconEye = passwordInput.parentElement.querySelector('.icon-eye');
    const iconEyeOff = passwordInput.parentElement.querySelector('.icon-eye-off');
    
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
 * Validate full name
 */
function validateFullName() {
    const fullName = document.getElementById('fullName');
    const fullNameError = document.getElementById('fullNameError');
    
    if (!fullName.value.trim()) {
        showError(fullNameError, 'Full name is required');
        fullName.classList.add('error-input');
        return false;
    }
    
    if (fullName.value.trim().length < 3) {
        showError(fullNameError, 'Full name must be at least 3 characters');
        fullName.classList.add('error-input');
        return false;
    }
    
    if (!/^[a-zA-Z\s'-]+$/.test(fullName.value.trim())) {
        showError(fullNameError, 'Full name can only contain letters, spaces, hyphens, and apostrophes');
        fullName.classList.add('error-input');
        return false;
    }
    
    clearError(fullNameError);
    fullName.classList.remove('error-input');
    return true;
}

/**
 * Validate company name
 */
function validateCompany() {
    const company = document.getElementById('company');
    const companyError = document.getElementById('companyError');
    
    if (!company.value.trim()) {
        showError(companyError, 'Company name is required');
        company.classList.add('error-input');
        return false;
    }
    
    if (company.value.trim().length < 2) {
        showError(companyError, 'Company name must be at least 2 characters');
        company.classList.add('error-input');
        return false;
    }
    
    clearError(companyError);
    company.classList.remove('error-input');
    return true;
}

/**
 * Validate email format
 */
function validateEmail() {
    const email = document.getElementById('email');
    const emailError = document.getElementById('emailError');
    
    if (!email.value.trim()) {
        showError(emailError, 'Email address is required');
        email.classList.add('error-input');
        return false;
    }
    
    // Email regex pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(email.value.trim())) {
        showError(emailError, 'Please enter a valid email address');
        email.classList.add('error-input');
        return false;
    }
    
    clearError(emailError);
    email.classList.remove('error-input');
    return true;
}

/**
 * Validate password strength
 */
function validatePassword() {
    const password = document.getElementById('password');
    const passwordError = document.getElementById('passwordError');
    
    if (!password.value) {
        showError(passwordError, 'Password is required');
        password.classList.add('error-input');
        return false;
    }
    
    if (password.value.length < 8) {
        showError(passwordError, 'Password must be at least 8 characters');
        password.classList.add('error-input');
        return false;
    }
    
    // Check for uppercase letters
    if (!/[A-Z]/.test(password.value)) {
        showError(passwordError, 'Password must contain at least one uppercase letter');
        password.classList.add('error-input');
        return false;
    }
    
    // Check for lowercase letters
    if (!/[a-z]/.test(password.value)) {
        showError(passwordError, 'Password must contain at least one lowercase letter');
        password.classList.add('error-input');
        return false;
    }
    
    // Check for numbers
    if (!/[0-9]/.test(password.value)) {
        showError(passwordError, 'Password must contain at least one number');
        password.classList.add('error-input');
        return false;
    }
    
    clearError(passwordError);
    password.classList.remove('error-input');
    return true;
}

/**
 * Validate confirm password
 */
function validateConfirmPassword() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    
    if (!confirmPassword.value) {
        showError(confirmPasswordError, 'Please confirm your password');
        confirmPassword.classList.add('error-input');
        return false;
    }
    
    if (confirmPassword.value !== password) {
        showError(confirmPasswordError, 'Passwords do not match');
        confirmPassword.classList.add('error-input');
        return false;
    }
    
    clearError(confirmPasswordError);
    confirmPassword.classList.remove('error-input');
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
 * Main signup handler
 */
function handleSignup(e) {
    e.preventDefault();
    
    // Clear previous errors
    document.getElementById('generalError').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
    
    // Validate all fields
    const isFullNameValid = validateFullName();
    const isCompanyValid = validateCompany();
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    const agreeTerms = document.querySelector('input[name="agreeTerms"]').checked;
    
    // Check terms
    let isTermsValid = true;
    if (!agreeTerms) {
        showError(document.getElementById('termsError'), 'You must agree to the Terms and Conditions');
        isTermsValid = false;
    }
    
    if (!isFullNameValid || !isCompanyValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid || !isTermsValid) {
        return;
    }
    
    // Get form data
    const fullName = document.getElementById('fullName').value.trim();
    const company = document.getElementById('company').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Disable button and show loading state
    const signupBtn = document.querySelector('.login-btn');
    const originalText = signupBtn.innerHTML;
    signupBtn.disabled = true;
    signupBtn.classList.add('loading');
    signupBtn.innerHTML = '<svg style="width:16px;height:16px;animation:spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg> Creating Account...';
    
    // Call backend API
    const apiUrl = API_BASE_URL;
    
    fetch(`${apiUrl}/api/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            email,
            password,
            fullName,
            company,
            department: document.getElementById('department')?.value || '',
            phone: document.getElementById('phone')?.value || ''
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.token) {
            // Success
            showSuccessMessage('Account created successfully! Redirecting to login...');
            
            // Store user token and data
            localStorage.setItem('ehssuite_token', data.token);
            localStorage.setItem('ehssuite_user', JSON.stringify(data.user));
            
            // Redirect to login after 2 seconds
            setTimeout(() => {
                window.location.href = 'index.html?registered=true&email=' + encodeURIComponent(email);
            }, 2000);
        } else {
            // Error
            showErrorMessage(data.error || 'Registration failed. Please try again.');
            signupBtn.disabled = false;
            signupBtn.classList.remove('loading');
            signupBtn.innerHTML = originalText;
        }
    })
    .catch(error => {
        console.error('Signup error:', error);
        showErrorMessage('Connection error. Make sure the backend server is running on ' + apiUrl);
        signupBtn.disabled = false;
        signupBtn.classList.remove('loading');
        signupBtn.innerHTML = originalText;
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
 * Add CSS animation for spinning loader
 */
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .password-hint {
        font-size: 11px;
        color: var(--text-light);
        margin-top: 6px;
        font-weight: 500;
    }
`;
document.head.appendChild(style);
