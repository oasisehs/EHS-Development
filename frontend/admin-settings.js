const API_BASE_URL = window.__API_BASE_URL
    || localStorage.getItem('ehs_api_base_url')
    || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5000'
        : window.location.origin);

const token = localStorage.getItem('ehssuite_token');

function setStatus(type, message) {
  const statusAlert = document.getElementById('statusAlert');
  statusAlert.className = `status-alert ${type}`;
  statusAlert.textContent = message;
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
  await loadSummary();
  await loadSettings();
  await loadAudit();

  document.getElementById('settingsForm').addEventListener('submit', saveSettings);
});
