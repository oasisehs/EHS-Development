const API_BASE_URL = window.__API_BASE_URL
  || localStorage.getItem('ehs_api_base_url')
  || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : window.location.origin);

const token = localStorage.getItem('ehssuite_token');

if (!token) {
  window.location.href = 'index.html';
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
}

function setOutput(value) {
  const out = document.getElementById('trainingOutput');
  out.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

function renderTable(rows) {
  const body = document.getElementById('trainingTable');
  body.innerHTML = '';

  rows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.employee_id || ''}</td>
      <td>${row.course_id || ''}</td>
      <td>${row.status || ''}</td>
      <td>${row.final_score ?? ''}</td>
      <td>${row.completed_at ? new Date(row.completed_at).toLocaleDateString() : ''}</td>
    `;
    body.appendChild(tr);
  });
}

async function assignTraining() {
  const employeeId = parseInt(document.getElementById('employeeId').value, 10);
  const courseId = parseInt(document.getElementById('courseId').value, 10);

  if (!employeeId || !courseId) {
    throw new Error('Employee ID and Course ID are required');
  }

  const payload = {
    course_id: courseId,
    status: document.getElementById('trainingStatus').value,
    final_score: parseInt(document.getElementById('trainingScore').value, 10) || null
  };

  const res = await fetch(`${API_BASE_URL}/api/employees/${employeeId}/training`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Unable to save training record');
  }

  setOutput(data);
  await loadTraining(employeeId);
}

async function loadTraining(explicitEmployeeId) {
  const employeeId = explicitEmployeeId || parseInt(document.getElementById('lookupEmployeeId').value, 10);

  if (!employeeId) {
    throw new Error('Employee ID is required to view training');
  }

  const res = await fetch(`${API_BASE_URL}/api/employees/${employeeId}/training`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Unable to load training history');
  }

  setOutput(data);
  renderTable(data.data || []);
}

function withErrorHandling(action) {
  return async () => {
    try {
      await action();
    } catch (error) {
      setOutput({ error: error.message });
    }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('assignTrainingBtn').addEventListener('click', withErrorHandling(assignTraining));
  document.getElementById('viewTrainingBtn').addEventListener('click', withErrorHandling(() => loadTraining()));
});
