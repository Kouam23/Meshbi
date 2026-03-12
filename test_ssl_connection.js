const { Pool } = require('pg');

// Test connection to Render PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER || 'meshbi',
    password: process.env.DB_PASSWORD || 'meshbi_password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'meshbi_school',
    // Enable SSL for Render
    ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false
});

async function testConnection() {
    try {
        console.log('\n🔐 Testing SSL Connection to Render PostgreSQL...\n');
        
        const result = await pool.query('SELECT NOW() as current_time, version() as version');
        
        console.log('✅ CONNECTION SUCCESSFUL!\n');
        console.log('Database Details:');
        console.log(`   Host: ${process.env.DB_HOST}`);
        console.log(`   Database: ${process.env.DB_NAME}`);
        console.log(`   User: ${process.env.DB_USER}`);
        console.log(`   Current Time: ${result.rows[0].current_time}`);
        console.log(`   PostgreSQL Version: ${result.rows[0].version.split(',')[0]}\n`);
        
        await pool.end();
        process.exit(0);
    } catch (error) {
        console.log('❌ CONNECTION FAILED:\n');
        console.log(`Error: ${error.message}\n`);
        if (error.code) console.log(`Code: ${error.code}`);
        process.exit(1);
    }
}

testConnection();
