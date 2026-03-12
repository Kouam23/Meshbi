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

const users = [
    { name: 'Loic', email: 'loic.admin@meshbi.com', password: 'Loic@Admin2026', role: 'admin', secondary_role: 'teacher' },
    { name: 'Diane', email: 'diane.secretary@meshbi.com', password: 'Diane@Sec2026', role: 'secretary', secondary_role: 'teacher' },
    { name: 'Abena', email: 'abena@meshbi.com', password: 'Abena@Teacher2026', role: 'teacher' },
    { name: 'Assiga', email: 'assiga@meshbi.com', password: 'Assiga@Teacher2026', role: 'teacher' },
    { name: 'Um', email: 'um@meshbi.com', password: 'Um@Teacher2026', role: 'teacher' },
    { name: 'Esther', email: 'esther@meshbi.com', password: 'Esther@Teacher2026', role: 'teacher' }
];

const get = async (sql, params) => {
    const result = await db.query(sql, params);
    return result.rows[0];
};

const run = async (sql, params) => {
    await db.query(sql, params);
};

async function seedUsers() {
    console.log('Seeding real users...\n');

    for (const u of users) {
        const existing = await get('SELECT id FROM users WHERE email = $1', [u.email]);
        if (existing) {
            console.log(`⏭  Skipped (already exists): ${u.email}`);
            continue;
        }
        const hashed = await bcrypt.hash(u.password, 10);
        // include secondary_role if present
        const columns = ['name','email','password','role'];
        const values = [u.name, u.email, hashed, u.role];
        if (u.secondary_role) {
            columns.push('secondary_role');
            values.push(u.secondary_role);
        }
        const placeholder = values.map((_, i) => `$${i+1}`).join(', ');
        await run(`INSERT INTO users (${columns.join(',')}) VALUES (${placeholder})`,
            values);
        console.log(`✅ Created [${u.role.padEnd(9)}] ${u.name.padEnd(8)} → ${u.email}  |  pwd: ${u.password}`);
    }

    console.log('\nDone!');
    db.end();
}

seedUsers().catch(err => { console.error(err); process.exit(1); });
