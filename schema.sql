-- PostgreSQL Database Schema for SMS Portal

-- 1. Students Table
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    roll_number VARCHAR(50) NOT NULL,
    class VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    contact VARCHAR(50) NOT NULL,
    gender VARCHAR(20) NOT NULL,
    parent_name VARCHAR(100) NOT NULL,
    bg_gradient VARCHAR(255) NOT NULL,
    initials VARCHAR(10) NOT NULL,
    fee_status VARCHAR(20) NOT NULL DEFAULT 'Unpaid',
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    pending_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    attendance INTEGER NOT NULL DEFAULT 100
);

-- 2. Teachers Table
CREATE TABLE IF NOT EXISTS teachers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    class_teacher VARCHAR(50),
    email VARCHAR(100) NOT NULL,
    contact VARCHAR(50) NOT NULL,
    bg_gradient VARCHAR(255) NOT NULL,
    initials VARCHAR(10) NOT NULL
);

-- 3. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    student_name VARCHAR(100) NOT NULL,
    class VARCHAR(50) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    date DATE NOT NULL,
    status VARCHAR(20) NOT NULL,
    paid_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00
);

-- 4. Attendance Table (Saves daily records per student)
CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    class VARCHAR(50) NOT NULL,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late')),
    CONSTRAINT unique_date_student UNIQUE (date, student_id)
);

-- 5. Weekly Tests Table
CREATE TABLE IF NOT EXISTS weekly_tests (
    id VARCHAR(50) PRIMARY KEY,
    test_name VARCHAR(100) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    class VARCHAR(50) NOT NULL,
    max_marks INTEGER NOT NULL DEFAULT 50
);

-- 6. Weekly Test Scores Table (Scores obtained by students in tests)
CREATE TABLE IF NOT EXISTS weekly_test_scores (
    id SERIAL PRIMARY KEY,
    test_id VARCHAR(50) NOT NULL REFERENCES weekly_tests(id) ON DELETE CASCADE,
    student_id VARCHAR(50) NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) NOT NULL,
    CONSTRAINT unique_test_student UNIQUE (test_id, student_id)
);
