const { Pool } = require('pg');

// PostgreSQL connection
const pool = new Pool({
    user: process.env.DB_USER || 'meshbi',
    password: process.env.DB_PASSWORD || 'meshbi_password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'meshbi_school'
});

async function checkDatabase() {
    try {
        console.log('\n╔═══════════════════════════════════════════════════════════╗');
        console.log('║           🔍 DATABASE INTEGRITY CHECK                    ║');
        console.log('╚═══════════════════════════════════════════════════════════╝\n');

        // Check connection
        console.log('1️⃣  Testing Database Connection...');
        const connTest = await pool.query('SELECT NOW()');
        console.log('   ✅ Connected Successfully\n');

        // Check tables exist
        console.log('2️⃣  Checking Tables...');
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name
        `);
        console.log(`   ✅ Found ${tables.rows.length} tables\n`);
        tables.rows.forEach(t => console.log(`      - ${t.table_name}`));

        // Count records in each table
        console.log('\n3️⃣  Counting Records in Each Table...\n');

        const users = await pool.query('SELECT COUNT(*) as count FROM users');
        console.log(`  👥 Users: ${users.rows[0].count} records`);

        const students = await pool.query('SELECT COUNT(*) as count FROM students');
        console.log(`  🎓 Students: ${students.rows[0].count} records`);

        const teachers = await pool.query('SELECT COUNT(*) as count FROM users WHERE role = \'teacher\'');
        console.log(`  👨‍🏫 Teachers: ${teachers.rows[0].count} records`);

        const subjects = await pool.query('SELECT COUNT(*) as count FROM subjects');
        console.log(`  📚 Subjects: ${subjects.rows[0].count} records`);

        const grades = await pool.query('SELECT COUNT(*) as count FROM grades');
        console.log(`  ⭐ Grades: ${grades.rows[0].count} records`);

        const payments = await pool.query('SELECT COUNT(*) as count FROM payments');
        console.log(`  💳 Payments: ${payments.rows[0].count} records`);

        const auditLogs = await pool.query('SELECT COUNT(*) as count FROM audit_logs');
        console.log(`  📋 Audit Logs: ${auditLogs.rows[0].count} records\n`);

        // Show sample of students
        if (students.rows[0].count > 0) {
            console.log('4️⃣  Sample Student Records:\n');
            const sampleStudents = await pool.query('SELECT id, name, level FROM students LIMIT 5');
            sampleStudents.rows.forEach(s => {
                console.log(`      ID: ${s.id}, Name: ${s.name}, Level: ${s.level}`);
            });
        } else {
            console.log('4️⃣  ⚠️  No student records found!\n');
        }

        // Show test users
        console.log('\n5️⃣  Test User Accounts:\n');
        const testUsers = await pool.query('SELECT id, name, email, role, secondary_role FROM users ORDER BY id');
        testUsers.rows.forEach(u => {
            console.log(`      ${u.name} (${u.email})`);
            console.log(`      Role: ${u.role} | Secondary: ${u.secondary_role || 'None'}`);
        });

        console.log('\n╔═══════════════════════════════════════════════════════════╗');
        console.log('║                    ✅ CHECK COMPLETE                      ║');
        console.log('╚═══════════════════════════════════════════════════════════╝\n');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ DATABASE ERROR:\n', error.message);
        process.exit(1);
    }
}

checkDatabase();
