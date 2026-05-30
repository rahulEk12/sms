import { getStudents, getTeachers, getInvoices } from './db.js';

export async function initDashboard(container) {
    const students = await getStudents();
    const teachers = await getTeachers();
    const invoices = await getInvoices();

    // Calculations
    const totalStudents = students.length;
    const totalTeachers = teachers.length;

    // Fees Calculations
    let totalCollected = 0;
    let totalPending = 0;
    invoices.forEach(inv => {
        if (inv.status === 'Paid') {
            totalCollected += inv.amount;
        } else if (inv.status === 'Partially Paid') {
            totalCollected += inv.paidAmount;
            totalPending += (inv.amount - inv.paidAmount);
        } else {
            totalPending += inv.amount;
        }
    });

    // Format money in INR
    const formatINR = (num) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(num);
    };

    // Calculate Average Attendance
    const avgAttendance = totalStudents > 0 
        ? Math.round(students.reduce((sum, s) => sum + s.attendance, 0) / totalStudents)
        : 0;

    // Get recent 3 invoices for recent activities
    const recentInvoices = [...invoices]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 3);

    // Get class-wise distribution
    const classCounts = {};
    students.forEach(s => {
        classCounts[s.class] = (classCounts[s.class] || 0) + 1;
    });

    container.innerHTML = `
        <!-- Stats Cards Grid -->
        <div class="stats-grid">
            
            <!-- Total Students Card -->
            <div class="glass-card stat-card">
                <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, var(--primary), var(--primary-light));">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Total Students</span>
                    <span class="stat-value">${totalStudents}</span>
                </div>
            </div>

            <!-- Attendance Card -->
            <div class="glass-card stat-card">
                <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, var(--success), var(--success-light));">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Avg Attendance</span>
                    <span class="stat-value">${avgAttendance}%</span>
                </div>
            </div>

            <!-- Fees Collected Card -->
            <div class="glass-card stat-card">
                <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, var(--info), #85e3ff);">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="12" y1="1" x2="12" y2="23" />
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Fees Collected</span>
                    <span class="stat-value" style="font-size: 1.5rem; font-weight: 800;">${formatINR(totalCollected)}</span>
                </div>
            </div>

            <!-- Fees Pending Card -->
            <div class="glass-card stat-card">
                <div class="stat-icon-wrapper" style="background: linear-gradient(135deg, var(--danger), var(--danger-light));">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                </div>
                <div class="stat-info">
                    <span class="stat-label">Pending Fees</span>
                    <span class="stat-value" style="font-size: 1.5rem; font-weight: 800;">${formatINR(totalPending)}</span>
                </div>
            </div>

        </div>

        <!-- Charts & Lists Section -->
        <div class="dashboard-charts">
            
            <!-- Class Distribution & Attendance Progress -->
            <div class="glass-card">
                <div class="chart-header">
                    <h3 class="chart-title">Class-wise Distribution</h3>
                    <span style="font-size: 0.8rem; color: var(--text-muted);">Enrollment counts</span>
                </div>
                
                <div class="progress-list">
                    ${Object.entries(classCounts).map(([className, count]) => {
                        const pct = totalStudents > 0 ? Math.round((count / totalStudents) * 100) : 0;
                        return `
                            <div class="progress-item">
                                <div class="progress-label-row">
                                    <span>Class ${className}</span>
                                    <span>${count} Students (${pct}%)</span>
                                </div>
                                <div class="progress-bar-bg">
                                    <div class="progress-bar-fill" style="width: ${pct}%; background: linear-gradient(to right, var(--primary), var(--primary-light));"></div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                    ${Object.keys(classCounts).length === 0 ? '<p style="color:var(--text-muted)">No class enrollments found.</p>' : ''}
                </div>
            </div>

            <!-- Recent Fee Transactions (Activities) -->
            <div class="glass-card">
                <div class="chart-header">
                    <h3 class="chart-title">Recent Transactions</h3>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2">
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                    </svg>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 16px; margin-top: 8px;">
                    ${recentInvoices.map(inv => {
                        const statusClass = inv.status === 'Paid' ? 'badge-success' : (inv.status === 'Unpaid' ? 'badge-danger' : 'badge-warning');
                        return `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 12px; border-bottom: 1px solid var(--border-color);">
                                <div style="display: flex; flex-direction: column; gap: 4px;">
                                    <span style="font-size: 0.9rem; font-weight: 600;">${inv.studentName}</span>
                                    <span style="font-size: 0.75rem; color: var(--text-muted);">${inv.id} &bull; ${inv.date}</span>
                                </div>
                                <div style="text-align: right; display: flex; flex-direction: column; gap: 4px; align-items: flex-end;">
                                    <span style="font-size: 0.9rem; font-weight: 700; color: var(--text-primary);">${formatINR(inv.status === 'Partially Paid' ? inv.paidAmount : inv.amount)}</span>
                                    <span class="badge ${statusClass}" style="font-size: 0.65rem; padding: 2px 6px;">${inv.status}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                    ${recentInvoices.length === 0 ? '<p style="color:var(--text-muted)">No transaction records available.</p>' : ''}
                </div>
            </div>

        </div>

        <!-- Recent Registered Students Grid Section -->
        <div class="glass-card" style="margin-bottom: 8px;">
            <div class="chart-header">
                <h3 class="chart-title">Top Performing Students</h3>
                <span style="font-size: 0.8rem; color: var(--success); font-weight: 600;">High Attendance (>90%)</span>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px;">
                ${students.filter(s => s.attendance >= 90).slice(0, 3).map(stu => `
                    <div style="display: flex; align-items: center; gap: 16px; padding: 16px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
                        <div style="width: 44px; height: 44px; border-radius: var(--radius-full); background: ${stu.bgGradient}; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1rem;">
                            ${stu.initials}
                        </div>
                        <div style="display: flex; flex-direction: column; gap: 4px; flex: 1;">
                            <span style="font-weight: 600; font-size: 0.92rem; color: var(--text-primary);">${stu.name}</span>
                            <span style="font-size: 0.78rem; color: var(--text-muted);">Class ${stu.class} &bull; Roll: ${stu.rollNumber}</span>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 0.95rem; font-weight: 700; color: var(--success);">${stu.attendance}%</span>
                            <span style="display: block; font-size: 0.7rem; color: var(--text-muted);">Attendance</span>
                        </div>
                    </div>
                `).join('')}
                ${students.filter(s => s.attendance >= 90).length === 0 ? '<p style="color:var(--text-muted); padding: 12px 0;">No high attendance students in db.</p>' : ''}
            </div>
        </div>
    `;
}
