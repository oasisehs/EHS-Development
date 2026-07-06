// ==========================================
// DASHBOARD FUNCTIONALITY
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initDashboard();
    
    // Set current date
    updateDate();
    
    // Check user session
    checkUserSession();
});

/**
 * Initialize dashboard
 */
function initDashboard() {
    // Add click listeners
    document.addEventListener('click', handleOutsideClick);
}

/**
 * Toggle sidebar
 */
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('active');
}

/**
 * Toggle user menu
 */
function toggleUserMenu() {
    const userMenu = document.getElementById('userMenu');
    const isVisible = userMenu.style.display === 'flex';
    
    // Close all menus
    document.querySelectorAll('.user-menu').forEach(menu => {
        menu.style.display = 'none';
    });
    
    // Toggle current menu
    if (!isVisible) {
        userMenu.style.display = 'flex';
        userMenu.style.flexDirection = 'column';
    }
}

/**
 * Handle outside clicks to close menus
 */
function handleOutsideClick(event) {
    const userMenu = document.getElementById('userMenu');
    const userProfile = document.querySelector('.user-profile');
    
    if (!userProfile.contains(event.target) && !userMenu.contains(event.target)) {
        userMenu.style.display = 'none';
    }
}

/**
 * Update current date display
 */
function updateDate() {
    const dateDisplay = document.getElementById('dateDisplay');
    if (dateDisplay) {
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        const today = new Date().toLocaleDateString('en-US', options);
        dateDisplay.textContent = today;
    }
}

/**
 * Check user session
 */
function checkUserSession() {
    const user = sessionStorage.getItem('ehssuite_user') || localStorage.getItem('ehssuite_user');
    
    if (!user) {
        // Redirect to login if no session
        window.location.href = 'index.html';
    }
}

/**
 * Logout function
 */
function logout() {
    sessionStorage.removeItem('ehssuite_user');
    localStorage.removeItem('ehssuite_user');
    localStorage.removeItem('ehssuite_remember');
    window.location.href = 'index.html';
}

/**
 * Attach logout to menu items
 */
document.addEventListener('DOMContentLoaded', function() {
    const logoutLink = document.querySelector('.menu-item.logout');
    if (logoutLink) {
        logoutLink.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
});

/**
 * Make navigation links work (smooth active state change)
 */
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        // Prevent default only if href is '#'
        if (this.getAttribute('href') === '#') {
            e.preventDefault();
        }
        
        // Remove active class from all links
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        
        // Add active class to clicked link
        this.classList.add('active');
        
        // Close sidebar on mobile
        const sidebar = document.querySelector('.sidebar');
        if (window.innerWidth <= 768) {
            sidebar.classList.remove('active');
        }
    });
});

/**
 * Action buttons functionality
 */
document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const actionText = this.textContent.trim();
        console.log('Action clicked:', actionText);
        // Add notification or navigate to respective page
        showActionNotification(actionText);
    });
});

/**
 * Show action notification
 */
function showActionNotification(action) {
    // You can implement a toast notification here
    console.log('Performing action:', action);
}

/**
 * Handle responsive sidebar
 */
window.addEventListener('resize', function() {
    const sidebar = document.querySelector('.sidebar');
    if (window.innerWidth > 768) {
        sidebar.classList.remove('active');
    }
});

/**
 * Add smooth scroll behavior for sidebar
 */
const sidebar = document.querySelector('.sidebar-nav');
if (sidebar) {
    // Smooth scrolling already enabled via CSS
}

/**
 * Animation for stat cards on load
 */
window.addEventListener('load', function() {
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.animation = `slideUp 0.5s ease forwards`;
        }, index * 100);
    });
});

/**
 * Add animation keyframes
 */
const style = document.createElement('style');
style.textContent = `
    @keyframes slideUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;
document.head.appendChild(style);

/**
 * Notification count badge animation
 */
const notificationBadge = document.querySelector('.notification-badge');
if (notificationBadge) {
    notificationBadge.style.animation = `pulse 2s infinite`;
    const pulseStyle = document.createElement('style');
    pulseStyle.textContent = `
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
    `;
    document.head.appendChild(pulseStyle);
}

/**
 * Navigation active state sync with browser history
 */
window.addEventListener('popstate', function() {
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-link').forEach(link => {
        if (link.href.includes(currentPath)) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

/**
 * Log user action (for analytics)
 */
function logUserAction(action, details = {}) {
    const timestamp = new Date().toISOString();
    const user = sessionStorage.getItem('ehssuite_user') || localStorage.getItem('ehssuite_user');
    
    console.log(`[${timestamp}] User: ${user}, Action: ${action}`, details);
    // Send to backend analytics endpoint
}

/**
 * Initialize tooltips
 */
function initTooltips() {
    // Add tooltip functionality if needed
}

/**
 * Dark mode toggle (optional)
 */
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('ehssuite_dark_mode', isDarkMode);
}

// Load user preferences on page load
document.addEventListener('DOMContentLoaded', function() {
    const darkMode = localStorage.getItem('ehssuite_dark_mode');
    if (darkMode === 'true') {
        document.body.classList.add('dark-mode');
    }
});
