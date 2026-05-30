import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const { Client, Pool } = pg;

// Connection configurations
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'sms_db'
};

let pool;

// Auto-seed Initial Demo Data
const INITIAL_DEMO_DATA = {
    students: [
        { id: 'STU001', name: 'Aarav Sharma', rollNumber: '101', class: '10-A', email: 'aarav.sharma@example.com', contact: '+91 98765 43210', gender: 'Male', parentName: 'Ramesh Sharma', bgGradient: 'linear-gradient(135deg, #FF6B6B, #FF8E53)', initials: 'AS', feeStatus: 'Paid', paidAmount: 45000, pendingAmount: 0, attendance: 92 },
        { id: 'STU002', name: 'Ananya Verma', rollNumber: '102', class: '10-A', email: 'ananya.v@example.com', contact: '+91 87654 32109', gender: 'Female', parentName: 'Sanjay Verma', bgGradient: 'linear-gradient(135deg, #4E65FF, #92EFFD)', initials: 'AV', feeStatus: 'Pending', paidAmount: 20000, pendingAmount: 25000, attendance: 88 },
        { id: 'STU003', name: 'Kabir Mehta', rollNumber: '103', class: '12-B', email: 'kabir.m@example.com', contact: '+91 76543 21098', gender: 'Male', parentName: 'Anil Mehta', bgGradient: 'linear-gradient(135deg, #11998e, #38ef7d)', initials: 'KM', feeStatus: 'Paid', paidAmount: 50000, pendingAmount: 0, attendance: 95 },
        { id: 'STU004', name: 'Isha Patel', rollNumber: '104', class: '12-B', email: 'isha.patel@example.com', contact: '+91 65432 10987', gender: 'Female', parentName: 'Vijay Patel', bgGradient: 'linear-gradient(135deg, #FC466B, #3F5EFB)', initials: 'IP', feeStatus: 'Unpaid', paidAmount: 0, pendingAmount: 50000, attendance: 74 },
        { id: 'STU005', name: 'Rohan Gupta', rollNumber: '105', class: '10-A', email: 'rohan.g@example.com', contact: '+91 99887 76655', gender: 'Male', parentName: 'Sunil Gupta', bgGradient: 'linear-gradient(135deg, #f857a6, #ff5858)', initials: 'RG', feeStatus: 'Pending', paidAmount: 30000, pendingAmount: 15000, attendance: 81 },
        { id: 'STU006', name: 'Diya Sen', rollNumber: '106', class: '11-C', email: 'diya.sen@example.com', contact: '+91 88776 65544', gender: 'Female', parentName: 'Joy Sen', bgGradient: 'linear-gradient(135deg, #00c6ff, #0072ff)', initials: 'DS', feeStatus: 'Paid', paidAmount: 48000, pendingAmount: 0, attendance: 97 }
    ],
    teachers: [
        { id: 'TCH001', name: 'Dr. Alok Mishra', department: 'Science', subject: 'Physics', classTeacher: '12-B', email: 'alok.mishra@school.edu', contact: '+91 90001 20001', bgGradient: 'linear-gradient(135deg, #7F00FF, #E100FF)', initials: 'AM' },
        { id: 'TCH002', name: 'Mrs. Sunita Rao', department: 'Mathematics', subject: 'Mathematics', classTeacher: '10-A', email: 'sunita.rao@school.edu', contact: '+91 90002 20002', bgGradient: 'linear-gradient(135deg, #F2C94C, #F2994A)', initials: 'SR' },
        { id: 'TCH003', name: 'Mr. David Paul', department: 'Languages', subject: 'English Literature', classTeacher: '11-C', email: 'david.paul@school.edu', contact: '+91 90003 20003', bgGradient: 'linear-gradient(135deg, #36D1DC, #5B86E5)', initials: 'DP' }
    ],
    invoices: [
        { id: 'INV-2026-001', studentId: 'STU001', studentName: 'Aarav Sharma', class: '10-A', amount: 45000, date: '2026-04-10', status: 'Paid', paidAmount: 45000 },
        { id: 'INV-2026-002', studentId: 'STU002', studentName: 'Ananya Verma', class: '10-A', amount: 45000, date: '2026-04-11', status: 'Partially Paid', paidAmount: 20000 },
        { id: 'INV-2026-003', studentId: 'STU003', studentName: 'Kabir Mehta', class: '12-B', amount: 50000, date: '2026-04-12', status: 'Paid', paidAmount: 50000 },
        { id: 'INV-2026-004', studentId: 'STU004', studentName: 'Isha Patel', class: '12-B', amount: 50000, date: '2026-04-12', status: 'Unpaid', paidAmount: 0 },
        { id: 'INV-2026-005', studentId: 'STU005', studentName: 'Rohan Gupta', class: '10-A', amount: 45000, date: '2026-04-14', status: 'Partially Paid', paidAmount: 30000 },
        { id: 'INV-2026-006', studentId: 'STU006', studentName: 'Diya Sen', class: '11-C', amount: 48000, date: '2026-04-15', status: 'Paid', paidAmount: 48000 }
    ],
    attendance: [
        { date: '2026-05-22', class: '10-A', student_id: 'STU001', status: 'present' },
        { date: '2026-05-22', class: '10-A', student_id: 'STU002', status: 'late' },
        { date: '2026-05-22', class: '10-A', student_id: 'STU005', status: 'present' },
        { date: '2026-05-22', class: '12-B', student_id: 'STU003', status: 'present' },
        { date: '2026-05-22', class: '12-B', student_id: 'STU004', status: 'absent' }
    ],
    weeklyTests: [
        { id: 'TEST001', testName: 'Weekly Math Test 1', subject: 'Mathematics', date: '2026-05-18', class: '10-A', maxMarks: 50, scores: { 'STU001': 45, 'STU002': 38, 'STU005': 24 } },
        { id: 'TEST002', testName: 'Science Quiz 1', subject: 'Physics', date: '2026-05-19', class: '12-B', maxMarks: 25, scores: { 'STU003': 22, 'STU004': 11 } }
    ]
};

// Database Initialization Lifecycle
async function initDatabase() {
    // 1. Connect to administrative 'postgres' database to verify target DB exists
    const adminClient = new Client({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        database: 'postgres'
    });

    try {
        await adminClient.connect();
        const checkDb = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbConfig.database]);
        if (checkDb.rowCount === 0) {
            console.log(`Database '${dbConfig.database}' not found. Creating it...`);
            await adminClient.query(`CREATE DATABASE "${dbConfig.database}"`);
            console.log(`Database '${dbConfig.database}' created successfully.`);
        }
    } catch (err) {
        console.error("Administrative pre-check failed:", err.message);
    } finally {
        await adminClient.end();
    }

    // 2. Initialize Core Connection Pool
    pool = new Pool(dbConfig);

    // Test connection
    const client = await pool.connect();
    try {
        console.log(`Connected to database '${dbConfig.database}' successfully.`);

        // 3. Run schema migrations from schema.sql
        const sqlSchemaPath = path.resolve('schema.sql');
        if (fs.existsSync(sqlSchemaPath)) {
            const schemaSql = fs.readFileSync(sqlSchemaPath, 'utf8');
            await client.query(schemaSql);
            console.log("Database schema migrated successfully.");
        } else {
            console.warn("schema.sql file not found. Skipping schema creation.");
        }

        // 4. Check if students table is empty, if so, seed demo data
        const checkStudents = await client.query("SELECT COUNT(*) FROM students");
        const studentCount = parseInt(checkStudents.rows[0].count);

        if (studentCount === 0) {
            console.log("Database is empty. Seeding initial demo data...");

            // Seed Students
            for (const s of INITIAL_DEMO_DATA.students) {
                await client.query(
                    `INSERT INTO students (id, name, roll_number, class, email, contact, gender, parent_name, bg_gradient, initials, fee_status, paid_amount, pending_amount, attendance)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
                    [s.id, s.name, s.rollNumber, s.class, s.email, s.contact, s.gender, s.parentName, s.bgGradient, s.initials, s.feeStatus, s.paidAmount, s.pendingAmount, s.attendance]
                );
            }

            // Seed Teachers
            for (const t of INITIAL_DEMO_DATA.teachers) {
                await client.query(
                    `INSERT INTO teachers (id, name, department, subject, class_teacher, email, contact, bg_gradient, initials)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                    [t.id, t.name, t.department, t.subject, t.classTeacher, t.email, t.contact, t.bgGradient, t.initials]
                );
            }

            // Seed Invoices
            for (const inv of INITIAL_DEMO_DATA.invoices) {
                await client.query(
                    `INSERT INTO invoices (id, student_id, student_name, class, amount, date, status, paid_amount)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                    [inv.id, inv.studentId, inv.studentName, inv.class, inv.amount, inv.date, inv.status, inv.paidAmount]
                );
            }

            // Seed Attendance
            for (const att of INITIAL_DEMO_DATA.attendance) {
                await client.query(
                    `INSERT INTO attendance (date, class, student_id, status)
                     VALUES ($1, $2, $3, $4)`,
                    [att.date, att.class, att.student_id, att.status]
                );
            }

            // Seed Weekly Tests
            for (const test of INITIAL_DEMO_DATA.weeklyTests) {
                await client.query(
                    `INSERT INTO weekly_tests (id, test_name, subject, date, class, max_marks)
                     VALUES ($1, $2, $3, $4, $5, $6)`,
                    [test.id, test.testName, test.subject, test.date, test.class, test.maxMarks]
                );

                for (const [studentId, score] of Object.entries(test.scores)) {
                    await client.query(
                        `INSERT INTO weekly_test_scores (test_id, student_id, score)
                         VALUES ($1, $2, $3)`,
                        [test.id, studentId, score]
                    );
                }
            }

            console.log("Demo data seeded successfully.");
        } else {
            console.log("Database contains existing records. Skipping seed step.");
        }
    } catch (err) {
        console.error("Database initialization failed:", err.message);
    } finally {
        client.release();
    }
}

// -------------------------------------------------------------
// REST API ENDPOINTS
// -------------------------------------------------------------

// 1. STUDENTS APIS

// Get all students
app.get('/api/students', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM students ORDER BY id ASC");
        // Map db columns to match frontend camelCase format
        const students = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            rollNumber: row.roll_number,
            class: row.class,
            email: row.email,
            contact: row.contact,
            gender: row.gender,
            parentName: row.parent_name,
            bgGradient: row.bg_gradient,
            initials: row.initials,
            feeStatus: row.fee_status,
            paidAmount: parseFloat(row.paid_amount),
            pendingAmount: parseFloat(row.pending_amount),
            attendance: row.attendance
        }));
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Save (Add or Update) student
app.post('/api/students', async (req, res) => {
    const student = req.body;
    const client = await pool.connect();
    
    try {
        await client.query("BEGIN");
        
        if (student.id) {
            // Edit existing
            await client.query(
                `UPDATE students 
                 SET name = $1, roll_number = $2, class = $3, email = $4, contact = $5, gender = $6, parent_name = $7, fee_status = $8, paid_amount = $9, pending_amount = $10 
                 WHERE id = $11`,
                [student.name, student.rollNumber, student.class, student.email, student.contact, student.gender, student.parentName, student.feeStatus, student.paidAmount, student.pendingAmount, student.id]
            );

            // Sync invoice references
            await client.query(
                `UPDATE invoices 
                 SET student_name = $1, class = $2 
                 WHERE student_id = $3`,
                [student.name, student.class, student.id]
            );

            await client.query("COMMIT");
            res.json({ success: true, message: 'Student updated successfully.' });
        } else {
            // Create new
            const countRes = await client.query("SELECT COUNT(*) FROM students");
            const nextId = 'STU' + String(parseInt(countRes.rows[0].count) + 1).padStart(3, '0');
            
            // Random gradient & initials
            const gradients = [
                'linear-gradient(135deg, #FF6B6B, #FF8E53)',
                'linear-gradient(135deg, #4E65FF, #92EFFD)',
                'linear-gradient(135deg, #11998e, #38ef7d)',
                'linear-gradient(135deg, #FC466B, #3F5EFB)',
                'linear-gradient(135deg, #f857a6, #ff5858)',
                'linear-gradient(135deg, #00c6ff, #0072ff)'
            ];
            const bgGradient = gradients[Math.floor(Math.random() * gradients.length)];
            const initials = student.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

            await client.query(
                `INSERT INTO students (id, name, roll_number, class, email, contact, gender, parent_name, bg_gradient, initials, fee_status, paid_amount, pending_amount, attendance)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 100)`,
                [nextId, student.name, student.rollNumber, student.class, student.email, student.contact, student.gender, student.parentName, bgGradient, initials, student.feeStatus, student.paidAmount, student.pendingAmount]
            );

            // Automatically create corresponding initial invoice
            const invCount = await client.query("SELECT COUNT(*) FROM invoices");
            const nextInvId = 'INV-2026-' + String(parseInt(invCount.rows[0].count) + 1).padStart(3, '0');
            const totalAmt = student.feeStatus === 'Paid' ? student.paidAmount : (student.paidAmount + student.pendingAmount);
            const status = student.feeStatus === 'Paid' ? 'Paid' : (student.feeStatus === 'Unpaid' ? 'Unpaid' : 'Partially Paid');

            await client.query(
                `INSERT INTO invoices (id, student_id, student_name, class, amount, date, status, paid_amount)
                 VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, $6, $7)`,
                [nextInvId, nextId, student.name, student.class, totalAmt, status, student.paidAmount]
            );

            await client.query("COMMIT");
            res.json({ success: true, message: 'Student registered successfully.', id: nextId });
        }
    } catch (err) {
        await client.query("ROLLBACK");
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Delete student
app.delete('/api/students/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM students WHERE id = $1", [req.params.id]);
        res.json({ success: true, message: 'Student deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// 2. TEACHERS APIS

// Get all teachers
app.get('/api/teachers', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM teachers ORDER BY id ASC");
        const teachers = result.rows.map(row => ({
            id: row.id,
            name: row.name,
            department: row.department,
            subject: row.subject,
            classTeacher: row.class_teacher,
            email: row.email,
            contact: row.contact,
            bgGradient: row.bg_gradient,
            initials: row.initials
        }));
        res.json(teachers);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Save (Add or Update) teacher
app.post('/api/teachers', async (req, res) => {
    const t = req.body;
    try {
        if (t.id) {
            await pool.query(
                `UPDATE teachers 
                 SET name = $1, department = $2, subject = $3, class_teacher = $4, email = $5, contact = $6 
                 WHERE id = $7`,
                [t.name, t.department, t.subject, t.classTeacher || null, t.email, t.contact, t.id]
            );
            res.json({ success: true });
        } else {
            const countRes = await pool.query("SELECT COUNT(*) FROM teachers");
            const nextId = 'TCH' + String(parseInt(countRes.rows[0].count) + 1).padStart(3, '0');
            
            const gradients = [
                'linear-gradient(135deg, #7F00FF, #E100FF)',
                'linear-gradient(135deg, #F2C94C, #F2994A)',
                'linear-gradient(135deg, #36D1DC, #5B86E5)'
            ];
            const bgGradient = gradients[Math.floor(Math.random() * gradients.length)];
            const initials = t.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

            await pool.query(
                `INSERT INTO teachers (id, name, department, subject, class_teacher, email, contact, bg_gradient, initials)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
                [nextId, t.name, t.department, t.subject, t.classTeacher || null, t.email, t.contact, bgGradient, initials]
            );
            res.json({ success: true, id: nextId });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete teacher
app.delete('/api/teachers/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM teachers WHERE id = $1", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// 3. ATTENDANCE APIS

// Get class attendance for a specific date
app.get('/api/attendance', async (req, res) => {
    const { date, class: className } = req.query;
    try {
        const result = await pool.query(
            "SELECT student_id, status FROM attendance WHERE date = $1 AND class = $2",
            [date, className]
        );
        const records = {};
        result.rows.forEach(row => {
            records[row.student_id] = row.status;
        });
        res.json(records);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Save class attendance and recalculate student percentage
app.post('/api/attendance', async (req, res) => {
    const { date, class: className, records } = req.body;
    const client = await pool.connect();
    
    try {
        await client.query("BEGIN");
        
        for (const [studentId, status] of Object.entries(records)) {
            // Upsert attendance record
            await client.query(
                `INSERT INTO attendance (date, class, student_id, status)
                 VALUES ($1, $2, $3, $4)
                 ON CONFLICT (date, student_id) 
                 DO UPDATE SET status = EXCLUDED.status`,
                [date, className, studentId, status]
            );
            
            // Fetch student's attendance history to compute average percentage
            const history = await client.query(
                "SELECT status FROM attendance WHERE student_id = $1",
                [studentId]
            );
            
            const total = history.rowCount;
            if (total > 0) {
                // present = 1, late = 0.8, absent = 0
                let presentCount = 0;
                history.rows.forEach(r => {
                    if (r.status === 'present') presentCount += 1;
                    else if (r.status === 'late') presentCount += 0.8;
                });
                
                // Add baseline fake historical weights to avoid volatile percentage drops on first few days
                const baselinePresent = 18;
                const baselineTotal = 20;
                const attendancePct = Math.min(100, Math.round(((presentCount + baselinePresent) / (total + baselineTotal)) * 100));
                
                await client.query(
                    "UPDATE students SET attendance = $1 WHERE id = $2",
                    [attendancePct, studentId]
                );
            }
        }
        
        await client.query("COMMIT");
        res.json({ success: true, message: 'Attendance recorded and grades synced.' });
    } catch (err) {
        await client.query("ROLLBACK");
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});


// 4. BILLING / FEES APIS

// Get all invoices
app.get('/api/invoices', async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM invoices ORDER BY date DESC");
        const invoices = result.rows.map(row => ({
            id: row.id,
            studentId: row.student_id,
            studentName: row.student_name,
            class: row.class,
            amount: parseFloat(row.amount),
            date: row.date.toISOString().split('T')[0],
            status: row.status,
            paidAmount: parseFloat(row.paid_amount)
        }));
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Process an invoice payment
app.post('/api/invoices/:id/pay', async (req, res) => {
    const { amountPaid } = req.body;
    const invoiceId = req.params.id;
    const client = await pool.connect();
    
    try {
        await client.query("BEGIN");
        
        // Fetch invoice
        const invRes = await client.query("SELECT * FROM invoices WHERE id = $1", [invoiceId]);
        if (invRes.rowCount === 0) {
            throw new Error("Invoice not found.");
        }
        
        const inv = invRes.rows[0];
        const currentPaid = parseFloat(inv.paid_amount);
        const amount = parseFloat(inv.amount);
        
        let newPaid = currentPaid + parseFloat(amountPaid);
        let newStatus = 'Partially Paid';
        
        if (newPaid >= amount) {
            newPaid = amount;
            newStatus = 'Paid';
        }
        
        // Update Invoice
        await client.query(
            "UPDATE invoices SET status = $1, paid_amount = $2 WHERE id = $3",
            [newStatus, newPaid, invoiceId]
        );
        
        // Update Student
        const outstanding = amount - newPaid;
        const studentStatus = newStatus === 'Paid' ? 'Paid' : 'Pending';
        
        await client.query(
            `UPDATE students 
             SET paid_amount = $1, pending_amount = $2, fee_status = $3 
             WHERE id = $4`,
            [newPaid, outstanding, studentStatus, inv.student_id]
        );
        
        await client.query("COMMIT");
        res.json({ success: true, message: 'Payment processed and student records synced.' });
    } catch (err) {
        await client.query("ROLLBACK");
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});


// 5. WEEKLY TESTS APIS

// Get all weekly tests
app.get('/api/weekly-tests', async (req, res) => {
    const { class: className } = req.query;
    try {
        let query = "SELECT * FROM weekly_tests";
        const params = [];
        if (className) {
            query += " WHERE class = $1";
            params.push(className);
        }
        query += " ORDER BY date DESC";
        
        const testsRes = await pool.query(query, params);
        const tests = [];
        
        for (const row of testsRes.rows) {
            // Fetch scores for this test
            const scoresRes = await pool.query(
                "SELECT student_id, score FROM weekly_test_scores WHERE test_id = $1",
                [row.id]
            );
            
            const marks = {};
            scoresRes.rows.forEach(s => {
                marks[s.student_id] = parseFloat(s.score);
            });
            
            tests.push({
                id: row.id,
                testName: row.test_name,
                subject: row.subject,
                date: row.date.toISOString().split('T')[0],
                class: row.class,
                maxMarks: row.max_marks,
                marks: marks
            });
        }
        
        res.json(tests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Save weekly test
app.post('/api/weekly-tests', async (req, res) => {
    const test = req.body;
    const client = await pool.connect();
    
    try {
        await client.query("BEGIN");
        
        let testId = test.id;
        
        if (testId) {
            // Update metadata
            await client.query(
                `UPDATE weekly_tests 
                 SET test_name = $1, subject = $2, date = $3, max_marks = $4 
                 WHERE id = $5`,
                [test.testName, test.subject, test.date, test.maxMarks, testId]
            );
            
            // Delete old scores to prevent duplicates
            await client.query("DELETE FROM weekly_test_scores WHERE test_id = $1", [testId]);
        } else {
            // Create new
            const countRes = await client.query("SELECT COUNT(*) FROM weekly_tests");
            testId = 'TEST' + String(parseInt(countRes.rows[0].count) + 1).padStart(3, '0');
            
            await client.query(
                `INSERT INTO weekly_tests (id, test_name, subject, date, class, max_marks)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                [testId, test.testName, test.subject, test.date, test.class, test.maxMarks]
            );
        }
        
        // Insert student scores
        for (const [studentId, score] of Object.entries(test.marks || {})) {
            await client.query(
                `INSERT INTO weekly_test_scores (test_id, student_id, score)
                 VALUES ($1, $2, $3)`,
                [testId, studentId, score]
            );
        }
        
        await client.query("COMMIT");
        res.json({ success: true, id: testId });
    } catch (err) {
        await client.query("ROLLBACK");
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// Delete weekly test
app.delete('/api/weekly-tests/:id', async (req, res) => {
    try {
        await pool.query("DELETE FROM weekly_tests WHERE id = $1", [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Start backend server
app.listen(PORT, async () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    await initDatabase();
});
