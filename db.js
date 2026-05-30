// PostgreSQL Backend API client layer

const API_URL = 'http://localhost:5000/api';

// No-op for backward compatibility since the backend handles table migrations and seeding automatically!
export async function initDatabase() {
    try {
        const res = await fetch(`${API_URL}/students`);
        if (res.ok) {
            console.log("Connected to backend database API successfully.");
        }
    } catch (err) {
        console.error("Backend database connection check failed:", err.message);
    }
}

// Student APIs
export async function getStudents() {
    const res = await fetch(`${API_URL}/students`);
    if (!res.ok) throw new Error("Failed to fetch students");
    return await res.json();
}

export async function saveStudent(studentData) {
    const res = await fetch(`${API_URL}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
    });
    if (!res.ok) throw new Error("Failed to save student");
    return await res.json();
}

export async function deleteStudent(id) {
    const res = await fetch(`${API_URL}/students/${id}`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete student");
    return await res.json();
}

// Teacher APIs
export async function getTeachers() {
    const res = await fetch(`${API_URL}/teachers`);
    if (!res.ok) throw new Error("Failed to fetch teachers");
    return await res.json();
}

export async function saveTeacher(teacherData) {
    const res = await fetch(`${API_URL}/teachers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(teacherData)
    });
    if (!res.ok) throw new Error("Failed to save teacher");
    return await res.json();
}

export async function deleteTeacher(id) {
    const res = await fetch(`${API_URL}/teachers/${id}`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete teacher");
    return await res.json();
}

// Attendance APIs
export async function getAttendance(date, className) {
    const res = await fetch(`${API_URL}/attendance?date=${date}&class=${className}`);
    if (!res.ok) throw new Error("Failed to fetch attendance");
    return await res.json();
}

export async function saveAttendance(date, className, records) {
    const res = await fetch(`${API_URL}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, class: className, records })
    });
    if (!res.ok) throw new Error("Failed to save attendance");
    return await res.json();
}

// Fee/Invoice APIs
export async function getInvoices() {
    const res = await fetch(`${API_URL}/invoices`);
    if (!res.ok) throw new Error("Failed to fetch invoices");
    return await res.json();
}

export async function payInvoice(invoiceId, amountPaid) {
    const res = await fetch(`${API_URL}/invoices/${invoiceId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountPaid })
    });
    if (!res.ok) throw new Error("Failed to process payment");
    return await res.json();
}

// Weekly Tests APIs
export async function getWeeklyTests(className) {
    const queryParam = className ? `?class=${className}` : '';
    const res = await fetch(`${API_URL}/weekly-tests${queryParam}`);
    if (!res.ok) throw new Error("Failed to fetch weekly tests");
    return await res.json();
}

export async function saveWeeklyTest(testData) {
    const res = await fetch(`${API_URL}/weekly-tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testData)
    });
    if (!res.ok) throw new Error("Failed to save weekly test scores");
    return await res.json();
}

export async function deleteWeeklyTest(testId) {
    const res = await fetch(`${API_URL}/weekly-tests/${testId}`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error("Failed to delete weekly test");
    return await res.json();
}
