const API_BASE_URL = window.__API_BASE_URL
  || localStorage.getItem('ehs_api_base_url')
  || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : window.location.origin);

const token = localStorage.getItem('ehssuite_token');
if (!token) {
  window.location.href = 'index.html';
}

function headers(withJson = false) {
  const h = { Authorization: `Bearer ${token}` };
  if (withJson) h['Content-Type'] = 'application/json';
  return h;
}

function setKpis(rows) {
  document.getElementById('incTotal').textContent = String(rows.length);
  document.getElementById('incOpen').textContent = String(rows.filter((r) => (r.status || '').toLowerCase() !== 'closed').length);
  document.getElementById('incHigh').textContent = String(rows.filter((r) => (r.severity || '').toLowerCase() === 'high').length);
}

function renderTable(rows) {
  const body = document.getElementById('incidentsBody');
  body.innerHTML = '';

  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="6">No incidents found.</td></tr>';
    return;
  }

  rows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.id}</td>
      <td>${row.employee_id || '-'}</td>
      <td>${row.severity || '-'}</td>
      <td>${row.status || '-'}</td>
      <td>${row.incident_date ? new Date(row.incident_date).toLocaleDateString() : '-'}</td>
      <td>${row.category || '-'}</td>
    `;
    body.appendChild(tr);
  });
}

async function loadIncidents() {
  const res = await fetch(`${API_BASE_URL}/api/incidents?limit=100&page=1`, {
    headers: headers()
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || 'Failed to load incidents');

  const rows = payload.data || [];
  setKpis(rows);
  renderTable(rows);
}

async function submitIncident() {
  const employeeId = parseInt(document.getElementById('incidentEmployeeId').value, 10);
  const severity = document.getElementById('incidentSeverity').value;
  const category = document.getElementById('incidentCategory').value.trim() || 'safety';
  const incidentDate = document.getElementById('incidentDate').value;
  const description = document.getElementById('incidentDescription').value.trim();

  if (!description) throw new Error('Description is required');

  const payload = {
    title: category ? `${category.toUpperCase()} incident report` : 'Incident report',
    description,
    category,
    severity,
    location: 'On-site',
    date_occurred: incidentDate || new Date().toISOString(),
    assigned_to: employeeId || null,
    status: 'open'
  };

  const res = await fetch(`${API_BASE_URL}/api/incidents`, {
    method: 'POST',
    headers: headers(true),
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Failed to submit incident');

  document.getElementById('incidentDescription').value = '';
  await loadIncidents();
}

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('submitIncidentBtn').addEventListener('click', async () => {
    try {
      await submitIncident();
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('refreshIncidentsBtn').addEventListener('click', async () => {
    try {
      await loadIncidents();
    } catch (err) {
      alert(err.message);
    }
  });

  try {
    await loadIncidents();
  } catch (err) {
    alert(err.message);
  }
});
