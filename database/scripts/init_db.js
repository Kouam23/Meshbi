const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER || 'meshbi',
    password: process.env.DB_PASSWORD || 'meshbi_password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'meshbi_school_rdlm',
    // Enable SSL for remote connections (Render), disable for localhost
    ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false
});

const schema = `
-- Drop existing tables (in order to recreate with new schema)
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) CHECK (role IN ('admin', 'teacher', 'secretary')) NOT NULL,
    secondary_role VARCHAR(50) CHECK (secondary_role IN ('admin', 'teacher', 'secretary')) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Students table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    matricule VARCHAR(255) UNIQUE NOT NULL,
    level VARCHAR(50) NOT NULL,
    dob DATE,
    pob VARCHAR(255),
    gender VARCHAR(10),
    parent_name VARCHAR(255),
    parent_phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subjects table
CREATE TABLE IF NOT EXISTS subjects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    coefficient INTEGER DEFAULT 1 NOT NULL,
    level VARCHAR(50) NOT NULL,
    teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Grades table
CREATE TABLE IF NOT EXISTS grades (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    semester INTEGER CHECK (semester IN (1, 2, 3)) NOT NULL,
    sequence INTEGER CHECK (sequence IN (1, 2)) NOT NULL,
    grade DECIMAL(5, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, subject_id, semester, sequence)
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payment_type VARCHAR(50) CHECK (payment_type IN ('Pension', 'Registration', 'Other')) NOT NULL,
    comments TEXT,
    recorded_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INTEGER,
    entity_name VARCHAR(255),
    details TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Session table for express-session with connect-pg-simple
DROP TABLE IF EXISTS session CASCADE;
CREATE TABLE IF NOT EXISTS session (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_expire ON session (expire);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_grades_student ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_subject ON grades(subject_id);
CREATE INDEX IF NOT EXISTS idx_subjects_teacher ON subjects(teacher_id);
`;

console.log('Initializing PostgreSQL database...');

(async () => {
    try {
        await pool.query(schema);
        console.log('Database initialized successfully.');
        await pool.end();
    } catch (err) {
        console.error('Error initializing database:', err);
        process.exit(1);
    }
})();
