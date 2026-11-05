const API_BASE_URL = window.__API_BASE_URL
    || localStorage.getItem('ehs_api_base_url')
    || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : window.location.origin);

function showInlineError(elementId, message) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.textContent = message;
    element.classList.add('show');
}

function clearInlineError(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.textContent = '';
    element.classList.remove('show');
}

function showGeneralMessage(type, message) {
    const errorEl = document.getElementById('generalError');
    const successEl = document.getElementById('successMessage');

    if (errorEl) errorEl.classList.add('hidden');
    if (successEl) successEl.classList.add('hidden');

    const target = type === 'success' ? successEl : errorEl;
    if (!target) return;

    target.textContent = message;
    target.classList.remove('hidden');
}

function validatePasswordComplexity(password) {
    if (!password || password.length < 8) {
        return 'Password must be at least 8 characters.';
    }

    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        return 'Password must include uppercase, lowercase, and numeric characters.';
    }

    return null;
}

function enforceAccessGuard() {
    const token = localStorage.getItem('ehssuite_token') || sessionStorage.getItem('ehssuite_token');
    const userRaw = localStorage.getItem('ehssuite_user') || sessionStorage.getItem('ehssuite_user');

    if (!token || !userRaw) {
        window.location.href = 'index.html';
        return null;
    }

    try {
        const user = JSON.parse(userRaw);
        if (!user.must_change_password) {
            window.location.href = 'dashboard.html';
            return null;
        }
        return { token, user };
    } catch (_error) {
        window.location.href = 'index.html';
        return null;
    }
}

async function submitFirstLoginPassword(event) {
    event.preventDefault();

    clearInlineError('newPasswordError');
    clearInlineError('confirmPasswordError');
    showGeneralMessage('error', '');

    const session = enforceAccessGuard();
    if (!session) return;

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    const complexityError = validatePasswordComplexity(newPassword);
    if (complexityError) {
        showInlineError('newPasswordError', complexityError);
        return;
    }

    if (newPassword !== confirmPassword) {
        showInlineError('confirmPasswordError', 'Passwords do not match.');
        return;
    }

    const submitBtn = document.getElementById('firstLoginSubmitBtn');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');
    submitBtn.innerHTML = '<span>Updating...</span>';

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/first-login-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.token}`
            },
            body: JSON.stringify({ newPassword })
        });

        const payload = await response.json();
        if (!response.ok) {
            throw new Error(payload.error || 'Failed to update password.');
        }

        const updatedUser = { ...session.user, must_change_password: false };
        localStorage.setItem('ehssuite_user', JSON.stringify(updatedUser));
        sessionStorage.setItem('ehssuite_user', JSON.stringify(updatedUser));

        showGeneralMessage('success', 'Password updated. Redirecting to dashboard...');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1200);
    } catch (error) {
        showGeneralMessage('error', error.message || 'Unable to update password.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
        submitBtn.innerHTML = originalText;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const session = enforceAccessGuard();
    if (!session) return;

    document.getElementById('firstLoginForm').addEventListener('submit', submitFirstLoginPassword);
});
