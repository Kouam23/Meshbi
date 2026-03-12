# 🚀 Meshbi School System - Deployment Guide

## Project Architecture

```
MESHBI (Full Stack Application)
│
├── FRONTEND (EJS Templates + Static Assets)
│   ├── views/              ← HTML/EJS templates
│   └── public/             ← CSS, images, JavaScript
│
├── BACKEND (Express.js + Node.js)
│   ├── app.js              ← Main server
│   ├── src/                ← Routes, middleware, utilities
│   ├── package.json        ← Dependencies
│   └── .env                ← Configuration (DO NOT COMMIT)
│
└── DATABASE (PostgreSQL)
    ├── Connection Pool     ← /src/database.js
    ├── Schema             ← /src/scripts/init_db.js
    └── Seeds              ← /src/scripts/seed_users.js
```

---

## 📋 Testing Each Component Locally

After making changes, test each part independently:

### 1️⃣ Database Health Check
```bash
curl http://localhost:3000/api/health/database
```
Returns JSON with database status and current time.

### 2️⃣ Backend Health Check
```bash
curl http://localhost:3000/api/health/backend
```
Returns JSON with backend status, uptime, and environment.

### 3️⃣ Frontend Health Check (HTML Page)
```bash
curl http://localhost:3000/health/frontend
```
Opens in browser: `http://localhost:3000/health/frontend`

### 4️⃣ Database Verification Page (HTML)
```bash
curl http://localhost:3000/health/database-page
```
Opens in browser: `http://localhost:3000/health/database-page`
Returns message: **"✅ This is the Database and it works perfectly!"**

---

## 🐳 Local Development with Docker

### Option 1: Docker Compose (Recommended)
```bash
# Start everything (PostgreSQL + Backend)
docker-compose up -d

# Check logs
docker-compose logs -f backend

# Stop everything
docker-compose down
```

### Option 2: PostgreSQL Locally (No Docker)
```bash
# Make sure PostgreSQL is running on localhost:5432
# Then start the app
npm start
```

**Answer:** It doesn't matter if PostgreSQL runs in Docker or locally. What matters:
- ✅ Database is accessible at `DB_HOST:DB_PORT`
- ✅ Credentials are correct
- ✅ Network connectivity exists

---

## 🌐 Deployment on Render

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Add health checks and Docker support"
git push origin main
```

### Step 2: Create PostgreSQL Database on Render
1. Go to [render.com](https://render.com)
2. Click **"+" → "PostgreSQL Database"**
3. Set:
   - **Name**: `meshbi-db`
   - **Database**: `meshbi_school`
   - **User**: `meshbi`
   - **Region**: Same as your Web Service
4. Copy the connection string (you'll use it next)

### Step 3: Create Web Service on Render
1. Click **"+" → "Web Service"**
2. Select your **GitHub Meshbi repository**
3. Set:
   - **Name**: `meshbi-app`
   - **Region**: Same as database
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### Step 4: Add Environment Variables
In your Web Service → **Environment** tab, add:

| Key | Value | Source |
|-----|-------|--------|
| `NODE_ENV` | `production` | - |
| `DB_HOST` | Extract from Render connection string | Render PostgreSQL |
| `DB_PORT` | `5432` | Render PostgreSQL |
| `DB_NAME` | `meshbi_school` | Render PostgreSQL |
| `DB_USER` | `meshbi` | Render PostgreSQL |
| `DB_PASSWORD` | Extract from connection string | Render PostgreSQL |

**Example Connection String:**
```
postgres://meshbi:abc123xyz@dpg-xyz.render.com:5432/meshbi_school
```

**Maps to:**
- `DB_HOST` = `dpg-xyz.render.com`
- `DB_USER` = `meshbi`
- `DB_PASSWORD` = `abc123xyz`
- `DB_PORT` = `5432`
- `DB_NAME` = `meshbi_school`

### Step 5: Initialize Remote Database
Run from your local machine (keep `.env` pointing to localhost):

```powershell
# Set environment variables temporarily (PowerShell)
$env:DB_HOST="dpg-xyz.render.com"
$env:DB_USER="meshbi"
$env:DB_PASSWORD="abc123xyz"
$env:DB_PORT="5432"
$env:DB_NAME="meshbi_school"

# Initialize schema
npm run init-db

# Seed users
node src/scripts/seed_users.js
```

### Step 6: Test Deployed Application

Your app is live at: `https://meshbi-app.onrender.com`

#### Test Frontend:
- Visit: `https://meshbi-app.onrender.com/health/frontend`
- Should show: **"✅ Frontend is Working"**

#### Test Backend:
- Visit: `https://meshbi-app.onrender.com/api/health/backend`
- Should return JSON with status and uptime

#### Test Database:
- Visit: `https://meshbi-app.onrender.com/health/database-page`
- Should show: **"✅ This is the Database and it works perfectly!"**

#### Test Full App:
- Visit: `https://meshbi-app.onrender.com/login`
- Log in with: `loic.admin@meshbi.com` / `Loic@Admin2026`
- Access dashboards, add students, grades, payments

---

## 🔧 Environment Variables Mapping

| Component | Variable | Local Value | Render Value | Purpose |
|-----------|----------|-------------|--------------|---------|
| Backend | `PORT` | `3000` | Auto-assigned | Server port |
| Backend | `NODE_ENV` | `development` | `production` | Runtime environment |
| Database | `DB_HOST` | `localhost` | `render.com` | Database server address |
| Database | `DB_PORT` | `5432` | `5432` | Database port |
| Database | `DB_NAME` | `meshbi_school` | `meshbi_school` | Database name |
| Database | `DB_USER` | `meshbi` | `meshbi` | Database user |
| Database | `DB_PASSWORD` | `meshbi_password` | `[from Render]` | Database password |

---

## ❓ Database FAQ

### Q: Does it matter if PostgreSQL runs in Docker or locally?
**A:** ✅ **No.** Docker or local doesn't matter. What matters:
- Database is accessible (has network connectivity)
- Credentials are correct
- Connection string points to right host

### Q: Will Docker hinder deployment to Render?
**A:** ✅ **No.** Render handles containerization automatically. You can:
- Use Docker locally for development
- Deploy to Render without Docker (Render builds from your code)

### Q: Can I use Render's PostgreSQL + Docker locally?
**A:** ✅ **Yes.** Update `docker-compose.yml` to point to Render's database:
```yaml
backend:
  environment:
    DB_HOST: dpg-xyz.render.com
    DB_PASSWORD: [your-render-password]
```

---

## 📊 Health Check Endpoints Summary

| Endpoint | Type | Purpose | Response |
|----------|------|---------|----------|
| `/api/health/backend` | JSON | Backend status | Status, uptime, port |
| `/api/health/database` | JSON | Database connectivity | DB time, version |
| `/health/frontend` | HTML | Frontend assets | "Frontend is Working" |
| `/health/database-page` | HTML | Database verification | "Database works perfectly" |

---

## 🚨 Troubleshooting

### App won't start locally:
```bash
# Check if PostgreSQL is running
# Update .env to point to your database
npm start
```

### Database connection fails on Render:
1. Check environment variables match Render connection string
2. Verify database is created and running (`Status` tab should show "Available")
3. Check app logs in Render dashboard

### Can't log in after deployment:
1. Check users were seeded: `node src/scripts/seed_users.js` (local with remote DB)
2. Verify database has `users` table: check Render PostgreSQL logs

### Static assets (CSS, images) not loading:
- Check `public/` folder exists and is committed to Git
- Express serves static files automatically from `public/`

---

## 📝 Key Points for Successful Deployment

✅ **Version control**: Always commit code changes, never `.env` secrets  
✅ **Health endpoints**: Use them to verify each part works independently  
✅ **Environment variables**: Set them in Render dashboard, not in code  
✅ **Database initialization**: Run `npm run init-db` once with remote DB  
✅ **User seeding**: Run `node src/scripts/seed_users.js` once after schema creation  
✅ **Testing**: Use health checks to verify frontend → backend → database chain works

---

## 🎯 Quick Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] `.env` contains secrets (never commit it)
- [ ] `.env.example` committed with template values
- [ ] PostgreSQL created on Render
- [ ] Web Service created on Render
- [ ] Environment variables set in Web Service
- [ ] `npm run init-db` executed (local with remote DB)
- [ ] `node src/scripts/seed_users.js` executed
- [ ] `/health/frontend` returns success page
- [ ] `/api/health/database` returns JSON status
- [ ] `/login` loads and login works
- [ ] Admin, student, and payment features work

---

**Your app is now ready for production deployment! 🚀**
