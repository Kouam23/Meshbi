# PostgreSQL Migration - Quick Start Guide

## You're Almost There! 🎯

The code migration from SQLite to PostgreSQL is **100% complete**. Now you just need to set up PostgreSQL and test the application.

---

## Step 1: Install & Start PostgreSQL

### Windows
1. Download from https://www.postgresql.org/download/windows/
2. Run installer, note the password you set for `postgres` user
3. PostgreSQL will automatically start

### macOS
```bash
brew install postgresql
brew services start postgresql
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

---

## Step 2: Create Database & User

Open PostgreSQL terminal (psql):
```bash
psql -U postgres
```

Run these commands:
```sql
CREATE DATABASE meshbi_school;
CREATE USER meshbi WITH PASSWORD 'meshbi_password';
GRANT ALL PRIVILEGES ON DATABASE meshbi_school TO meshbi;
\c meshbi_school
GRANT ALL PRIVILEGES ON SCHEMA public TO meshbi;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO meshbi;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO meshbi;
\q
```

---

## Step 3: Configure Environment

Create `.env` file in project root:
```
DB_USER=meshbi
DB_PASSWORD=meshbi_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=meshbi_school
NODE_ENV=development
PORT=3000
```

---

## Step 4: Initialize Database Schema

```bash
npm run init-db
```

Expected output:
```
Initializing PostgreSQL database...
Database initialized successfully.
```

---

## Step 5: Start the Application

```bash
npm start
```

Expected output:
```
Server running on http://localhost:3000
Connected to the PostgreSQL database.
```

---

## Step 6: Test It!

1. Open http://localhost:3000 in your browser
2. You should see the login page
3. Try logging in with your test credentials

---

## What Changed?

| Aspect | Before | After |
|--------|--------|-------|
| Database | SQLite (.db file) | PostgreSQL (server) |
| Connection | File-based | Connection pooling |
| Query Syntax | `db.all(..., callback)` | `await db.query(...)` |
| Parameters | `?` placeholders | `$1, $2` placeholders |
| Sessions | `sessions.db` file | PostgreSQL `session` table |
| Cloud Ready | ❌ Data lost on restart | ✅ Persistent in cloud |

---

## Troubleshooting

### Error: "ECONNREFUSED"
- PostgreSQL is not running
- Check: `pg_isready` command or check PostgreSQL service

### Error: "password authentication failed"
- Wrong credentials in `.env`
- Verify user exists: `psql -U meshbi -d meshbi_school`

### Error: "database does not exist"
- Forgot to create database
- Run: `createdb -U meshbi meshbi_school`

### Error: "relation does not exist"
- Tables not created yet
- Run: `npm run init-db`

---

## Files to Know

- **`.env`** - Your configuration (create this, don't commit)
- **`.env.example`** - Template for .env
- **`POSTGRESQL_SETUP.md`** - Detailed setup guide
- **`MIGRATION_SUMMARY.md`** - What changed and why
- **`CHANGELOG_POSTGRESQL.md`** - Complete change list

---

## Next Steps

After testing locally:

1. **Cloud Deployment:**
   - See `POSTGRESQL_SETUP.md` Cloud Deployment section
   - Heroku, AWS RDS, Railway, Render all supported

2. **Production Hardening:**
   - Change default passwords
   - Enable SSL connections
   - Set up automated backups
   - Use managed database services

3. **Data Migration (if you have existing SQLite data):**
   - Export from old `school.db` as CSV
   - Import CSVs into PostgreSQL tables
   - Verify data integrity

---

## Need Help?

All routes have been updated and tested for syntax:
- ✅ Authentication
- ✅ Student management  
- ✅ Payments
- ✅ Grades
- ✅ Reports
- ✅ Audit logs
- ✅ User management

If you encounter issues, check `POSTGRESQL_SETUP.md` first.

---

**You've got this! 🚀**
