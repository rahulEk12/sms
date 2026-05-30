import { getStudents, saveStudent, deleteStudent } from './db.js';
import { openModal, closeModal } from './app.js';

let allStudents = [];
let filteredStudents = [];
let currentSearchQuery = '';
let currentClassFilter = '';

export async function initStudents(container) {
    allStudents = await getStudents();
    filteredStudents = [...allStudents];
    currentSearchQuery = '';
    currentClassFilter = '';

    renderLayout(container);
    renderTable();
    setupListeners(container);
}

function renderLayout(container) {
    // Unique classes list for filter dropdown
    const classes = [...new Set(allStudents.map(s => s.class))].sort();

    container.innerHTML = `
        <div class="glass-card">
            <!-- Controls Row (Search and Add) -->
            <div class="controls-row">
                <div class="search-wrapper">
                    <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                    </svg>
                    <input type="text" class="search-input" id="student-search" placeholder="Search by name, roll number, parent...">
                </div>
                
                <div class="filters-wrapper">
                    <select class="select-input" id="class-filter">
                        <option value="">All Classes</option>
                        ${classes.map(c => `<option value="${c}">Class ${c}</option>`).join('')}
                    </select>
                    
                    <button class="btn btn-primary" id="add-student-btn">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"/>
                            <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                        Add Student
                    </button>
                </div>
            </div>

            <!-- Students Table Area -->
            <div class="table-responsive">
                <table class="custom-table">
                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Class</th>
                            <th>Roll No</th>
                            <th>Parent Name</th>
                            <th>Attendance</th>
                            <th>Fee Status</th>
                            <th style="text-align: right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="students-table-body">
                        <!-- Loaded dynamically -->
                    </tbody>
                </table>
            </div>
            
            <div id="no-students-message" style="display: none; text-align: center; padding: 40px; color: var(--text-muted);">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 12px; opacity: 0.5;">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="8" y1="12" x2="16" y2="12"/>
                </svg>
                <p>No students found matching the criteria.</p>
            </div>
        </div>
    `;
}

function renderTable() {
    const tableBody = document.getElementById('students-table-body');
    const emptyMsg = document.getElementById('no-students-message');
    
    // Apply search filter and class filter
    filteredStudents = allStudents.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(currentSearchQuery) || 
                              s.rollNumber.includes(currentSearchQuery) || 
                              s.parentName.toLowerCase().includes(currentSearchQuery) ||
                              s.email.toLowerCase().includes(currentSearchQuery);
        
        const matchesClass = currentClassFilter === '' || s.class === currentClassFilter;
        
        return matchesSearch && matchesClass;
    });

    if (filteredStudents.length === 0) {
        tableBody.innerHTML = '';
        emptyMsg.style.display = 'block';
        return;
    }

    emptyMsg.style.display = 'none';
    tableBody.innerHTML = filteredStudents.map(s => {
        let badgeClass = 'badge-success';
        if (s.feeStatus === 'Unpaid') badgeClass = 'badge-danger';
        else if (s.feeStatus === 'Pending') badgeClass = 'badge-warning';

        let attendanceColor = 'var(--success)';
        if (s.attendance < 75) attendanceColor = 'var(--danger)';
        else if (s.attendance < 85) attendanceColor = 'var(--warning)';

        return `
            <tr>
                <td>
                    <div class="table-student-cell">
                        <div class="table-student-avatar" style="background: ${s.bgGradient};">
                            ${s.initials}
                        </div>
                        <div>
                            <div class="table-student-name">${s.name}</div>
                            <div style="font-size: 0.78rem; color: var(--text-muted);">${s.email}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span style="font-weight: 500;">${s.class}</span>
                </td>
                <td>
                    <span>${s.rollNumber}</span>
                </td>
                <td>
                    <span>${s.parentName}</span>
                </td>
                <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span style="font-weight: 700; color: ${attendanceColor};">${s.attendance}%</span>
                        <div class="progress-bar-bg" style="width: 50px; height: 4px;">
                            <div class="progress-bar-fill" style="width: ${s.attendance}%; background: ${attendanceColor};"></div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge ${badgeClass}">${s.feeStatus}</span>
                </td>
                <td style="text-align: right;">
                    <div class="actions-cell" style="justify-content: flex-end;">
                        <button class="btn-icon-action edit" data-id="${s.id}" title="Edit Student">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>
                        </button>
                        <button class="btn-icon-action delete" data-id="${s.id}" title="Delete Student">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                <line x1="10" y1="11" x2="10" y2="17" />
                                <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function setupListeners(container) {
    // Search listener
    const searchInput = document.getElementById('student-search');
    searchInput.addEventListener('input', (e) => {
        currentSearchQuery = e.target.value.toLowerCase().trim();
        renderTable();
    });

    // Class filter listener
    const classFilter = document.getElementById('class-filter');
    classFilter.addEventListener('change', (e) => {
        currentClassFilter = e.target.value;
        renderTable();
    });

    // Add student button listener
    const addBtn = document.getElementById('add-student-btn');
    addBtn.addEventListener('click', () => {
        openStudentModal();
    });

    // Edit/Delete action listeners (event delegation on table body)
    const tableBody = document.getElementById('students-table-body');
    tableBody.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.btn-icon-action.edit');
        const deleteBtn = e.target.closest('.btn-icon-action.delete');

        if (editBtn) {
            const studentId = editBtn.getAttribute('data-id');
            const student = allStudents.find(s => s.id === studentId);
            if (student) openStudentModal(student);
        }

        if (deleteBtn) {
            const studentId = deleteBtn.getAttribute('data-id');
            const student = allStudents.find(s => s.id === studentId);
            if (student && confirm(`Are you sure you want to delete ${student.name}?`)) {
                await deleteStudent(studentId);
                allStudents = await getStudents(); // Refresh data
                renderTable();
            }
        }
    });
}

function openStudentModal(student = null) {
    const isEdit = !!student;
    const title = isEdit ? `Edit Student: ${student.name}` : 'Add New Student';

    const classesList = ['10-A', '10-B', '11-A', '11-C', '12-A', '12-B'];

    const contentHtml = `
        <form id="student-form">
            ${isEdit ? `<input type="hidden" name="id" value="${student.id}">` : ''}
            
            <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" name="name" class="form-input" required placeholder="e.g. Ramesh Kumar" value="${isEdit ? student.name : ''}">
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Class</label>
                    <select name="class" class="select-input" style="width: 100%;" required>
                        ${classesList.map(c => `
                            <option value="${c}" ${isEdit && student.class === c ? 'selected' : ''}>Class ${c}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Roll Number</label>
                    <input type="text" name="rollNumber" class="form-input" required placeholder="e.g. 102" value="${isEdit ? student.rollNumber : ''}">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Parent/Guardian Name</label>
                    <input type="text" name="parentName" class="form-input" required placeholder="e.g. Sunil Kumar" value="${isEdit ? student.parentName : ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Gender</label>
                    <select name="gender" class="select-input" style="width: 100%;" required>
                        <option value="Male" ${isEdit && student.gender === 'Male' ? 'selected' : ''}>Male</option>
                        <option value="Female" ${isEdit && student.gender === 'Female' ? 'selected' : ''}>Female</option>
                        <option value="Other" ${isEdit && student.gender === 'Other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Email Address</label>
                    <input type="email" name="email" class="form-input" required placeholder="e.g. student@example.com" value="${isEdit ? student.email : ''}">
                </div>
                <div class="form-group">
                    <label class="form-label">Contact Number</label>
                    <input type="text" name="contact" class="form-input" required placeholder="e.g. +91 99887 76655" value="${isEdit ? student.contact : ''}">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Fee Payment Status</label>
                    <select name="feeStatus" id="modal-fee-status" class="select-input" style="width: 100%;" required>
                        <option value="Paid" ${isEdit && student.feeStatus === 'Paid' ? 'selected' : ''}>Fully Paid</option>
                        <option value="Pending" ${isEdit && student.feeStatus === 'Pending' ? 'selected' : ''}>Partially Paid</option>
                        <option value="Unpaid" ${isEdit && student.feeStatus === 'Unpaid' ? 'selected' : ''}>Unpaid</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label" id="fee-amount-label">Paid Amount (INR)</label>
                    <input type="number" name="paidAmount" id="modal-paid-amount" class="form-input" min="0" required placeholder="e.g. 20000" value="${isEdit ? student.paidAmount : '0'}">
                </div>
            </div>

            <div class="form-group" id="pending-amount-group" style="${isEdit && student.feeStatus === 'Pending' ? '' : 'display: none;'}">
                <label class="form-label">Remaining Pending Amount (INR)</label>
                <input type="number" name="pendingAmount" id="modal-pending-amount" class="form-input" min="0" placeholder="e.g. 25000" value="${isEdit ? student.pendingAmount : '0'}">
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-secondary" id="modal-cancel-btn">Cancel</button>
                <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Register Student'}</button>
            </div>
        </form>
    `;

    openModal(title, contentHtml);

    // Dynamic fee inputs logic
    const statusSelect = document.getElementById('modal-fee-status');
    const paidInput = document.getElementById('modal-paid-amount');
    const pendingGroup = document.getElementById('pending-amount-group');
    const pendingInput = document.getElementById('modal-pending-amount');
    const amountLabel = document.getElementById('fee-amount-label');

    statusSelect.addEventListener('change', (e) => {
        const val = e.target.value;
        if (val === 'Paid') {
            amountLabel.textContent = 'Total Paid Amount (INR)';
            paidInput.value = '45000'; // baseline class fee example
            pendingGroup.style.display = 'none';
            pendingInput.value = '0';
            pendingInput.removeAttribute('required');
        } else if (val === 'Unpaid') {
            amountLabel.textContent = 'Unpaid Value (INR)';
            paidInput.value = '0';
            pendingGroup.style.display = 'none';
            pendingInput.value = '45000';
            pendingInput.removeAttribute('required');
        } else if (val === 'Pending') {
            amountLabel.textContent = 'Paid Amount (INR)';
            paidInput.value = '20000';
            pendingGroup.style.display = 'block';
            pendingInput.value = '25000';
            pendingInput.setAttribute('required', 'true');
        }
    });

    // Form submit listener
    const form = document.getElementById('student-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            class: formData.get('class'),
            rollNumber: formData.get('rollNumber'),
            parentName: formData.get('parentName'),
            gender: formData.get('gender'),
            email: formData.get('email'),
            contact: formData.get('contact'),
            feeStatus: formData.get('feeStatus'),
            paidAmount: parseFloat(formData.get('paidAmount') || 0),
            pendingAmount: parseFloat(formData.get('pendingAmount') || 0)
        };

        if (isEdit) {
            data.id = formData.get('id');
        }

        // Adjust pending amount calculations dynamically
        if (data.feeStatus === 'Paid') {
            data.pendingAmount = 0;
        } else if (data.feeStatus === 'Unpaid') {
            data.pendingAmount = data.paidAmount > 0 ? 0 : 45000;
            data.paidAmount = 0;
        }

        await saveStudent(data);
        closeModal();
        
        // Refresh table content
        allStudents = await getStudents();
        renderTable();
    });

    // Cancel button
    document.getElementById('modal-cancel-btn').addEventListener('click', closeModal);
}
