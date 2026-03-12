const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
    user: process.env.DB_USER || 'meshbi',
    password: process.env.DB_PASSWORD || 'meshbi_password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'meshbi_school',
    // Enable SSL for remote connections (Render), disable for localhost
    ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
    console.log('Connected to the PostgreSQL database.');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle client', err);
    process.exit(-1);
});

module.exports = pool;
