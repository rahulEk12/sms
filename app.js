import { initDashboard } from './dashboard.js';
import { initStudents } from './students.js';
import { initAttendance } from './attendance.js';
import { initFees } from './fees.js';
import { initTeachers } from './teachers.js';
import { initDatabase } from './db.js';
import { initWeeklyTests } from './weeklytests.js';

// Global state / Modal refs
const modalOverlay = document.getElementById('app-modal');
const modalCloseBtn = document.getElementById('modal-close');

// Initialize database on first load
initDatabase();

// Modal functions
export function openModal(title, contentHtml) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = contentHtml;
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // prevent background scrolling
}

export function closeModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// Attach modal close events
modalCloseBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) closeModal();
});

// App Router
const VIEWS = {
    dashboard: { title: 'Dashboard', render: initDashboard },
    students: { title: 'Students Directory', render: initStudents },
    attendance: { title: 'Attendance Tracker', render: initAttendance },
    fees: { title: 'Fee Management', render: initFees },
    teachers: { title: 'Teachers Directory', render: initTeachers },
    'weekly-tests': { title: 'Weekly Test Performance', render: initWeeklyTests }
};

function navigateTo(viewKey) {
    const view = VIEWS[viewKey];
    if (!view) return;

    // Update Navbar title
    document.getElementById('page-title').textContent = view.title;

    // Update active nav item
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
        if (item.getAttribute('data-view') === viewKey) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // Close mobile menu if active
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.remove('mobile-active');

    // Run view's render engine
    const mainContent = document.getElementById('main-content');
    
    // Inject loading indicator
    mainContent.innerHTML = `
        <div class="loader-container">
            <div class="loader"></div>
        </div>
    `;

    // Slight delay to simulate premium loading transition
    setTimeout(async () => {
        try {
            await view.render(mainContent);
        } catch (error) {
            console.error(`Error rendering view ${viewKey}:`, error);
            mainContent.innerHTML = `
                <div class="glass-card" style="text-align: center; padding: 40px; border-color: var(--danger); max-width: 600px; margin: 0 auto;">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" style="margin-bottom: 16px;">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <h3 style="margin-bottom: 8px;">Error Loading Module</h3>
                    <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 16px;">${error.message}</p>
                    <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: var(--radius-md); padding: 16px; text-align: left;">
                        <h4 style="margin-bottom: 8px; font-weight: 700; color: var(--text-primary);">Troubleshooting Steps:</h4>
                        <ol style="margin-left: 20px; color: var(--text-secondary); font-size: 0.88rem; display: flex; flex-direction: column; gap: 6px;">
                            <li>Verify if your Express backend server is running (e.g. <code>npm run dev</code> or <code>npm start</code>).</li>
                            <li>Ensure your PostgreSQL database (<code>sms_db</code>) is active and running locally on port <code>5432</code>.</li>
                            <li>Check database connection settings in your <code>.env</code> file.</li>
                        </ol>
                    </div>
                </div>
            `;
        }
    }, 150);
}

// Router Event Listeners
window.addEventListener('hashchange', () => {
    const hash = window.location.hash.substring(1) || 'dashboard';
    if (VIEWS[hash]) {
        navigateTo(hash);
    }
});

// Sidebar click triggers (for instant hash updates)
document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const viewKey = item.getAttribute('data-view');
        window.location.hash = viewKey;
    });
});

// Mobile menu toggle
const mobileToggle = document.getElementById('mobile-toggle');
mobileToggle.addEventListener('click', () => {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('mobile-active');
});

// Theme Toggle logic
const themeToggleBtn = document.getElementById('theme-toggle');
const sunIcon = themeToggleBtn.querySelector('.sun-icon');
const moonIcon = themeToggleBtn.querySelector('.moon-icon');

function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sms_theme', theme);
    
    if (theme === 'dark') {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    } else {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }
}

// Initial theme load
const currentSavedTheme = localStorage.getItem('sms_theme') || 'dark';
setTheme(currentSavedTheme);

// Theme button event
themeToggleBtn.addEventListener('click', () => {
    const activeTheme = document.documentElement.getAttribute('data-theme');
    const nextTheme = activeTheme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
});

// Start application
document.addEventListener('DOMContentLoaded', () => {
    const initialView = window.location.hash.substring(1) || 'dashboard';
    navigateTo(initialView);
});
