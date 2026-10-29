const token = localStorage.getItem('ehssuite_token');

if (!token) {
  window.location.href = 'index.html';
}

const API_BASE_URL = window.__API_BASE_URL
  || localStorage.getItem('ehs_api_base_url')
  || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000'
    : window.location.origin);

const assetsState = {
  page: 1,
  limit: 10,
  pages: 1,
  q: '',
  assetType: '',
  status: ''
};

function authHeaders(withJson = false) {
  const headers = {
    Authorization: `Bearer ${token}`
  };
  if (withJson) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

function statusText(status) {
  return String(status || '').replace('_', ' ');
}

function renderAssets(assets) {
  const tbody = document.getElementById('assetsTableBody');
  tbody.innerHTML = '';

  if (!assets.length) {
    const emptyRow = document.createElement('tr');
    emptyRow.innerHTML = '<td colspan="6">No assets found.</td>';
    tbody.appendChild(emptyRow);
    return;
  }

  assets.forEach((asset) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${asset.asset_number}</td>
      <td>${asset.name}</td>
      <td>${asset.asset_type || ''}</td>
      <td>${asset.location || ''}</td>
      <td><span class="status ${asset.status}">${statusText(asset.status)}</span></td>
      <td><button type="button" class="archive-btn" data-asset-id="${asset.id}">Archive</button></td>
    `;
    tbody.appendChild(row);
  });

  document.querySelectorAll('.archive-btn').forEach((button) => {
    button.addEventListener('click', async () => {
      const assetId = parseInt(button.getAttribute('data-asset-id'), 10);
      if (!assetId) {
        return;
      }

      if (!window.confirm('Archive this asset?')) {
        return;
      }

      try {
        await archiveAsset(assetId);
        await loadAssets();
      } catch (err) {
        alert(err.message);
      }
    });
  });
}

function setupAddAsset() {
  document.getElementById('addAssetBtn').addEventListener('click', async () => {
    const tag = document.getElementById('assetTag').value.trim();
    const name = document.getElementById('assetName').value.trim();
    const assetType = document.getElementById('assetType').value;
    const location = document.getElementById('assetLocation').value.trim();
    const status = document.getElementById('assetStatus').value;

    if (!tag || !name) {
      alert('Asset tag and name are required.');
      return;
    }

    const payload = {
      asset_number: tag,
      name,
      asset_type: assetType,
      location: location || null,
      status
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/assets`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create asset');
      }

      assetsState.page = 1;
      await loadAssets();
    } catch (err) {
      alert(err.message);
      return;
    }

    document.getElementById('assetTag').value = '';
    document.getElementById('assetName').value = '';
    document.getElementById('assetType').value = 'equipment';
    document.getElementById('assetLocation').value = '';
    document.getElementById('assetStatus').value = 'active';
  });

  document.getElementById('refreshAssetsBtn').addEventListener('click', async () => {
    try {
      await loadAssets();
    } catch (err) {
      alert(err.message);
    }
  });
}

function updatePaginationUI() {
  const text = document.getElementById('assetsPaginationText');
  const prev = document.getElementById('assetsPrevBtn');
  const next = document.getElementById('assetsNextBtn');

  text.textContent = `Page ${assetsState.page} of ${assetsState.pages}`;
  prev.disabled = assetsState.page <= 1;
  next.disabled = assetsState.page >= assetsState.pages;
}

function setupFiltersAndPagination() {
  document.getElementById('applyAssetFiltersBtn').addEventListener('click', async () => {
    assetsState.q = document.getElementById('assetSearch').value.trim();
    assetsState.assetType = document.getElementById('assetFilterType').value;
    assetsState.status = document.getElementById('assetFilterStatus').value;
    assetsState.page = 1;

    try {
      await loadAssets();
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('assetsPrevBtn').addEventListener('click', async () => {
    if (assetsState.page <= 1) {
      return;
    }

    assetsState.page -= 1;
    try {
      await loadAssets();
    } catch (err) {
      alert(err.message);
    }
  });

  document.getElementById('assetsNextBtn').addEventListener('click', async () => {
    if (assetsState.page >= assetsState.pages) {
      return;
    }

    assetsState.page += 1;
    try {
      await loadAssets();
    } catch (err) {
      alert(err.message);
    }
  });
}

async function loadAssets() {
  const query = new URLSearchParams({
    page: String(assetsState.page),
    limit: String(assetsState.limit)
  });

  if (assetsState.q) {
    query.set('q', assetsState.q);
  }

  if (assetsState.assetType) {
    query.set('asset_type', assetsState.assetType);
  }

  if (assetsState.status) {
    query.set('status', assetsState.status);
  }

  const res = await fetch(`${API_BASE_URL}/api/assets?${query.toString()}`, {
    headers: authHeaders()
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to load assets');
  }

  const pagination = data.pagination || {};
  assetsState.page = pagination.page || assetsState.page;
  assetsState.pages = pagination.pages || 1;

  renderAssets(data.data || []);
  updatePaginationUI();
}

async function archiveAsset(assetId) {
  const res = await fetch(`${API_BASE_URL}/api/assets/${assetId}`, {
    method: 'DELETE',
    headers: authHeaders()
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Failed to archive asset');
  }

  return data;
}

document.addEventListener('DOMContentLoaded', async () => {
  setupFiltersAndPagination();
  setupAddAsset();
  try {
    await loadAssets();
  } catch (err) {
    alert(err.message);
  }
});
