const API_BASE_URL = window.__API_BASE_URL
  || localStorage.getItem('ehs_api_base_url')
  || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : window.location.origin);

const token = localStorage.getItem('ehssuite_token');
if (!token) {
  window.location.href = 'index.html';
}

const state = {
  page: 1,
  limit: 9,
  pages: 1,
  q: '',
  status: '',
  departmentId: ''
};

function authHeaders() {
  return { Authorization: `Bearer ${token}` };
}

function escapeHtml(v) {
  return String(v ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderSummary(rows) {
  const total = rows.length;
  const active = rows.filter((r) => r.status === 'active').length;
  const onLeave = rows.filter((r) => r.status === 'on_leave').length;
  const scores = rows.map((r) => Number(r.compliance_score || 0));
  const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  document.getElementById('totalEmployees').textContent = String(total);
  document.getElementById('activeEmployees').textContent = String(active);
  document.getElementById('onLeaveEmployees').textContent = String(onLeave);
  document.getElementById('complianceAverage').textContent = `${avg}%`;
}

function renderPagination() {
  document.getElementById('employeePaginationText').textContent = `Page ${state.page} of ${state.pages}`;
  document.getElementById('employeePrevBtn').disabled = state.page <= 1;
  document.getElementById('employeeNextBtn').disabled = state.page >= state.pages;
}

function renderCards(rows) {
  const host = document.getElementById('employeeCards');
  host.innerHTML = '';

  if (!rows.length) {
    host.innerHTML = '<div class="employee-card"><h3>No employees found</h3><div class="meta">Try adjusting filters.</div></div>';
    return;
  }

  rows.forEach((emp) => {
    const card = document.createElement('article');
    card.className = 'employee-card';
    const status = escapeHtml(emp.status || 'inactive');
    const fullName = `${escapeHtml(emp.first_name)} ${escapeHtml(emp.last_name)}`.trim();
    card.innerHTML = `
      <h3>${fullName || 'Unnamed Employee'}</h3>
      <div class="meta">${escapeHtml(emp.job_title || 'No title')} | ${escapeHtml(emp.department_name || 'Unassigned')}</div>
      <div class="row">Email: ${escapeHtml(emp.email || '-')}</div>
      <div class="row">Compliance: ${escapeHtml(emp.compliance_score ?? 0)}%</div>
      <div class="row"><span class="status-pill ${status}">${status}</span></div>
      <div class="card-actions">
        <button type="button" data-action="training" data-employee-id="${emp.id}">Training</button>
        <button type="button" data-action="onboarding" data-employee-id="${emp.id}">Onboarding</button>
      </div>
    `;
    host.appendChild(card);
  });

  host.querySelectorAll('button[data-action="training"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const employeeId = btn.getAttribute('data-employee-id');
      window.location.href = `training.html?employeeId=${encodeURIComponent(employeeId)}`;
    });
  });

  host.querySelectorAll('button[data-action="onboarding"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const employeeId = btn.getAttribute('data-employee-id');
      window.location.href = `onboarding.html?employeeId=${encodeURIComponent(employeeId)}`;
    });
  });
}

async function loadDepartments() {
  const res = await fetch(`${API_BASE_URL}/api/departments?limit=100`, { headers: authHeaders() });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Failed to load departments');
  }

  const select = document.getElementById('employeeDeptFilter');
  const rows = payload.data || [];
  rows.forEach((d) => {
    const opt = document.createElement('option');
    opt.value = String(d.id);
    opt.textContent = d.name;
    select.appendChild(opt);
  });
}

async function loadEmployees() {
  const query = new URLSearchParams({
    page: String(state.page),
    limit: String(state.limit)
  });

  if (state.q) {
    query.set('q', state.q);
  }
  if (state.status) {
    query.set('status', state.status);
  }
  if (state.departmentId) {
    query.set('department_id', state.departmentId);
  }

  const res = await fetch(`${API_BASE_URL}/api/employees?${query.toString()}`, {
    headers: authHeaders()
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Failed to load employees');
  }

  const rows = payload.data || [];
  const pagination = payload.pagination || {};
  state.page = pagination.page || state.page;
  state.pages = pagination.pages || 1;

  renderSummary(rows);
  renderCards(rows);
  renderPagination();
}

function setupEvents() {
  document.getElementById('applyEmployeeFiltersBtn').addEventListener('click', async () => {
    state.q = document.getElementById('employeeSearch').value.trim();
    state.status = document.getElementById('employeeStatusFilter').value;
    state.departmentId = document.getElementById('employeeDeptFilter').value;
    state.page = 1;

    try {
      await loadEmployees();
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('employeePrevBtn').addEventListener('click', async () => {
    if (state.page <= 1) return;
    state.page -= 1;
    try {
      await loadEmployees();
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('employeeNextBtn').addEventListener('click', async () => {
    if (state.page >= state.pages) return;
    state.page += 1;
    try {
      await loadEmployees();
    } catch (err) {
      alert(err.message);
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  setupEvents();
  try {
    await loadDepartments();
    await loadEmployees();
  } catch (err) {
    alert(err.message);
  }
});
