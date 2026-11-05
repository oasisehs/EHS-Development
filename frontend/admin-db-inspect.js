// Admin Database Inspector
// This page allows admins to inspect and manage the Render Postgres database

let apiBase = '';
let currentTable = null;
let currentPage = 0;
const pageSize = 50;

document.addEventListener('DOMContentLoaded', async () => {
    // Determine API base URL
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        apiBase = 'http://localhost:5000';
    } else {
        // For Render deployment, extract the backend URL from the frontend URL
        const frontendUrl = window.location.origin;
        apiBase = frontendUrl.replace('ehs-development', 'ehs-suite-backend').replace('/admin-db-inspect.html', '');
        if (!apiBase.includes(':')) {
            apiBase = frontendUrl.replace('/admin-db-inspect.html', '');
        }
    }

    console.log('API Base URL:', apiBase);

    // Check if user is authenticated
    const token = localStorage.getItem('authToken');
    if (!token) {
        showError('Not authenticated. Redirecting to login...');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        return;
    }

    // Load database info and tables
    await loadDatabaseInfo();
});

async function loadDatabaseInfo() {
    try {
        showLoading('Connecting to database...');

        const response = await fetch(`${apiBase}/api/admin/db/inspect`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Update connection info
        if (data.connection) {
            document.getElementById('connectionInfo').innerHTML = `
                <div style="margin-bottom: 8px;"><strong>Host:</strong> ${data.connection.host}</div>
                <div style="margin-bottom: 8px;"><strong>Port:</strong> ${data.connection.port}</div>
                <div style="margin-bottom: 8px;"><strong>Database:</strong> ${data.connection.database}</div>
                <div style="margin-bottom: 8px;"><strong>Tables:</strong> ${data.tables.length}</div>
            `;
        }

        // Update status badge
        updateStatusBadge('connected', 'Connected');

        // Populate table list
        const tableList = document.getElementById('tableList');
        tableList.innerHTML = data.tables.map(table => `
            <li class="table-item" onclick="loadTableData('${table}')">
                <span>${table}</span>
                <span class="row-count" id="count-${table}">...</span>
            </li>
        `).join('');

        // Load row counts for each table
        for (const table of data.tables) {
            loadTableRowCount(table);
        }

        showSuccess('Database connected successfully');
        clearMainContent();
    } catch (error) {
        console.error('Error loading database info:', error);
        updateStatusBadge('disconnected', 'Disconnected');
        showError(`Failed to connect to database: ${error.message}`);
    }
}

async function loadTableRowCount(tableName) {
    try {
        const response = await fetch(`${apiBase}/api/admin/db/schema/${tableName}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            const countElement = document.getElementById(`count-${tableName}`);
            if (countElement) {
                countElement.textContent = `${data.rowCount} rows`;
            }
        }
    } catch (error) {
        console.error(`Error loading row count for ${tableName}:`, error);
    }
}

async function loadTableData(tableName) {
    try {
        currentTable = tableName;
        currentPage = 0;
        showLoading(`Loading ${tableName}...`);

        // Load schema
        const schemaResponse = await fetch(`${apiBase}/api/admin/db/schema/${tableName}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        });

        if (!schemaResponse.ok) {
            throw new Error(`Failed to load schema: ${schemaResponse.statusText}`);
        }

        const schema = await schemaResponse.json();

        // Load data
        const dataResponse = await fetch(
            `${apiBase}/api/admin/db/data/${tableName}?limit=${pageSize}&offset=${currentPage * pageSize}`,
            {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!dataResponse.ok) {
            throw new Error(`Failed to load data: ${dataResponse.statusText}`);
        }

        const dataResult = await dataResponse.json();

        // Update selected table in sidebar
        document.querySelectorAll('.table-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`.table-item:has(span:first-child:contains("${tableName}"))`).parentElement.querySelector(`.table-item:contains("${tableName}")`).classList.add('active');
        const activeItem = Array.from(document.querySelectorAll('.table-item')).find(
            el => el.textContent.includes(tableName)
        );
        if (activeItem) activeItem.classList.add('active');

        // Update header
        document.getElementById('selectedTable').textContent = tableName;
        document.getElementById('tableInfo').innerHTML = `
            <div class="info-item">
                <div class="info-label">Total Rows</div>
                <div class="info-value">${schema.rowCount.toLocaleString()}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Columns</div>
                <div class="info-value">${schema.columns.length}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Showing</div>
                <div class="info-value">${dataResult.data.length} rows</div>
            </div>
        `;

        // Render schema
        let content = '<h3 style="margin-bottom: 16px; margin-top: 0;">Schema</h3>';
        content += `
            <table class="schema-table">
                <thead>
                    <tr>
                        <th>Column Name</th>
                        <th>Data Type</th>
                        <th>Nullable</th>
                        <th>Default</th>
                    </tr>
                </thead>
                <tbody>
                    ${schema.columns.map(col => `
                        <tr>
                            <td><code>${col.column_name}</code></td>
                            <td><code>${col.data_type}</code></td>
                            <td>${col.is_nullable === 'YES' ? '✓' : '✗'}</td>
                            <td>${col.column_default ? `<code>${col.column_default}</code>` : '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Render data
        if (dataResult.data.length > 0) {
            const columns = Object.keys(dataResult.data[0]);
            content += '<h3 style="margin-bottom: 16px; margin-top: 32px;">Data</h3>';
            content += `
                <div style="overflow-x: auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                ${columns.map(col => `<th>${col}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${dataResult.data.map(row => `
                                <tr>
                                    ${columns.map(col => `
                                        <td title="${JSON.stringify(row[col])}">${formatValue(row[col])}</td>
                                    `).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;

            // Add pagination
            const totalPages = Math.ceil(schema.rowCount / pageSize);
            if (totalPages > 1) {
                content += `
                    <div class="pagination">
                        <button class="btn-primary" onclick="previousPage()" ${currentPage === 0 ? 'disabled' : ''}>← Previous</button>
                        <span style="padding: 8px 12px; background: #f8f9fa; border-radius: 6px; font-size: 13px;">
                            Page ${currentPage + 1} of ${totalPages}
                        </span>
                        <button class="btn-primary" onclick="nextPage()" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>Next →</button>
                    </div>
                `;
            }
        } else {
            content += '<p style="color: #999; text-align: center; padding: 40px;">No data in this table</p>';
        }

        document.getElementById('mainContent').innerHTML = content;
        clearMessages();
    } catch (error) {
        console.error('Error loading table data:', error);
        showError(`Failed to load table data: ${error.message}`);
    }
}

function formatValue(value) {
    if (value === null) {
        return '<em style="color: #999;">NULL</em>';
    }
    if (typeof value === 'object') {
        return `<code>${JSON.stringify(value).substring(0, 100)}...</code>`;
    }
    if (typeof value === 'boolean') {
        return value ? '<strong style="color: #28a745;">✓ true</strong>' : '<strong style="color: #dc3545;">✗ false</strong>';
    }
    const str = String(value);
    if (str.length > 100) {
        return `<code>${str.substring(0, 100)}...</code>`;
    }
    return `<code>${str}</code>`;
}

async function previousPage() {
    if (currentPage > 0) {
        currentPage--;
        await loadTableData(currentTable);
    }
}

async function nextPage() {
    currentPage++;
    await loadTableData(currentTable);
}

function toggleQueryEditor() {
    const editor = document.getElementById('queryEditor');
    editor.classList.toggle('show');
    if (editor.classList.contains('show')) {
        document.getElementById('queryInput').focus();
    }
}

async function executeQuery() {
    try {
        const query = document.getElementById('queryInput').value.trim();
        if (!query) {
            showError('Please enter a query');
            return;
        }

        showLoading('Executing query...');

        const response = await fetch(`${apiBase}/api/admin/db/query`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP ${response.status}`);
        }

        let content = `<h3 style="margin-bottom: 16px; margin-top: 0;">Query Results</h3>`;
        content += `<p style="color: #666; margin-bottom: 16px;">Rows returned: <strong>${data.rowCount}</strong></p>`;

        if (data.data.length > 0) {
            const columns = Object.keys(data.data[0]);
            content += `
                <div style="overflow-x: auto;">
                    <table class="data-table">
                        <thead>
                            <tr>
                                ${columns.map(col => `<th>${col}</th>`).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${data.data.map(row => `
                                <tr>
                                    ${columns.map(col => `
                                        <td title="${JSON.stringify(row[col])}">${formatValue(row[col])}</td>
                                    `).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            content += '<p style="color: #999;">No results</p>';
        }

        document.getElementById('mainContent').innerHTML = content;
        showSuccess('Query executed successfully');
        toggleQueryEditor();
    } catch (error) {
        console.error('Error executing query:', error);
        showError(`Query failed: ${error.message}`);
    }
}

async function seedDatabase() {
    const confirmed = confirm('This will populate the database with demo data (admin@ehssuite.com / demo123456). Continue?');
    if (!confirmed) return;

    try {
        showLoading('Seeding database...');

        const response = await fetch(`${apiBase}/api/admin/db/seed`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP ${response.status}`);
        }

        showSuccess('✓ Database seeded successfully! Demo users created:\n- admin@ehssuite.com / demo123456\n- manager@ehssuite.com / demo123456\n- employee@ehssuite.com / demo123456\n- safety@ehssuite.com / demo123456');
        
        // Reload database info
        setTimeout(() => {
            loadDatabaseInfo();
        }, 2000);
    } catch (error) {
        console.error('Error seeding database:', error);
        showError(`Seeding failed: ${error.message}`);
    }
}

function showLoading(message) {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
    clearMessages();
}

function clearMainContent() {
    document.getElementById('mainContent').innerHTML = 
        '<p style="color: #999; text-align: center; padding: 40px;">Select a table from the left to view its data</p>';
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.add('show');
    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.classList.add('show');
    setTimeout(() => {
        successDiv.classList.remove('show');
    }, 5000);
}

function clearMessages() {
    document.getElementById('errorMessage').classList.remove('show');
    document.getElementById('successMessage').classList.remove('show');
}

function updateStatusBadge(status, text) {
    const badge = document.getElementById('statusBadge');
    badge.textContent = text;
    badge.className = `status-badge ${status}`;
}

function logout() {
    localStorage.removeItem('authToken');
    window.location.href = 'index.html';
}
