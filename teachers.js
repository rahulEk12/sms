import { getTeachers, saveTeacher, deleteTeacher } from './db.js';
import { openModal, closeModal } from './app.js';

let allTeachers = [];

export async function initTeachers(container) {
    allTeachers = await getTeachers();
    renderLayout(container);
    renderGrid();
    setupListeners();
}

function renderLayout(container) {
    container.innerHTML = `
        <div style="display: flex; justify-content: flex-end; margin-bottom: 24px;">
            <button class="btn btn-primary" id="add-teacher-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add Teacher
            </button>
        </div>

        <!-- Teachers Card Grid -->
        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 24px;" id="teachers-cards-grid">
            <!-- Dynamic loaded cards -->
        </div>

        <div id="no-teachers-message" style="display: none; text-align: center; padding: 40px; color: var(--text-muted); width: 100%;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-bottom: 12px; opacity: 0.5;">
                <circle cx="12" cy="12" r="10"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            <p>No teachers registered in the system.</p>
        </div>
    `;
}

function renderGrid() {
    const grid = document.getElementById('teachers-cards-grid');
    const emptyMsg = document.getElementById('no-teachers-message');

    if (allTeachers.length === 0) {
        grid.innerHTML = '';
        emptyMsg.style.display = 'block';
        return;
    }

    emptyMsg.style.display = 'none';
    grid.innerHTML = allTeachers.map(t => {
        return `
            <div class="glass-card" style="display: flex; flex-direction: column; gap: 16px; position: relative;">
                <!-- Action Buttons in Top Right Corner -->
                <div style="position: absolute; top: 16px; right: 16px; display: flex; gap: 6px;">
                    <button class="btn-icon-action edit" data-id="${t.id}" title="Edit Teacher">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                    </button>
                    <button class="btn-icon-action delete" data-id="${t.id}" title="Delete Teacher">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                    </button>
                </div>

                <!-- Avatar and Title Header -->
                <div style="display: flex; align-items: center; gap: 16px;">
                    <div style="width: 52px; height: 52px; border-radius: var(--radius-md); background: ${t.bgGradient}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.15rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
                        ${t.initials}
                    </div>
                    <div>
                        <h4 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">${t.name}</h4>
                        <span class="badge badge-primary" style="font-size: 0.7rem;">${t.subject} Specialist</span>
                    </div>
                </div>

                <!-- Key details -->
                <div style="background: var(--bg-secondary); border: 1px solid var(--border-color); padding: 12px; border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 8px; font-size: 0.82rem;">
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-muted);">Department</span>
                        <span style="font-weight: 600;">${t.department}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between;">
                        <span style="color: var(--text-muted);">Class Teacher</span>
                        <span style="font-weight: 600; color: var(--primary-light);">${t.classTeacher ? `Class ${t.classTeacher}` : 'None'}</span>
                    </div>
                </div>

                <!-- Contact Info Footer -->
                <div style="display: flex; flex-direction: column; gap: 6px; font-size: 0.8rem; border-top: 1px solid var(--border-color); padding-top: 12px; margin-top: auto; color: var(--text-secondary);">
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                        </svg>
                        <span>${t.email}</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2">
                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        <span>${t.contact}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function setupListeners() {
    const addBtn = document.getElementById('add-teacher-btn');
    const grid = document.getElementById('teachers-cards-grid');

    addBtn.addEventListener('click', () => {
        openTeacherModal();
    });

    grid.addEventListener('click', async (e) => {
        const editBtn = e.target.closest('.btn-icon-action.edit');
        const deleteBtn = e.target.closest('.btn-icon-action.delete');

        if (editBtn) {
            const id = editBtn.getAttribute('data-id');
            const teacher = allTeachers.find(t => t.id === id);
            if (teacher) openTeacherModal(teacher);
        }

        if (deleteBtn) {
            const id = deleteBtn.getAttribute('data-id');
            const teacher = allTeachers.find(t => t.id === id);
            if (teacher && confirm(`Are you sure you want to delete ${teacher.name}?`)) {
                await deleteTeacher(id);
                allTeachers = await getTeachers(); // Refresh list
                renderGrid();
            }
        }
    });
}

function openTeacherModal(teacher = null) {
    const isEdit = !!teacher;
    const title = isEdit ? `Edit Teacher: ${teacher.name}` : 'Add New Teacher';

    const depts = ['Science', 'Mathematics', 'Languages', 'Arts', 'Social Sciences', 'Physical Education'];
    const classes = ['10-A', '10-B', '11-A', '11-C', '12-A', '12-B', 'None'];

    const contentHtml = `
        <form id="teacher-form">
            ${isEdit ? `<input type="hidden" name="id" value="${teacher.id}">` : ''}

            <div class="form-group">
                <label class="form-label">Full Name</label>
                <input type="text" name="name" class="form-input" required placeholder="e.g. Mrs. Sunita Rao" value="${isEdit ? teacher.name : ''}">
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Department</label>
                    <select name="department" class="select-input" style="width: 100%;" required>
                        ${depts.map(d => `
                            <option value="${d}" ${isEdit && teacher.department === d ? 'selected' : ''}>${d}</option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Subject Specialty</label>
                    <input type="text" name="subject" class="form-input" required placeholder="e.g. Algebra" value="${isEdit ? teacher.subject : ''}">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">Class Teacher Allocation</label>
                    <select name="classTeacher" class="select-input" style="width: 100%;" required>
                        ${classes.map(c => `
                            <option value="${c === 'None' ? '' : c}" ${isEdit && (teacher.classTeacher || '') === (c === 'None' ? '' : c) ? 'selected' : ''}>
                                ${c === 'None' ? 'None (Subject Teacher)' : `Class ${c}`}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Contact Number</label>
                    <input type="text" name="contact" class="form-input" required placeholder="e.g. +91 90000 12345" value="${isEdit ? teacher.contact : ''}">
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">Email Address</label>
                <input type="email" name="email" class="form-input" required placeholder="e.g. teacher@school.edu" value="${isEdit ? teacher.email : ''}">
            </div>

            <div class="form-actions">
                <button type="button" class="btn btn-secondary" id="modal-teacher-cancel">Cancel</button>
                <button type="submit" class="btn btn-primary">${isEdit ? 'Save Changes' : 'Register Teacher'}</button>
            </div>
        </form>
    `;

    openModal(title, contentHtml);

    const form = document.getElementById('teacher-form');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const data = {
            name: formData.get('name'),
            department: formData.get('department'),
            subject: formData.get('subject'),
            classTeacher: formData.get('classTeacher'),
            contact: formData.get('contact'),
            email: formData.get('email')
        };

        if (isEdit) {
            data.id = formData.get('id');
        }

        await saveTeacher(data);
        closeModal();

        // Refresh list
        allTeachers = await getTeachers();
        renderGrid();
    });

    document.getElementById('modal-teacher-cancel').addEventListener('click', closeModal);
}
