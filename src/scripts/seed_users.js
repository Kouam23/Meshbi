const db = require('../database');
const bcrypt = require('bcrypt');

const users = [
    { name: 'Loic', email: 'loic.admin@meshbi.com', password: 'Loic@Admin2026', role: 'admin' },
    { name: 'Loic', email: 'loic.teacher@meshbi.com', password: 'Loic@Teacher2026', role: 'teacher' },
    { name: 'Diane', email: 'diane.secretary@meshbi.com', password: 'Diane@Sec2026', role: 'secretary' },
    { name: 'Diane', email: 'diane.teacher@meshbi.com', password: 'Diane@Teacher2026', role: 'teacher' },
    { name: 'Abena', email: 'abena@meshbi.com', password: 'Abena@Teacher2026', role: 'teacher' },
    { name: 'Assiga', email: 'assiga@meshbi.com', password: 'Assiga@Teacher2026', role: 'teacher' },
    { name: 'Um', email: 'um@meshbi.com', password: 'Um@Teacher2026', role: 'teacher' },
    { name: 'Esther', email: 'esther@meshbi.com', password: 'Esther@Teacher2026', role: 'teacher' },
];

const get = (sql, params) => new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row)));

const run = (sql, params) => new Promise((resolve, reject) =>
    db.run(sql, params, function (err) { err ? reject(err) : resolve(this); }));

async function seedUsers() {
    console.log('Seeding real users...\n');

    for (const u of users) {
        const existing = await get('SELECT id FROM users WHERE email = ?', [u.email]);
        if (existing) {
            console.log(`⏭  Skipped (already exists): ${u.email}`);
            continue;
        }
        const hashed = await bcrypt.hash(u.password, 10);
        await run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            [u.name, u.email, hashed, u.role]);
        console.log(`✅ Created [${u.role.padEnd(9)}] ${u.name.padEnd(8)} → ${u.email}  |  pwd: ${u.password}`);
    }

    console.log('\nDone!');
    db.close();
}

seedUsers().catch(err => { console.error(err); process.exit(1); });
