// ==========================================
// FORGOT PASSWORD FORM HANDLING & VALIDATION
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    const resetPasswordForm = document.getElementById('resetPasswordForm');
    
    if (forgotPasswordForm) {
        forgotPasswordForm.addEventListener('submit', handleForgotPassword);
        document.getElementById('email').addEventListener('blur', validateEmail);
        document.getElementById('email').addEventListener('input', function() {
            clearError('emailError');
            clearError('generalError');
        });
    }
    
    if (resetPasswordForm) {
        resetPasswordForm.addEventListener('submit', handleResetPassword);
        document.getElementById('newPassword').addEventListener('blur', validateNewPassword);
        document.getElementById('confirmNewPassword').addEventListener('blur', validateConfirmNewPassword);
        
        document.getElementById('newPassword').addEventListener('input', function() {
            clearError('newPasswordError');
            clearError('resetError');
        });
        document.getElementById('confirmNewPassword').addEventListener('input', function() {
            clearError('confirmNewPasswordError');
            clearError('resetError');
        });
    }
});

/**
 * Toggle password visibility
 */
function togglePasswordVisibility(fieldId) {
    const passwordInput = document.getElementById(fieldId);
    const wrapper = passwordInput.parentElement;
    const iconEye = wrapper.querySelector('.icon-eye');
    const iconEyeOff = wrapper.querySelector('.icon-eye-off');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        if (iconEye) iconEye.style.display = 'none';
        if (iconEyeOff) iconEyeOff.style.display = 'block';
    } else {
        passwordInput.type = 'password';
        if (iconEye) iconEye.style.display = 'block';
        if (iconEyeOff) iconEyeOff.style.display = 'none';
    }
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
 * Validate new password strength
 */
function validateNewPassword() {
    const password = document.getElementById('newPassword');
    const passwordError = document.getElementById('newPasswordError');
    
    if (!password.value) {
        showError(passwordError, 'New password is required');
        password.classList.add('error-input');
        return false;
    }
    
    if (password.value.length < 8) {
        showError(passwordError, 'Password must be at least 8 characters');
        password.classList.add('error-input');
        return false;
    }
    
    if (!/[A-Z]/.test(password.value)) {
        showError(passwordError, 'Password must contain at least one uppercase letter');
        password.classList.add('error-input');
        return false;
    }
    
    if (!/[a-z]/.test(password.value)) {
        showError(passwordError, 'Password must contain at least one lowercase letter');
        password.classList.add('error-input');
        return false;
    }
    
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
 * Validate confirm new password
 */
function validateConfirmNewPassword() {
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword');
    const confirmPasswordError = document.getElementById('confirmNewPasswordError');
    
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
 * Handle forgot password form submission
 */
function handleForgotPassword(e) {
    e.preventDefault();
    
    document.getElementById('generalError').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
    
    if (!validateEmail()) {
        return;
    }
    
    const email = document.getElementById('email').value.trim();
    const forgotBtn = document.querySelector('#forgotPasswordForm .login-btn');
    const originalText = forgotBtn.innerHTML;
    
    forgotBtn.disabled = true;
    forgotBtn.classList.add('loading');
    forgotBtn.innerHTML = '<svg style="width:16px;height:16px;animation:spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg> Sending...';
    
    // Simulate API call
    setTimeout(() => {
        showSuccessMessage('Reset link sent! Check your email.');
        
        // Store email for display
        document.getElementById('confirmEmail').textContent = email;
        
        // Show step 2
        setTimeout(() => {
            document.getElementById('stepOne').style.display = 'none';
            document.getElementById('stepTwo').style.display = 'block';
        }, 1000);
        
        forgotBtn.disabled = false;
        forgotBtn.classList.remove('loading');
        forgotBtn.innerHTML = originalText;
    }, 1500);
}

/**
 * Back to login
 */
function backToLogin() {
    window.location.href = 'index.html';
}

/**
 * Resend email
 */
function resendEmail(e) {
    e.preventDefault();
    
    const email = document.getElementById('confirmEmail').textContent;
    const resendLink = event.target;
    const originalText = resendLink.textContent;
    
    resendLink.textContent = 'Sending...';
    resendLink.style.pointerEvents = 'none';
    
    setTimeout(() => {
        resendLink.textContent = 'Email sent!';
        setTimeout(() => {
            resendLink.textContent = originalText;
            resendLink.style.pointerEvents = 'auto';
        }, 2000);
    }, 1500);
}

/**
 * Handle reset password form submission
 */
function handleResetPassword(e) {
    e.preventDefault();
    
    document.getElementById('resetError').style.display = 'none';
    document.getElementById('resetSuccess').style.display = 'none';
    
    const isNewPasswordValid = validateNewPassword();
    const isConfirmPasswordValid = validateConfirmNewPassword();
    
    if (!isNewPasswordValid || !isConfirmPasswordValid) {
        return;
    }
    
    const newPassword = document.getElementById('newPassword').value;
    const resetBtn = document.querySelector('#resetPasswordForm .login-btn');
    const originalText = resetBtn.innerHTML;
    
    resetBtn.disabled = true;
    resetBtn.classList.add('loading');
    resetBtn.innerHTML = '<svg style="width:16px;height:16px;animation:spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/></svg> Updating...';
    
    // Simulate API call
    setTimeout(() => {
        showResetSuccessMessage('Password updated successfully! Redirecting to login...');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }, 1500);
}

/**
 * Show success message for password reset
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
 * Show reset success message
 */
function showResetSuccessMessage(message) {
    const successAlert = document.getElementById('resetSuccess');
    successAlert.innerHTML = `
        <svg style="width:20px;height:20px;" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
        ${message}
    `;
    successAlert.style.display = 'flex';
}

/**
 * Add CSS for email confirmation
 */
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
    
    .email-confirmation {
        padding: 20px;
        background: var(--bg-light);
        border-radius: 12px;
        text-align: center;
    }
    
    .confirmation-icon {
        font-size: 48px;
        margin-bottom: 16px;
    }
    
    .confirmation-email {
        font-size: 14px;
        font-weight: 600;
        color: var(--primary-dark);
        margin-bottom: 12px;
    }
    
    .confirmation-text {
        font-size: 14px;
        color: var(--text-light);
        margin-bottom: 20px;
        line-height: 1.5;
    }
    
    .info-box {
        background: var(--bg-white);
        border-left: 3px solid var(--accent-orange);
        padding: 12px;
        border-radius: 6px;
        margin-bottom: 20px;
        text-align: left;
    }
    
    .info-box p {
        font-size: 12px;
        color: var(--text-light);
        margin: 0;
    }
    
    .info-box strong {
        color: var(--text-dark);
    }
    
    .resend-text {
        font-size: 13px;
        color: var(--text-light);
        margin-top: 16px;
    }
    
    .resend-text a {
        color: var(--primary-light);
        text-decoration: none;
        font-weight: 600;
        transition: color var(--transition-fast);
    }
    
    .resend-text a:hover {
        color: var(--accent-orange);
    }
    
    .password-hint {
        font-size: 11px;
        color: var(--text-light);
        margin-top: 6px;
        font-weight: 500;
    }
    
    .email-confirmation .login-btn {
        margin-top: 20px;
        margin-bottom: 0;
    }
`;
document.head.appendChild(style);
