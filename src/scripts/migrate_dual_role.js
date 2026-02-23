/**
 * Migration: Add secondary_role to users and merge dual-role accounts
 */
const db = require('../database');

const run = (sql, params = []) => new Promise((resolve, reject) =>
    db.run(sql, params, function (err) { err ? reject(err) : resolve(this); }));

const get = (sql, params = []) => new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => err ? reject(err) : resolve(row)));

async function migrate() {
    console.log('Running dual-role migration...\n');

    // 1. Add secondary_role column (safe if already exists via try/catch)
    try {
        await run(`ALTER TABLE users ADD COLUMN secondary_role TEXT DEFAULT NULL`);
        console.log('✅ Added secondary_role column');
    } catch (e) {
        console.log('ℹ️  secondary_role column already exists');
    }

    // 2. Loic: set secondary_role on admin account, delete the separate teacher account
    const loicAdmin = await get(`SELECT id FROM users WHERE email = 'loic.admin@meshbi.com'`);
    if (loicAdmin) {
        await run(`UPDATE users SET secondary_role = 'teacher', name = 'Loic' WHERE email = 'loic.admin@meshbi.com'`);
        await run(`DELETE FROM users WHERE email = 'loic.teacher@meshbi.com'`);
        console.log('✅ Merged Loic → admin + teacher on loic.admin@meshbi.com');
    } else {
        console.log('⚠️  loic.admin@meshbi.com not found - skipping Loic merge');
    }

    // 3. Diane: set secondary_role on secretary account, delete the separate teacher account
    const dianeSec = await get(`SELECT id FROM users WHERE email = 'diane.secretary@meshbi.com'`);
    if (dianeSec) {
        await run(`UPDATE users SET secondary_role = 'teacher', name = 'Diane' WHERE email = 'diane.secretary@meshbi.com'`);
        await run(`DELETE FROM users WHERE email = 'diane.teacher@meshbi.com'`);
        console.log('✅ Merged Diane → secretary + teacher on diane.secretary@meshbi.com');
    } else {
        console.log('⚠️  diane.secretary@meshbi.com not found - skipping Diane merge');
    }

    // 4. Show final user list
    console.log('\nFinal user list:');
    await new Promise((resolve) =>
        db.all(`SELECT name, email, role, secondary_role FROM users ORDER BY role, name`, [], (err, rows) => {
            rows.forEach(r => {
                const dualTag = r.secondary_role ? ` + ${r.secondary_role}` : '';
                console.log(`  [${(r.role + dualTag).padEnd(20)}] ${r.name.padEnd(10)} ${r.email}`);
            });
            resolve();
        })
    );

    console.log('\nMigration complete!');
    db.close();
}

migrate().catch(err => { console.error(err); process.exit(1); });
