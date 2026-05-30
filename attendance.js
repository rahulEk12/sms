import { getStudents, getAttendance, saveAttendance } from './db.js';

let selectedClass = '10-A';
let selectedDate = new Date().toISOString().split('T')[0];
let currentAttendanceRecords = {}; // studentId: status

export async function initAttendance(container) {
    selectedClass = '10-A';
    selectedDate = new Date().toISOString().split('T')[0];
    
    await renderLayout(container);
    await loadAttendanceRecords();
    setupListeners(container);
}

async function renderLayout(container) {
    const students = await getStudents();
    
    // Get unique classes
    const classes = [...new Set(students.map(s => s.class))].sort();

    container.innerHTML = `
        <div class="glass-card">
            <!-- Selector Controls Row -->
            <div class="controls-row" style="margin-bottom: 32px;">
                <div class="filters-wrapper" style="flex: 1; align-items: center; gap: 16px;">
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <label class="form-label" style="margin-bottom: 0;">Select Class</label>
                        <select class="select-input" id="attendance-class-select" style="min-width: 150px;">
                            ${classes.map(c => `<option value="${c}" ${c === selectedClass ? 'selected' : ''}>Class ${c}</option>`).join('')}
                        </select>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <label class="form-label" style="margin-bottom: 0;">Select Date</label>
                        <input type="date" class="select-input" id="attendance-date-select" value="${selectedDate}" max="${new Date().toISOString().split('T')[0]}">
                    </div>
                </div>
                
                <div style="display: flex; align-items: flex-end; height: 100%;">
                    <button class="btn btn-primary" id="save-attendance-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Save Attendance
                    </button>
                </div>
            </div>

            <!-- Attendance Toggles Panel -->
            <div id="attendance-main-area">
                <div class="attendance-grid" id="attendance-students-grid">
                    <!-- Dynamic rendering -->
                </div>
                
                <div id="no-students-warning" style="display: none; text-align: center; padding: 40px; color: var(--text-muted);">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 12px; opacity: 0.5;">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p>No students enrolled in this class.</p>
                </div>
            </div>
            
            <!-- Toast Feedback Overlay -->
            <div id="attendance-toast" style="display: none; position: fixed; bottom: 24px; right: 24px; z-index: 1000; background: var(--success); color: white; padding: 16px 24px; border-radius: var(--radius-md); box-shadow: var(--shadow-lg); font-weight: 600; display: flex; align-items: center; gap: 10px; animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>Attendance saved successfully!</span>
            </div>
        </div>
    `;
}

async function loadAttendanceRecords() {
    const students = await getStudents();
    const classStudents = students.filter(s => s.class === selectedClass);
    
    const grid = document.getElementById('attendance-students-grid');
    const warning = document.getElementById('no-students-warning');

    if (classStudents.length === 0) {
        grid.innerHTML = '';
        warning.style.display = 'block';
        return;
    }

    warning.style.display = 'none';

    // Get current attendance status from database
    const savedRecords = await getAttendance(selectedDate, selectedClass);
    
    // Initialize temporary in-memory state
    currentAttendanceRecords = {};
    classStudents.forEach(s => {
        // Default to present if no saved status exists yet
        currentAttendanceRecords[s.id] = savedRecords[s.id] || 'present';
    });

    renderGrid(classStudents);
}

function renderGrid(students) {
    const grid = document.getElementById('attendance-students-grid');
    
    grid.innerHTML = students.map(s => {
        const currentStatus = currentAttendanceRecords[s.id];

        return `
            <div class="glass-card attendance-card" data-student-id="${s.id}">
                <div style="display: flex; align-items: center; gap: 14px;">
                    <div style="width: 40px; height: 40px; border-radius: var(--radius-full); background: ${s.bgGradient}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem;">
                        ${s.initials}
                    </div>
                    <div>
                        <div style="font-weight: 600; font-size: 0.92rem; color: var(--text-primary);">${s.name}</div>
                        <div style="font-size: 0.76rem; color: var(--text-muted);">Roll: ${s.rollNumber} &bull; Prev: ${s.attendance}%</div>
                    </div>
                </div>

                <!-- 3-State Toggle Selector -->
                <div class="attendance-status-selector">
                    <button class="attendance-opt ${currentStatus === 'present' ? 'active' : ''}" data-status="present">P</button>
                    <button class="attendance-opt ${currentStatus === 'absent' ? 'active' : ''}" data-status="absent">A</button>
                    <button class="attendance-opt ${currentStatus === 'late' ? 'active' : ''}" data-status="late">L</button>
                </div>
            </div>
        `;
    }).join('');
}

function setupListeners(container) {
    const classSelect = document.getElementById('attendance-class-select');
    const dateSelect = document.getElementById('attendance-date-select');
    const saveBtn = document.getElementById('save-attendance-btn');
    const grid = document.getElementById('attendance-students-grid');

    // Class select change
    classSelect.addEventListener('change', async (e) => {
        selectedClass = e.target.value;
        await loadAttendanceRecords();
    });

    // Date select change
    dateSelect.addEventListener('change', async (e) => {
        selectedDate = e.target.value;
        await loadAttendanceRecords();
    });

    // Attendance button toggle (Event Delegation)
    grid.addEventListener('click', (e) => {
        const optBtn = e.target.closest('.attendance-opt');
        if (!optBtn) return;

        const card = optBtn.closest('.attendance-card');
        const studentId = card.getAttribute('data-student-id');
        const status = optBtn.getAttribute('data-status');

        // Update in memory records
        currentAttendanceRecords[studentId] = status;

        // Visual update for buttons inside this selector
        const selector = optBtn.closest('.attendance-status-selector');
        selector.querySelectorAll('.attendance-opt').forEach(btn => {
            if (btn === optBtn) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    });

    // Save attendance triggers
    saveBtn.addEventListener('click', async () => {
        await saveAttendance(selectedDate, selectedClass, currentAttendanceRecords);
        showToast();
        
        // Refresh grid values (baseline attendance scores update dynamically in db)
        setTimeout(async () => {
            const students = await getStudents();
            const classStudents = students.filter(s => s.class === selectedClass);
            renderGrid(classStudents);
        }, 1500);
    });
}

function showToast() {
    const toast = document.getElementById('attendance-toast');
    if (!toast) return;

    toast.style.display = 'flex';
    
    // Style adjustments to ensure clean styling
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.backgroundColor = 'var(--success)';
    toast.style.color = '#ffffff';

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            toast.style.display = 'none';
            toast.style.opacity = '1';
        }, 500);
    }, 2500);
}
