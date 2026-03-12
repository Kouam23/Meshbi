# ✅ Health Check Testing Guide

Your Meshbi app now has 4 health check endpoints to verify each component works.

## Test Locally (http://localhost:3000)

### 1. Frontend Health Check
**URL:** http://localhost:3000/health/frontend  
**Expected:** Green page saying "✅ Frontend is Working"  
**Tests:** EJS templates and static assets are working

### 2. Database Health Check (HTML Page)
**URL:** http://localhost:3000/health/database-page  
**Expected:** Green page saying "✅ This is the Database and it works perfectly!"  
**Tests:** PostgreSQL connection and real database query

### 3. Backend Health (JSON API)
**URL:** http://localhost:3000/api/health/backend  
**Expected:** JSON response with status, uptime, environment
```json
{
  "status": "healthy",
  "message": "Backend is running",
  "timestamp": "2026-03-11T10:30:00.000Z",
  "uptime": 125.4,
  "environment": "development",
  "port": 3000
}
```

### 4. Database Health (JSON API)
**URL:** http://localhost:3000/api/health/database  
**Expected:** JSON response with database version and current time
```json
{
  "status": "healthy",
  "message": "Database connection successful",
  "timestamp": "2026-03-11T10:30:00.000Z",
  "database_time": "2026-03-11T10:30:00.123456+00:00",
  "postgres_version": "PostgreSQL 15.2 (Debian 15.2-1.pgdg120+1) on x86_64-pc-linux-gnu..."
}
```

## Test After Deploying to Render

Replace `http://localhost:3000` with `https://meshbi-app.onrender.com`

### Quick Test Sequence:
1. ✅ Check Frontend: `https://meshbi-app.onrender.com/health/frontend`
2. ✅ Check Backend: `https://meshbi-app.onrender.com/api/health/backend`
3. ✅ Check Database: `https://meshbi-app.onrender.com/health/database-page`
4. ✅ Login & Use App: `https://meshbi-app.onrender.com/login`

## Full Application Test

After all 3 components show healthy:

```
1. Go to https://meshbi-app.onrender.com/login
2. Log in with:
   - Email: loic.admin@meshbi.com
   - Password: Loic@Admin2026
3. Create a new student
4. Add a subject and assign a teacher
5. Enter student grades
6. Record a payment
7. View reports
```

If everything works → **Your entire app is production-ready! 🎉**

## What Each Health Check Verifies

| Component | Check | Verifies |
|-----------|-------|----------|
| **Frontend** | `/health/frontend` | EJS templating, static files (CSS, JS, images) |
| **Backend** | `/api/health/backend` | Node.js server running, uptime tracking |
| **Database** | `/api/health/database` (JSON) | PostgreSQL connectivity, query execution |
| **Database** | `/health/database-page` (HTML) | Database is operational and accessible |

---

## Troubleshooting with Health Checks

### If Frontend fails:
- ❌ `/health/frontend` gives error
- → Check that `/public` and `/views` folders exist and are committed to Git

### If Backend fails:
- ❌ `/api/health/backend` gives error or timeout
- → Check server logs: `npm start` in terminal
- → Verify `NODE_ENV` and `PORT` in `.env`

### If Database fails:
- ❌ `/api/health/database` fails
- → Check database credentials in `.env` (locally) or environment variables (Render)
- → Verify PostgreSQL is running
- → Check `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

### If login fails after all health checks pass:
- ❌ Can log in to `/login` but credentials don't work
- → Run: `node src/scripts/seed_users.js` (with correct database connection)
- → Verify users table exists: `npm run init-db` (if fresh database)
