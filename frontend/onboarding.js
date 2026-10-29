const API_BASE_URL = window.__API_BASE_URL
  || localStorage.getItem('ehs_api_base_url')
  || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : window.location.origin);

const token = localStorage.getItem('ehssuite_token');
if (!token) {
  window.location.href = 'index.html';
}

function authHeaders(withJson = false) {
  const headers = { Authorization: `Bearer ${token}` };
  if (withJson) headers['Content-Type'] = 'application/json';
  return headers;
}

function setLog(value) {
  const target = document.getElementById('onboardingLog');
  target.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

function renderTasks(tasks) {
  const body = document.getElementById('tasksBody');
  body.innerHTML = '';

  if (!tasks.length) {
    body.innerHTML = '<tr><td colspan="4">No tasks found.</td></tr>';
    return;
  }

  tasks.forEach((t) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${t.id}</td><td>${t.step_number}</td><td>${t.task_name}</td><td>${t.completed ? 'Yes' : 'No'}</td>`;
    body.appendChild(tr);
  });
}

function updateProgress(tasks) {
  const total = tasks.length;
  const done = tasks.filter((t) => t.completed).length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  document.getElementById('onboardingProgressFill').style.width = `${percent}%`;
  document.getElementById('onboardingProgressMeta').textContent = `Progress: ${percent}% (${done}/${total})`;
}

async function loadStatus(employeeId) {
  const res = await fetch(`${API_BASE_URL}/api/employees/${employeeId}/onboard`, {
    headers: authHeaders()
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload.error || 'Failed to load onboarding status');
  }

  setLog(payload);
  const tasks = payload.tasks || payload.data?.tasks || [];
  renderTasks(tasks);
  updateProgress(tasks);
}

async function startOnboarding() {
  const employeeId = parseInt(document.getElementById('startEmployeeId').value, 10);
  if (!employeeId) throw new Error('Employee ID is required');

  const templateId = parseInt(document.getElementById('templateId').value, 10);
  const totalSteps = parseInt(document.getElementById('totalSteps').value, 10);

  const payload = {
    template_id: Number.isInteger(templateId) ? templateId : null,
    total_steps: Number.isInteger(totalSteps) ? totalSteps : null
  };

  const res = await fetch(`${API_BASE_URL}/api/employees/${employeeId}/onboard`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to start onboarding');
  }

  setLog(data);
  await loadStatus(employeeId);
}

async function completeStep() {
  const employeeId = parseInt(document.getElementById('stepEmployeeId').value, 10);
  const taskId = parseInt(document.getElementById('taskId').value, 10);
  if (!employeeId || !taskId) throw new Error('Employee ID and Task ID are required');

  const payload = {
    task_id: taskId,
    notes: document.getElementById('stepNotes').value.trim() || null
  };

  const res = await fetch(`${API_BASE_URL}/api/employees/${employeeId}/onboard/step`, {
    method: 'POST',
    headers: authHeaders(true),
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to complete onboarding step');
  }

  setLog(data);
  await loadStatus(employeeId);
}

function withErrors(fn) {
  return async () => {
    try {
      await fn();
    } catch (err) {
      setLog({ error: err.message });
    }
  };
}

document.addEventListener('DOMContentLoaded', () => {
  const paramId = new URLSearchParams(window.location.search).get('employeeId');
  if (paramId) {
    document.getElementById('startEmployeeId').value = paramId;
    document.getElementById('stepEmployeeId').value = paramId;
  }

  document.getElementById('startOnboardingBtn').addEventListener('click', withErrors(startOnboarding));
  document.getElementById('loadOnboardingBtn').addEventListener('click', withErrors(async () => {
    const id = parseInt(document.getElementById('startEmployeeId').value, 10);
    if (!id) throw new Error('Employee ID is required');
    await loadStatus(id);
  }));
  document.getElementById('completeStepBtn').addEventListener('click', withErrors(completeStep));
});
