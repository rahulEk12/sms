import { getStudents, getWeeklyTests, saveWeeklyTest, deleteWeeklyTest } from './db.js';

let selectedClass = '10-A';
let currentView = 'list'; // 'list', 'form', 'details'
let activeTestId = null; // for editing or viewing details
let tempTestScores = {}; // studentId: marks (temporary score holding state)

export async function initWeeklyTests(container) {
    selectedClass = '10-A';
    currentView = 'list';
    activeTestId = null;
    tempTestScores = {};
    
    await renderApp(container);
}

async function renderApp(container) {
    if (currentView === 'list') {
        await renderListView(container);
    } else if (currentView === 'form') {
        await renderFormView(container);
    } else if (currentView === 'details') {
        await renderDetailsView(container);
    }
}

// -------------------------------------------------------------
// VIEW 1: LIST VIEW OF ALL WEEKLY TESTS
// -------------------------------------------------------------
async function renderListView(container) {
    const students = await getStudents();
    const classes = [...new Set(students.map(s => s.class))].sort();
    const tests = await getWeeklyTests(selectedClass);

    container.innerHTML = `
        <div class="glass-card">
            <!-- Selector Controls Row -->
            <div class="controls-row" style="margin-bottom: 24px;">
                <div class="filters-wrapper" style="flex: 1; align-items: center; gap: 16px;">
                    <div style="display: flex; flex-direction: column; gap: 6px;">
                        <label class="form-label" style="margin-bottom: 0;">Select Class</label>
                        <select class="select-input" id="test-class-select" style="min-width: 150px;">
                            ${classes.map(c => `<option value="${c}" ${c === selectedClass ? 'selected' : ''}>Class ${c}</option>`).join('')}
                        </select>
                    </div>
                </div>
                
                <div style="display: flex; align-items: flex-end; height: 100%;">
                    <button class="btn btn-primary" id="btn-create-test">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Create Weekly Test
                    </button>
                </div>
            </div>

            <!-- Test Grid/Table -->
            <div id="test-list-area">
                ${tests.length === 0 ? `
                    <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 16px; opacity: 0.5;">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                            <polyline points="10 9 9 9 8 9"/>
                        </svg>
                        <h4 style="color: var(--text-primary); margin-bottom: 8px;">No tests recorded yet</h4>
                        <p style="font-size: 0.88rem;">Click on "Create Weekly Test" to add a new test and record student performances.</p>
                    </div>
                ` : `
                    <div class="table-responsive">
                        <table class="custom-table">
                            <thead>
                                <tr>
                                    <th>Test Name</th>
                                    <th>Subject</th>
                                    <th>Date</th>
                                    <th>Max Marks</th>
                                    <th>Class Avg (%)</th>
                                    <th style="text-align: right;">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tests.map(test => {
                                    // Calculate class average
                                    const scores = Object.values(test.marks || {});
                                    let avgText = 'N/A';
                                    if (scores.length > 0) {
                                        const sum = scores.reduce((a, b) => a + b, 0);
                                        const avgScore = sum / scores.length;
                                        avgText = `${Math.round((avgScore / test.maxMarks) * 100)}%`;
                                    }

                                    return `
                                        <tr>
                                            <td>
                                                <div style="font-weight: 600; color: var(--text-primary);">${test.testName}</div>
                                            </td>
                                            <td>${test.subject}</td>
                                            <td>${test.date}</td>
                                            <td><span class="badge badge-primary">${test.maxMarks}</span></td>
                                            <td><span class="badge badge-success">${avgText}</span></td>
                                            <td>
                                                <div class="actions-cell" style="justify-content: flex-end;">
                                                    <button class="btn-icon-action btn-view-reports" data-test-id="${test.id}" title="View & Send WhatsApp Reports">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2">
                                                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                                                        </svg>
                                                    </button>
                                                    <button class="btn-icon-action edit btn-edit-test" data-test-id="${test.id}" title="Edit Scores">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                        </svg>
                                                    </button>
                                                    <button class="btn-icon-action delete btn-delete-test" data-test-id="${test.id}" title="Delete Test">
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                            <polyline points="3 6 5 6 21 6"></polyline>
                                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></polyline>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `}
            </div>
        </div>

        <!-- Toast Feedback Overlay -->
        <div id="test-toast" style="display: none; position: fixed; bottom: 24px; right: 24px; z-index: 1000; padding: 16px 24px; border-radius: var(--radius-md); box-shadow: var(--shadow-lg); font-weight: 600; align-items: center; gap: 10px; animation: slideUp 0.3s ease;">
            <svg id="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"></svg>
            <span id="toast-msg">Success!</span>
        </div>
    `;

    // Hook listeners
    document.getElementById('test-class-select').addEventListener('change', async (e) => {
        selectedClass = e.target.value;
        await renderListView(container);
    });

    document.getElementById('btn-create-test').addEventListener('click', async () => {
        currentView = 'form';
        activeTestId = null;
        tempTestScores = {};
        await renderApp(container);
    });

    container.querySelectorAll('.btn-view-reports').forEach(btn => {
        btn.addEventListener('click', async () => {
            activeTestId = btn.getAttribute('data-test-id');
            currentView = 'details';
            await renderApp(container);
        });
    });

    container.querySelectorAll('.btn-edit-test').forEach(btn => {
        btn.addEventListener('click', async () => {
            activeTestId = btn.getAttribute('data-test-id');
            const allTests = await getWeeklyTests();
            const currentTest = allTests.find(t => t.id === activeTestId);
            if (currentTest) {
                tempTestScores = { ...currentTest.marks };
                currentView = 'form';
                await renderApp(container);
            }
        });
    });

    container.querySelectorAll('.btn-delete-test').forEach(btn => {
        btn.addEventListener('click', async () => {
            const testId = btn.getAttribute('data-test-id');
            if (confirm('Are you sure you want to delete this weekly test? This action cannot be undone.')) {
                await deleteWeeklyTest(testId);
                showToast('Test deleted successfully!', 'success');
                await renderListView(container);
            }
        });
    });
}

// -------------------------------------------------------------
// VIEW 2: FORM VIEW (CREATE / EDIT SCORES)
// -------------------------------------------------------------
async function renderFormView(container) {
    const students = (await getStudents()).filter(s => s.class === selectedClass);
    const allTests = await getWeeklyTests();
    const isEdit = activeTestId !== null;
    const testData = isEdit ? allTests.find(t => t.id === activeTestId) : null;

    // Prefill data
    const testName = isEdit ? testData.testName : '';
    const subject = isEdit ? testData.subject : '';
    const date = isEdit ? testData.date : new Date().toISOString().split('T')[0];
    const maxMarks = isEdit ? testData.maxMarks : 50;

    if (students.length === 0) {
        container.innerHTML = `
            <div class="glass-card" style="text-align: center; padding: 40px; color: var(--text-muted);">
                <h4 style="color: var(--text-primary); margin-bottom: 8px;">No students enrolled</h4>
                <p style="margin-bottom: 20px;">You cannot create a test because there are no students in Class ${selectedClass}.</p>
                <button class="btn btn-secondary" id="btn-form-cancel">Back to List</button>
            </div>
        `;
        document.getElementById('btn-form-cancel').addEventListener('click', async () => {
            currentView = 'list';
            await renderApp(container);
        });
        return;
    }

    container.innerHTML = `
        <div class="glass-card">
            <h3 style="margin-bottom: 24px; font-weight: 700; display: flex; align-items: center; gap: 8px;">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                </svg>
                ${isEdit ? 'Edit Weekly Test Scores' : `Record New Weekly Test for Class ${selectedClass}`}
            </h3>

            <form id="weekly-test-form">
                <!-- Test Meta Data Fields -->
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 32px;">
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <label class="form-label">Test Name / Title</label>
                        <input type="text" class="select-input" id="form-test-name" value="${testName}" placeholder="e.g. Science Test 1" required style="width: 100%;">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <label class="form-label">Subject</label>
                        <input type="text" class="select-input" id="form-test-subject" value="${subject}" placeholder="e.g. Physics" required style="width: 100%;">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <label class="form-label">Test Date</label>
                        <input type="date" class="select-input" id="form-test-date" value="${date}" required style="width: 100%;">
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <label class="form-label">Max Marks</label>
                        <input type="number" class="select-input" id="form-test-max" value="${maxMarks}" min="1" required style="width: 100%;">
                    </div>
                </div>

                <!-- Students Score Entry Section -->
                <h4 style="margin-bottom: 16px; font-weight: 700; border-bottom: 1px solid var(--border-color); padding-bottom: 8px; color: var(--text-primary);">Enter Student Marks</h4>
                
                <div class="table-responsive" style="margin-bottom: 32px;">
                    <table class="custom-table">
                        <thead>
                            <tr>
                                <th>Student Details</th>
                                <th>Roll Number</th>
                                <th style="width: 200px;">Marks Obtained</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${students.map(s => {
                                const currentScore = tempTestScores[s.id] !== undefined ? tempTestScores[s.id] : '';
                                return `
                                    <tr class="form-student-row" data-student-id="${s.id}">
                                        <td>
                                            <div class="table-student-cell">
                                                <div class="table-student-avatar" style="background: ${s.bgGradient};">
                                                    ${s.initials}
                                                </div>
                                                <div>
                                                    <span class="table-student-name">${s.name}</span>
                                                    <div style="font-size: 0.75rem; color: var(--text-muted);">Parent: ${s.parentName}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>${s.rollNumber}</td>
                                        <td>
                                            <div style="display: flex; align-items: center; gap: 8px;">
                                                <input type="number" class="select-input form-student-score" 
                                                       data-student-id="${s.id}" 
                                                       value="${currentScore}" 
                                                       min="0" 
                                                       step="0.5"
                                                       placeholder="0"
                                                       required
                                                       style="width: 100px; padding: 8px 12px; text-align: center;">
                                                <span style="color: var(--text-muted); font-size: 0.9rem;">/ <span class="max-marks-label">${maxMarks}</span></span>
                                            </div>
                                            <span class="error-msg" style="color: var(--danger); font-size: 0.75rem; display: none; margin-top: 4px;">Exceeds max marks!</span>
                                        </td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Form Buttons -->
                <div style="display: flex; justify-content: flex-end; gap: 12px;">
                    <button type="button" class="btn btn-secondary" id="btn-form-cancel">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17 21 17 13 7 13 7 21"/>
                            <polyline points="7 3 7 8 15 8"/>
                        </svg>
                        Save Test Scores
                    </button>
                </div>
            </form>
        </div>

        <!-- Toast Feedback Overlay -->
        <div id="test-toast" style="display: none; position: fixed; bottom: 24px; right: 24px; z-index: 1000; padding: 16px 24px; border-radius: var(--radius-md); box-shadow: var(--shadow-lg); font-weight: 600; align-items: center; gap: 10px; animation: slideUp 0.3s ease;">
            <svg id="toast-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"></svg>
            <span id="toast-msg">Success!</span>
        </div>
    `;

    // Dynamic Max Marks label updating
    const maxMarksInput = document.getElementById('form-test-max');
    maxMarksInput.addEventListener('input', (e) => {
        const val = e.target.value || 0;
        container.querySelectorAll('.max-marks-label').forEach(lbl => {
            lbl.textContent = val;
        });
        
        // Retrigger error validations if max marks change
        container.querySelectorAll('.form-student-score').forEach(input => {
            validateScoreInput(input, val);
        });
    });

    // Score validation helper
    function validateScoreInput(input, maxVal) {
        const score = parseFloat(input.value);
        const max = parseFloat(maxVal);
        const row = input.closest('tr');
        const errorSpan = row.querySelector('.error-msg');
        
        if (!isNaN(score) && score > max) {
            errorSpan.style.display = 'block';
            input.style.borderColor = 'var(--danger)';
            return false;
        } else {
            errorSpan.style.display = 'none';
            input.style.borderColor = '';
            return true;
        }
    }

    // Input listeners for real-time validation
    container.querySelectorAll('.form-student-score').forEach(input => {
        input.addEventListener('input', (e) => {
            validateScoreInput(e.target, maxMarksInput.value);
        });
    });

    // Cancel Button
    document.getElementById('btn-form-cancel').addEventListener('click', async () => {
        currentView = 'list';
        await renderApp(container);
    });

    // Form Submit Event
    document.getElementById('weekly-test-form').addEventListener('submit', async (e) => {
        e.preventDefault();

        const testNameVal = document.getElementById('form-test-name').value;
        const subjectVal = document.getElementById('form-test-subject').value;
        const dateVal = document.getElementById('form-test-date').value;
        const maxMarksVal = parseFloat(maxMarksInput.value);

        // Final score checks
        let isValid = true;
        const marksRecords = {};

        container.querySelectorAll('.form-student-score').forEach(input => {
            const studentId = input.getAttribute('data-student-id');
            const score = parseFloat(input.value);
            
            if (!validateScoreInput(input, maxMarksVal)) {
                isValid = false;
            }
            marksRecords[studentId] = score;
        });

        if (!isValid) {
            alert('Please fix the validation errors. Some scores exceed the maximum marks allowed!');
            return;
        }

        const dataToSave = {
            testName: testNameVal,
            subject: subjectVal,
            date: dateVal,
            maxMarks: maxMarksVal,
            class: selectedClass,
            marks: marksRecords
        };

        if (isEdit) {
            dataToSave.id = activeTestId;
        }

        await saveWeeklyTest(dataToSave);
        
        showToast('Weekly test scores saved successfully!', 'success');
        
        // Redirect back to list
        setTimeout(async () => {
            currentView = 'list';
            activeTestId = null;
            await renderApp(container);
        }, 1200);
    });
}

// -------------------------------------------------------------
// VIEW 3: DETAILS & WHATSAPP SEND PANEL
// -------------------------------------------------------------
async function renderDetailsView(container) {
    const students = (await getStudents()).filter(s => s.class === selectedClass);
    const allTests = await getWeeklyTests();
    const test = allTests.find(t => t.id === activeTestId);

    if (!test) {
        container.innerHTML = `
            <div class="glass-card" style="text-align: center; padding: 40px; color: var(--text-muted);">
                <h4 style="color: var(--text-primary); margin-bottom: 8px;">Test not found</h4>
                <button class="btn btn-secondary" id="btn-details-back">Back to List</button>
            </div>
        `;
        document.getElementById('btn-details-back').addEventListener('click', () => {
            currentView = 'list';
            renderApp(container);
        });
        return;
    }

    // Class average calculation
    const scores = Object.values(test.marks || {});
    let avgPercentageText = '0%';
    let highestScore = 0;
    let lowestScore = test.maxMarks;
    
    if (scores.length > 0) {
        const sum = scores.reduce((a, b) => a + b, 0);
        avgPercentageText = `${Math.round(((sum / scores.length) / test.maxMarks) * 100)}%`;
        highestScore = Math.max(...scores);
        lowestScore = Math.min(...scores);
    } else {
        lowestScore = 0;
    }

    container.innerHTML = `
        <!-- Test Header stats info -->
        <div style="display: flex; gap: 16px; margin-bottom: 24px; align-items: center;">
            <button class="btn btn-secondary btn-sm" id="btn-details-back" style="padding: 10px 14px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Back
            </button>
            <h2 style="font-weight: 700; color: var(--text-primary); margin: 0;">${test.testName} Performance Report</h2>
        </div>

        <div class="stats-grid" style="margin-bottom: 32px;">
            <div class="glass-card stat-card">
                <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, var(--primary), var(--primary-light));">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Subject & Date</span>
                    <span class="stat-value" style="font-size: 1.15rem; font-weight: 700;">${test.subject} (${test.date})</span>
                </div>
            </div>

            <div class="glass-card stat-card">
                <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #11998e, #38ef7d);">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                    </svg>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Class Average</span>
                    <span class="stat-value">${avgPercentageText}</span>
                </div>
            </div>

            <div class="glass-card stat-card">
                <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #FF6B6B, #FF8E53);">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Highest Score</span>
                    <span class="stat-value">${highestScore} / <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: normal;">${test.maxMarks}</span></span>
                </div>
            </div>

            <div class="glass-card stat-card">
                <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, #f857a6, #ff5858);">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>
                        <polyline points="17 18 23 18 23 12"/>
                    </svg>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Lowest Score</span>
                    <span class="stat-value">${lowestScore} / <span style="font-size: 0.9rem; color: var(--text-muted); font-weight: normal;">${test.maxMarks}</span></span>
                </div>
            </div>
        </div>

        <!-- Student Marks Table and WhatsApp triggers -->
        <div class="glass-card">
            <h3 style="margin-bottom: 20px; font-weight: 700; color: var(--text-primary);">Detailed Student Results</h3>
            
            <div class="table-responsive">
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th>Student Details</th>
                            <th>Roll Number</th>
                            <th>Marks Obtained</th>
                            <th>Percentage</th>
                            <th>Parent Details</th>
                            <th style="text-align: right;">Notify parent</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${students.map(s => {
                            const score = test.marks[s.id] !== undefined ? test.marks[s.id] : 0;
                            const percentage = Math.round((score / test.maxMarks) * 100);
                            
                            // Badge mapping for percentages
                            let badgeClass = 'badge-danger';
                            if (percentage >= 85) badgeClass = 'badge-success';
                            else if (percentage >= 60) badgeClass = 'badge-primary';
                            else if (percentage >= 40) badgeClass = 'badge-warning';

                            return `
                                <tr>
                                    <td>
                                        <div class="table-student-cell">
                                            <div class="table-student-avatar" style="background: ${s.bgGradient};">
                                                ${s.initials}
                                            </div>
                                            <div>
                                                <span class="table-student-name">${s.name}</span>
                                                <div style="font-size: 0.75rem; color: var(--text-muted);">${s.gender}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>${s.rollNumber}</td>
                                    <td>
                                        <span style="font-weight: 600; color: var(--text-primary);">${score}</span>
                                        <span style="color: var(--text-muted); font-size: 0.8rem;"> / ${test.maxMarks}</span>
                                    </td>
                                    <td>
                                        <span class="badge ${badgeClass}">${percentage}%</span>
                                    </td>
                                    <td>
                                        <div>${s.parentName}</div>
                                        <div style="font-size: 0.78rem; color: var(--text-muted);">${s.contact}</div>
                                    </td>
                                    <td>
                                        <div style="display: flex; justify-content: flex-end;">
                                            <button class="btn btn-secondary btn-sm btn-whatsapp-notify" 
                                                    data-student-id="${s.id}" 
                                                    data-score="${score}"
                                                    style="gap: 6px; padding: 6px 12px; border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.05); color: var(--success);">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                                                </svg>
                                                Send Report
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;

    // Back to List hook
    document.getElementById('btn-details-back').addEventListener('click', async () => {
        currentView = 'list';
        await renderApp(container);
    });

    // WhatsApp Click hooks
    container.querySelectorAll('.btn-whatsapp-notify').forEach(btn => {
        btn.addEventListener('click', () => {
            const studentId = btn.getAttribute('data-student-id');
            const score = parseFloat(btn.getAttribute('data-score'));
            const student = students.find(s => s.id === studentId);

            if (student) {
                sendWhatsAppNotification(student, score, test);
            }
        });
    });
}

// -------------------------------------------------------------
// WHATSAPP REDIRECT LOGIC
// -------------------------------------------------------------
function sendWhatsAppNotification(student, score, test) {
    // Sanitize contact number (keep only digits and + symbol)
    const sanitizedContact = student.contact.replace(/[^\d+]/g, '');
    
    // Add country code prefix if missing (assuming +91 for India if exactly 10 digits)
    let formattedPhone = sanitizedContact;
    if (formattedPhone.length === 10) {
        formattedPhone = '91' + formattedPhone;
    } else if (formattedPhone.startsWith('+')) {
        formattedPhone = formattedPhone.substring(1); // wa.me needs code without +
    }

    const percentage = ((score / test.maxMarks) * 100).toFixed(1);

    // Determine performance tier in Devanagari Hindi
    let performanceText = '';
    if (percentage >= 90) {
        performanceText = 'अति उत्तम (Excellent) 🌟';
    } else if (percentage >= 75) {
        performanceText = 'बहुत अच्छा (Very Good) ✨';
    } else if (percentage >= 50) {
        performanceText = 'अच्छा (Good) 👍';
    } else {
        performanceText = 'सुधार की आवश्यकता (Needs Improvement) 📚';
    }

    // Build the gorgeous professional report message in Hindi Devanagari script
    const message = `नमस्ते ${student.parentName} जी,

यह SMS स्कूल पोर्टल (Student Management System) की तरफ से एक साप्ताहिक अपडेट है।

आपके बच्चे *${student.name}* (Class: ${student.class}, Roll No: ${student.rollNumber}) ने इस सप्ताह की परीक्षा *'${test.testName}'* (विषय: *${test.subject}*) में निम्नलिखित अंक प्राप्त किए हैं:

• प्राप्त अंक (Marks Obtained): *${score}* / ${test.maxMarks}
• प्रतिशत (Percentage): *${percentage}%*
• प्रदर्शन ग्रेड (Performance): *${performanceText}*

कृपया अपने बच्चे का हौसला बढ़ाएं और उसे नियमित पढ़ाई करने के लिए प्रेरित करें। यदि आपका कोई प्रश्न है, तो आप स्कूल प्रशासन से संपर्क कर सकते हैं।

धन्यवाद! 🙏
*SMS School Management Portal*`;

    // Open WhatsApp Web or WhatsApp Application redirect
    const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
}

// -------------------------------------------------------------
// GENERAL UTILS
// -------------------------------------------------------------
function showToast(message, type = 'success') {
    const toast = document.getElementById('test-toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastMsg = document.getElementById('toast-msg');

    if (!toast) return;

    toastMsg.textContent = message;
    toast.style.display = 'flex';
    toast.style.position = 'fixed';
    toast.style.bottom = '24px';
    toast.style.right = '24px';
    toast.style.opacity = '1';

    if (type === 'success') {
        toast.style.backgroundColor = 'var(--success)';
        toast.style.color = '#ffffff';
        toastIcon.innerHTML = `
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        `;
    } else {
        toast.style.backgroundColor = 'var(--danger)';
        toast.style.color = '#ffffff';
        toastIcon.innerHTML = `
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        `;
    }

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.5s ease';
        setTimeout(() => {
            toast.style.display = 'none';
            toast.style.opacity = '1';
        }, 500);
    }, 2500);
}
