const API_BASE_URL = window.__API_BASE_URL
    || localStorage.getItem('ehs_api_base_url')
    || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : window.location.origin);

const token = localStorage.getItem('ehssuite_token');
let availableRoles = ['admin', 'manager', 'employee', 'viewer'];

function setStatus(type, message) {
  const statusAlert = document.getElementById('statusAlert');
  statusAlert.className = `status-alert ${type}`;
  statusAlert.textContent = message;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function roleOptions(selectedRole) {
  return availableRoles.map((role) => (
    `<option value="${escapeHtml(role)}"${role === selectedRole ? ' selected' : ''}>${escapeHtml(role)}</option>`
  )).join('');
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function renderSummary(data) {
  const summaryGrid = document.getElementById('summaryGrid');
  const cards = [
    { label: 'Users', value: data.total_users ?? 0 },
    { label: 'Roles', value: data.total_roles ?? 0 },
    { label: 'Open incidents', value: data.open_incidents ?? 0 },
    { label: 'Pending compliance', value: data.pending_compliance ?? 0 }
  ];

  summaryGrid.innerHTML = cards.map((card) => `
    <div class="summary-box">
      <h4>${card.label}</h4>
      <strong>${card.value}</strong>
    </div>
  `).join('');
}

function renderAudit(entries) {
  const auditList = document.getElementById('auditList');

  if (!Array.isArray(entries) || entries.length === 0) {
    auditList.innerHTML = '<li class="audit-item"><strong>No audit entries yet.</strong></li>';
    return;
  }

  auditList.innerHTML = entries.slice(0, 6).map((entry) => `
    <li class="audit-item">
      <strong>${entry.action || 'System action'}</strong>
      <div class="audit-meta">${entry.actor_name || 'System'} · ${entry.entity_type || 'system'} · ${formatDate(entry.timestamp || entry.created_at)}</div>
    </li>
  `).join('');
}

function renderUsers(users) {
  const tableBody = document.getElementById('usersTableBody');
  const emptyState = document.getElementById('usersEmpty');

  if (!Array.isArray(users) || users.length === 0) {
    tableBody.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';
  tableBody.innerHTML = users.map((user) => {
    const selectedRole = String(user.role || 'viewer').toLowerCase();
    return `
      <tr>
        <td>${escapeHtml(user.id)}</td>
        <td>${escapeHtml(user.full_name || '—')}</td>
        <td>${escapeHtml(user.email || '—')}</td>
        <td>${escapeHtml(user.status || 'active')}</td>
        <td>${Boolean(user.must_change_password) ? 'Yes' : 'No'}</td>
        <td>
          <select class="inline-role-select" data-user-id="${escapeHtml(user.id)}">
            ${roleOptions(selectedRole)}
          </select>
        </td>
        <td class="actions-cell">
          <button class="btn btn-primary" data-action="save-role" data-user-id="${escapeHtml(user.id)}">Save role</button>
          <button class="btn btn-primary" data-action="toggle-status" data-user-id="${escapeHtml(user.id)}" data-current-status="${escapeHtml(String(user.status || 'active').toLowerCase())}">${String(user.status || 'active').toLowerCase() === 'active' ? 'Deactivate' : 'Activate'}</button>
        </td>
      </tr>
    `;
  }).join('');
}

function populateRoleDropdown() {
  const roleSelect = document.getElementById('newUserRole');
  roleSelect.innerHTML = roleOptions('employee');
}

async function loadRoles() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/roles`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Failed to load roles');
    }

    if (Array.isArray(payload.data) && payload.data.length > 0) {
      availableRoles = payload.data.map((entry) => String(entry).toLowerCase());
    }
  } catch (error) {
    console.error('Roles load failed:', error);
    availableRoles = ['admin', 'manager', 'employee', 'viewer'];
  }

  populateRoleDropdown();
}

async function loadUsers() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Failed to load users');
    }

    renderUsers(payload.data || []);
  } catch (error) {
    console.error('Users load failed:', error);
    renderUsers([]);
  }
}

async function loadSettings() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Failed to load settings');
    }

    const settings = payload.data || {};
    document.getElementById('incident_escalation_threshold').value = settings.incident_escalation_threshold ?? 75;
    document.getElementById('compliance_target').value = settings.compliance_target ?? 95;
    document.getElementById('session_timeout_minutes').value = settings.session_timeout_minutes ?? 60;
    document.getElementById('require_mfa').checked = Boolean(settings.require_mfa);
    document.getElementById('email_alerts_enabled').checked = Boolean(settings.email_alerts_enabled);
    document.getElementById('in_app_alerts_enabled').checked = Boolean(settings.in_app_alerts_enabled);
  } catch (error) {
    setStatus('error', error.message || 'Unable to load settings.');
  }
}

async function loadSummary() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/summary`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Failed to load summary');
    }

    renderSummary(payload.data || {});
  } catch (error) {
    console.error('Summary load failed:', error);
  }
}

async function loadAudit() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/audit-log`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error || 'Failed to load audit log');
    }

    renderAudit(payload.data || []);
  } catch (error) {
    console.error('Audit load failed:', error);
    renderAudit([]);
  }
}

async function saveSettings(event) {
  event.preventDefault();

  const payload = {
    incident_escalation_threshold: Number(document.getElementById('incident_escalation_threshold').value),
    compliance_target: Number(document.getElementById('compliance_target').value),
    session_timeout_minutes: Number(document.getElementById('session_timeout_minutes').value),
    require_mfa: document.getElementById('require_mfa').checked,
    email_alerts_enabled: document.getElementById('email_alerts_enabled').checked,
    in_app_alerts_enabled: document.getElementById('in_app_alerts_enabled').checked
  };

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Settings update failed');
    }

    setStatus('success', 'Settings saved successfully.');
    await loadSummary();
    await loadAudit();
  } catch (error) {
    setStatus('error', error.message || 'Unable to save settings.');
  }
}

async function createUser(event) {
  event.preventDefault();

  const createButton = document.getElementById('createUserBtn');
  const originalText = createButton.textContent;

  const autoGeneratePassword = document.getElementById('newUserAutoGeneratePassword').checked;
  const manualPassword = document.getElementById('newUserPassword').value;

  if (!autoGeneratePassword && manualPassword.length < 8) {
    setStatus('error', 'Temporary password must be at least 8 characters when auto-generate is disabled.');
    return;
  }

  const payload = {
    email: document.getElementById('newUserEmail').value.trim(),
    password: manualPassword,
    autoGeneratePassword,
    mustChangePassword: document.getElementById('newUserMustChangePassword').checked,
    fullName: document.getElementById('newUserFullName').value.trim(),
    role: document.getElementById('newUserRole').value
  };

  try {
    createButton.disabled = true;
    createButton.textContent = 'Creating...';

    const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create user');
    }

    const temporaryPassword = data.temporaryPassword || payload.password;
    setStatus('success', `User ${payload.email} created. Temporary password: ${temporaryPassword}`);
    document.getElementById('createUserForm').reset();
    document.getElementById('newUserRole').value = 'employee';
    document.getElementById('newUserAutoGeneratePassword').checked = true;
    document.getElementById('newUserMustChangePassword').checked = true;
    togglePasswordInputState();
    await loadSummary();
    await loadUsers();
    await loadAudit();
  } catch (error) {
    setStatus('error', error.message || 'Unable to create user.');
  } finally {
    createButton.disabled = false;
    createButton.textContent = originalText;
  }
}

async function updateUserStatus(userId, nextStatus) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ status: nextStatus })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update status');
    }

    setStatus('success', `User #${userId} is now ${nextStatus}.`);
    await loadUsers();
    await loadAudit();
  } catch (error) {
    setStatus('error', error.message || 'Unable to update status.');
  }
}

function togglePasswordInputState() {
  const autoGenerate = document.getElementById('newUserAutoGeneratePassword').checked;
  const passwordInput = document.getElementById('newUserPassword');
  passwordInput.disabled = autoGenerate;
  passwordInput.required = !autoGenerate;
  if (autoGenerate) {
    passwordInput.value = '';
  }
}

async function updateUserRole(userId) {
  const roleSelect = document.querySelector(`.inline-role-select[data-user-id="${userId}"]`);
  if (!roleSelect) return;

  const role = roleSelect.value;
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ role })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update role');
    }

    setStatus('success', `Role updated to ${role} for user #${userId}.`);
    await loadUsers();
    await loadAudit();
  } catch (error) {
    setStatus('error', error.message || 'Unable to update role.');
  }
}

function bindUserActions() {
  const tableBody = document.getElementById('usersTableBody');
  tableBody.addEventListener('click', async (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.dataset.action === 'save-role') {
      const userId = target.dataset.userId;
      if (userId) {
        await updateUserRole(userId);
      }
    }

    if (target.dataset.action === 'toggle-status') {
      const userId = target.dataset.userId;
      const currentStatus = String(target.dataset.currentStatus || 'active').toLowerCase();
      const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
      if (userId) {
        await updateUserStatus(userId, nextStatus);
      }
    }
  });
}

function loadUserName() {
  const user = JSON.parse(localStorage.getItem('ehssuite_user') || '{}');
  const name = user.full_name || user.email || 'Admin';
  document.getElementById('userName').textContent = name;
}

function initDate() {
  const dateDisplay = document.getElementById('dateDisplay');
  if (dateDisplay) {
    dateDisplay.textContent = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  initDate();
  loadUserName();
  await loadRoles();
  await loadSummary();
  await loadSettings();
  await loadUsers();
  await loadAudit();

  document.getElementById('settingsForm').addEventListener('submit', saveSettings);
  document.getElementById('createUserForm').addEventListener('submit', createUser);
  document.getElementById('newUserAutoGeneratePassword').addEventListener('change', togglePasswordInputState);
  togglePasswordInputState();
  bindUserActions();
});
