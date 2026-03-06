# PostgreSQL Migration Guide

## Overview
The Meshbi school management system has been migrated from SQLite to PostgreSQL to support cloud hosting platforms with ephemeral file systems.

## Setup Instructions

### 1. Prerequisites
- PostgreSQL 12+ installed
- Node.js 14+ installed
- npm or yarn package manager

### 2. PostgreSQL Installation & Setup

#### On Windows (using PostgreSQL installer):
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Run the installer and follow the setup wizard
3. Note the superuser password you set for the `postgres` user
4. PostgreSQL will run on port 5432 by default

#### On macOS (using Homebrew):
```bash
brew install postgresql
brew services start postgresql
```

#### On Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 3. Create Database & User

Open PostgreSQL command line (psql) as superuser:

```bash
psql -U postgres
```

Then execute these commands:

```sql
-- Create the database
CREATE DATABASE meshbi_school;

-- Create a dedicated user for the application
CREATE USER meshbi WITH PASSWORD 'meshbi_password';

-- Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE meshbi_school TO meshbi;

-- Connect to the database and grant schema privileges
\c meshbi_school
GRANT ALL PRIVILEGES ON SCHEMA public TO meshbi;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO meshbi;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO meshbi;

-- Exit psql
\q
```

**Note:** Change the password `'meshbi_password'` to a secure password in production.

### 4. Environment Variables

Create a `.env` file in the project root:

```
DB_USER=meshbi
DB_PASSWORD=meshbi_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=meshbi_school
NODE_ENV=development
PORT=3000
```

Or set environment variables directly:

```bash
# Windows (PowerShell)
$env:DB_USER="meshbi"
$env:DB_PASSWORD="meshbi_password"
$env:DB_HOST="localhost"
$env:DB_PORT="5432"
$env:DB_NAME="meshbi_school"

# Linux/macOS (Bash)
export DB_USER=meshbi
export DB_PASSWORD=meshbi_password
export DB_HOST=localhost
export DB_PORT=5432
export DB_NAME=meshbi_school
```

### 5. Initialize the Database Schema

```bash
npm run init-db
```

This will create all the necessary tables and indexes.

### 6. Start the Application

```bash
npm start
```

The application will now use PostgreSQL instead of SQLite.

## Database Schema

The migration maintains the same database structure with these tables:

- **users** - Application users (admin, teacher, secretary)
- **students** - Student records with contact and parent information
- **subjects** - Subject/course definitions with coefficients
- **grades** - Student grades by subject, semester, and sequence
- **payments** - Payment records for students
- **audit_logs** - Complete audit trail of all user actions
- **session** - Express session storage (auto-created by connect-pg-simple)

## Key Changes from SQLite

### 1. Parameterized Queries
- SQLite: `db.get('SELECT * FROM users WHERE email = ?', [email])`
- PostgreSQL: `db.query('SELECT * FROM users WHERE email = $1', [email])`

### 2. Query Results
- SQLite uses callbacks: `db.all(sql, [], (err, rows) => {})`
- PostgreSQL uses promises: `const result = await db.query(sql); const rows = result.rows;`

### 3. Data Types
- SQLite's `INTEGER PRIMARY KEY AUTOINCREMENT` → PostgreSQL's `SERIAL PRIMARY KEY`
- SQLite's `REAL` → PostgreSQL's `DECIMAL(10,2)` for currency
- SQLite's `DATETIME` → PostgreSQL's `TIMESTAMP`
- SQLite's `TEXT CHECK(...)` → PostgreSQL's `VARCHAR(50) CHECK(...)`

### 4. Session Storage
- SQLite used `connect-sqlite3` to store sessions in a file
- PostgreSQL uses `connect-pg-simple` which creates a `session` table automatically

## Cloud Deployment

When deploying to cloud platforms:

1. **Heroku Example:**
   ```bash
   heroku create your-app-name
   heroku addons:create heroku-postgresql:standard-0 --app=your-app-name
   heroku config:set NODE_ENV=production
   git push heroku main
   ```

2. **AWS RDS Example:**
   - Create PostgreSQL RDS instance
   - Set environment variables to RDS endpoint, username, password
   - Run `npm run init-db` to initialize schema

3. **Railway, Render, or DigitalOcean:**
   - Create PostgreSQL database through their dashboards
   - Set environment variables provided by their platforms
   - Run `npm run init-db`

## Troubleshooting

### Connection Error: "ECONNREFUSED"
- Ensure PostgreSQL is running: `sudo systemctl status postgresql` (Linux) or check Services (Windows)
- Verify credentials in `.env` file
- Test connection: `psql -U meshbi -d meshbi_school -h localhost`

### Permission Errors
- Ensure the `meshbi` user has all necessary privileges (see step 3)
- Re-run privilege grants if needed

### Tables Not Found
- Run `npm run init-db` to create tables
- Check that you're connected to `meshbi_school` database, not `postgres`

### Session Table Not Found
- Delete old session data: `DROP TABLE IF EXISTS session;`
- The table will be auto-created on first request with `connect-pg-simple`

## Migration from SQLite (if upgrading from old version)

To migrate existing data from SQLite:

1. Export data from SQLite as CSV
2. Import CSV data into PostgreSQL tables
3. Update sequence counters: 
   ```sql
   SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
   SELECT setval('students_id_seq', (SELECT MAX(id) FROM students));
   -- ... repeat for all tables with id column
   ```

