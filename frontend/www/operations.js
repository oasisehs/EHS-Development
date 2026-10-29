const API_BASE_URL = window.__API_BASE_URL
  || localStorage.getItem('ehs_api_base_url')
  || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : window.location.origin);

const token = localStorage.getItem('ehssuite_token');

if (!token) {
  window.location.href = 'index.html';
}

function jsonHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
}

async function apiGet(path) {
  const res = await fetch(`${API_BASE_URL}${path}`, { headers: { 'Authorization': `Bearer ${token}` } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function apiPost(path, payload) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: jsonHeaders(),
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function setLog(id, value) {
  const target = document.getElementById(id);
  target.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
}

function toIntOrNull(v) {
  if (v === '' || v === null || v === undefined) return null;
  const n = parseInt(v, 10);
  return Number.isInteger(n) ? n : null;
}

function renderEmployees(rows) {
  const body = document.getElementById('employeesBody');
  body.innerHTML = '';
  rows.forEach((r) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.id}</td><td>${r.first_name} ${r.last_name}</td><td>${r.email}</td><td>${r.status}</td><td>${r.department_id || ''}</td>`;
    body.appendChild(tr);
  });
}

function renderDepartments(rows) {
  const body = document.getElementById('departmentsBody');
  body.innerHTML = '';
  rows.forEach((r) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r.id}</td><td>${r.name}</td><td>${r.manager_name || ''}</td><td>${r.employee_count || 0}</td>`;
    body.appendChild(tr);
  });
}

async function loadEmployees() {
  const result = await apiGet('/api/employees?limit=25');
  renderEmployees(result.data || []);
}

async function loadDepartments() {
  const result = await apiGet('/api/departments?limit=25');
  renderDepartments(result.data || []);
}

async function createEmployee() {
  const payload = {
    first_name: document.getElementById('empFirstName').value.trim(),
    last_name: document.getElementById('empLastName').value.trim(),
    email: document.getElementById('empEmail').value.trim(),
    job_title: document.getElementById('empJobTitle').value.trim() || null,
    department_id: toIntOrNull(document.getElementById('empDepartmentId').value),
    status: document.getElementById('empStatus').value
  };

  if (!payload.first_name || !payload.last_name || !payload.email) {
    throw new Error('First name, last name, and email are required');
  }

  await apiPost('/api/employees', payload);
  await loadEmployees();
}

async function createDepartment() {
  const payload = {
    name: document.getElementById('deptName').value.trim(),
    manager_id: toIntOrNull(document.getElementById('deptManagerId').value),
    description: document.getElementById('deptDescription').value.trim() || null
  };

  if (!payload.name) {
    throw new Error('Department name is required');
  }

  await apiPost('/api/departments', payload);
  await loadDepartments();
}

async function saveTraining() {
  const employeeId = toIntOrNull(document.getElementById('trainingEmployeeId').value);
  const payload = {
    course_id: toIntOrNull(document.getElementById('trainingCourseId').value),
    status: document.getElementById('trainingStatus').value,
    final_score: toIntOrNull(document.getElementById('trainingScore').value)
  };

  if (!employeeId || !payload.course_id) {
    throw new Error('Employee ID and Course ID are required');
  }

  const result = await apiPost(`/api/employees/${employeeId}/training`, payload);
  setLog('trainingLog', result);
}

async function viewTraining() {
  const employeeId = toIntOrNull(document.getElementById('trainingEmployeeId').value);
  if (!employeeId) {
    throw new Error('Employee ID is required');
  }
  const result = await apiGet(`/api/employees/${employeeId}/training`);
  setLog('trainingLog', result);
}

async function createCompliance() {
  const employeeId = toIntOrNull(document.getElementById('compEmployeeId').value);
  const payload = {
    template_id: toIntOrNull(document.getElementById('compTemplateId').value),
    due_date: document.getElementById('compDueDate').value,
    status: document.getElementById('compStatus').value,
    notes: document.getElementById('compNotes').value.trim() || null
  };

  if (!employeeId || !payload.template_id || !payload.due_date) {
    throw new Error('Employee ID, Template ID, and Due Date are required');
  }

  const result = await apiPost(`/api/employees/${employeeId}/compliance`, payload);
  setLog('complianceLog', result);
}

async function viewCompliance() {
  const employeeId = toIntOrNull(document.getElementById('compEmployeeId').value);
  if (!employeeId) {
    throw new Error('Employee ID is required');
  }
  const result = await apiGet(`/api/employees/${employeeId}/compliance`);
  setLog('complianceLog', result);
}

async function startOnboarding() {
  const employeeId = toIntOrNull(document.getElementById('onboardEmployeeId').value);
  if (!employeeId) {
    throw new Error('Employee ID is required');
  }

  const payload = {
    template_id: toIntOrNull(document.getElementById('onboardTemplateId').value),
    total_steps: toIntOrNull(document.getElementById('onboardSteps').value) || 5
  };

  const result = await apiPost(`/api/employees/${employeeId}/onboard`, payload);
  setLog('onboardingLog', result);
}

async function getOnboarding() {
  const employeeId = toIntOrNull(document.getElementById('onboardEmployeeId').value);
  if (!employeeId) {
    throw new Error('Employee ID is required');
  }
  const result = await apiGet(`/api/employees/${employeeId}/onboard`);
  setLog('onboardingLog', result);
}

async function completeStep() {
  const employeeId = toIntOrNull(document.getElementById('onboardEmployeeId').value);
  const taskId = toIntOrNull(document.getElementById('onboardTaskId').value);

  if (!employeeId || !taskId) {
    throw new Error('Employee ID and Task ID are required');
  }

  const payload = {
    task_id: taskId,
    notes: document.getElementById('onboardNotes').value.trim() || null
  };

  const result = await apiPost(`/api/employees/${employeeId}/onboard/step`, payload);
  setLog('onboardingLog', result);
}

async function runAction(action, logTarget) {
  try {
    await action();
  } catch (err) {
    if (logTarget) {
      setLog(logTarget, { error: err.message });
    } else {
      alert(err.message);
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  document.getElementById('createEmployeeBtn').addEventListener('click', () => runAction(createEmployee));
  document.getElementById('loadEmployeesBtn').addEventListener('click', () => runAction(loadEmployees));

  document.getElementById('createDepartmentBtn').addEventListener('click', () => runAction(createDepartment));
  document.getElementById('loadDepartmentsBtn').addEventListener('click', () => runAction(loadDepartments));

  document.getElementById('saveTrainingBtn').addEventListener('click', () => runAction(saveTraining, 'trainingLog'));
  document.getElementById('viewTrainingBtn').addEventListener('click', () => runAction(viewTraining, 'trainingLog'));

  document.getElementById('createComplianceBtn').addEventListener('click', () => runAction(createCompliance, 'complianceLog'));
  document.getElementById('viewComplianceBtn').addEventListener('click', () => runAction(viewCompliance, 'complianceLog'));

  document.getElementById('startOnboardingBtn').addEventListener('click', () => runAction(startOnboarding, 'onboardingLog'));
  document.getElementById('getOnboardingBtn').addEventListener('click', () => runAction(getOnboarding, 'onboardingLog'));
  document.getElementById('completeStepBtn').addEventListener('click', () => runAction(completeStep, 'onboardingLog'));

  await runAction(loadEmployees);
  await runAction(loadDepartments);
});
