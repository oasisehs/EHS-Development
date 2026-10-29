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
  q: '',
  type: ''
};

function headers() {
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

function formatBytes(bytes) {
  const n = Number(bytes || 0);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function docTypeClass(t) {
  const type = String(t || 'other').toLowerCase();
  if (['document', 'compliance', 'report', 'image'].includes(type)) return type;
  return 'other';
}

function renderRows(rows) {
  const body = document.getElementById('documentsBody');
  body.innerHTML = '';

  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="5">No documents found.</td></tr>';
    return;
  }

  rows.forEach((file) => {
    const tr = document.createElement('tr');
    const type = escapeHtml(file.file_type || 'other');
    tr.innerHTML = `
      <td>${escapeHtml(file.original_name || file.file_name || 'unnamed')}</td>
      <td><span class="doc-badge ${docTypeClass(file.file_type)}">${type}</span></td>
      <td>${formatBytes(file.file_size)}</td>
      <td>${new Date(file.created_at).toLocaleString()}</td>
      <td>
        <div class="table-actions">
          <button type="button" data-action="download" data-id="${file.id}">Download</button>
          <button type="button" data-action="delete" data-id="${file.id}">Delete</button>
        </div>
      </td>
    `;
    body.appendChild(tr);
  });

  body.querySelectorAll('button[data-action="download"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      window.open(`${API_BASE_URL}/api/files/${encodeURIComponent(id)}/download?token=${encodeURIComponent(token)}`, '_blank');
    });
  });

  body.querySelectorAll('button[data-action="delete"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      if (!confirm('Delete this document?')) return;
      try {
        const res = await fetch(`${API_BASE_URL}/api/files/${id}`, { method: 'DELETE', headers: headers() });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.error || 'Delete failed');
        await loadDocuments();
      } catch (err) {
        alert(err.message);
      }
    });
  });
}

async function loadDocuments() {
  const res = await fetch(`${API_BASE_URL}/api/files`, { headers: headers() });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(payload.error || 'Failed to load documents');

  let rows = payload.data || [];

  if (state.type) {
    rows = rows.filter((r) => String(r.file_type || '').toLowerCase() === state.type.toLowerCase());
  }
  if (state.q) {
    const q = state.q.toLowerCase();
    rows = rows.filter((r) =>
      String(r.original_name || r.file_name || '').toLowerCase().includes(q)
    );
  }

  renderRows(rows);
}

function setupEvents() {
  document.getElementById('applyDocFiltersBtn').addEventListener('click', async () => {
    state.q = document.getElementById('docSearch').value.trim();
    state.type = document.getElementById('docTypeFilter').value;
    try {
      await loadDocuments();
    } catch (err) {
      alert(err.message);
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  setupEvents();
  try {
    await loadDocuments();
  } catch (err) {
    alert(err.message);
  }
});
