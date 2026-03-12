const { Pool } = require('pg');
const bcrypt = require('bcrypt');

// PostgreSQL connection pool
const db = new Pool({
    user: process.env.DB_USER || 'meshbi',
    password: process.env.DB_PASSWORD || 'meshbi_password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'meshbi_school_rdlm',
    // Enable SSL for remote connections (Render), disable for localhost
    ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false
});

async function seed() {
    console.log('Seeding database...');

    // Helper to run query as promise
    const get = (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    };

    const run = (sql, params = []) => {
        return new Promise((resolve, reject) => {
            db.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve(this);
            });
        });
    };

    try {
        // Create Admin
        const adminEmail = 'admin@meshbi.com';
        const adminPass = 'admin123';
        const hashedPassword = await bcrypt.hash(adminPass, 10);

        const checkAdmin = await get("SELECT * FROM users WHERE email = ?", [adminEmail]);
        if (!checkAdmin) {
            await run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", ['System Admin', adminEmail, hashedPassword, 'admin']);
            console.log(`Admin created: ${adminEmail} / ${adminPass}`);
        } else {
            console.log('Admin already exists.');
        }

        // Create Teacher (Demo)
        const teacherEmail = 'teacher@meshbi.com';
        const teacherPass = 'teacher123';
        const hashedTeacherPass = await bcrypt.hash(teacherPass, 10);

        const checkTeacher = await get("SELECT * FROM users WHERE email = ?", [teacherEmail]);
        if (!checkTeacher) {
            await run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", ['John Doe (Prof)', teacherEmail, hashedTeacherPass, 'teacher']);
            console.log(`Teacher created: ${teacherEmail} / ${teacherPass}`);
        }

        // Create Secretary (Demo)
        const secEmail = 'secretary@meshbi.com';
        const secPass = 'secretary123';
        const hashedSecPass = await bcrypt.hash(secPass, 10);

        const checkSec = await get("SELECT * FROM users WHERE email = ?", [secEmail]);
        if (!checkSec) {
            await run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", ['Jane Smith (Sec)', secEmail, hashedSecPass, 'secretary']);
            console.log(`Secretary created: ${secEmail} / ${secPass}`);
        }

        console.log('Seeding complete.');

        // Close DB connection after seeding (optional, but good practice for scripts)
        // db.close(); // db is imported from ../database, might be shared. But for script it's fine.

    } catch (err) {
        console.error('Error seeding database:', err);
    }
}

seed();
