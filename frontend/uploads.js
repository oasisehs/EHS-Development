// ==========================================
// FILE UPLOAD MANAGER
// ==========================================

const API_URL = localStorage.getItem('API_URL') || 'https://ehs-development.onrender.com';
const TOKEN = localStorage.getItem('ehssuite_token');

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!TOKEN) {
        window.location.href = 'index.html';
        return;
    }

    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadBtn = document.getElementById('uploadBtn');

    // Upload area click to open file picker
    uploadArea.addEventListener('click', () => fileInput.click());

    // File input change handler
    fileInput.addEventListener('change', handleFileSelect);

    // Drag and drop handlers
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });

    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });

    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    // Upload button click
    uploadBtn.addEventListener('click', uploadFile);

    // Load existing files
    loadFiles();
});

/**
 * Handle file selection from input
 */
function handleFileSelect(e) {
    handleFiles(e.target.files);
}

/**
 * Handle dropped files
 */
function handleFiles(files) {
    if (files.length === 0) return;

    // For now, only handle single file upload
    const file = files[0];
    document.getElementById('uploadBtn').disabled = false;
    
    // Store selected file
    document.getElementById('fileInput').dataset.selectedFile = file.name;
    document.getElementById('uploadArea').querySelector('.upload-text').textContent = 
        `Selected: ${file.name}`;
    document.getElementById('uploadArea').querySelector('.upload-subtext').textContent = 
        `${(file.size / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * Upload file to S3
 */
async function uploadFile() {
    const fileInput = document.getElementById('fileInput');
    
    if (fileInput.files.length === 0) {
        showAlert('error', 'Please select a file to upload');
        return;
    }

    const file = fileInput.files[0];
    const description = document.getElementById('fileDescription').value;
    const uploadType = document.getElementById('uploadType').value;

    // Validate file size (50MB limit)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        showAlert('error', 'File size exceeds 50MB limit');
        return;
    }

    // Show progress
    const progressContainer = document.getElementById('progressContainer');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    progressContainer.style.display = 'block';
    progressFill.style.width = '0%';
    progressText.textContent = '0%';

    // Disable upload button
    const uploadBtn = document.getElementById('uploadBtn');
    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';

    try {
        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('description', description);
        formData.append('uploadType', uploadType);

        // Upload file
        const response = await fetch(`${API_URL}/api/files/upload`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            },
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
        }

        showAlert('success', 'File uploaded successfully!');
        
        // Reset form
        fileInput.value = '';
        document.getElementById('fileDescription').value = '';
        document.getElementById('uploadArea').querySelector('.upload-text').textContent = 
            'Drag and drop your files here';
        document.getElementById('uploadArea').querySelector('.upload-subtext').textContent = 
            'or click to browse';
        progressContainer.style.display = 'none';
        uploadBtn.disabled = true;
        uploadBtn.textContent = 'Upload Selected File';

        // Reload files
        loadFiles();
    } catch (error) {
        console.error('Upload error:', error);
        showAlert('error', error.message || 'Upload failed');
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload Selected File';
    }
}

/**
 * Load user's files from backend
 */
async function loadFiles() {
    try {
        const response = await fetch(`${API_URL}/api/files`, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load files');
        }

        const files = await response.json();
        displayFiles(files);
    } catch (error) {
        console.error('Load files error:', error);
        showAlert('error', 'Failed to load files');
    }
}

/**
 * Display files in the list
 */
function displayFiles(files) {
    const fileList = document.getElementById('fileList');

    if (files.length === 0) {
        fileList.innerHTML = `
            <div class="empty-state">
                <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                <div>No files uploaded yet</div>
            </div>
        `;
        return;
    }

    // Create file list HTML
    let html = '<div class="file-list-header">Files</div>';
    
    files.forEach(file => {
        const fileType = getFileType(file.file_type);
        const badgeClass = getBadgeClass(file.upload_type);
        const date = new Date(file.created_at).toLocaleDateString();
        const size = formatFileSize(file.file_size);

        html += `
            <div class="file-item">
                <svg class="file-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                    <polyline points="13 2 13 9 20 9"></polyline>
                </svg>
                <div class="file-info">
                    <div class="file-name">
                        ${file.file_name}
                        <span class="status-badge ${badgeClass}">${file.upload_type}</span>
                    </div>
                    <div class="file-meta">${size} • ${date}</div>
                </div>
                <div class="file-actions">
                    <button class="file-action-btn btn-view" onclick="openFile('${file.id}')">View</button>
                    <button class="file-action-btn btn-copy" onclick="copyLink('${file.id}')">Copy Link</button>
                    <button class="file-action-btn btn-delete" onclick="deleteFile('${file.id}')">Delete</button>
                </div>
            </div>
        `;
    });

    fileList.innerHTML = html;
}

/**
 * Get file type icon/label
 */
function getFileType(mimeType) {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'doc';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'sheet';
    return 'file';
}

/**
 * Get badge CSS class
 */
function getBadgeClass(uploadType) {
    const classMap = {
        'document': 'badge-document',
        'image': 'badge-image',
        'report': 'badge-document',
        'compliance': 'badge-document'
    };
    return classMap[uploadType] || 'badge-other';
}

/**
 * Format file size
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Open file in new tab
 */
function openFile(fileId) {
    const file = findFileById(fileId);
    if (file && file.s3_url) {
        window.open(file.s3_url, '_blank');
    }
}

/**
 * Copy file link to clipboard
 */
async function copyLink(fileId) {
    try {
        const response = await fetch(`${API_URL}/api/files/${fileId}/presigned-url`, {
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to generate link');
        }

        const data = await response.json();
        const presignedUrl = data.presignedUrl;

        // Copy to clipboard
        await navigator.clipboard.writeText(presignedUrl);
        showAlert('success', 'Link copied to clipboard!');
    } catch (error) {
        console.error('Copy link error:', error);
        showAlert('error', 'Failed to copy link');
    }
}

/**
 * Delete file
 */
async function deleteFile(fileId) {
    if (!confirm('Are you sure you want to delete this file?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/files/${fileId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${TOKEN}`
            }
        });

        if (!response.ok) {
            throw new Error('Delete failed');
        }

        showAlert('success', 'File deleted successfully!');
        loadFiles();
    } catch (error) {
        console.error('Delete error:', error);
        showAlert('error', 'Failed to delete file');
    }
}

/**
 * Find file object by ID (helper for button clicks)
 */
function findFileById(fileId) {
    // This is a simple helper - in production, maintain file list in memory
    return null;
}

/**
 * Show alert message
 */
function showAlert(type, message) {
    const alertId = `${type}Alert`;
    const alertEl = document.getElementById(alertId);
    
    alertEl.textContent = message;
    alertEl.classList.add('show');

    // Auto-hide after 4 seconds
    setTimeout(() => {
        alertEl.classList.remove('show');
    }, 4000);
}
