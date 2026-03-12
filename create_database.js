const { Client } = require('pg');

// Connect to default "postgres" database to create a new one
const client = new Client({
    user: process.env.DB_USER || 'meshbi',
    password: process.env.DB_PASSWORD || 'meshbi_password',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'postgres', // Connect to default postgres database
    ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' ? { rejectUnauthorized: false } : false
});

async function createDatabase() {
    try {
        console.log('\n🔧 Creating database on Render...\n');
        
        await client.connect();
        console.log('✅ Connected to PostgreSQL server\n');
        
        // Create the database
        const dbName = process.env.DB_NAME || 'meshbi_school';
        console.log(`📌 Creating database: ${dbName}`);
        
        try {
            await client.query(`CREATE DATABASE "${dbName}"`);
            console.log(`✅ Database "${dbName}" created successfully!\n`);
        } catch (err) {
            if (err.code === '42P04') {
                console.log(`✅ Database "${dbName}" already exists\n`);
            } else {
                throw err;
            }
        }
        
        await client.end();
        console.log('✅ Done! Now run: npm run init-db\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating database:\n', error.message);
        process.exit(1);
    }
}

createDatabase();
