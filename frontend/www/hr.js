const API_BASE_URL = window.__API_BASE_URL
  || localStorage.getItem('ehs_api_base_url')
  || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : window.location.origin);

const token = localStorage.getItem('ehssuite_token');

if (!token) {
  window.location.href = 'index.html';
}

const leaveRequests = [
  { employee: 'Sarah Khan', type: 'Annual', from: '2026-11-03', to: '2026-11-06', status: 'pending' },
  { employee: 'John Lee', type: 'Sick', from: '2026-11-10', to: '2026-11-11', status: 'approved' },
  { employee: 'Anita Verma', type: 'Emergency', from: '2026-11-12', to: '2026-11-12', status: 'rejected' }
];

function authHeaders() {
  return {
    Authorization: `Bearer ${token}`
  };
}

function statusPill(status) {
  return `<span class="status-pill ${status}">${status}</span>`;
}

function renderLeaveTable() {
  const tbody = document.getElementById('leaveTableBody');
  tbody.innerHTML = '';

  leaveRequests.forEach((item) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.employee}</td>
      <td>${item.type}</td>
      <td>${item.from}</td>
      <td>${item.to}</td>
      <td>${statusPill(item.status)}</td>
    `;
    tbody.appendChild(row);
  });

  const pendingCount = leaveRequests.filter((r) => r.status === 'pending').length;
  document.getElementById('openLeaveRequests').textContent = String(pendingCount);
}

async function loadHrMetrics() {
  const employeesRes = await fetch(`${API_BASE_URL}/api/employees?limit=200`, {
    headers: authHeaders()
  });
  const employeesPayload = await employeesRes.json().catch(() => ({}));

  if (!employeesRes.ok) {
    throw new Error(employeesPayload.error || 'Unable to load employees');
  }

  const employees = employeesPayload.data || [];
  const active = employees.filter((e) => e.status === 'active').length;
  const onLeave = employees.filter((e) => e.status === 'on_leave').length;

  document.getElementById('activeEmployees').textContent = String(active);
  document.getElementById('onLeaveEmployees').textContent = String(onLeave);

  let complianceScores = [];
  for (const employee of employees.slice(0, 15)) {
    const compRes = await fetch(`${API_BASE_URL}/api/employees/${employee.id}/compliance`, {
      headers: authHeaders()
    });
    if (!compRes.ok) continue;
    const compPayload = await compRes.json().catch(() => ({}));
    const rows = compPayload.data || [];
    rows.forEach((r) => {
      if (typeof r.compliance_score === 'number') complianceScores.push(r.compliance_score);
    });
  }

  const avg = complianceScores.length
    ? Math.round(complianceScores.reduce((sum, n) => sum + n, 0) / complianceScores.length)
    : 0;

  document.getElementById('complianceAvg').textContent = `${avg}%`;
}

function setupCreateLeaveRequest() {
  document.getElementById('addLeaveBtn').addEventListener('click', () => {
    const employee = document.getElementById('leaveEmployee').value.trim();
    const type = document.getElementById('leaveType').value;
    const from = document.getElementById('leaveFrom').value;
    const to = document.getElementById('leaveTo').value;

    if (!employee || !from || !to) {
      alert('Employee, from date, and to date are required.');
      return;
    }

    leaveRequests.unshift({
      employee,
      type,
      from,
      to,
      status: 'pending'
    });

    renderLeaveTable();
    document.getElementById('leaveEmployee').value = '';
    document.getElementById('leaveFrom').value = '';
    document.getElementById('leaveTo').value = '';
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  renderLeaveTable();
  setupCreateLeaveRequest();
  try {
    await loadHrMetrics();
  } catch (error) {
    document.getElementById('complianceAvg').textContent = 'N/A';
  }
});
